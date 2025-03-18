import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Save, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import type { Coordinates } from '../lib/types';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Road {
  name: string;
  length: number;
  width: number;
  paved_length: number;
  sidewalk_length: number;
  curb_length: number;
  coordinates: Coordinates[];
  pathologies: {
    description: string;
    coordinates: Coordinates;
  }[];
}

interface FormData {
  serviceOrderNumber: string;
  roads: Road[];
}

const initialRoad: Road = {
  name: '',
  length: 0,
  width: 0,
  paved_length: 0,
  sidewalk_length: 0,
  curb_length: 0,
  coordinates: [],
  pathologies: []
};

function MapComponent({ 
  onLocationSelect, 
  markers = [], 
  isPathology = false 
}: { 
  onLocationSelect: (coords: Coordinates) => void;
  markers?: Coordinates[];
  isPathology?: boolean;
}) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((coords, index) => (
        <Marker
          key={`${coords.lat}-${coords.lng}-${index}`}
          position={[coords.lat, coords.lng]}
        />
      ))}
    </>
  );
}

export default function RoadReport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    serviceOrderNumber: '',
    roads: [{ ...initialRoad }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedRoadIndex, setSelectedRoadIndex] = useState<number>(0);
  const [selectedPathologyIndex, setSelectedPathologyIndex] = useState<number | null>(null);

  const handleRoadChange = (index: number, field: keyof Road, value: any) => {
    const newRoads = [...formData.roads];
    newRoads[index] = {
      ...newRoads[index],
      [field]: value
    };
    setFormData({ ...formData, roads: newRoads });
  };

  const handlePathologyChange = (roadIndex: number, pathologyIndex: number, value: string) => {
    const newRoads = [...formData.roads];
    newRoads[roadIndex].pathologies[pathologyIndex] = {
      ...newRoads[roadIndex].pathologies[pathologyIndex],
      description: value
    };
    setFormData({ ...formData, roads: newRoads });
  };

  const handleLocationSelect = (coords: Coordinates) => {
    const newRoads = [...formData.roads];
    if (selectedPathologyIndex !== null) {
      // Update pathology location
      newRoads[selectedRoadIndex].pathologies[selectedPathologyIndex].coordinates = coords;
    } else {
      // Add point to road path
      newRoads[selectedRoadIndex].coordinates.push(coords);
    }
    setFormData({ ...formData, roads: newRoads });
  };

  const addRoad = () => {
    setFormData({
      ...formData,
      roads: [...formData.roads, { ...initialRoad }]
    });
  };

  const removeRoad = (index: number) => {
    const newRoads = formData.roads.filter((_, i) => i !== index);
    setFormData({ ...formData, roads: newRoads });
    if (selectedRoadIndex === index) {
      setSelectedRoadIndex(Math.max(0, index - 1));
    }
  };

  const addPathology = (roadIndex: number) => {
    const newRoads = [...formData.roads];
    newRoads[roadIndex].pathologies.push({
      description: '',
      coordinates: { lat: 0, lng: 0 }
    });
    setFormData({ ...formData, roads: newRoads });
    setSelectedPathologyIndex(newRoads[roadIndex].pathologies.length - 1);
  };

  const removePathology = (roadIndex: number, pathologyIndex: number) => {
    const newRoads = [...formData.roads];
    newRoads[roadIndex].pathologies = newRoads[roadIndex].pathologies.filter(
      (_, i) => i !== pathologyIndex
    );
    setFormData({ ...formData, roads: newRoads });
    if (selectedPathologyIndex === pathologyIndex) {
      setSelectedPathologyIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create service order
      const { data: serviceOrder, error: serviceOrderError } = await supabase
        .from('service_orders')
        .insert({
          number: formData.serviceOrderNumber,
          user_id: user.id
        })
        .select()
        .single();

      if (serviceOrderError) throw serviceOrderError;

      // Create roads and pathologies
      for (const road of formData.roads) {
        const { data: roadData, error: roadError } = await supabase
          .from('roads')
          .insert({
            service_order_id: serviceOrder.id,
            name: road.name,
            length: road.length,
            width: road.width,
            paved_length: road.paved_length,
            sidewalk_length: road.sidewalk_length,
            curb_length: road.curb_length,
            coordinates: road.coordinates
          })
          .select()
          .single();

        if (roadError) throw roadError;

        // Create pathologies for this road
        const pathologyPromises = road.pathologies
          .filter(p => p.description.trim())
          .map(pathology =>
            supabase
              .from('pathologies')
              .insert({
                road_id: roadData.id,
                description: pathology.description,
                coordinates: pathology.coordinates
              })
          );

        await Promise.all(pathologyPromises);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar relatório');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Relatório salvo com sucesso! Redirecionando...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Relatório de Vias
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="serviceOrderNumber" className="block text-sm font-medium text-gray-700">
                  Número da OS
                </label>
                <input
                  type="text"
                  id="serviceOrderNumber"
                  value={formData.serviceOrderNumber}
                  onChange={(e) => setFormData({ ...formData, serviceOrderNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              {formData.roads.map((road, roadIndex) => (
                <div key={roadIndex} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Via {roadIndex + 1}</h4>
                    {roadIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => removeRoad(roadIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Via
                      </label>
                      <input
                        type="text"
                        value={road.name}
                        onChange={(e) => handleRoadChange(roadIndex, 'name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Comprimento (m)
                      </label>
                      <input
                        type="number"
                        value={road.length}
                        onChange={(e) => handleRoadChange(roadIndex, 'length', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Largura (m)
                      </label>
                      <input
                        type="number"
                        value={road.width}
                        onChange={(e) => handleRoadChange(roadIndex, 'width', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trecho Asfaltado (m)
                      </label>
                      <input
                        type="number"
                        value={road.paved_length}
                        onChange={(e) => handleRoadChange(roadIndex, 'paved_length', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
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
                        value={road.sidewalk_length}
                        onChange={(e) => handleRoadChange(roadIndex, 'sidewalk_length', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trecho com Meio Fio (m)
                      </label>
                      <input
                        type="number"
                        value={road.curb_length}
                        onChange={(e) => handleRoadChange(roadIndex, 'curb_length', parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patologias
                    </label>
                    {road.pathologies.map((pathology, pathologyIndex) => (
                      <div key={pathologyIndex} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={pathology.description}
                          onChange={(e) => handlePathologyChange(roadIndex, pathologyIndex, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Descreva a patologia"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoadIndex(roadIndex);
                            setSelectedPathologyIndex(pathologyIndex);
                          }}
                          className={`p-2 rounded-md ${
                            selectedPathologyIndex === pathologyIndex && selectedRoadIndex === roadIndex
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <MapPin className="h-5 w-5" />
                        </button>
                        {pathologyIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => removePathology(roadIndex, pathologyIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addPathology(roadIndex)}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Patologia
                    </button>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoadIndex(roadIndex);
                        setSelectedPathologyIndex(null);
                      }}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                        selectedRoadIndex === roadIndex && selectedPathologyIndex === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {road.coordinates.length > 0 ? 'Continuar Traçado' : 'Traçar Via'}
                    </button>
                  </div>
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={addRoad}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Via
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Relatório
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="h-[800px]">
            <MapContainer
              center={[-23.5505, -46.6333]} // São Paulo
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <MapComponent
                onLocationSelect={handleLocationSelect}
                markers={
                  selectedPathologyIndex !== null
                    ? [formData.roads[selectedRoadIndex].pathologies[selectedPathologyIndex].coordinates]
                    : formData.roads[selectedRoadIndex].coordinates
                }
                isPathology={selectedPathologyIndex !== null}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}