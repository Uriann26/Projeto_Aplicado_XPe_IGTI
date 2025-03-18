import { supabase } from '../supabase';
import type { Team, TeamMember, Task, TaskComment } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createTeam(name: string, description?: string): Promise<Team> {
  const user = await getAuthenticatedUser();

  // Use the database function to create team and add leader in a single transaction
  const { data, error } = await supabase
    .rpc('create_team_with_leader', {
      team_name: name,
      team_description: description,
      user_id: user.id
    });

  if (error) {
    console.error('Error creating team:', error);
    throw new Error('Erro ao criar equipe');
  }

  // Fetch the complete team data with members
  const { data: team, error: fetchError } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        id,
        role,
        user:profiles(
          id,
          name,
          role,
          avatar_url
        )
      )
    `)
    .eq('id', data.id)
    .single();

  if (fetchError) {
    console.error('Error fetching team:', fetchError);
    throw new Error('Erro ao buscar dados da equipe');
  }

  return team;
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        id,
        role,
        user:profiles(
          id,
          name,
          role,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar equipes');
  return data || [];
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: 'leader' | 'member'
): Promise<TeamMember> {
  if (!teamId) throw new Error('ID da equipe é obrigatório');
  if (!userId) throw new Error('ID do usuário é obrigatório');

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    throw new Error('Este usuário já é membro da equipe');
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role
    })
    .select(`
      *,
      user:profiles(
        id,
        name,
        role,
        avatar_url
      )
    `)
    .single();

  if (error) throw new Error('Erro ao adicionar membro');
  return data;
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  if (!teamId) throw new Error('ID da equipe é obrigatório');
  if (!userId) throw new Error('ID do usuário é obrigatório');

  // Check if user is the last leader
  const { data: leaders } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('role', 'leader');

  if (leaders?.length === 1) {
    const leader = leaders[0];
    const { data: leaderData } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('id', leader.id)
      .single();

    if (leaderData?.user_id === userId) {
      throw new Error('Não é possível remover o último líder da equipe');
    }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao remover membro');
}

export async function createTask(
  teamId: string,
  title: string,
  description: string,
  assignedTo: string,
  dueDate: Date,
  priority: 'low' | 'medium' | 'high'
): Promise<Task> {
  const user = await getAuthenticatedUser();

  // Verify team membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    throw new Error('Você não é membro desta equipe');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      team_id: teamId,
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate.toISOString(),
      priority,
      status: 'pending',
      created_by: user.id
    })
    .select(`
      *,
      assigned_user:profiles!tasks_assigned_to_fkey(
        id,
        name,
        role,
        avatar_url
      ),
      creator:profiles!tasks_created_by_fkey(
        id,
        name,
        role,
        avatar_url
      )
    `)
    .single();

  if (error) throw new Error('Erro ao criar tarefa');
  return data;
}

export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) throw new Error('Erro ao atualizar status da tarefa');
}

export async function getTeamTasks(teamId: string | null): Promise<Task[]> {
  if (!teamId) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:profiles!tasks_assigned_to_fkey(
        id,
        name,
        role,
        avatar_url
      ),
      creator:profiles!tasks_created_by_fkey(
        id,
        name,
        role,
        avatar_url
      ),
      comments:task_comments(
        id,
        content,
        created_at,
        user:profiles(
          id,
          name,
          role,
          avatar_url
        )
      )
    `)
    .eq('team_id', teamId)
    .order('due_date', { ascending: true });

  if (error) throw new Error('Erro ao buscar tarefas');
  return data || [];
}

export async function addTaskComment(
  taskId: string,
  content: string
): Promise<TaskComment> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content
    })
    .select(`
      *,
      user:profiles(
        id,
        name,
        role,
        avatar_url
      )
    `)
    .single();

  if (error) throw new Error('Erro ao adicionar comentário');
  return data;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      user:profiles(
        id,
        name,
        role,
        avatar_url
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar comentários');
  return data || [];
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) throw new Error('Erro ao excluir equipe');
}

export async function updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
  const { data: updatedTeam, error } = await supabase
    .from('teams')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', teamId)
    .select(`
      *,
      members:team_members(
        id,
        role,
        user:profiles(
          id,
          name,
          role,
          avatar_url
        )
      )
    `)
    .single();

  if (error) throw new Error('Erro ao atualizar equipe');
  return updatedTeam;
}