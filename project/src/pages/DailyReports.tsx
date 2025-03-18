import React, { useState } from 'react';
import { Calendar, Plus, Trash2, FileDown, Loader2 } from 'lucide-react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getDailyReports, createDailyReport, addActivity, deleteActivity, compileDailyReports } from '../lib/services/dailyReports';
import { getServiceOrders } from '../lib/services/serviceOrders';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { DailyReport, ServiceOrder } from '../lib/types';

export default function DailyReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoadId, setSelectedRoadId] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState('');

  const { data: reports, loading: reportsLoading, error: reportsError } = useSupabaseQuery<DailyReport[]>({
    query: getDailyReports,
    dependencies: []
  });

  const { data: serviceOrders, loading: ordersLoading } = useSupabaseQuery<ServiceOrder[]>({
    query: getServiceOrders,
    dependencies: []
  });

  const roads = serviceOrders?.flatMap(order => order.roads) || [];

  const handleCreateReport = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await createDailyReport(selectedDate);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar relatório');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddActivity = async (reportId: string) => {
    if (!selectedRoadId || !activityDescription) {
      setError('Selecione uma via e descreva a atividade');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await addActivity(reportId, selectedRoadId, activityDescription);
      setSelectedRoadId('');
      setActivityDescription('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar atividade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      setIsSubmitting(true);
      setError('');
      await deleteActivity(activityId);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir atividade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompileReports = async () => {
    try {
      setIsCompiling(true);
      setError('');
      const pdf = await compileDailyReports(startDate, endDate);
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${startDate}-a-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao compilar relatórios');
    } finally {
      setIsCompiling(false);
    }
  };

  if (reportsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (reportsError) {
    return <ErrorMessage error={reportsError} />;
  }

  const todayReport = reports?.find(
    report => report.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Relatórios Diários</h1>
          <p className="mt-2 text-sm text-gray-700">
            Registre as atividades realizadas em cada via
          </p>
        </div>
      </div>

      {error && <ErrorMessage error={error} />}

      {/* Compile Reports Section */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-medium text-gray-900">Compilar Relatórios</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCompileReports}
                disabled={isCompiling}
                className="w-full"
                leftIcon={isCompiling ? <Loader2 className="animate-spin" /> : <FileDown />}
              >
                {isCompiling ? 'Compilando...' : 'Compilar PDF'}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Create Daily Report */}
      {!todayReport && (
        <Card>
          <Card.Body>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <Button
                onClick={handleCreateReport}
                disabled={isSubmitting}
                leftIcon={<Calendar />}
              >
                Criar Relatório
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Reports List */}
      <div className="space-y-6">
        {reports?.map((report) => (
          <Card key={report.id}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {new Date(report.date).toLocaleDateString('pt-BR')}
                </h3>
                <span className="text-sm text-gray-500">
                  {report.profiles?.name}
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Activities List */}
              <div className="space-y-4">
                {report.activities?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {activity.road?.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {activity.activity_description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}

                {/* Add Activity Form */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <select
                      value={selectedRoadId}
                      onChange={(e) => setSelectedRoadId(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Selecione uma via</option>
                      {roads.map((road) => (
                        <option key={road.id} value={road.id}>
                          {road.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={activityDescription}
                        onChange={(e) => setActivityDescription(e.target.value)}
                        placeholder="Descreva a atividade realizada"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <Button
                        onClick={() => handleAddActivity(report.id)}
                        disabled={isSubmitting}
                        leftIcon={<Plus />}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}