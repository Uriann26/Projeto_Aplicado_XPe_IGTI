import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { addComment } from '../lib/reports';

type CommentSectionProps = {
  reportId: string;
  comments: string[];
  onCommentAdded: (newComment: string) => void;
};

export default function CommentSection({ reportId, comments, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      await addComment(reportId, newComment);
      onCommentAdded(newComment);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comentários</h3>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {comments && comments.length > 0 ? (
          comments.map((comment, index) => {
            const [timestamp, content] = comment.split(' - ');
            const date = new Date(timestamp);
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{content}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-start space-x-4">
          <div className="min-w-0 flex-1">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}