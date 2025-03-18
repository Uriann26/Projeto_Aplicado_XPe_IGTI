import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Save, X, MapPin } from 'lucide-react';
import type { Coordinates } from '../lib/types';
import { createPathology } from '../lib/services/roads';

interface PathologyFormProps {
  roadId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function LocationPicker({ onLocationSelect }: { onLocationSelect: (coord: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
}

export default function PathologyForm({ roadId, onSuccess, onCancel }: PathologyFormProps) {
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !coordinates) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createPathology(roadId, description, coordinates);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar patologia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Patologia</h3>

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
          <label className="block text-sm font-medium text-gray-700">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Descreva a patologia encontrada"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização *
          </label>
          <div className="h-96 bg-gray-100 rounded-lg overflow-hidden">
            <MapContainer
              center={[-23.5505, -46.6333]} // São Paulo
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker onLocationSelect={setCoordinates} />
              {coordinates && (
                <Marker position={[coordinates.lat, coordinates.lng]} />
              )}
            </MapContainer>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Clique no mapa para marcar a localização da patologia
          </p>
        </div>

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
                Salvar Patologia
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}