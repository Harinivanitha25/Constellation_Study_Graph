import { pipeline, env, type FeatureExtractionPipeline } from '@xenova/transformers';

// Configure transformers.js for client-side browser usage
env.allowLocalModels = false;
env.useBrowserCache = true;

export type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
let currentStatus: ModelLoadStatus = 'idle';
let statusListeners: Array<(status: ModelLoadStatus, message?: string) => void> = [];
let lastErrorMessage = '';

export function subscribeModelStatus(listener: (status: ModelLoadStatus, message?: string) => void): () => void {
  statusListeners.push(listener);
  listener(currentStatus, lastErrorMessage);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

function updateStatus(status: ModelLoadStatus, message = '') {
  currentStatus = status;
  lastErrorMessage = message;
  statusListeners.forEach((l) => l(status, message));
}

export function getModelStatus(): { status: ModelLoadStatus; message: string } {
  return { status: currentStatus, message: lastErrorMessage };
}

/**
 * Loads the Xenova/all-MiniLM-L6-v2 pipeline with offline browser caching
 */
export async function getExtractor(): Promise<FeatureExtractionPipeline | null> {
  if (currentStatus === 'ready' && extractorPromise) {
    return extractorPromise;
  }

  if (currentStatus === 'fallback') {
    return null;
  }

  if (extractorPromise) {
    return extractorPromise;
  }

  updateStatus('loading', 'Loading embedding model (all-MiniLM-L6-v2)...');

  extractorPromise = (async () => {
    try {
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      updateStatus('ready', 'Neural embedding model active (cached for offline use).');
      return extractor as FeatureExtractionPipeline;
    } catch (err: any) {
      console.warn('Transformers.js model failed to load. Falling back to keyword-overlap similarity:', err);
      updateStatus('fallback', 'Model unavailable. Using keyword-overlap similarity fallback.');
      return null as any;
    }
  })();

  return extractorPromise;
}

/**
 * Normalizes and extracts plain tokens for the keyword overlap fallback
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where', 'who',
  'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'just', 'should', 'now', 'into', 'also', 'about'
]);

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Fallback pseudo-embedding based on bag-of-words term frequencies
 */
export function computeKeywordVector(text: string, vocabulary: string[]): number[] {
  const tokens = tokenizeText(text);
  const tfMap = new Map<string, number>();
  for (const t of tokens) {
    tfMap.set(t, (tfMap.get(t) || 0) + 1);
  }

  const vec = vocabulary.map((word) => tfMap.get(word) || 0);
  // Normalize vector
  const norm = Math.hypot(...vec);
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/**
 * Computes semantic embedding for text using transformers.js
 * Returns null if model fails (triggers fallback)
 */
export async function computeEmbedding(text: string): Promise<number[] | null> {
  const clean = text.trim();
  if (!clean) return null;

  try {
    const extractor = await getExtractor();
    if (!extractor) {
      return null;
    }

    const output = await extractor(clean, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data as Float32Array);
  } catch (err) {
    console.warn('Failed to compute neural embedding:', err);
    updateStatus('fallback', 'Semantic model error. Fallback keyword similarity active.');
    return null;
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const mag = Math.sqrt(normA) * Math.sqrt(normB);
  if (mag <= 0) return 0;

  const score = dot / mag;
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Keyword overlap similarity (Jaccard + TF overlap) fallback
 */
export function keywordSimilarity(textA: string, textB: string): number {
  const tokensA = tokenizeText(textA);
  const tokensB = tokenizeText(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) {
      intersection++;
    }
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}
