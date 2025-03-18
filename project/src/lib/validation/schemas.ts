import { z } from 'zod';

export const reportSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título muito longo'),
  description: z.string().optional(),
  file: z.instanceof(File, { message: 'Arquivo é obrigatório' })
    .refine(file => file.size <= 10 * 1024 * 1024, 'Arquivo deve ter no máximo 10MB')
    .refine(
      file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Formato de arquivo inválido'
    ),
  deadline: z.string().datetime().optional(),
});

export const profileSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo'),
  role: z.enum(['supervisor', 'engineer', 'technician']),
});

export const serviceOrderSchema = z.object({
  number: z.string()
    .min(1, 'Número da OS é obrigatório')
    .max(50, 'Número da OS muito longo'),
  roads: z.array(z.object({
    name: z.string()
      .min(1, 'Nome da via é obrigatório')
      .max(255, 'Nome da via muito longo'),
    length: z.number()
      .min(0, 'Comprimento deve ser maior que 0'),
    width: z.number()
      .min(0, 'Largura deve ser maior que 0'),
    paved_length: z.number()
      .min(0, 'Trecho asfaltado deve ser maior que 0'),
    sidewalk_length: z.number()
      .min(0, 'Trecho com calçada deve ser maior que 0'),
    curb_length: z.number()
      .min(0, 'Trecho com meio fio deve ser maior que 0'),
    pathologies: z.array(z.object({
      description: z.string()
        .min(1, 'Descrição da patologia é obrigatória')
        .max(1000, 'Descrição muito longa'),
      coordinates: z.object({
        lat: z.number()
          .min(-90, 'Latitude inválida')
          .max(90, 'Latitude inválida'),
        lng: z.number()
          .min(-180, 'Longitude inválida')
          .max(180, 'Longitude inválida')
      })
    }))
  })).min(1, 'Adicione pelo menos uma via'),
});

export const taskSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título muito longo'),
  description: z.string()
    .max(1000, 'Descrição muito longa')
    .optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid('ID de usuário inválido'),
  team_id: z.string().uuid('ID de equipe inválido')
});

export const teamSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo'),
  description: z.string()
    .max(1000, 'Descrição muito longa')
    .optional()
});

export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Mensagem é obrigatória')
    .max(5000, 'Mensagem muito longa'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url('URL inválida')
  })).optional()
});