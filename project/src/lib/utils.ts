import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'approved':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'rejected':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    default:
      return status;
  }
}