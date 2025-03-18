import { supabase } from './supabase';

export type Report = {
  id: string;
  title: string;
  description: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  updated_at: string;
  comments?: string[];
  tags?: string[];
};

export type ReportStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  monthly: number;
};

// Helper function to check user authentication
const getAuthenticatedUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
};

// Helper function to validate file
const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('O arquivo não pode ser maior que 10MB');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, XLS ou XLSX');
  }
};

export async function uploadFile(file: File, userId: string) {
  validateFile(file);

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('reports')
    .upload(filePath, file);

  if (uploadError || !data) {
    throw new Error('Erro ao fazer upload do arquivo');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('reports')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createReport(data: Partial<Report>) {
  const user = await getAuthenticatedUser();

  const { data: report, error } = await supabase
    .from('reports')
    .insert([{ ...data, user_id: user.id }])
    .select('*, profiles(*)')
    .single();

  if (error) throw new Error('Erro ao criar relatório');
  return report;
}

export async function getReports() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar relatórios');
  return data || [];
}

export async function getReportById(id: string) {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) throw new Error('Relatório não encontrado');
  return data;
}

export async function getReportStats(): Promise<ReportStats> {
  const user = await getAuthenticatedUser();
  const firstDayOfMonth = new Date(new Date().setDate(1));

  const { data: reports, error } = await supabase
    .from('reports')
    .select('status, created_at')
    .eq('user_id', user.id);

  if (error) throw new Error('Erro ao buscar estatísticas');

  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    monthly: reports.filter(r => new Date(r.created_at) >= firstDayOfMonth).length
  };
}

export async function updateReport(id: string, data: Partial<Report>) {
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from('reports')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Erro ao atualizar relatório');
}

export async function deleteReport(id: string) {
  const user = await getAuthenticatedUser();

  const { data: report } = await supabase
    .from('reports')
    .select('file_url')
    .eq('id', id)
    .single();

  if (report?.file_url) {
    const filePath = report.file_url.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('reports')
        .remove([`${user.id}/${filePath}`]);
    }
  }

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Erro ao deletar relatório');
}

export async function addComment(reportId: string, comment: string) {
  const user = await getAuthenticatedUser();

  const { data: report } = await supabase
    .from('reports')
    .select('comments')
    .eq('id', reportId)
    .single();

  const comments = [...(report?.comments || []), `${new Date().toISOString()} - ${user.email}: ${comment}`];

  const { error } = await supabase
    .from('reports')
    .update({ comments, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('user_id', user.id);

  if (error) throw new Error('Erro ao adicionar comentário');
}

export async function addTags(reportId: string, tags: string[]) {
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from('reports')
    .update({ tags, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('user_id', user.id);

  if (error) throw new Error('Erro ao adicionar tags');
}