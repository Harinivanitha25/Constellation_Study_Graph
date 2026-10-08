import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import ImageExtension from '@tiptap/extension-image';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';

export const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { src, alt, title, width = '100%', alignment = 'center' } = node.attrs;
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isClickedActive, setIsClickedActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isResizing) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // 350ms grace period so user can smoothly move mouse between image and toolbar
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 350);
  };

  // Close clicked active state on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsClickedActive(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleStartResize = (e: React.MouseEvent, direction: 'right' | 'left' = 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const parentWidth = containerRef.current?.parentElement?.clientWidth || 800;
    const currentPercent = parseFloat(width) || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) * (direction === 'right' ? 1 : -1);
      const deltaPercent = (deltaX / parentWidth) * 100;
      let newPercent = Math.round(currentPercent + deltaPercent);
      newPercent = Math.max(20, Math.min(100, newPercent));
      updateAttributes({ width: `${newPercent}%` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const setPresetWidth = (preset: string) => {
    updateAttributes({ width: preset });
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align });
  };

  // Alignment classes for outer wrapper
  const alignClass =
    alignment === 'left'
      ? 'justify-start'
      : alignment === 'right'
      ? 'justify-end'
      : 'justify-center';

  const showToolbar = selected || isHovered || isResizing || isClickedActive;

  return (
    <NodeViewWrapper
      className={`relative my-6 flex w-full ${alignClass} select-none`}
      data-drag-handle
    >
      <div
        ref={containerRef}
        className="group relative inline-block max-w-full transition-all duration-150 pt-2"
        style={{ width: width || '100%' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsClickedActive(true)}
      >
        {/* Floating Quick Size & Alignment Toolbar */}
        {showToolbar && (
          <div
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] text-slate-300 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invisible hover bridge connecting toolbar to top edge of image */}
            <div className="absolute top-full left-0 right-0 h-4 bg-transparent pointer-events-auto" />

            {/* Size Presets */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700/80">
              {['25%', '50%', '75%', '100%'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPresetWidth(preset)}
                  className={`px-1.5 py-0.5 rounded transition font-mono ${
                    width === preset
                      ? 'bg-sky-500/25 text-sky-400 font-semibold border border-sky-500/30'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`Resize to ${preset}`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Alignment Options */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700/80">
              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`p-1 rounded transition ${
                  alignment === 'left'
                    ? 'bg-sky-500/25 text-sky-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`p-1 rounded transition ${
                  alignment === 'center'
                    ? 'bg-sky-500/25 text-sky-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('right')}
                className={`p-1 rounded transition ${
                  alignment === 'right'
                    ? 'bg-sky-500/25 text-sky-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Delete Image */}
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* The Image Element */}
        <div
          className={`relative overflow-hidden rounded-xl border transition-all duration-150 ${
            selected || isResizing
              ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.35)] ring-2 ring-sky-400/40'
              : 'border-slate-800 shadow-xl'
          }`}
        >
          <img
            src={src}
            alt={alt || ''}
            title={title || ''}
            className="w-full h-auto block select-none"
            draggable={false}
          />

          {/* Current Size Pill Indicator while resizing or hovering */}
          {(isResizing || isHovered) && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700/60 text-[10px] font-mono text-slate-300 backdrop-blur-sm pointer-events-none">
              {width}
            </div>
          )}
        </div>

        {/* Corner Drag Resize Handles */}
        {showToolbar && (
          <>
            <div
              onMouseDown={(e) => handleStartResize(e, 'right')}
              className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-sky-400 border-2 border-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)] cursor-nwse-resize z-20 hover:scale-125 transition-transform"
              title="Drag to resize width"
            />
            <div
              onMouseDown={(e) => handleStartResize(e, 'left')}
              className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-sky-400 border-2 border-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)] cursor-nesw-resize z-20 hover:scale-125 transition-transform"
              title="Drag to resize width"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = ImageExtension.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      alignment: {
        default: 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
