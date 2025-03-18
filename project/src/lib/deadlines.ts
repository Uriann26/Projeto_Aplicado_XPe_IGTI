import { supabase } from './supabase';
import type { Deadline } from './types';

async function checkSupervisorRole(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'supervisor';
}

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createDeadline(reportId: string, dueDate: Date): Promise<Deadline> {
  const user = await getAuthenticatedUser();
  const isSupervisor = await checkSupervisorRole(user.id);

  if (!isSupervisor) {
    throw new Error('Apenas supervisores podem definir prazos');
  }

  const { data, error } = await supabase
    .from('deadlines')
    .insert({
      report_id: reportId,
      due_date: dueDate.toISOString(),
      created_by: user.id
    })
    .select('*, profiles(*)')
    .single();

  if (error) throw new Error('Erro ao criar prazo');
  return data;
}

export async function updateDeadline(deadlineId: string, dueDate: Date): Promise<Deadline> {
  const user = await getAuthenticatedUser();
  const isSupervisor = await checkSupervisorRole(user.id);

  if (!isSupervisor) {
    throw new Error('Apenas supervisores podem atualizar prazos');
  }

  const { data, error } = await supabase
    .from('deadlines')
    .update({ due_date: dueDate.toISOString() })
    .eq('id', deadlineId)
    .select('*, profiles(*)')
    .single();

  if (error) throw new Error('Erro ao atualizar prazo');
  return data;
}

export async function deleteDeadline(deadlineId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  const isSupervisor = await checkSupervisorRole(user.id);

  if (!isSupervisor) {
    throw new Error('Apenas supervisores podem excluir prazos');
  }

  const { error } = await supabase
    .from('deadlines')
    .delete()
    .eq('id', deadlineId);

  if (error) throw new Error('Erro ao excluir prazo');
}

export async function getDeadlinesByUser(): Promise<Deadline[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('deadlines')
    .select(`
      *,
      profiles(*),
      reports!inner(*)
    `)
    .eq('reports.user_id', user.id)
    .order('due_date', { ascending: true });

  if (error) throw new Error('Erro ao buscar prazos');
  return data || [];
}

export async function getDeadlinesByReport(reportId: string): Promise<Deadline[]> {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*, profiles(*)')
    .eq('report_id', reportId)
    .order('due_date', { ascending: true });

  if (error) throw new Error('Erro ao buscar prazos do relatório');
  return data || [];
}