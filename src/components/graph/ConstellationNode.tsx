import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useConnection, useReactFlow, type NodeProps } from '@xyflow/react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Sparkles, AlertCircle } from 'lucide-react';
import type { Topic } from '../../data/types';
import { hasInsufficientText } from '../../services/linkingService';
import { useConstellationStore } from '../../store/useConstellationStore';

export interface ConstellationNodeData {
  topic: Topic;
  onEditTopic?: (topic: Topic) => void;
  isSearchResult?: boolean;
}

export const ConstellationNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const navigate = useNavigate();
  const nodeData = data as unknown as ConstellationNodeData;
  const topic = nodeData.topic;
  const isSearchResult = nodeData.isSearchResult;

  const isConnecting = useConnection((s) => s.inProgress);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (isConnecting) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // 300ms safe intent window so moving between the node and hover card is rock-solid
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hoverTimeoutRef.current = null;
    }, 300);
  };

  const handleHandleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
    setIsTouchActive(false);
  };

  useEffect(() => {
    if (isConnecting) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(false);
      setIsTouchActive(false);
    }
  }, [isConnecting]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Generate object URL for preview image if Blob exists
  useEffect(() => {
    if (topic.previewImage instanceof Blob) {
      const url = URL.createObjectURL(topic.previewImage);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl(null);
    }
  }, [topic.previewImage]);

  const reactFlow = useReactFlow();
  const setSavedViewport = useConstellationStore((s) => s.setSavedViewport);

  const navigateToTopic = () => {
    try {
      const currentViewport = reactFlow.getViewport();
      if (currentViewport) {
        setSavedViewport(currentViewport);
      }
    } catch {}
    navigate(`/topic/${topic.id}`);
  };

  // Handle touch device interaction: first tap shows preview, second tap opens
  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    // If not a touch device (standard click), navigate directly
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouch) {
      navigateToTopic();
      return;
    }

    if (!isTouchActive) {
      // First tap: show preview card
      e.preventDefault();
      e.stopPropagation();
      setIsTouchActive(true);
    } else {
      // Second tap: navigate to topic
      navigateToTopic();
    }
  };

  // Close touch card when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsTouchActive(false);
      }
    };
    if (isTouchActive) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTouchActive]);

  const showPreview = !isConnecting && (isHovered || isTouchActive);
  const isLowContent = hasInsufficientText(topic);

  // Elevate this node's React Flow container above ALL other elements when preview is active
  useEffect(() => {
    const nodeElement = cardRef.current?.closest('.react-flow__node') as HTMLElement | null;
    if (nodeElement) {
      if (showPreview) {
        nodeElement.style.zIndex = '99999';
      } else {
        nodeElement.style.zIndex = '';
      }
    }
    return () => {
      if (nodeElement) {
        nodeElement.style.zIndex = '';
      }
    };
  }, [showPreview]);

  return (
    <div
      ref={cardRef}
      className={`relative group select-none ${showPreview ? 'z-[99999]' : ''}`}
      onClick={handleTouch}
    >
      {/* 4 Connection Dots (Top, Bottom, Left, Right) - small, positioned exactly on the box border line */}
      <Handle
        type="source"
        id="top"
        position={Position.Top}
        isConnectableStart={true}
        isConnectableEnd={true}
        onMouseEnter={handleHandleInteraction}
        onMouseDown={handleHandleInteraction}
        title="Click and drag to connect to another topic"
        className="!w-2.5 !h-2.5 !rounded-full !bg-sky-400 !border-[1.5px] !border-slate-950 !shadow-[0_0_8px_rgba(56,189,248,0.9)] !z-40 hover:!bg-white hover:!shadow-[0_0_12px_#38bdf8] !cursor-crosshair before:content-[''] before:absolute before:-inset-3 before:rounded-full before:bg-transparent"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        isConnectableStart={true}
        isConnectableEnd={true}
        onMouseEnter={handleHandleInteraction}
        onMouseDown={handleHandleInteraction}
        title="Click and drag to connect to another topic"
        className="!w-2.5 !h-2.5 !rounded-full !bg-sky-400 !border-[1.5px] !border-slate-950 !shadow-[0_0_8px_rgba(56,189,248,0.9)] !z-40 hover:!bg-white hover:!shadow-[0_0_12px_#38bdf8] !cursor-crosshair before:content-[''] before:absolute before:-inset-3 before:rounded-full before:bg-transparent"
      />
      <Handle
        type="source"
        id="left"
        position={Position.Left}
        isConnectableStart={true}
        isConnectableEnd={true}
        onMouseEnter={handleHandleInteraction}
        onMouseDown={handleHandleInteraction}
        title="Click and drag to connect to another topic"
        className="!w-2.5 !h-2.5 !rounded-full !bg-sky-400 !border-[1.5px] !border-slate-950 !shadow-[0_0_8px_rgba(56,189,248,0.9)] !z-40 hover:!bg-white hover:!shadow-[0_0_12px_#38bdf8] !cursor-crosshair before:content-[''] before:absolute before:-inset-3 before:rounded-full before:bg-transparent"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        isConnectableStart={true}
        isConnectableEnd={true}
        onMouseEnter={handleHandleInteraction}
        onMouseDown={handleHandleInteraction}
        title="Click and drag to connect to another topic"
        className="!w-2.5 !h-2.5 !rounded-full !bg-sky-400 !border-[1.5px] !border-slate-950 !shadow-[0_0_8px_rgba(56,189,248,0.9)] !z-40 hover:!bg-white hover:!shadow-[0_0_12px_#38bdf8] !cursor-crosshair before:content-[''] before:absolute before:-inset-3 before:rounded-full before:bg-transparent"
      />

      {/* Main Node Body - Glowing Constellation Star Orb */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-md ${
          isSearchResult
            ? 'bg-amber-950/80 border-2 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)] ring-4 ring-amber-500/30 scale-105'
            : selected
            ? 'bg-slate-900/90 border border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.5)] ring-2 ring-sky-500/40'
            : isHovered || isTouchActive
            ? 'bg-slate-900/90 border border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] scale-105'
            : 'bg-slate-950/75 border border-sky-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(56,189,248,0.12)] hover:border-sky-400/50'
        }`}
      >
        {/* Soft Background Radial Flare */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 opacity-70 pointer-events-none" />

        {/* Node Icon / Star Avatar */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700/60 overflow-hidden shrink-0 shadow-inner">
          {imageUrl ? (
            <img src={imageUrl} alt={topic.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-sky-600/30 to-indigo-600/30">
              <Sparkles className="w-4 h-4 text-sky-300" />
            </div>
          )}
          {/* Subtle star pulse indicator */}
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping opacity-60" />
        </div>

        {/* Title & Micro Meta */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-100 tracking-tight truncate max-w-[160px]">
              {topic.title}
            </span>
            {isLowContent && (
              <span title="Very little text content" className="text-amber-400 shrink-0">
                <AlertCircle className="w-3 h-3" />
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
            {topic.previewText || 'No summary'}
          </span>
        </div>
      </div>

      {/* Floating Tooltip Card on Hover or Touch */}
      {showPreview && (
        <div
          className="absolute z-[99999] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 rounded-2xl bg-slate-950/95 border border-sky-500/30 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.2)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-slate-100 cursor-default"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invisible hover bridge connecting card to node across the margin gap */}
          <div className="absolute top-full left-0 right-0 h-4 bg-transparent pointer-events-auto" />

          {/* Preview content */}
          {imageUrl ? (
            <>
              {/* Preview Image with edit button overlay */}
              <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2.5 border border-slate-800 bg-slate-900">
                <img src={imageUrl} alt={topic.title} className="w-full h-full object-cover" />
                {nodeData.onEditTopic && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nodeData.onEditTopic?.(topic);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white transition shadow-md border border-slate-700/60 cursor-pointer"
                    title="Edit Preview"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Preview Text */}
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {topic.previewText || 'No preview text provided yet.'}
              </p>
            </>
          ) : (
            /* Without image: Summary and Edit Preview on the same line separated by space */
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed flex-1">
                {topic.previewText || 'No preview text provided yet.'}
              </p>
              {nodeData.onEditTopic && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nodeData.onEditTopic?.(topic);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer shrink-0 mt-0.5"
                  title="Edit Preview"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Insufficient text guidance */}
          {isLowContent && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-950/60 border border-amber-600/30 text-[11px] text-amber-200 mt-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Add a sentence or two to find related topics.</span>
            </div>
          )}

          {/* Pointer Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 rotate-45 bg-slate-950 border-r border-b border-sky-500/30" />
        </div>
      )}
    </div>
  );
};
