import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, History } from 'lucide-react';
import { createReview, getReportReviews, createReportVersion } from '../lib/services/reviews';
import type { ReportReview, ReportVersion } from '../types';

interface ReviewSectionProps {
  reportId: string;
  initialReviews: ReportReview[];
  initialVersions: ReportVersion[];
  onReviewAdded: (review: ReportReview) => void;
  onVersionAdded: (version: ReportVersion) => void;
}

export default function ReviewSection({
  reportId,
  initialReviews,
  initialVersions,
  onReviewAdded,
  onVersionAdded
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [versions, setVersions] = useState(initialVersions);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  const handleReview = async (status: 'approved' | 'rejected') => {
    try {
      setIsSubmitting(true);
      setError('');

      const review = await createReview(reportId, status, comment);
      onReviewAdded(review);
      setReviews([review, ...reviews]);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar revisão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Revisão do Relatório
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </button>
            <button
              onClick={() => handleReview('approved')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Histórico de Revisões
          </h3>
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showVersions ? 'Ver Revisões' : 'Ver Versões'}
          </button>
        </div>

        {showVersions ? (
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      Versão {version.version_number}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(version.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Por {version.profiles?.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {review.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {review.profiles?.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {review.comments?.map((comment, index) => {
                  const [timestamp, content] = comment.split(' - ');
                  return (
                    <div key={index} className="mt-2 flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">{content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}