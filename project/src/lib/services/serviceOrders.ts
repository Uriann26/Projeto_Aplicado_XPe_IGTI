import { supabase } from '../supabase';
import type { ServiceOrder, Road, Pathology } from '../types';

async function getAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}

export async function createServiceOrder(data: Partial<ServiceOrder>): Promise<ServiceOrder> {
  const user = await getAuthenticatedUser();

  const { data: serviceOrder, error } = await supabase
    .from('service_orders')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error('Erro ao criar ordem de serviço');
  return serviceOrder;
}

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      roads (
        *,
        pathologies (*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar ordens de serviço');
  return data || [];
}

export async function deleteServiceOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('service_orders')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Erro ao excluir ordem de serviço');
}