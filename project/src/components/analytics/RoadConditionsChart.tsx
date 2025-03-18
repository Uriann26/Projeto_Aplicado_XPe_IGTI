import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { RoadConditionStats } from '../../lib/services/analytics';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RoadConditionsChartProps {
  data: RoadConditionStats;
}

export default function RoadConditionsChart({ data }: RoadConditionsChartProps) {
  const chartData = {
    labels: ['Pavimentado', 'Não Pavimentado', 'Com Calçada', 'Com Meio-fio'],
    datasets: [
      {
        data: [
          data.pavedLength,
          data.totalLength - data.pavedLength,
          data.sidewalkLength,
          data.curbLength
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(168, 85, 247, 0.5)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Condições das Vias'
      }
    }
  };

  return <Doughnut data={chartData} options={options} />;
}