import { supabase } from './supabase';

export async function getServiceOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      roads (
        id,
        name,
        length,
        pathologies (
          id,
          description
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}