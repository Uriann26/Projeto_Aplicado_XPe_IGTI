import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(72, 'A senha não pode ter mais de 72 caracteres'),
});

export const signUpSchema = loginSchema.extend({
  role: z.enum(['supervisor', 'engineer', 'technician'], {
    required_error: 'Função é obrigatória',
    invalid_type_error: 'Função inválida',
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;