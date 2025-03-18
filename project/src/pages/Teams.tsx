import React, { useState } from 'react';
import { Users, Plus, UserPlus, Calendar, MessageSquare, FileText, BarChart, UserX, Shield } from 'lucide-react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { createTeam, getTeams, addTeamMember, createTask, getTeamTasks } from '../lib/services/teams';
import { getAllProfiles, updateUserRole } from '../lib/services/profiles';
import { getTeamStats } from '../lib/services/analytics';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import TeamCalendar from '../components/TeamCalendar';
import TeamChat from '../components/TeamChat';
import TeamFiles from '../components/TeamFiles';
import TeamStatsChart from '../components/analytics/TeamStatsChart';

type ActiveTab = 'calendar' | 'chat' | 'files' | 'stats' | 'users';

export default function Teams() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [memberRole, setMemberRole] = useState<'leader' | 'member'>('member');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Fetch data
  const { data: teams, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useSupabaseQuery({
    query: getTeams,
    dependencies: []
  });

  const { data: profiles, loading: profilesLoading, error: profilesError } = useSupabaseQuery({
    query: getAllProfiles,
    dependencies: []
  });

  const { data: tasks, loading: tasksLoading } = useSupabaseQuery({
    query: () => getTeamTasks(selectedTeam!),
    dependencies: [selectedTeam]
  });

  const { data: teamStats } = useSupabaseQuery({
    query: () => selectedTeam ? getTeamStats(selectedTeam) : Promise.resolve(null),
    dependencies: [selectedTeam]
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Nome da equipe é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createTeam(teamName.trim(), teamDescription.trim());
      setShowNewTeamForm(false);
      setTeamName('');
      setTeamDescription('');
      await refetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedMember) {
      setError('Selecione uma equipe e um membro');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await addTeamMember(selectedTeam, selectedMember, memberRole);
      setShowAddMemberForm(false);
      setSelectedMember('');
      setMemberRole('member');
      await refetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !taskTitle || !taskAssignee || !taskDueDate) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createTask(
        selectedTeam,
        taskTitle,
        taskDescription,
        taskAssignee,
        new Date(taskDueDate),
        taskPriority
      );
      setShowNewTaskForm(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssignee('');
      setTaskDueDate('');
      setTaskPriority('medium');
      await refetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (teamsLoading || profilesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (teamsError || profilesError) {
    return <ErrorMessage error={teamsError || profilesError} />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gerenciamento de Equipes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie equipes, membros e tarefas
          </p>
        </div>
        <Button
          onClick={() => setShowNewTeamForm(true)}
          leftIcon={<Plus />}
        >
          Nova Equipe
        </Button>
      </div>

      {error && <ErrorMessage error={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Teams List */}
        <div className="space-y-4">
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">
                  Equipes
                </h2>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-200">
                {teams?.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                      selectedTeam === team.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <h3 className="text-sm font-medium text-gray-900">
                      {team.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {team.members?.length || 0} membros
                    </p>
                  </button>
                ))}
                {!teams?.length && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Nenhuma equipe cadastrada
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {selectedTeam && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowAddMemberForm(true)}
                variant="outline"
                leftIcon={<UserPlus />}
                className="w-full"
              >
                Adicionar Membro
              </Button>
              <Button
                onClick={() => setShowNewTaskForm(true)}
                variant="outline"
                leftIcon={<Plus />}
                className="w-full"
              >
                Nova Tarefa
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className="h-5 w-5 mr-2" />
                Membros
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`${
                  activeTab === 'calendar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Calendário
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FileText className="h-5 w-5 mr-2" />
                Arquivos
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart className="h-5 w-5 mr-2" />
                Estatísticas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {selectedTeam ? (
            <>
              {activeTab === 'calendar' && tasks && (
                <TeamCalendar tasks={tasks} />
              )}

              {activeTab === 'chat' && (
                <TeamChat teamId={selectedTeam} />
              )}

              {activeTab === 'files' && (
                <TeamFiles teamId={selectedTeam} />
              )}

              {activeTab === 'stats' && teamStats && (
                <TeamStatsChart data={teamStats} />
              )}

              {activeTab === 'users' && (
                <Card>
                  <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900">
                      Membros da Equipe
                    </h3>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-4">
                      {teams?.find(t => t.id === selectedTeam)?.members?.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {member.user.name[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">
                                {member.user.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {member.role === 'leader' ? 'Líder' : 'Membro'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className={`h-5 w-5 ${
                              member.role === 'leader' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                Selecione uma equipe para ver os detalhes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Team Modal */}
      {showNewTeamForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nova Equipe
            </h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTeamForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : undefined}
                >
                  {isSubmitting ? 'Criando...' : 'Criar Equipe'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Adicionar Membro
            </h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Usuário *
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Selecione um usuário</option>
                  {profiles?.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Função *
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as 'leader' | 'member')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="member">Membro</option>
                  <option value="leader">Líder</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMemberForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : undefined}
                >
                  {isSubmitting ? 'Adicionando...' : 'Adicionar Membro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nova Tarefa
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Responsável *
                </label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Selecione um responsável</option>
                  {teams?.find(t => t.id === selectedTeam)?.members?.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de Entrega *
                </label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prioridade *
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTaskForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : undefined}
                >
                  {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}