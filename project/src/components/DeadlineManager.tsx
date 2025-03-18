import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Save } from 'lucide-react';
import { createDeadline, updateDeadline, deleteDeadline } from '../lib/deadlines';
import type { Deadline, Report } from '../lib/types';

interface DeadlineManagerProps {
  report: Report;
  onDeadlineUpdated: (deadline: Deadline | null) => void;
}

export default function DeadlineManager({ report, onDeadlineUpdated }: DeadlineManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dueDate, setDueDate] = useState(
    report.deadline ? new Date(report.deadline.due_date) : new Date()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      let deadline;
      if (report.deadline) {
        deadline = await updateDeadline(report.deadline.id, dueDate);
      } else {
        deadline = await createDeadline(report.id, dueDate);
      }

      onDeadlineUpdated(deadline);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar prazo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report.deadline || !confirm('Tem certeza que deseja remover o prazo?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await deleteDeadline(report.deadline.id);
      onDeadlineUpdated(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover prazo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Prazo de Entrega</h3>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Editar Prazo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">
              Data de Entrega
            </label>
            <input
              type="datetime-local"
              id="due-date"
              value={dueDate.toISOString().slice(0, 16)}
              onChange={(e) => setDueDate(new Date(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
            {report.deadline && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Remover Prazo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              {report.deadline ? (
                <>
                  <p className="text-sm text-gray-900">
                    Entrega até {new Date(report.deadline.due_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Definido por {report.deadline.profiles?.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhum prazo definido
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}