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
import type { TeamProductivity } from '../../lib/services/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TeamProductivityChartProps {
  data: TeamProductivity[];
}

export default function TeamProductivityChart({ data }: TeamProductivityChartProps) {
  const chartData = {
    labels: data.map(item => item.userName),
    datasets: [
      {
        label: 'Aprovados',
        data: data.map(item => item.approvedReports),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Pendentes',
        data: data.map(item => item.pendingReports),
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1
      },
      {
        label: 'Rejeitados',
        data: data.map(item => item.rejectedReports),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
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
        text: 'Produtividade por Membro da Equipe'
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true
      }
    }
  };

  return <Bar data={chartData} options={options} />;
}