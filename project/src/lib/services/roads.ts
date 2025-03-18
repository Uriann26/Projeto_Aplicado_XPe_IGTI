import { supabase } from '../supabase';
import type { Road, Pathology, Coordinates } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createRoad(
  serviceOrderId: string,
  name: string,
  length: number,
  width: number,
  pavedLength: number,
  sidewalkLength: number,
  curbLength: number,
  coordinates: Coordinates[]
): Promise<Road> {
  if (!serviceOrderId) throw new Error('ID da ordem de serviço é obrigatório');
  if (!name) throw new Error('Nome da via é obrigatório');
  if (!coordinates.length) throw new Error('Coordenadas são obrigatórias');

  const { data, error } = await supabase
    .from('roads')
    .insert({
      service_order_id: serviceOrderId,
      name,
      length,
      width,
      paved_length: pavedLength,
      sidewalk_length: sidewalkLength,
      curb_length: curbLength,
      coordinates
    })
    .select()
    .single();

  if (error) throw new Error('Erro ao criar via');
  return data;
}

export async function createPathology(
  roadId: string,
  description: string,
  coordinates: Coordinates
): Promise<Pathology> {
  if (!roadId) throw new Error('ID da via é obrigatório');
  if (!description) throw new Error('Descrição é obrigatória');
  if (!coordinates) throw new Error('Coordenadas são obrigatórias');

  const { data, error } = await supabase
    .from('pathologies')
    .insert({
      road_id: roadId,
      description,
      coordinates
    })
    .select()
    .single();

  if (error) throw new Error('Erro ao criar patologia');
  return data;
}

export async function getRoads(): Promise<Road[]> {
  const { data, error } = await supabase
    .from('roads')
    .select(`
      *,
      pathologies (
        id,
        description,
        coordinates
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar vias');
  return data || [];
}

export async function getRoadById(id: string): Promise<Road> {
  const { data, error } = await supabase
    .from('roads')
    .select(`
      *,
      pathologies (
        id,
        description,
        coordinates
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error('Erro ao buscar via');
  return data;
}

export async function updateRoad(id: string, data: Partial<Road>): Promise<Road> {
  const { data: updatedRoad, error } = await supabase
    .from('roads')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Erro ao atualizar via');
  return updatedRoad;
}

export async function deleteRoad(id: string): Promise<void> {
  const { error } = await supabase
    .from('roads')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Erro ao excluir via');
}

export async function updatePathology(
  id: string,
  data: Partial<Pathology>
): Promise<Pathology> {
  const { data: updatedPathology, error } = await supabase
    .from('pathologies')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Erro ao atualizar patologia');
  return updatedPathology;
}

export async function deletePathology(id: string): Promise<void> {
  const { error } = await supabase
    .from('pathologies')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Erro ao excluir patologia');
}