import { create } from 'zustand';
import type { Topic, TopicLink, TopicCreateInput, TopicUpdateInput } from '../data/types';
import { topicRepository } from '../data/repository';
import { SEED_EMBEDDINGS } from '../data/seedEmbeddings';
import {
  computeEmbedding,
  subscribeModelStatus,
  type ModelLoadStatus,
} from '../services/embeddingService';
import { getCombinedTopicText } from '../services/linkingService';

export interface ConstellationViewport {
  x: number;
  y: number;
  zoom: number;
}

interface ConstellationState {
  topics: Topic[];
  storedLinks: TopicLink[];
  loading: boolean;
  similarityThreshold: number;
  showAutoLinks: boolean;
  searchQuery: string;
  selectedTopicId: string | null;
  savedViewport: ConstellationViewport | null;
  modelStatus: ModelLoadStatus;
  modelMessage: string;
  isEmbeddingInProgress: boolean;

  // Actions
  loadAll: () => Promise<void>;
  setSimilarityThreshold: (val: number) => void;
  setShowAutoLinks: (show: boolean) => void;
  toggleShowAutoLinks: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedTopicId: (id: string | null) => void;
  setSavedViewport: (viewport: ConstellationViewport) => void;

  createTopic: (input: TopicCreateInput) => Promise<Topic>;
  updateTopic: (id: string, updates: TopicUpdateInput) => Promise<Topic>;
  deleteTopic: (id: string) => Promise<void>;
  updatePosition: (id: string, x: number, y: number) => Promise<void>;

  addManualLink: (sourceTopicId: string, targetTopicId: string) => Promise<void>;
  hideLink: (sourceTopicId: string, targetTopicId: string) => Promise<void>;
  deleteStoredLink: (id: string) => Promise<void>;

  ensureEmbeddings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export const useConstellationStore = create<ConstellationState>((set, get) => {
  // Subscribe to embedding model status
  subscribeModelStatus((status, message) => {
    set({
      modelStatus: status,
      modelMessage: message || '',
    });
  });

  const initialShowAutoLinks =
    typeof window !== 'undefined'
      ? localStorage.getItem('constellation_show_auto_links') !== 'false'
      : true;

  const getInitialViewport = (): ConstellationViewport | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('constellation_viewport');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  return {
    topics: [],
    storedLinks: [],
    loading: true,
    similarityThreshold: 0.28,
    showAutoLinks: initialShowAutoLinks,
    searchQuery: '',
    selectedTopicId: null,
    savedViewport: getInitialViewport(),
    modelStatus: 'idle',
    modelMessage: '',
    isEmbeddingInProgress: false,

    loadAll: async () => {
      set({ loading: true });
      try {
        await topicRepository.init();
        const [topics, storedLinks] = await Promise.all([
          topicRepository.getAllTopics(),
          topicRepository.getAllLinks(),
        ]);

        // Hydrate any missing seed embeddings immediately so auto-links appear without delay
        const hydratedTopics = topics.map((t) => {
          if (!t.embedding && SEED_EMBEDDINGS[t.id]) {
            const embedding = SEED_EMBEDDINGS[t.id];
            topicRepository.updateTopic(t.id, { embedding }).catch(console.warn);
            return { ...t, embedding };
          }
          return t;
        });

        // Clean out any legacy mention links so only manual and auto links exist
        const sanitizedLinks: TopicLink[] = [];
        for (const link of storedLinks) {
          if ((link.type as string) === 'mention') {
            topicRepository.deleteLink(link.id).catch(console.warn);
          } else {
            sanitizedLinks.push(link);
          }
        }

        set({ topics: hydratedTopics, storedLinks: sanitizedLinks, loading: false });

        // Ensure missing embeddings are computed in background
        get().ensureEmbeddings();
      } catch (err) {
        console.error('Failed to load constellation data:', err);
        set({ loading: false });
      }
    },

    setSimilarityThreshold: (val: number) => {
      set({ similarityThreshold: val });
    },

    setShowAutoLinks: (show: boolean) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('constellation_show_auto_links', String(show));
      }
      set({ showAutoLinks: show });
    },

    toggleShowAutoLinks: () => {
      const next = !get().showAutoLinks;
      if (typeof window !== 'undefined') {
        localStorage.setItem('constellation_show_auto_links', String(next));
      }
      set({ showAutoLinks: next });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setSelectedTopicId: (id: string | null) => {
      set({ selectedTopicId: id });
    },

    setSavedViewport: (viewport: ConstellationViewport) => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('constellation_viewport', JSON.stringify(viewport));
        } catch {}
      }
      set({ savedViewport: viewport });
    },

    createTopic: async (input: TopicCreateInput) => {
      const topic = await topicRepository.createTopic(input);
      set((state) => ({ topics: [topic, ...state.topics] }));

      // Compute embedding asynchronously
      const fullText = getCombinedTopicText(topic);
      computeEmbedding(fullText)
        .then(async (embedding) => {
          if (embedding) {
            await topicRepository.updateTopic(topic.id, { embedding });
            set((state) => ({
              topics: state.topics.map((t) => (t.id === topic.id ? { ...t, embedding } : t)),
            }));
          }
        })
        .catch(console.warn);

      return topic;
    },

    updateTopic: async (id: string, updates: TopicUpdateInput) => {
      const existing = get().topics.find((t) => t.id === id);
      const updated = await topicRepository.updateTopic(id, updates);

      set((state) => ({
        topics: state.topics.map((t) => (t.id === id ? updated : t)),
      }));

      // Recompute embedding if title, preview, or notes plain text changed
      const textChanged =
        (updates.title !== undefined && updates.title !== existing?.title) ||
        (updates.previewText !== undefined && updates.previewText !== existing?.previewText) ||
        (updates.notesPlainText !== undefined && updates.notesPlainText !== existing?.notesPlainText);

      if (textChanged) {
        const fullText = getCombinedTopicText(updated);
        computeEmbedding(fullText)
          .then(async (embedding) => {
            if (embedding) {
              await topicRepository.updateTopic(id, { embedding });
              set((state) => ({
                topics: state.topics.map((t) => (t.id === id ? { ...t, embedding } : t)),
              }));
            }
          })
          .catch(console.warn);
      }

      return updated;
    },

    deleteTopic: async (id: string) => {
      await topicRepository.deleteTopic(id);
      set((state) => ({
        topics: state.topics.filter((t) => t.id !== id),
        storedLinks: state.storedLinks.filter(
          (l) => l.sourceTopicId !== id && l.targetTopicId !== id
        ),
      }));
    },

    updatePosition: async (id: string, x: number, y: number) => {
      // Optimistic update in store
      set((state) => ({
        topics: state.topics.map((t) => (t.id === id ? { ...t, positionX: x, positionY: y } : t)),
      }));
      await topicRepository.updatePosition(id, x, y);
    },

    addManualLink: async (sourceTopicId: string, targetTopicId: string) => {
      if (sourceTopicId === targetTopicId) return;

      const source = get().topics.find((t) => t.id === sourceTopicId);
      const target = get().topics.find((t) => t.id === targetTopicId);
      const reason = `Manual connection: "${source?.title || 'Topic'}" ⇄ "${target?.title || 'Topic'}"`;

      const newLink = await topicRepository.saveLink({
        sourceTopicId,
        targetTopicId,
        type: 'manual',
        score: 1.0,
        reason,
      });

      set((state) => ({
        storedLinks: [
          ...state.storedLinks.filter(
            (l) =>
              !(
                (l.sourceTopicId === sourceTopicId && l.targetTopicId === targetTopicId) ||
                (l.sourceTopicId === targetTopicId && l.targetTopicId === sourceTopicId)
              )
          ),
          newLink,
        ],
      }));
    },

    hideLink: async (sourceTopicId: string, targetTopicId: string) => {
      await topicRepository.hideLink(sourceTopicId, targetTopicId);
      const updatedStored = await topicRepository.getAllLinks();
      set({ storedLinks: updatedStored });
    },

    deleteStoredLink: async (id: string) => {
      await topicRepository.deleteLink(id);
      set((state) => ({
        storedLinks: state.storedLinks.filter((l) => l.id !== id),
      }));
    },

    ensureEmbeddings: async () => {
      const { topics, isEmbeddingInProgress } = get();
      if (isEmbeddingInProgress) return;

      const pending = topics.filter((t) => !t.embedding && !t.deleted);
      if (pending.length === 0) return;

      set({ isEmbeddingInProgress: true });

      try {
        for (const topic of pending) {
          const text = getCombinedTopicText(topic);
          const embedding = await computeEmbedding(text);
          if (embedding) {
            await topicRepository.updateTopic(topic.id, { embedding });
            set((state) => ({
              topics: state.topics.map((t) => (t.id === topic.id ? { ...t, embedding } : t)),
            }));
          }
        }
      } catch (e) {
        console.warn('Error during batch embedding generation:', e);
      } finally {
        set({ isEmbeddingInProgress: false });
      }
    },

    resetToDefaults: async () => {
      set({ loading: true });
      await topicRepository.resetToDefaults();
      const [topics, storedLinks] = await Promise.all([
        topicRepository.getAllTopics(),
        topicRepository.getAllLinks(),
      ]);
      set({ topics, storedLinks, loading: false });
      get().ensureEmbeddings();
    },
  };
});
