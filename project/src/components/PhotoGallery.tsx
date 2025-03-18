import React, { useState } from 'react';
import { Camera, Trash2, MapPin } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import LightGallery from 'lightgallery';
import 'lightgallery/css/lightgallery.css';
import { uploadRoadPhoto, deleteRoadPhoto } from '../lib/services/photos';
import type { RoadPhoto } from '../types';

interface PhotoGalleryProps {
  roadId: string;
  photos: RoadPhoto[];
  onPhotoAdded: (photo: RoadPhoto) => void;
  onPhotoDeleted: (photoId: string) => void;
}

export default function PhotoGallery({
  roadId,
  photos,
  onPhotoAdded,
  onPhotoDeleted
}: PhotoGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);
      setError('');

      for (const file of acceptedFiles) {
        const photo = await uploadRoadPhoto(
          roadId,
          file,
          '',
          { lat: 0, lng: 0 }, // TODO: Get actual location
          new Date()
        );
        onPhotoAdded(photo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload das fotos');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: true
  });

  const handleDelete = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;

    try {
      await deleteRoadPhoto(photoId);
      onPhotoDeleted(photoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir foto');
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Camera className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Arraste e solte fotos aqui, ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500">
          JPG, JPEG, PNG até 10MB
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Fotos ({photos.length})
            </h3>
            {selectedPhotos.length === 2 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showComparison ? 'Voltar à Galeria' : 'Comparar Selecionadas'}
              </button>
            )}
          </div>

          {showComparison && selectedPhotos.length === 2 ? (
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={photos.find(p => p.id === selectedPhotos[0])?.photo_url || ''}
                  alt="Before"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={photos.find(p => p.id === selectedPhotos[1])?.photo_url || ''}
                  alt="After"
                />
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative group ${
                    selectedPhotos.includes(photo.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => togglePhotoSelection(photo.id)}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.description || 'Road photo'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id);
                        }}
                        className="p-2 text-white hover:text-red-500"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  {photo.location && (photo.location.lat !== 0 || photo.location.lng !== 0) && (
                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-1">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {new Date(photo.taken_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}