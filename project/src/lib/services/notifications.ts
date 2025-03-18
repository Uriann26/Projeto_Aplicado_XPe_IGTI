import { supabase } from '../supabase';
import { addDays } from 'date-fns';
import type { NotificationSettings } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error('Erro ao buscar configurações');

  return data || {
    email_notifications: true,
    deadline_reminders: true,
    reminder_days_before: 3,
    daily_digest: false
  };
}

export async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error('Erro ao atualizar configurações');
}

export async function createNotification(
  userId: string,
  type: 'deadline_reminder' | 'report_status_change' | 'report_comment' | 'deadline_assigned',
  title: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      content,
      read: false
    });

  if (error) throw new Error('Erro ao criar notificação');
}

export async function getUpcomingDeadlineNotifications() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      schedules:notification_schedules(*)
    `)
    .eq('user_id', user.id)
    .eq('type', 'deadline_reminder')
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar notificações');
  return data || [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw new Error('Erro ao marcar notificação como lida');
}

export function subscribeToNotifications(callback: (notification: any) => void) {
  const user = getAuthenticatedUser();
  if (!user) throw new Error('Usuário não autenticado');

  return supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
}

export async function createTaskNotification(
  taskId: string,
  action: 'assigned' | 'updated' | 'completed' | 'commented'
): Promise<void> {
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_to:profiles!assigned_to(*),
      team:teams(*)
    `)
    .eq('id', taskId)
    .single();

  if (taskError) throw taskError;

  const { data: teamMembers, error: membersError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', task.team.id);

  if (membersError) throw membersError;

  const notifications = teamMembers.map(member => ({
    user_id: member.user_id,
    type: 'deadline_assigned',
    title: getNotificationTitle(action, task),
    content: getNotificationContent(action, task)
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) throw new Error('Erro ao criar notificações');
}

function getNotificationTitle(action: string, task: any): string {
  const titles = {
    assigned: 'Nova Tarefa Atribuída',
    updated: 'Tarefa Atualizada',
    completed: 'Tarefa Concluída',
    commented: 'Novo Comentário'
  };
  return titles[action] || 'Atualização de Tarefa';
}

function getNotificationContent(action: string, task: any): string {
  const contents = {
    assigned: `Você foi atribuído à tarefa "${task.title}" na equipe ${task.team.name}`,
    updated: `A tarefa "${task.title}" foi atualizada`,
    completed: `A tarefa "${task.title}" foi marcada como concluída`,
    commented: `Novo comentário na tarefa "${task.title}"`
  };
  return contents[action] || `Atualização na tarefa "${task.title}"`;
}