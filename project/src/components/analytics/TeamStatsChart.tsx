import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TeamStats } from '../../lib/services/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TeamStatsChartProps {
  data: TeamStats;
}

export default function TeamStatsChart({ data }: TeamStatsChartProps) {
  const chartData = {
    labels: ['Prioridade', 'Status'],
    datasets: [
      {
        label: 'Alta/Pendente',
        data: [data.tasksByPriority.high, data.tasksByStatus.pending],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Média/Em Progresso',
        data: [data.tasksByPriority.medium, data.tasksByStatus.in_progress],
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1
      },
      {
        label: 'Baixa/Concluída',
        data: [data.tasksByPriority.low, data.tasksByStatus.completed],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
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
        text: 'Distribuição de Tarefas'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true
      },
      x: {
        stacked: true
      }
    }
  };

  return <Bar data={chartData} options={options} />;
}