import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, FileText } from 'lucide-react';
import { getNotificationSettings, updateNotificationSettings } from '../lib/services/notifications';
import { Card } from './ui/Card';
import { ErrorMessage } from './ui/ErrorMessage';
import type { NotificationSettings as NotificationSettingsType } from '../lib/types';

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    email_notifications: true,
    deadline_reminders: true,
    reminder_days_before: 3,
    daily_digest: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      await updateNotificationSettings(settings);
      setSuccessMessage('Configurações salvas com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            Configurações de Notificações
          </h3>
        </div>
      </Card.Header>

      <Card.Body>
        {error && <ErrorMessage error={error} />}

        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Notificações por Email
                </p>
                <p className="text-sm text-gray-500">
                  Receba atualizações importantes por email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({
                  ...settings,
                  email_notifications: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Lembretes de Prazo
                </p>
                <p className="text-sm text-gray-500">
                  Seja notificado quando um prazo estiver próximo
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deadline_reminders}
                onChange={(e) => setSettings({
                  ...settings,
                  deadline_reminders: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.deadline_reminders && (
            <div className="ml-8 mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Dias de antecedência para lembrete
              </label>
              <select
                value={settings.reminder_days_before}
                onChange={(e) => setSettings({
                  ...settings,
                  reminder_days_before: parseInt(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value={1}>1 dia</option>
                <option value={3}>3 dias</option>
                <option value={5}>5 dias</option>
                <option value={7}>7 dias</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Resumo Diário
                </p>
                <p className="text-sm text-gray-500">
                  Receba um resumo diário das atividades
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.daily_digest}
                onChange={(e) => setSettings({
                  ...settings,
                  daily_digest: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </Card.Footer>
    </Card>
  );
}