import React, { useState } from 'react';
import { Brain, AlertTriangle, Clock, DollarSign, FileText } from 'lucide-react';
import { analyzePathologyImage, predictMaintenance, generateReport } from '../lib/services/ai';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';

interface PathologyAnalysisProps {
  pathologyId: string;
  imageUrl: string;
}

export default function PathologyAnalysis({ pathologyId, imageUrl }: PathologyAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [analysisResult, maintenanceResult] = await Promise.all([
        analyzePathologyImage(imageUrl),
        predictMaintenance(pathologyId)
      ]);
      
      setAnalysis(analysisResult);
      setMaintenance(maintenanceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar patologia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await generateReport(pathologyId);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage error={error} />}

      <div className="flex justify-end space-x-4">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          leftIcon={<Brain />}
        >
          {isLoading ? 'Analisando...' : 'Analisar Patologia'}
        </Button>
        <Button
          onClick={handleGenerateReport}
          disabled={isLoading || !analysis}
          leftIcon={<FileText />}
        >
          Gerar Relatório
        </Button>
      </div>

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-medium">Análise da Patologia</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{analysis.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Severidade</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      analysis.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : analysis.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {analysis.severity === 'high' ? 'Alta' : analysis.severity === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Recomendações</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="list-disc pl-5 space-y-1">
                      {analysis.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </Card.Body>
          </Card>

          {maintenance && (
            <Card>
              <Card.Header>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium">Previsão de Manutenção</h3>
                </div>
              </Card.Header>
              <Card.Body>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Próxima Manutenção</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(maintenance.nextMaintenance).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Custo Estimado</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {maintenance.estimatedCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Recomendações</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <ul className="list-disc pl-5 space-y-1">
                        {maintenance.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {report && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium">Relatório Técnico</h3>
          </Card.Header>
          <Card.Body>
            <pre className="whitespace-pre-wrap text-sm text-gray-900">
              {report}
            </pre>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}