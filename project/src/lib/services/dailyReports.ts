import { supabase } from '../supabase';
import type { DailyReport, DailyReportActivity } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createDailyReport(date: string): Promise<DailyReport> {
  const user = await getAuthenticatedUser();

  // First check if a report already exists for this date
  const { data: existingReport } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (existingReport) {
    return existingReport;
  }

  const { data, error } = await supabase
    .from('daily_reports')
    .insert({ 
      date,
      user_id: user.id 
    })
    .select('*, profiles(*)')
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      // If we get here, it means another request created the report
      // between our check and insert. Let's fetch the existing report.
      const { data: report, error: fetchError } = await supabase
        .from('daily_reports')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (fetchError) throw new Error('Erro ao buscar relatório diário');
      return report;
    }
    throw new Error('Erro ao criar relatório diário');
  }

  return data;
}

export async function getDailyReports(): Promise<DailyReport[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      profiles(*),
      activities:daily_report_activities(
        *,
        road:roads(*)
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw new Error('Erro ao buscar relatórios diários');
  return data || [];
}

export async function addActivity(
  dailyReportId: string,
  roadId: string,
  activityDescription: string
): Promise<DailyReportActivity> {
  if (!dailyReportId) throw new Error('ID do relatório é obrigatório');
  if (!roadId) throw new Error('ID da via é obrigatório');
  if (!activityDescription) throw new Error('Descrição da atividade é obrigatória');

  const { data, error } = await supabase
    .from('daily_report_activities')
    .insert({
      daily_report_id: dailyReportId,
      road_id: roadId,
      activity_description: activityDescription,
    })
    .select('*, road:roads(*)')
    .single();

  if (error) throw new Error('Erro ao adicionar atividade');
  return data;
}

export async function deleteActivity(id: string): Promise<void> {
  if (!id) throw new Error('ID da atividade é obrigatório');

  const { error } = await supabase
    .from('daily_report_activities')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Erro ao deletar atividade');
}

export async function compileDailyReports(startDate: string, endDate: string): Promise<Blob> {
  const user = await getAuthenticatedUser();

  const { data: reports, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      profiles(*),
      activities:daily_report_activities(
        *,
        road:roads(*)
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw new Error('Erro ao buscar relatórios para compilação');

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Relatório de Atividades', 14, 20);
  doc.setFontSize(12);
  doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 30);

  let yPos = 40;
  reports?.forEach((report) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text(`Data: ${new Date(report.date).toLocaleDateString('pt-BR')}`, 14, yPos);
    doc.setFontSize(12);
    doc.text(`Responsável: ${report.profiles?.name}`, 14, yPos + 7);

    const tableData = report.activities.map(activity => [
      activity.road?.name || '',
      activity.activity_description
    ]);

    if (tableData.length > 0) {
      (doc as any).autoTable({
        startY: yPos + 15,
        head: [['Via', 'Atividade']],
        body: tableData,
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
    } else {
      yPos += 30;
    }
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}