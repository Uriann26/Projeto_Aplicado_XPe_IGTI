import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Download, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getReports, deleteReport } from '../lib/services/reports';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { Report } from '../lib/types';

export default function Reports() {
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: reports, loading, error: queryError } = useSupabaseQuery<Report[]>({
    query: getReports,
    dependencies: []
  });

  useEffect(() => {
    if (reports) {
      filterReports(reports);
    }
  }, [searchTerm, statusFilter, reports]);

  function filterReports(reports: Report[]) {
    let filtered = [...reports];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return;

    try {
      setIsDeleting(id);
      setError('');
      await deleteReport(id);
      setFilteredReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir relatório');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (queryError) {
    return <ErrorMessage error={queryError} />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seus relatórios técnicos
          </p>
        </div>
        <Link
          to="/dashboard/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FileText className="h-4 w-4 mr-2" />
          Novo Relatório
        </Link>
      </div>

      {error && <ErrorMessage error={error} />}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <ul role="list" className="divide-y divide-gray-200">
          {filteredReports.length === 0 ? (
            <li className="p-4 text-center text-gray-500">
              Nenhum relatório encontrado
            </li>
          ) : (
            filteredReports.map((report) => (
              <li key={report.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {report.status === 'pending' ? (
                          <Clock className="h-6 w-6 text-yellow-500" />
                        ) : report.status === 'approved' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <Link
                          to={`/dashboard/reports/${report.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                        >
                          {report.title}
                        </Link>
                        {report.description && (
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {report.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <p>
                            Enviado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
                            {report.deadline && (
                              <span className="ml-2 text-yellow-600">
                                • Prazo: {new Date(report.deadline.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      {report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={isDeleting === report.id}
                        className="text-red-400 hover:text-red-500 disabled:opacity-50"
                        title="Excluir"
                      >
                        {isDeleting === report.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}