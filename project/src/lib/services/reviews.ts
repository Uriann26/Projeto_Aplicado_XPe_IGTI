import { supabase } from '../supabase';
import type { ReportReview, ReportVersion } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createReportVersion(
  reportId: string,
  content: any
): Promise<ReportVersion> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('report_versions')
    .insert({
      report_id: reportId,
      content,
      created_by: user.id
    })
    .select('*, profiles(*)')
    .single();

  if (error) throw new Error('Erro ao criar versão');
  return data;
}

export async function getReportVersions(reportId: string): Promise<ReportVersion[]> {
  const { data, error } = await supabase
    .from('report_versions')
    .select(`
      *,
      profiles(name)
    `)
    .eq('report_id', reportId)
    .order('version_number', { ascending: false });

  if (error) throw new Error('Erro ao buscar versões');
  return data || [];
}

export async function createReview(
  reportId: string,
  status: 'pending' | 'approved' | 'rejected',
  comment?: string
): Promise<ReportReview> {
  const user = await getAuthenticatedUser();

  const { data: existingReview } = await supabase
    .from('report_reviews')
    .select('*')
    .eq('report_id', reportId)
    .eq('reviewer_id', user.id)
    .single();

  const comments = [...(existingReview?.comments || [])];
  if (comment) {
    comments.push(`${new Date().toISOString()} - ${comment}`);
  }

  const reviewData = {
    report_id: reportId,
    reviewer_id: user.id,
    status,
    comments,
    updated_at: new Date().toISOString()
  };

  const { data, error } = existingReview
    ? await supabase
        .from('report_reviews')
        .update(reviewData)
        .eq('id', existingReview.id)
        .select()
        .single()
    : await supabase
        .from('report_reviews')
        .insert(reviewData)
        .select()
        .single();

  if (error) throw new Error('Erro ao criar/atualizar revisão');
  return data;
}

export async function getReportReviews(reportId: string): Promise<ReportReview[]> {
  const { data, error } = await supabase
    .from('report_reviews')
    .select(`
      *,
      profiles(
        name,
        role
      )
    `)
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar revisões');
  return data || [];
}