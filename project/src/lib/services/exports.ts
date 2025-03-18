import { supabase } from '../supabase';
import { utils, write } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

interface ExportOptions {
  type: 'csv' | 'excel' | 'pdf';
  data: 'reports' | 'service_orders' | 'tasks';
  filters?: Record<string, any>;
}

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

async function createExportRecord(userId: string, type: string) {
  const { data: exportRecord, error } = await supabase
    .from('data_exports')
    .insert({
      user_id: userId,
      type,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return exportRecord;
}

async function fetchData(type: string, filters?: Record<string, any>) {
  let query = supabase.from(type);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}

function generateCSV(data: any[]): Blob {
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

function generateExcel(data: any[]): Blob {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Data');
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function generatePDF(data: any[]): Promise<Blob> {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Relatório de Exportação', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

  const headers = Object.keys(data[0]);
  const rows = data.map(item => Object.values(item));

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 20 } }
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

export async function exportData(options: ExportOptions): Promise<string> {
  const user = await getAuthenticatedUser();
  const exportRecord = await createExportRecord(user.id, options.type);

  try {
    const data = await fetchData(options.data, options.filters);
    let fileContent: Blob;
    let fileName: string;

    switch (options.type) {
      case 'csv':
        fileContent = generateCSV(data);
        fileName = `export_${Date.now()}.csv`;
        break;
      case 'excel':
        fileContent = generateExcel(data);
        fileName = `export_${Date.now()}.xlsx`;
        break;
      case 'pdf':
        fileContent = await generatePDF(data);
        fileName = `export_${Date.now()}.pdf`;
        break;
      default:
        throw new Error('Formato de exportação inválido');
    }

    const filePath = `${user.id}/exports/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, fileContent);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('exports')
      .getPublicUrl(filePath);

    await supabase
      .from('data_exports')
      .update({
        status: 'completed',
        file_url: publicUrl
      })
      .eq('id', exportRecord.id);

    return publicUrl;
  } catch (error) {
    await supabase
      .from('data_exports')
      .update({
        status: 'failed'
      })
      .eq('id', exportRecord.id);

    throw error;
  }
}