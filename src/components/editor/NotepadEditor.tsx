import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import { ResizableImage } from './ResizableImageNode';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  Undo,
  Redo,
  Check,
  Loader2,
} from 'lucide-react';
import { topicRepository } from '../../data/repository';
import { db } from '../../data/db';

interface NotepadEditorProps {
  topicId: string;
  initialContent: any;
  onContentChange: (jsonContent: any, plainText: string) => void;
}

/**
 * Converts a File or Blob into a high-fidelity, permanent Data URL.
 * Automatically scales down excessively large images (> 1600px width) so notes stay fast and lightweight.
 */
async function fileToDataUrl(file: File | Blob, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return resolve('');

      if (file.type === 'image/svg+xml' || file.size < 400 * 1024) {
        return resolve(result);
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(result);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.9));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const NotepadEditor: React.FC<NotepadEditorProps> = ({
  topicId,
  initialContent,
  onContentChange,
}) => {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-slate max-w-none focus:outline-none min-h-[60vh] py-6 px-2 text-slate-200 leading-relaxed text-base',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            fileToDataUrl(file).then(async (dataUrl) => {
              if (!dataUrl) return;
              const imageId = await topicRepository.storeImage(file, file.type, topicId);
              editor
                ?.chain()
                .focus()
                .setImage({
                  src: dataUrl,
                  alt: file.name,
                  title: `Stored image ${imageId}`,
                })
                .run();
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData?.files?.length) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            fileToDataUrl(file).then(async (dataUrl) => {
              if (!dataUrl) return;
              const imageId = await topicRepository.storeImage(file, file.type, topicId);
              editor
                ?.chain()
                .focus()
                .setImage({
                  src: dataUrl,
                  alt: file.name,
                  title: `Stored image ${imageId}`,
                })
                .run();
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        onContentChange(json, text);
        setSaveStatus('saved');
      }, 600);
    },
  });

  // Calculate initial word count
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    }
  }, [editor]);

  // Automatic recovery of stored images:
  // If an existing note has a temporary/expired blob URL, resolve it from IndexedDB and convert to permanent Base64
  useEffect(() => {
    if (!editor) return;

    let isCancelled = false;

    const recoverImages = async () => {
      const currentJson = editor.getJSON();
      let hasFixedImages = false;

      const scanAndFix = async (node: any): Promise<void> => {
        if (!node) return;
        if (node.type === 'image' && node.attrs) {
          const src = node.attrs.src || '';
          const isDeadUrl =
            src.startsWith('blob:') ||
            !src ||
            src.startsWith('http://localhost') ||
            src.includes('.run.app/blob:');

          if (isDeadUrl) {
            let blob: Blob | undefined;
            const title = node.attrs.title || '';
            const match = title.match(/Stored image ([a-zA-Z0-9-]+)/);
            if (match && match[1]) {
              blob = await topicRepository.getImageBlob(match[1]);
            }
            if (!blob && topicId) {
              const topicImages = await db.images.where('topicId').equals(topicId).toArray();
              if (topicImages.length > 0) {
                // Find matching or most recent image
                blob = topicImages[topicImages.length - 1].blob;
              }
            }
            if (blob) {
              const permanentDataUrl = await fileToDataUrl(blob);
              if (permanentDataUrl) {
                node.attrs.src = permanentDataUrl;
                hasFixedImages = true;
              }
            }
          }
        }

        if (Array.isArray(node.content)) {
          for (const child of node.content) {
            await scanAndFix(child);
          }
        }
      };

      await scanAndFix(currentJson);

      if (hasFixedImages && !isCancelled) {
        editor.commands.setContent(currentJson, { emitUpdate: false });
        const text = editor.getText();
        onContentChange(currentJson, text);
      }
    };

    recoverImages();

    return () => {
      isCancelled = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, topicId, onContentChange]);

  // DOM image error listener: if any <img> inside the editor fails to load, heal it on the fly
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleImgError = async (e: Event) => {
      const target = e.target as HTMLImageElement;
      if (target && target.tagName === 'IMG') {
        let blob: Blob | undefined;
        const title = target.title || '';
        const match = title.match(/Stored image ([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          blob = await topicRepository.getImageBlob(match[1]);
        }
        if (!blob && topicId) {
          const topicImages = await db.images.where('topicId').equals(topicId).toArray();
          if (topicImages.length > 0) {
            blob = topicImages[topicImages.length - 1].blob;
          }
        }
        if (blob) {
          const dataUrl = await fileToDataUrl(blob);
          if (dataUrl) {
            target.src = dataUrl;
          }
        }
      }
    };

    container.addEventListener('error', handleImgError, true);
    return () => {
      container.removeEventListener('error', handleImgError, true);
    };
  }, [topicId]);

  // Handle image upload -> Store Blob in IndexedDB + Convert to permanent Base64 Data URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP, SVG, GIF).');
      setTimeout(() => setImageError(null), 4000);
      return;
    }

    try {
      // 1. Convert to permanent Data URL
      const dataUrl = await fileToDataUrl(file);

      // 2. Also store raw Blob in IndexedDB for safety
      const imageId = await topicRepository.storeImage(file, file.type, topicId);

      // 3. Insert image node into editor with the permanent Data URL
      editor
        .chain()
        .focus()
        .setImage({
          src: dataUrl,
          alt: file.name,
          title: `Stored image ${imageId}`,
        })
        .run();

      setImageError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to store image in database:', err);
      setImageError('Could not save image to local database.');
      setTimeout(() => setImageError(null), 4000);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mx-auto">
      {imageError && (
        <div className="mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 animate-in fade-in">
          {imageError}
        </div>
      )}

      {/* Editor Controls & Sticky Toolbar */}
      <div className="sticky top-16 z-30 flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 mb-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl text-slate-300">
        {/* Formatting Actions */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('bold') ? 'bg-sky-500/20 text-sky-400 font-bold' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('italic') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('underline') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('strike') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('code') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('heading', { level: 1 }) ? 'bg-sky-500/20 text-sky-400 font-bold' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('heading', { level: 2 }) ? 'bg-sky-500/20 text-sky-400 font-bold' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('heading', { level: 3 }) ? 'bg-sky-500/20 text-sky-400 font-bold' : ''
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('bulletList') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('orderedList') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer ${
              editor.isActive('blockquote') ? 'bg-sky-500/20 text-sky-400' : ''
            }`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Divider"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Insert Image Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 hover:text-white transition text-sky-400 cursor-pointer"
            title="Insert Image (stored as Blob in IndexedDB)"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Image</span>
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition cursor-pointer"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition cursor-pointer"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Right Status Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{wordCount} words</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{Math.ceil(wordCount / 200)} min read</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />

          {/* Autosave Indicator */}
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-amber-400 text-[11px]">Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Saved locally</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notepad Paper Container */}
      <div
        ref={editorContainerRef}
        className="rounded-3xl bg-slate-950/60 border border-slate-800/80 p-5 sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(56,189,248,0.05)] backdrop-blur-md min-h-[70vh]"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
