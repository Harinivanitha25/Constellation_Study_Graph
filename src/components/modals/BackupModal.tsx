import React, { useState, useRef } from 'react';
import { X, Download, Upload, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { topicRepository } from '../../data/repository';
import { useConstellationStore } from '../../store/useConstellationStore';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { loadAll, resetToDefaults } = useConstellationStore();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling constellation database and binary images...');
    setIsError(false);

    try {
      const payload = await topicRepository.exportBackup();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `constellation-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Constellation successfully exported to JSON backup file!');
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Reading backup file and restoring images to IndexedDB...');
    setIsError(false);

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!payload.topics || !Array.isArray(payload.topics)) {
        throw new Error('Invalid JSON: missing topics list.');
      }

      await topicRepository.importBackup(payload);
      await loadAll();
      setStatusMessage(`Successfully imported ${payload.topics.length} topics and relationships!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Import error: ${err?.message || 'Invalid backup file'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetDefaults = async () => {
    setIsProcessing(true);
    try {
      await resetToDefaults();
      setShowResetConfirm(false);
      setStatusMessage('Constellation reset to starter topics.');
      setIsError(false);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Reset error: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Constellation Backup & Data</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            All your topics, notes, embeddings, and images are stored locally in your browser's IndexedDB. You can export a complete JSON snapshot to migrate or back up your study graph.
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isError
                  ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {isError ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-sky-400/60 hover:bg-slate-850 transition text-slate-200 hover:text-white cursor-pointer group disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-sky-400 group-hover:scale-110 transition" />
              <div className="text-center">
                <span className="block text-xs font-semibold">Export JSON</span>
                <span className="text-[10px] text-slate-400">Includes all images</span>
              </div>
            </button>

            {/* Import Button */}
            <label
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-400/60 hover:bg-slate-850 transition text-slate-200 hover:text-white cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
                disabled={isProcessing}
              />
              <Upload className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
              <div className="text-center">
                <span className="block text-xs font-semibold">Import JSON</span>
                <span className="text-[10px] text-slate-400">Restore graph</span>
              </div>
            </label>
          </div>

          {/* Reset to starter topics */}
          <div className="pt-4 border-t border-slate-800/80">
            {showResetConfirm ? (
              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-200 text-xs space-y-3">
                <p className="font-medium">
                  Reset your constellation? This will replace your current graph with the default starter topics.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition cursor-pointer shadow-md"
                  >
                    {isProcessing ? 'Resetting...' : 'Yes, Reset'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Starter Constellation Seeds</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-slate-800/80 bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
