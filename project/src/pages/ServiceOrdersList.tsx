import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { useSupabaseQuery } from '../lib/hooks/useSupabaseQuery';
import { getServiceOrders } from '../lib/services/serviceOrders';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export default function ServiceOrdersList() {
  const navigate = useNavigate();
  const { data: serviceOrders, loading, error } = useSupabaseQuery({
    query: getServiceOrders,
    dependencies: []
  });

  const handleNewServiceOrder = () => {
    navigate('/dashboard/road-report');
  };

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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Ordens de Serviço</h2>
          <p className="mt-1 text-sm text-gray-600">
            Lista de todas as ordens de serviço e suas vias cadastradas
          </p>
        </div>
        <Button
          onClick={handleNewServiceOrder}
          leftIcon={<Plus />}
        >
          Nova OS
        </Button>
      </div>

      <div className="space-y-6">
        {serviceOrders?.length === 0 ? (
          <Card>
            <Card.Body>
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <MapPin className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma OS cadastrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece criando uma nova ordem de serviço.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={handleNewServiceOrder}
                    leftIcon={<Plus />}
                  >
                    Nova OS
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ) : (
          serviceOrders?.map((order) => (
            <Card key={order.id} variant="hover">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      OS #{order.number}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Criada em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {order.roads.length} via(s)
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Lista de Vias */}
                <div className="mt-4 space-y-2">
                  {order.roads.map((road) => (
                    <div
                      key={road.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{road.name}</h4>
                          <div className="mt-1 text-sm text-gray-500 space-y-1">
                            <p>Extensão: {road.length}m • Largura: {road.width}m</p>
                            <p>
                              Pavimentado: {road.paved_length}m • 
                              Calçada: {road.sidewalk_length}m • 
                              Meio-fio: {road.curb_length}m
                            </p>
                          </div>
                        </div>
                        {road.pathologies.length > 0 && (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">
                              {road.pathologies.length} patologia(s)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lista de Patologias */}
                      {road.pathologies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-red-200 space-y-2">
                          {road.pathologies.map((pathology) => (
                            <div
                              key={pathology.id}
                              className="text-sm text-gray-600"
                            >
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-red-400 mr-2" />
                                {pathology.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}