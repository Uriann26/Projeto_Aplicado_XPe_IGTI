import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ApiError } from '../../lib/types';

interface ErrorMessageProps {
  error: string | ApiError;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const message = error 
    ? typeof error === 'string' 
      ? error 
      : error.message
    : 'Um erro inesperado ocorreu';
  
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4" role="alert">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}