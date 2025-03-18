import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { addTags } from '../lib/reports';

type TagsSectionProps = {
  reportId: string;
  tags: string[];
  onTagsUpdated: (newTags: string[]) => void;
};

export default function TagsSection({ reportId, tags = [], onTagsUpdated }: TagsSectionProps) {
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      const updatedTags = [...tags, newTag.trim()];
      await addTags(reportId, updatedTags);
      onTagsUpdated(updatedTags);
      setNewTag('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      const updatedTags = tags.filter(tag => tag !== tagToRemove);
      await addTags(reportId, updatedTags);
      onTagsUpdated(updatedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Tags</h3>
        <form onSubmit={handleAddTag} className="flex items-center space-x-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nova tag..."
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newTag.trim()}
            className="inline-flex items-center p-2 border border-transparent rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              <Tag className="h-4 w-4 mr-1" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={isSubmitting}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhuma tag adicionada.</p>
        )}
      </div>
    </div>
  );
}