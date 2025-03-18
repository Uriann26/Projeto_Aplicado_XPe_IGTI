import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportData } from '../lib/services/exports';

interface ExportButtonProps {
  type: 'csv' | 'excel' | 'pdf';
  data: 'reports' | 'service_orders' | 'tasks';
  filters?: Record<string, any>;
  className?: string;
}

export default function ExportButton({
  type,
  data,
  filters,
  className = ''
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError('');
      const url = await exportData({ type, data, filters });
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Exportar {type.toUpperCase()}
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}