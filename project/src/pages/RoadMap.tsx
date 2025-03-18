import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Map as MapIcon, Navigation, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getServiceOrders } from '../lib/services/serviceOrders';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { ServiceOrder, Road, Pathology } from '../lib/types';

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pathologyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RoadWithCoordinates extends Road {
  coordinates: [number, number][];
  pathologies: (Pathology & { coordinates: [number, number] })[];
}

interface ServiceOrderWithCoordinates extends ServiceOrder {
  roads: RoadWithCoordinates[];
}

export default function RoadMap() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo
  const [zoom, setZoom] = useState(12);

  const { data: serviceOrders, loading, error } = useSupabaseQuery<ServiceOrder[]>({
    query: getServiceOrders,
    dependencies: []
  });

  // Mock coordinates for demonstration
  // In a real application, these would come from the database
  const ordersWithCoordinates: ServiceOrderWithCoordinates[] = serviceOrders?.map(order => ({
    ...order,
    roads: order.roads.map(road => ({
      ...road,
      coordinates: generateMockCoordinates(center, road.length),
      pathologies: road.pathologies.map(pathology => ({
        ...pathology,
        coordinates: generateRandomPoint(center)
      }))
    }))
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mapa de Vias</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualize as vias cadastradas e suas patologias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Service Orders List */}
        <div className="space-y-4">
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-2">
                <MapIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">
                  Ordens de Serviço
                </h2>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {ordersWithCoordinates.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                      selectedOrder === order.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <h3 className="text-sm font-medium text-gray-900">
                      OS #{order.number}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {order.roads.length} via(s) • {
                        order.roads.reduce((acc, road) => acc + road.pathologies.length, 0)
                      } patologia(s)
                    </p>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Legend */}
          <Card>
            <Card.Body>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Via</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Patologia</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <div className="h-[600px]">
              <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {ordersWithCoordinates.map((order) => (
                  <React.Fragment key={order.id}>
                    {order.roads.map((road) => (
                      <React.Fragment key={road.id}>
                        {/* Road path */}
                        <Polyline
                          positions={road.coordinates}
                          color={selectedOrder === order.id ? '#2563eb' : '#94a3b8'}
                          weight={3}
                        >
                          <Popup>
                            <div className="text-sm">
                              <p className="font-medium">{road.name}</p>
                              <p className="text-gray-600">
                                Extensão: {road.length}m
                              </p>
                            </div>
                          </Popup>
                        </Polyline>

                        {/* Pathologies */}
                        {road.pathologies.map((pathology) => (
                          <Marker
                            key={pathology.id}
                            position={pathology.coordinates}
                            icon={pathologyIcon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-medium text-red-600">Patologia</p>
                                <p>{pathology.description}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions to generate mock coordinates
function generateMockCoordinates(center: [number, number], length: number): [number, number][] {
  const points = Math.ceil(length / 100); // One point every 100 meters
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i < points; i++) {
    coordinates.push([
      center[0] + (Math.random() - 0.5) * 0.01,
      center[1] + (Math.random() - 0.5) * 0.01
    ]);
  }
  
  return coordinates;
}

function generateRandomPoint(center: [number, number]): [number, number] {
  return [
    center[0] + (Math.random() - 0.5) * 0.01,
    center[1] + (Math.random() - 0.5) * 0.01
  ];
}