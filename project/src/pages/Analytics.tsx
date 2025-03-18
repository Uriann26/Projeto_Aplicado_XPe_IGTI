import React from 'react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getTeamProductivity, getRoadConditionStats, getMonthlyStats } from '../lib/services/analytics';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import TeamProductivityChart from '../components/analytics/TeamProductivityChart';
import RoadConditionsChart from '../components/analytics/RoadConditionsChart';
import MonthlyProgressChart from '../components/analytics/MonthlyProgressChart';

export default function Analytics() {
  const { data: teamProductivity, loading: productivityLoading, error: productivityError } = useSupabaseQuery({
    query: getTeamProductivity,
    dependencies: []
  });

  const { data: roadConditions, loading: conditionsLoading, error: conditionsError } = useSupabaseQuery({
    query: getRoadConditionStats,
    dependencies: []
  });

  const { data: monthlyStats, loading: monthlyLoading, error: monthlyError } = useSupabaseQuery({
    query: () => getMonthlyStats(6),
    dependencies: []
  });

  if (productivityLoading || conditionsLoading || monthlyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (productivityError || conditionsError || monthlyError) {
    return <ErrorMessage error={productivityError || conditionsError || monthlyError} />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Análise e Estatísticas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualize métricas e tendências do sistema
          </p>
        </div>
      </div>

      {/* Monthly Progress */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-medium text-gray-900">
            Evolução Mensal
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="h-96">
            {monthlyStats && <MonthlyProgressChart data={monthlyStats} />}
          </div>
        </Card.Body>
      </Card>

      {/* Team Productivity */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-medium text-gray-900">
            Produtividade da Equipe
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="h-96">
            {teamProductivity && <TeamProductivityChart data={teamProductivity} />}
          </div>
        </Card.Body>
      </Card>

      {/* Road Conditions */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-medium text-gray-900">
            Condições das Vias
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="h-96">
            {roadConditions && <RoadConditionsChart data={roadConditions} />}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}