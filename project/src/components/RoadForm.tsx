import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Coordinates } from '../lib/types';
import { createRoad } from '../lib/services/roads';
import RoadCoordinatesForm from './RoadCoordinatesForm';

interface RoadFormProps {
  serviceOrderId: string;
  onSuccess: (roadId: string) => void;
  onCancel: () => void;
}

export default function RoadForm({ serviceOrderId, onSuccess, onCancel }: RoadFormProps) {
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [pavedLength, setPavedLength] = useState('');
  const [sidewalkLength, setSidewalkLength] = useState('');
  const [curbLength, setCurbLength] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !length || !width || !coordinates.length) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const road = await createRoad(
        serviceOrderId,
        name,
        parseFloat(length),
        parseFloat(width),
        parseFloat(pavedLength) || 0,
        parseFloat(sidewalkLength) || 0,
        parseFloat(curbLength) || 0,
        coordinates
      );
      onSuccess(road.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar via');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Via</h3>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <X className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome da Via *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comprimento (m) *
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Largura (m) *
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trecho Pavimentado (m)
            </label>
            <input
              type="number"
              value={pavedLength}
              onChange={(e) => setPavedLength(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trecho com Calçada (m)
            </label>
            <input
              type="number"
              value={sidewalkLength}
              onChange={(e) => setSidewalkLength(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trecho com Meio-fio (m)
            </label>
            <input
              type="number"
              value={curbLength}
              onChange={(e) => setCurbLength(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <RoadCoordinatesForm
          coordinates={coordinates}
          onCoordinatesChange={setCoordinates}
        />

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
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
                <Save className="h-4 w-4 mr-2" />
                Salvar Via
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}