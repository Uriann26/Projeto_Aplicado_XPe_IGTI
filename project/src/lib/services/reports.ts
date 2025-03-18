import { supabase } from '../supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { utils, write } from 'xlsx';
import Papa from 'papaparse';
import type { Report, ServiceOrder, Road, Pathology } from '../types';

interface ReportTemplate {
  title: string;
  sections: {
    title: string;
    content: string | string[];
    type: 'text' | 'list' | 'table';
    data?: any[];
  }[];
}

export async function getReports(): Promise<Report[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar relatórios: ${error.message}`);
  }

  return data || [];
}

export async function getReportById(id: string): Promise<Report> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar relatório: ${error.message}`);
  }

  if (!data) {
    throw new Error('Relatório não encontrado');
  }

  return data;
}

export async function getReportStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  monthly: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('status, created_at')
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
  }

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    monthly: reports.filter(r => new Date(r.created_at) >= firstDayOfMonth).length
  };
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase
    .from('reports')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Erro ao atualizar relatório: ${error.message}`);
  }
}

export async function deleteReport(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // First, get the report to check if it has an associated file
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    throw new Error(`Erro ao buscar relatório: ${fetchError.message}`);
  }

  // If there's a file, delete it from storage
  if (report?.file_url) {
    const filePath = report.file_url.split('/').pop();
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('reports')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao deletar arquivo:', storageError);
      }
    }
  }

  // Delete the report record
  const { error: deleteError } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    throw new Error(`Erro ao deletar relatório: ${deleteError.message}`);
  }
}

export async function generateReport(
  type: 'technical' | 'executive' | 'inspection',
  data: {
    serviceOrder?: ServiceOrder;
    roads?: Road[];
    pathologies?: Pathology[];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Blob> {
  // Generate report content based on type
  const template = await getReportTemplate(type, data);
  
  // Create PDF document
  const doc = new jsPDF();
  let yPos = 20;

  // Add header
  doc.setFontSize(16);
  doc.text(template.title, 14, yPos);
  yPos += 10;

  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, yPos);
  yPos += 20;

  // Add sections
  for (const section of template.sections) {
    // Add section title
    doc.setFontSize(12);
    doc.text(section.title, 14, yPos);
    yPos += 10;

    // Add section content based on type
    switch (section.type) {
      case 'text':
        doc.setFontSize(10);
        doc.text(section.content as string, 14, yPos);
        yPos += 10;
        break;

      case 'list':
        doc.setFontSize(10);
        (section.content as string[]).forEach(item => {
          doc.text(`• ${item}`, 20, yPos);
          yPos += 6;
        });
        break;

      case 'table':
        if (section.data) {
          (doc as any).autoTable({
            startY: yPos,
            head: [Object.keys(section.data[0])],
            body: section.data.map(Object.values),
            margin: { left: 14 }
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
        break;
    }

    yPos += 10;

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  }

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

async function getReportTemplate(
  type: 'technical' | 'executive' | 'inspection',
  data: any
): Promise<ReportTemplate> {
  switch (type) {
    case 'technical':
      return {
        title: 'Relatório Técnico',
        sections: [
          {
            title: 'Informações da OS',
            type: 'text',
            content: `OS #${data.serviceOrder?.number}\nData: ${new Date().toLocaleDateString('pt-BR')}`
          },
          {
            title: 'Vias Inspecionadas',
            type: 'table',
            data: data.roads?.map(road => ({
              'Via': road.name,
              'Extensão (m)': road.length,
              'Pavimentada (m)': road.paved_length,
              'Calçada (m)': road.sidewalk_length
            }))
          },
          {
            title: 'Patologias Encontradas',
            type: 'table',
            data: data.pathologies?.map(pathology => ({
              'Via': pathology.road?.name,
              'Descrição': pathology.description,
              'Localização': `${pathology.coordinates.lat}, ${pathology.coordinates.lng}`
            }))
          }
        ]
      };

    case 'executive':
      return {
        title: 'Relatório Executivo',
        sections: [
          {
            title: 'Resumo',
            type: 'text',
            content: `Total de vias: ${data.roads?.length}\nTotal de patologias: ${data.pathologies?.length}`
          },
          {
            title: 'Indicadores',
            type: 'list',
            content: [
              `Extensão total: ${data.roads?.reduce((sum, r) => sum + r.length, 0)}m`,
              `Extensão pavimentada: ${data.roads?.reduce((sum, r) => sum + r.paved_length, 0)}m`,
              `Extensão com calçada: ${data.roads?.reduce((sum, r) => sum + r.sidewalk_length, 0)}m`
            ]
          }
        ]
      };

    case 'inspection':
      return {
        title: 'Relatório de Inspeção',
        sections: [
          {
            title: 'Período',
            type: 'text',
            content: `De ${data.startDate?.toLocaleDateString('pt-BR')} a ${data.endDate?.toLocaleDateString('pt-BR')}`
          },
          {
            title: 'Vias Inspecionadas',
            type: 'table',
            data: data.roads?.map(road => ({
              'Via': road.name,
              'Data': new Date(road.created_at).toLocaleDateString('pt-BR'),
              'Status': road.pathologies?.length ? 'Com Patologias' : 'Sem Patologias'
            }))
          }
        ]
      };

    default:
      throw new Error('Tipo de relatório inválido');
  }
}

export async function exportToExcel(data: any[], filename: string): Promise<Blob> {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Data');
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export async function exportToCSV(data: any[]): Promise<Blob> {
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}