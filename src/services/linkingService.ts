import type { Topic, TopicLink, LinkType } from '../data/types';
import { cosineSimilarity, keywordSimilarity } from './embeddingService';

export interface ComputeLinksOptions {
  topics: Topic[];
  storedLinks: TopicLink[];
  similarityThreshold: number;
  useFallbackKeywordSimilarity?: boolean;
  showAutoLinks?: boolean;
}

export interface ActiveGraphLink {
  id: string;
  sourceTopicId: string;
  targetTopicId: string;
  type: LinkType;
  score: number;
  reason: string;
  isStored: boolean;
}

/**
 * Combines topic title, preview, and notes for text analysis
 */
export function getCombinedTopicText(topic: Topic): string {
  return `${topic.title}\n${topic.previewText || ''}\n${topic.notesPlainText || ''}`.trim();
}

/**
 * Checks if a topic has very little text (< 20 characters or <= 3 words)
 */
export function hasInsufficientText(topic: Topic): boolean {
  const combined = `${topic.previewText || ''} ${topic.notesPlainText || ''}`.trim();
  const wordCount = combined.split(/\s+/).filter(Boolean).length;
  return wordCount < 5;
}

/**
 * Evaluates semantic auto links, manual links, and respects hidden links
 */
export function computeGraphLinks(options: ComputeLinksOptions): ActiveGraphLink[] {
  const { topics, storedLinks, similarityThreshold, useFallbackKeywordSimilarity } = options;
  const activeTopics = topics.filter((t) => !t.deleted);
  const topicMap = new Map<string, Topic>(activeTopics.map((t) => [t.id, t]));

  // Index stored links by unordered pair key: `minId--maxId`
  const storedPairMap = new Map<string, TopicLink>();
  for (const link of storedLinks) {
    const key = [link.sourceTopicId, link.targetTopicId].sort().join('--');
    storedPairMap.set(key, link);
  }

  const results: ActiveGraphLink[] = [];
  const processedPairs = new Set<string>();

  // 1. Process explicit stored links (manual, auto, and hidden)
  for (const stored of storedLinks) {
    const sourceExists = topicMap.has(stored.sourceTopicId);
    const targetExists = topicMap.has(stored.targetTopicId);
    if (!sourceExists || !targetExists) continue;

    const key = [stored.sourceTopicId, stored.targetTopicId].sort().join('--');
    if (processedPairs.has(key)) {
      continue; // Skip duplicate records for the same pair
    }
    processedPairs.add(key);

    // If user explicitly hid or deleted this link, or if auto links are turned off and this is an auto link
    if (stored.type === 'hidden' || (stored.type === 'auto' && options.showAutoLinks === false)) {
      continue;
    }

    results.push({
      id: stored.id,
      sourceTopicId: stored.sourceTopicId,
      targetTopicId: stored.targetTopicId,
      type: stored.type,
      score: stored.score,
      reason: stored.reason || (stored.type === 'manual' ? 'Manual connection created by you' : 'Discovered relation'),
      isStored: true,
    });
  }

  // 2. Discover automatic semantic links across all topic pairs
  for (let i = 0; i < activeTopics.length; i++) {
    for (let j = i + 1; j < activeTopics.length; j++) {
      const topicA = activeTopics[i];
      const topicB = activeTopics[j];
      const key = [topicA.id, topicB.id].sort().join('--');

      // If already handled (manual or hidden in stored links), skip
      if (processedPairs.has(key)) {
        continue;
      }

      // If auto links are turned off by user, do not compute or emit semantic auto links
      if (options.showAutoLinks === false) {
        continue;
      }

      const textA = getCombinedTopicText(topicA);
      const textB = getCombinedTopicText(topicB);

      // Semantic similarity computation
      let similarity = 0;
      let method = 'Neural Embedding';
      const effectiveThreshold = useFallbackKeywordSimilarity
        ? Math.min(0.04, similarityThreshold * 0.15)
        : similarityThreshold;

      if (!useFallbackKeywordSimilarity && topicA.embedding && topicB.embedding) {
        similarity = cosineSimilarity(topicA.embedding, topicB.embedding);
      } else {
        // Fallback keyword similarity
        similarity = keywordSimilarity(textA, textB);
        method = 'Keyword Overlap';
      }

      if (similarity >= effectiveThreshold) {
        const percent = Math.round(similarity * 100);
        results.push({
          id: `auto--${key}`,
          sourceTopicId: topicA.id,
          targetTopicId: topicB.id,
          type: 'auto',
          score: similarity,
          reason: `Auto-suggested: ${percent}% similarity via ${method}`,
          isStored: false,
        });
      }
    }
  }

  return results;
}
