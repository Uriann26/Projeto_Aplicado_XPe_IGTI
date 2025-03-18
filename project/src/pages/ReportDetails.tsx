import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Clock, CheckCircle, XCircle, Trash2, Save } from 'lucide-react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getReportById, updateReport, deleteReport } from '../lib/services/reports';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { Report } from '../lib/types';

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: report, loading, error: queryError } = useSupabaseQuery<Report>({
    query: () => getReportById(id!),
    dependencies: [id]
  });

  const handleStatusUpdate = async (newStatus: string) => {
    if (!report) return;
    
    try {
      setIsUpdating(true);
      setError('');
      setSuccessMessage('');
      
      await updateReport(report.id, { status: newStatus });
      setSuccessMessage('Status atualizado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!report || !confirm('Tem certeza que deseja excluir este relatório?')) return;
    
    try {
      setIsDeleting(true);
      await deleteReport(report.id);
      navigate('/dashboard/reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir relatório');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (queryError || !report) {
    return <ErrorMessage error={queryError || 'Relatório não encontrado'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/reports')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.open(report.file_url, '_blank')}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Excluir
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} />}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">{report.title}</h1>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  report.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : report.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {report.status === 'pending' ? (
                  <><Clock className="w-4 h-4 mr-1" /> Pendente</>
                ) : report.status === 'approved' ? (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Aprovado</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-1" /> Rejeitado</>
                )}
              </span>
              <select
                value={report.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={isUpdating}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
          </div>

          {report.description && (
            <p className="mt-2 text-gray-600">{report.description}</p>
          )}

          <div className="mt-6 border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Envio</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(report.created_at).toLocaleDateString('pt-BR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Última Atualização</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                </dd>
              </div>
              {report.deadline && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prazo de Entrega</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(report.deadline.due_date).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">URL do Arquivo</dt>
                <dd className="mt-1 text-sm text-blue-600 break-all">
                  <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                    {report.file_url}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}