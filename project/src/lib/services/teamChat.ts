import { supabase } from '../supabase';
import type { TeamMessage, TeamFile } from '../types';

export async function sendMessage(
  teamId: string,
  content: string,
  attachments: { name: string; url: string }[] = []
): Promise<TeamMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('team_messages')
    .insert({
      team_id: teamId,
      user_id: user.id,
      content,
      attachments
    })
    .select(`
      *,
      user:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getTeamMessages(teamId: string): Promise<TeamMessage[]> {
  const { data, error } = await supabase
    .from('team_messages')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function uploadTeamFile(
  teamId: string,
  file: File
): Promise<TeamFile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Upload file to storage
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${teamId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('team_files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('team_files')
    .getPublicUrl(filePath);

  // Create file record
  const { data, error } = await supabase
    .from('team_files')
    .insert({
      team_id: teamId,
      user_id: user.id,
      name: file.name,
      file_url: publicUrl,
      size: file.size,
      type: file.type
    })
    .select(`
      *,
      user:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getTeamFiles(teamId: string): Promise<TeamFile[]> {
  const { data, error } = await supabase
    .from('team_files')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteTeamFile(fileId: string): Promise<void> {
  const { data: file, error: fetchError } = await supabase
    .from('team_files')
    .select('file_url')
    .eq('id', fileId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage
  if (file?.file_url) {
    const filePath = file.file_url.split('/').pop();
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('team_files')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }
  }

  // Delete record
  const { error } = await supabase
    .from('team_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
}

export function subscribeToTeamMessages(
  teamId: string,
  callback: (message: TeamMessage) => void
) {
  return supabase
    .channel(`team_messages:${teamId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'team_messages',
      filter: `team_id=eq.${teamId}`
    }, payload => {
      callback(payload.new as TeamMessage);
    })
    .subscribe();
}