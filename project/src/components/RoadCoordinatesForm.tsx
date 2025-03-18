import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import { Plus, Trash2, MapPin, Info } from 'lucide-react';
import type { Coordinates } from '../lib/types';

interface RoadCoordinatesFormProps {
  coordinates: Coordinates[];
  onCoordinatesChange: (coordinates: Coordinates[]) => void;
}

function CoordinatesPicker({ onCoordinateSelect }: { onCoordinateSelect: (coord: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onCoordinateSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
}

export default function RoadCoordinatesForm({ coordinates, onCoordinatesChange }: RoadCoordinatesFormProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [error, setError] = useState('');

  const handleCoordinateSelect = (coord: Coordinates) => {
    onCoordinatesChange([...coordinates, coord]);
  };

  const handleRemoveCoordinate = (index: number) => {
    onCoordinatesChange(coordinates.filter((_, i) => i !== index));
  };

  const handleAddManualCoordinate = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Coordenadas inválidas');
      return;
    }

    onCoordinatesChange([...coordinates, { lat, lng }]);
    setNewLat('');
    setNewLng('');
    setShowManualForm(false);
    setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Traçado da Via *
        </label>
        <div className="flex items-center text-sm text-gray-500">
          <Info className="h-4 w-4 mr-1" />
          Clique no mapa para adicionar pontos
        </div>
      </div>

      {/* Instruções */}
      <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Como adicionar coordenadas:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Clique diretamente no mapa para adicionar pontos</li>
          <li>2. Os pontos serão conectados na ordem em que foram adicionados</li>
          <li>3. Para maior precisão, use o formulário "Adicionar Manualmente"</li>
          <li>4. Latitude: valores entre -90 e 90 (Ex: -23.5505)</li>
          <li>5. Longitude: valores entre -180 e 180 (Ex: -46.6333)</li>
        </ul>
      </div>

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
          <CoordinatesPicker onCoordinateSelect={handleCoordinateSelect} />
          {coordinates.map((coord, index) => (
            <Marker
              key={`marker-${index}`}
              position={[coord.lat, coord.lng]}
              title={`Ponto ${index + 1}`}
            />
          ))}
          {coordinates.length > 1 && (
            <Polyline
              positions={coordinates.map(coord => [coord.lat, coord.lng])}
              color="blue"
            />
          )}
        </MapContainer>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Coordenadas</h4>
          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Manualmente
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {showManualForm && (
          <form onSubmit={handleAddManualCoordinate} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude (-90 a 90)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    step="any"
                    min="-90"
                    max="90"
                    required
                    placeholder="-23.5505"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Exemplo: -23.5505 (Sul) ou 23.5505 (Norte)
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude (-180 a 180)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    step="any"
                    min="-180"
                    max="180"
                    required
                    placeholder="-46.6333"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Exemplo: -46.6333 (Oeste) ou 46.6333 (Leste)
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}

        <div className="mt-2 space-y-2">
          {coordinates.map((coord, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  Ponto {index + 1}: {coord.lat.toFixed(6)}° {coord.lat >= 0 ? 'N' : 'S'}, {coord.lng.toFixed(6)}° {coord.lng >= 0 ? 'L' : 'O'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCoordinate(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}