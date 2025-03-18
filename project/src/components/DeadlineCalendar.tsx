import React, { useState } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import type { Report } from '../lib/types';
import { createDeadline } from '../lib/deadlines';
import { supabase } from '../lib/supabase';

interface DeadlineCalendarProps {
  reports: Report[];
  onSelectDate?: (date: Date) => void;
}

export default function DeadlineCalendar({ reports, onSelectDate }: DeadlineCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Check if user is supervisor
  React.useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsSupervisor(profile?.role === 'supervisor');
      }
    }
    checkRole();
  }, []);

  // Agrupar relatórios por data de prazo
  const deadlinesByDate = reports.reduce((acc, report) => {
    if (report.deadline) {
      const date = new Date(report.deadline.due_date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(report);
    }
    return acc;
  }, {} as Record<string, Report[]>);

  // Gerar dias do mês atual
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days = Array.from(
    { length: lastDay.getDate() },
    (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1)
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onSelectDate?.(date);
    if (isSupervisor) {
      setShowDeadlineForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newReportTitle) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Create a new report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: newReportTitle,
          status: 'pending'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Create deadline for the report
      await createDeadline(report.id, selectedDate);

      // Reset form
      setNewReportTitle('');
      setShowDeadlineForm(false);
      setSelectedDate(null);

      // Reload page to show new deadline
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar prazo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Calendário de Prazos
          </h2>
          <Calendar className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDay.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 bg-gray-50" />
          ))}

          {days.map((date) => {
            const dateString = date.toDateString();
            const hasDeadlines = deadlinesByDate[dateString]?.length > 0;
            const isSelected = selectedDate?.toDateString() === dateString;
            const isToday = today.toDateString() === dateString;

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  h-24 p-2 border border-gray-200 cursor-pointer transition-colors
                  ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}
                  ${isToday ? 'bg-yellow-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </span>
                  {hasDeadlines && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="ml-1 text-xs text-blue-500">
                        {deadlinesByDate[dateString].length}
                      </span>
                    </div>
                  )}
                </div>

                {hasDeadlines && (
                  <div className="mt-1">
                    {deadlinesByDate[dateString].map((report) => (
                      <div
                        key={report.id}
                        className="text-xs truncate text-gray-600"
                        title={report.title}
                      >
                        {report.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Deadline Form Modal */}
        {showDeadlineForm && isSupervisor && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Definir Novo Prazo
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Data Selecionada
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título do Relatório
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newReportTitle}
                    onChange={(e) => setNewReportTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeadlineForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Prazo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}