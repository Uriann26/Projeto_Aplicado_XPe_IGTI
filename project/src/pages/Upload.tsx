import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFile, createReport } from '../lib/reports';
import { getUser, createProfileIfNotExists } from '../lib/auth';
import { createDeadline } from '../lib/deadlines';

interface UploadFormData {
  title: string;
  description: string;
  deadline: string;
  file: File | null;
}

export default function Upload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    deadline: '',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({ ...prev, file: acceptedFiles[0] }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const { data: { user } } = await getUser();
      if (!user) throw new Error('Usuário não autenticado');

      await createProfileIfNotExists(user.id, user.email || '');
      const fileUrl = await uploadFile(formData.file, user.id);
      
      const report = await createReport({
        title: formData.title,
        description: formData.description,
        file_url: fileUrl,
        status: 'pending'
      });

      if (formData.deadline && report) {
        await createDeadline(report.id, new Date(formData.deadline));
      }

      navigate('/dashboard/reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do relatório');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Upload de Relatório</h3>
          <p className="mt-2 text-sm text-gray-500">
            Faça upload do seu relatório em formato PDF, DOC, DOCX, XLS ou XLSX.
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <X className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Digite o título do relatório"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Digite uma descrição para o relatório"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Data Limite de Entrega
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Arquivo *</label>
              <div
                {...getRootProps()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                  isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="space-y-1 text-center">
                  <input {...getInputProps()} />
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  {formData.file ? (
                    <p className="text-sm text-gray-600">{formData.file.name}</p>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-blue-600 hover:text-blue-500">
                        Clique para selecionar
                      </p>
                      <p>ou arraste e solte</p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX até 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Relatório'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}