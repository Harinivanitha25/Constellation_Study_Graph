import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Edit3,
  Calendar,
  Share2,
  Trash2,
  AlertCircle,
  Network,
  BookOpen,
} from 'lucide-react';
import { useConstellationStore } from '../store/useConstellationStore';
import { NotepadEditor } from '../components/editor/NotepadEditor';
import { TopicModal } from '../components/modals/TopicModal';
import { hasInsufficientText, computeGraphLinks } from '../services/linkingService';
import type { Topic } from '../data/types';

export const TopicNotesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    topics,
    storedLinks,
    similarityThreshold,
    showAutoLinks,
    updateTopic,
    deleteTopic,
    loadAll,
    loading,
  } = useConstellationStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDirectDeleteConfirm, setShowDirectDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // If store is still loading initial state, trigger load
  useEffect(() => {
    if (topics.length === 0 && !loading) {
      loadAll();
    }
  }, [topics.length, loading, loadAll]);

  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === id);
  }, [topics, id]);

  const handleDirectDelete = async () => {
    if (!currentTopic) return;
    setIsDeleting(true);
    try {
      await deleteTopic(currentTopic.id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete topic:', err);
      setIsDeleting(false);
    }
  };

  // Compute active links for this topic to show related constellation neighbors
  const activeLinks = useMemo(() => {
    if (!currentTopic) return [];
    const allLinks = computeGraphLinks({
      topics,
      storedLinks,
      similarityThreshold,
      showAutoLinks,
    });
    return allLinks.filter(
      (l) => l.sourceTopicId === currentTopic.id || l.targetTopicId === currentTopic.id
    );
  }, [topics, storedLinks, similarityThreshold, showAutoLinks, currentTopic]);

  // Neighboring topics (deduplicated by neighbor ID)
  const neighborTopics = useMemo(() => {
    if (!currentTopic) return [];
    const seen = new Set<string>();
    const list: { topic: Topic; link: (typeof activeLinks)[0] }[] = [];

    for (const link of activeLinks) {
      const neighborId =
        link.sourceTopicId === currentTopic.id ? link.targetTopicId : link.sourceTopicId;
      if (seen.has(neighborId)) continue;
      seen.add(neighborId);

      const neighbor = topics.find((t) => t.id === neighborId);
      if (neighbor) {
        list.push({ topic: neighbor, link });
      }
    }
    return list;
  }, [activeLinks, currentTopic, topics]);

  // Handle ESC key to return to graph
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditModalOpen) {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isEditModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030712] text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-slate-300 p-6">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Topic Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          This topic may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs transition hover:bg-sky-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Constellation</span>
        </button>
      </div>
    );
  }

  const isLowContent = hasInsufficientText(currentTopic);

  const handleContentChange = (jsonContent: any, plainText: string) => {
    updateTopic(currentTopic.id, {
      notesContent: jsonContent,
      notesPlainText: plainText,
    });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Top Fixed Navigation Bar */}
      <header className="sticky top-0 z-40 relative flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        {/* Back to Graph */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-sky-400/50 hover:bg-slate-800 transition cursor-pointer text-xs font-medium group"
            title="Return to Constellation Graph (Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition" />
            <span>Constellation</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
              Esc
            </kbd>
          </button>
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center max-w-[40%] sm:max-w-[50%] md:max-w-[60%] pointer-events-none px-2 text-center">
          <h1
            className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight truncate pointer-events-auto"
            title={currentTopic.title}
          >
            {currentTopic.title}
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Edit Topic metadata and preview image"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Edit Topic</span>
          </button>

          <button
            onClick={() => setShowDirectDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
            title="Delete this topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </header>

      {/* Main Notepad Content Area - 75% size length across all screen sizes */}
      <main className="flex-1 w-[75%] mx-auto px-2 sm:px-4 py-6">
        {/* Topic Header Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Updated {new Date(currentTopic.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Insufficient text warning */}
          {isLowContent && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Add a sentence or two to find related topics automatically in your constellation!
              </span>
            </div>
          )}

          {/* Related Topics Bar */}
          {neighborTopics.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <Network className="w-3.5 h-3.5 text-sky-400" />
                  Connected Topics ({neighborTopics.length}):
                </span>
                {neighborTopics.map(({ topic, link }) => (
                  <Link
                    key={link.id}
                    to={`/topic/${topic.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-sky-400/50 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs"
                    title={link.reason}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        link.type === 'manual' ? 'bg-sky-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>{topic.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tiptap Rich Text Editor */}
        <NotepadEditor
          topicId={currentTopic.id}
          initialContent={currentTopic.notesContent}
          onContentChange={handleContentChange}
        />
      </main>

      {/* Edit Topic Modal */}
      <TopicModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        topicToEdit={currentTopic}
        onDeleteSuccess={() => navigate('/')}
      />

      {/* Direct Delete Confirmation Dialog */}
      {showDirectDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Delete &ldquo;{currentTopic.title}&rdquo;?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              This will permanently remove this topic, its notes, and all relationships from your constellation graph.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDirectDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDirectDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
