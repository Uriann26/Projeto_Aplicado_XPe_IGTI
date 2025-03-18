import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Trash2, File, FileText, Image, Film, Music, Archive } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { uploadTeamFile, getTeamFiles, deleteTeamFile } from '../lib/services/teamChat';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import type { TeamFile } from '../types';

interface TeamFilesProps {
  teamId: string;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip') || type.includes('rar')) return Archive;
  return File;
}

function formatFileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default function TeamFiles({ teamId }: TeamFilesProps) {
  const [files, setFiles] = useState<TeamFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop
  });

  React.useEffect(() => {
    loadFiles();
  }, [teamId]);

  async function loadFiles() {
    try {
      setIsLoading(true);
      setError('');
      const data = await getTeamFiles(teamId);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar arquivos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileDrop(acceptedFiles: File[]) {
    try {
      setIsUploading(true);
      setError('');

      for (const file of acceptedFiles) {
        const uploadedFile = await uploadTeamFile(teamId, file);
        setFiles(prev => [uploadedFile, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload dos arquivos');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      await deleteTeamFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir arquivo');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage error={error} />}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-500">Fazendo upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Arraste e solte arquivos aqui, ou clique para selecionar
            </p>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ul role="list" className="divide-y divide-gray-200">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <li
                key={file.id}
                className="px-4 py-4 sm:px-6 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {file.name}
                          </a>
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <p>
                            Enviado por {file.user?.name} •{' '}
                            {formatDistanceToNow(new Date(file.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex space-x-4">
                      <a
                        href={file.file_url}
                        download
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {files.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              Nenhum arquivo enviado ainda
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}