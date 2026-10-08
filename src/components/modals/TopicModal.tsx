import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { Topic } from '../../data/types';
import { useConstellationStore } from '../../store/useConstellationStore';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicToEdit?: Topic | null;
  onDeleteSuccess?: () => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  topicToEdit,
  onDeleteSuccess,
}) => {
  const { createTopic, updateTopic, deleteTopic } = useConstellationStore();

  const [title, setTitle] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (topicToEdit) {
      setTitle(topicToEdit.title);
      setPreviewText(topicToEdit.previewText || '');
      setImageBlob(topicToEdit.previewImage || null);
      if (topicToEdit.previewImage) {
        const url = URL.createObjectURL(topicToEdit.previewImage);
        setImagePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setImagePreviewUrl(null);
      }
    } else {
      setTitle('');
      setPreviewText('');
      setImageBlob(null);
      setImagePreviewUrl(null);
    }
    setError('');
  }, [topicToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WebP, SVG).');
        return;
      }
      setImageBlob(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageBlob(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Topic title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (topicToEdit) {
        await updateTopic(topicToEdit.id, {
          title: title.trim(),
          previewText: previewText.trim(),
          previewImage: imageBlob,
        });
      } else {
        await createTopic({
          title: title.trim(),
          previewText: previewText.trim(),
          previewImage: imageBlob,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!topicToEdit) return;
    setIsSubmitting(true);
    try {
      await deleteTopic(topicToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.15)] text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-semibold text-white">
              {topicToEdit ? 'Edit Topic' : 'Add New Topic to Constellation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Topic Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Entanglement, Machine Learning"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
              autoFocus
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Summary
            </label>
            <textarea
              rows={3}
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Brief summary or key intuition. This preview appears on node hover and is used for automatic semantic linking."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition resize-none"
            />
          </div>

          {/* Preview Image Upload (Stored as Blob in IndexedDB) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Preview Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreviewUrl ? (
              <div className="relative w-full h-36 rounded-xl border border-slate-700 overflow-hidden group bg-slate-900">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700 transition cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs hover:bg-rose-500 transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-700/80 hover:border-sky-500/50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-sky-300 transition bg-slate-900/40 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-medium">Click to upload preview image</span>
                <span className="text-[10px] text-slate-500">PNG, JPG, WebP, or SVG</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800/80 mt-6">
            {showDeleteConfirm && topicToEdit ? (
              <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs">
                  <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium">
                    Permanently delete &ldquo;{topicToEdit.title}&rdquo;?
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {topicToEdit ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Topic</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-xl shadow-md shadow-sky-500/20 transition cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : topicToEdit ? 'Save Changes' : 'Create Topic'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
