import { supabase } from '../supabase';
import type { Profile, UserRole } from '../types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function deleteUser(userId: string): Promise<void> {
  // First, get user's teams where they are the only leader
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      team_members!inner(
        user_id,
        role
      )
    `)
    .eq('team_members.role', 'leader');

  if (teamsError) throw teamsError;

  const teamsToDelete = teams?.filter(team => {
    const leaders = team.team_members.filter(member => member.role === 'leader');
    return leaders.length === 1 && leaders[0].user_id === userId;
  });

  // Delete teams where user is the only leader
  if (teamsToDelete && teamsToDelete.length > 0) {
    const { error: deleteTeamsError } = await supabase
      .from('teams')
      .delete()
      .in('id', teamsToDelete.map(team => team.id));

    if (deleteTeamsError) throw deleteTeamsError;
  }

  // Delete user's profile
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (deleteError) throw deleteError;
}