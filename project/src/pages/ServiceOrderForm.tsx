import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, MapPin } from 'lucide-react';
import { createServiceOrder } from '../lib/services/serviceOrders';
import RoadForm from '../components/RoadForm';
import PathologyForm from '../components/PathologyForm';

type FormMode = 'order' | 'road' | 'pathology';

export default function ServiceOrderForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>('order');
  const [orderNumber, setOrderNumber] = useState('');
  const [currentRoadId, setCurrentRoadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serviceOrderId, setServiceOrderId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Número da OS é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const serviceOrder = await createServiceOrder({ number: orderNumber });
      setServiceOrderId(serviceOrder.id);
      setMode('road');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar OS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoadSuccess = (roadId: string) => {
    setCurrentRoadId(roadId);
    setMode('pathology');
  };

  const handlePathologySuccess = () => {
    setMode('road');
    setCurrentRoadId(null);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h2 className="text-lg font-medium text-gray-900">Nova Ordem de Serviço</h2>
        <p className="mt-1 text-sm text-gray-600">
          Cadastre uma nova ordem de serviço e suas vias
        </p>
      </div>

      {mode === 'order' && (
        <div className="mt-6">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <X className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">
                    Número da OS *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="orderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ex: OS-2025-001"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Próximo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mode === 'road' && serviceOrderId && (
        <div className="mt-6">
          <RoadForm
            serviceOrderId={serviceOrderId}
            onSuccess={handleRoadSuccess}
            onCancel={() => navigate('/dashboard')}
          />
        </div>
      )}

      {mode === 'pathology' && currentRoadId && (
        <div className="mt-6">
          <PathologyForm
            roadId={currentRoadId}
            onSuccess={handlePathologySuccess}
            onCancel={() => setMode('road')}
          />
        </div>
      )}
    </div>
  );
}