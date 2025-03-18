import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendMessage, getTeamMessages, uploadTeamFile, subscribeToTeamMessages } from '../lib/services/teamChat';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import type { TeamMessage } from '../types';

interface TeamChatProps {
  teamId: string;
}

export default function TeamChat({ teamId }: TeamChatProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadingFiles(prev => [...prev, ...acceptedFiles]);
    },
    multiple: true
  });

  useEffect(() => {
    loadMessages();
    const subscription = subscribeToTeamMessages(teamId, (message) => {
      setMessages(prev => [message, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      setIsLoading(true);
      setError('');
      const data = await getTeamMessages(teamId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() && uploadingFiles.length === 0) return;

    try {
      setIsSending(true);
      setError('');

      const attachments = [];

      // Upload files if any
      for (const file of uploadingFiles) {
        const uploadedFile = await uploadTeamFile(teamId, file);
        attachments.push({
          name: uploadedFile.name,
          url: uploadedFile.file_url
        });
      }

      await sendMessage(teamId, newMessage, attachments);
      setNewMessage('');
      setUploadingFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
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
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      {error && <ErrorMessage error={error} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">
                      {message.user?.name?.[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {message.user?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {message.content}
                  </p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4" />
                          <span>{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="space-y-4">
          {uploadingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadingFiles.map((file, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <span className="truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadingFiles(prev => prev.filter((_, i) => i !== index))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
                rows={1}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isSending || (!newMessage.trim() && uploadingFiles.length === 0)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}