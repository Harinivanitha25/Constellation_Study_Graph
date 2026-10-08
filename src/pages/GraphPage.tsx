import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  Search,
  Plus,
  Sparkles,
  Database,
  Loader2,
  X,
} from 'lucide-react';
import { GraphView } from '../components/graph/GraphView';
import { TopicModal } from '../components/modals/TopicModal';
import { BackupModal } from '../components/modals/BackupModal';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { useConstellationStore } from '../store/useConstellationStore';
import type { Topic } from '../data/types';

export const GraphPage: React.FC = () => {
  const {
    topics,
    loading,
    loadAll,
    searchQuery,
    setSearchQuery,
    modelStatus,
    modelMessage,
    isEmbeddingInProgress,
    showAutoLinks,
    toggleShowAutoLinks,
  } = useConstellationStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleOpenAdd = () => {
    setTopicToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (topic: Topic) => {
    setTopicToEdit(topic);
    setIsAddModalOpen(true);
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] overflow-hidden flex flex-col">
      {/* Top Floating Constellation Navigation Header */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Brand & Stats */}
        <div className="flex items-center gap-2.5 bg-slate-950/85 px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-xl pointer-events-auto">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.5)] shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <span className="tracking-wide">
              {topics.length} {topics.length === 1 ? 'STAR' : 'STARS'}
            </span>
            {isEmbeddingInProgress && (
              <>
                <span className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
                <span className="text-[10px] font-normal text-sky-400">Analyzing...</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block pointer-events-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, notes, or intuitions..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 text-xs text-slate-200 placeholder-slate-500 shadow-xl backdrop-blur-xl focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Auto Links Visible / Invisible Toggle */}
          <button
            onClick={toggleShowAutoLinks}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition shadow-xl backdrop-blur-xl cursor-pointer ${
              showAutoLinks
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-200 hover:bg-sky-500/25 hover:border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'bg-slate-950/85 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title={
              showAutoLinks
                ? 'Auto links are visible (click to turn OFF)'
                : 'Auto links are hidden (click to turn ON)'
            }
          >
            <span className="hidden sm:inline">Auto Links</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition ${
                showAutoLinks ? 'bg-sky-400/25 text-sky-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showAutoLinks ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Backup / Export / Import */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-950/85 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900 transition shadow-xl backdrop-blur-xl cursor-pointer"
            title="Export/Import backup data"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Add New Topic Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Topic</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Graph Canvas */}
      <main className="flex-1 w-full h-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <span className="text-xs font-mono tracking-widest uppercase">
              Rendering Constellation...
            </span>
          </div>
        ) :topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 text-center z-20">
            <button
              onClick={handleOpenAdd}
              className="group flex flex-col items-center gap-3.5 p-8 rounded-3xl bg-slate-950/80 border border-slate-800/80 hover:border-sky-400/50 shadow-2xl backdrop-blur-xl transition cursor-pointer max-w-sm hover:scale-[1.02]"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400/20 to-indigo-600/20 border border-sky-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.25)] group-hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] group-hover:scale-105 transition">
                <Sparkles className="w-7 h-7 text-sky-400" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-sky-300 transition">
                Add new topic to create constellation
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-semibold group-hover:bg-sky-400 group-hover:text-slate-950 transition">
                <Plus className="w-3.5 h-3.5" />
                <span>Create Topic</span>
              </span>
            </button>
          </div>
        ) : (
          <ReactFlowProvider>
            <GraphView onEditTopic={handleOpenEdit} />
          </ReactFlowProvider>
        )}
      </main>

      {/* Modals */}
      <TopicModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTopicToEdit(null);
        }}
        topicToEdit={topicToEdit}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
};
