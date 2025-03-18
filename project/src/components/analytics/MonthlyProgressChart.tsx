import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { MonthlyStats } from '../../lib/services/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyProgressChartProps {
  data: MonthlyStats[];
}

export default function MonthlyProgressChart({ data }: MonthlyProgressChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Relatórios',
        data: data.map(item => item.reports),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      },
      {
        label: 'Patologias',
        data: data.map(item => item.pathologies),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.4
      },
      {
        label: 'Extensão Inspecionada (m)',
        data: data.map(item => item.inspectedLength),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4
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
        text: 'Evolução Mensal'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={chartData} options={options} />;
}