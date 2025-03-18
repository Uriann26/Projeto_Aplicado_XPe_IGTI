import React, { useState } from 'react';
import { FileText, Upload, Clock, CheckCircle, AlertTriangle, Loader as Road, ChevronRight, TrendingUp, Users, Plus, MapPin, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getReports, getReportStats } from '../lib/services/reports';
import { getServiceOrders } from '../lib/services/serviceOrders';
import { getTeamStats } from '../lib/services/analytics';
import { useAuth } from '../lib/hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import DeadlineCalendar from '../components/DeadlineCalendar';
import TeamStatsChart from '../components/analytics/TeamStatsChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: reports, loading: reportsLoading, error: reportsError } = useSupabaseQuery({
    query: getReports,
    dependencies: []
  });

  const { data: stats, loading: statsLoading, error: statsError } = useSupabaseQuery({
    query: getReportStats,
    dependencies: []
  });

  const { data: serviceOrders, loading: ordersLoading, error: ordersError } = useSupabaseQuery({
    query: getServiceOrders,
    dependencies: []
  });

  const { data: teamStats } = useSupabaseQuery({
    query: () => selectedTeam ? getTeamStats(selectedTeam) : Promise.resolve(null),
    dependencies: [selectedTeam]
  });

  if (reportsLoading || statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (reportsError || statsError || ordersError) {
    return <ErrorMessage error={reportsError || statsError || ordersError} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-8 -mt-8 px-8 py-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">
            Bem-vindo, {profile?.name || 'Usuário'}!
          </h1>
          <p className="mt-2 text-blue-100">
            Gerencie seus relatórios e acompanhe o progresso da sua equipe
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="hover" onClick={() => navigate('/dashboard/upload')} className="cursor-pointer">
          <Card.Body className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Novo Relatório</h3>
              <p className="text-sm text-gray-500">Upload de relatório técnico</p>
            </div>
          </Card.Body>
        </Card>

        <Card variant="hover" onClick={() => navigate('/dashboard/road-report')} className="cursor-pointer">
          <Card.Body className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Nova OS</h3>
              <p className="text-sm text-gray-500">Cadastrar ordem de serviço</p>
            </div>
          </Card.Body>
        </Card>

        <Card variant="hover" onClick={() => navigate('/dashboard/daily-reports')} className="cursor-pointer">
          <Card.Body className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Relatório Diário</h3>
              <p className="text-sm text-gray-500">Registrar atividades do dia</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="hover">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Relatórios
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.total || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                      <span className="sr-only">Aumentou</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card variant="hover">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendentes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.pending || 0}
                    </div>
                    <Badge variant="warning" size="sm" className="ml-2">
                      Aguardando
                    </Badge>
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card variant="hover">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aprovados
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.approved || 0}
                    </div>
                    <Badge variant="success" size="sm" className="ml-2">
                      {((stats?.approved || 0) / (stats?.total || 1) * 100).toFixed(0)}%
                    </Badge>
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card variant="hover">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Este Mês
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.monthly || 0}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      relatórios
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Calendar and Recent Service Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Calendário de Prazos
            </h2>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Clock />}
            >
              Ver Todos
            </Button>
          </div>
          <DeadlineCalendar reports={reports || []} />
        </div>

        {/* Recent Service Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Ordens de Serviço Recentes
            </h2>
            <Button
              as={Link}
              to="/dashboard/service-orders"
              variant="primary"
              size="sm"
              leftIcon={<Plus />}
            >
              Nova OS
            </Button>
          </div>

          <Card>
            <div className="divide-y divide-gray-200">
              {(serviceOrders || []).slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        OS #{order.number}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="default" size="sm">
                        {order.roads.length} via(s)
                      </Badge>
                      <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {order.roads.map((road) => (
                      <div key={road.id} className="text-sm text-gray-500 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                        {road.name} ({road.length}m)
                        {road.pathologies.length > 0 && (
                          <Badge variant="error" size="sm" className="ml-2">
                            {road.pathologies.length} patologia(s)
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!serviceOrders?.length && (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma ordem de serviço cadastrada
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Team Stats */}
      {teamStats && (
        <Card>
          <Card.Header>
            <h2 className="text-lg font-medium text-gray-900">
              Estatísticas da Equipe
            </h2>
          </Card.Header>
          <Card.Body>
            <div className="h-96">
              <TeamStatsChart data={teamStats} />
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}