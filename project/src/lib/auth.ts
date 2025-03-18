import { supabase } from './supabase';
import type { UserRole } from './types';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signUpSchema = authSchema.extend({
  role: z.enum(['supervisor', 'engineer', 'technician'], {
    required_error: 'Função é obrigatória',
    invalid_type_error: 'Função inválida',
  }),
});

export type LoginInput = z.infer<typeof authSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

async function createUserProfile(userId: string, email: string, role: UserRole = 'supervisor') {
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert([{
      id: userId,
      name: email,
      role,
      updated_at: new Date().toISOString()
    }], {
      onConflict: 'id',
      ignoreDuplicates: false
    });

  if (profileError) throw new Error('Erro ao criar perfil do usuário');

  const { error: settingsError } = await supabase
    .from('notification_settings')
    .upsert([{
      user_id: userId,
      email_notifications: true,
      deadline_reminders: true,
      reminder_days_before: 3,
      daily_digest: false,
      updated_at: new Date().toISOString()
    }], {
      onConflict: 'user_id',
      ignoreDuplicates: false
    });

  if (settingsError) {
    console.error('Error creating notification settings:', settingsError);
  }
}

export async function signIn(email: string, password: string) {
  try {
    authSchema.parse({ email, password });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos' 
        : error.message);
    }

    return data;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.errors[0].message);
    }
    throw err;
  }
}

export async function signUp(email: string, password: string, role: UserRole = 'supervisor') {
  try {
    signUpSchema.parse({ email, password, role });

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'supervisor' }
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message.includes('already registered')
        ? 'Este email já está cadastrado'
        : signUpError.message);
    }

    if (user) {
      await createUserProfile(user.id, email);
    }

    return { user };
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.errors[0].message);
    }
    throw err;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Erro ao fazer logout');
}

export async function getUser() {
  return supabase.auth.getUser();
}

export function onAuthStateChange(callback: (event: any, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function createProfileIfNotExists(userId: string, email: string) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    await createUserProfile(userId, email);
  }
}