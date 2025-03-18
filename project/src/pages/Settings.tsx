import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Save, Users, FileText, Clock } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import NotificationSettings from '../components/NotificationSettings';
import type { Profile, UserRole } from '../lib/types';
import { updateProfile, getAllProfiles, updateUserRole } from '../lib/services/profiles';

type UserStats = {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  upcomingDeadlines: number;
};

export default function Settings() {
  const { user, profile: currentProfile } = useAuth();
  const [name, setName] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      loadData();
    }
  }, [currentProfile]);

  async function loadData() {
    try {
      setIsLoading(true);
      await Promise.all([
        loadUserStats(),
        currentProfile?.role === 'supervisor' ? loadUsers() : Promise.resolve()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserStats() {
    if (!user) return;

    try {
      const { data: reports } = await supabase
        .from('reports')
        .select('status')
        .eq('user_id', user.id);

      const { data: deadlines } = await supabase
        .from('deadlines')
        .select('*')
        .gt('due_date', new Date().toISOString())
        .order('due_date');

      setUserStats({
        totalReports: reports?.length || 0,
        pendingReports: reports?.filter(r => r.status === 'pending').length || 0,
        approvedReports: reports?.filter(r => r.status === 'approved').length || 0,
        upcomingDeadlines: deadlines?.length || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function loadUsers() {
    try {
      const profiles = await getAllProfiles();
      setUsers(profiles);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      await updateProfile(user.id, { name });
      setSuccessMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await updateUserRole(userId, newRole);
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      setSuccessMessage('Função atualizada com sucesso!');
      
      if (userId === user?.id) {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar função');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* User Stats */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Estatísticas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Relatórios</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats?.totalReports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats?.pendingReports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aprovados</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats?.approvedReports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Prazos Próximos</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats?.upcomingDeadlines || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Configurações do Perfil</h3>
          
          {error && <ErrorMessage error={error} />}

          {successMessage && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full bg-gray-50 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Função
              </label>
              <select
                value={currentProfile?.role}
                onChange={(e) => handleRoleChange(user?.id || '', e.target.value as UserRole)}
                disabled={currentProfile?.role !== 'supervisor'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="engineer">Engenheiro</option>
                <option value="supervisor">Supervisor</option>
                <option value="technician">Técnico</option>
              </select>
              {currentProfile?.role !== 'supervisor' && (
                <p className="mt-2 text-sm text-gray-500">
                  Apenas supervisores podem alterar funções.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Settings */}
      <NotificationSettings />

      {/* User Management (Supervisor Only) */}
      {currentProfile?.role === 'supervisor' && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Gerenciar Usuários</h3>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">{users.length} usuários</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="engineer">Engenheiro</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="technician">Técnico</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}