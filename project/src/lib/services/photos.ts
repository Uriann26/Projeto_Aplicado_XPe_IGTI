import { supabase } from '../supabase';
import type { RoadPhoto } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

async function validatePhoto(file: File) {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('O arquivo não pode ser maior que 10MB');
  }

  const fileType = file.type.split('/')[0];
  if (fileType !== 'image') {
    throw new Error('Apenas imagens são permitidas');
  }
}

export async function uploadRoadPhoto(
  roadId: string,
  file: File,
  description: string,
  location: { lat: number; lng: number },
  takenAt: Date
): Promise<RoadPhoto> {
  const user = await getAuthenticatedUser();
  await validatePhoto(file);

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${file.name.substring(file.name.lastIndexOf('.'))}`;
  const filePath = `${user.id}/roads/${roadId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('road_photos')
    .upload(filePath, file);

  if (uploadError) throw new Error('Erro ao fazer upload da foto');

  const { data: { publicUrl } } = supabase.storage
    .from('road_photos')
    .getPublicUrl(filePath);

  const { data: photo, error: dbError } = await supabase
    .from('road_photos')
    .insert({
      road_id: roadId,
      photo_url: publicUrl,
      description,
      location,
      taken_at: takenAt.toISOString()
    })
    .select()
    .single();

  if (dbError) throw new Error('Erro ao salvar foto');
  return photo;
}

export async function getRoadPhotos(roadId: string): Promise<RoadPhoto[]> {
  const { data, error } = await supabase
    .from('road_photos')
    .select('*')
    .eq('road_id', roadId)
    .order('taken_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar fotos');
  return data || [];
}

export async function deleteRoadPhoto(photoId: string): Promise<void> {
  const { data: photo, error: fetchError } = await supabase
    .from('road_photos')
    .select('photo_url')
    .eq('id', photoId)
    .single();

  if (fetchError) throw new Error('Erro ao buscar foto');

  if (photo?.photo_url) {
    const filePath = photo.photo_url.split('/').pop();
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('road_photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao deletar arquivo:', storageError);
      }
    }
  }

  const { error: deleteError } = await supabase
    .from('road_photos')
    .delete()
    .eq('id', photoId);

  if (deleteError) throw new Error('Erro ao deletar foto');
}