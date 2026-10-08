import { db, type StoredImage } from './db';
import type {
  Topic,
  TopicLink,
  TopicCreateInput,
  TopicUpdateInput,
  ExportPayload,
  ExportTopic,
  ExportLink,
} from './types';
import { INITIAL_SEEDS, INITIAL_LINKS } from './seedData';

export interface ITopicRepository {
  init(): Promise<void>;
  getAllTopics(): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(data: TopicCreateInput): Promise<Topic>;
  updateTopic(id: string, updates: TopicUpdateInput): Promise<Topic>;
  deleteTopic(id: string, soft?: boolean): Promise<void>;
  updatePosition(id: string, x: number, y: number): Promise<void>;

  getAllLinks(): Promise<TopicLink[]>;
  saveLink(
    link: Omit<TopicLink, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }
  ): Promise<TopicLink>;
  deleteLink(id: string): Promise<void>;
  hideLink(sourceTopicId: string, targetTopicId: string): Promise<void>;

  storeImage(blob: Blob, mimeType: string, topicId?: string): Promise<string>;
  getImageBlob(id: string): Promise<Blob | undefined>;

  exportBackup(): Promise<ExportPayload>;
  importBackup(payload: ExportPayload): Promise<void>;
  resetToDefaults(): Promise<void>;
}

// Convert Blob to Base64 Data URL for JSON export and persistent storage
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 Data URL to Blob for JSON import
function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export class LocalAdapter implements ITopicRepository {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const count = await db.topics.count();
      if (count === 0) {
        // Seed default topics and links
        await db.transaction('rw', db.topics, db.links, async () => {
          await db.topics.bulkAdd(INITIAL_SEEDS);
          await db.links.bulkAdd(INITIAL_LINKS);
        });
      } else {
        // Ensure demonstration topics exist if upgrading an existing IndexedDB database
        for (const seed of INITIAL_SEEDS) {
          const exists = await db.topics.get(seed.id);
          if (!exists) {
            await db.topics.add(seed);
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize local repository:', err);
    }
  }

  async getAllTopics(): Promise<Topic[]> {
    await this.init();
    return await db.topics
      .filter((t) => !t.deleted)
      .toArray();
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    await this.init();
    const topic = await db.topics.get(id);
    if (!topic || topic.deleted) return undefined;
    return topic;
  }

  async createTopic(data: TopicCreateInput): Promise<Topic> {
    await this.init();
    const now = Date.now();
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      previewText: data.previewText?.trim() || '',
      previewImage: data.previewImage || null,
      notesContent: data.notesContent || {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: data.title.trim() }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.previewText?.trim() || 'Start drafting your study notes here...',
              },
            ],
          },
        ],
      },
      notesPlainText: data.notesPlainText || (data.previewText?.trim() || ''),
      embedding: null,
      positionX: data.positionX ?? (300 + Math.random() * 200 - 100),
      positionY: data.positionY ?? (300 + Math.random() * 200 - 100),
      createdAt: now,
      updatedAt: now,
      deleted: false,
      synced: false,
    };

    await db.topics.add(newTopic);
    return newTopic;
  }

  async updateTopic(id: string, updates: TopicUpdateInput): Promise<Topic> {
    await this.init();
    const existing = await db.topics.get(id);
    if (!existing) {
      throw new Error(`Topic with id ${id} not found`);
    }

    const updated: Topic = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.topics.put(updated);
    return updated;
  }

  async deleteTopic(id: string, soft = true): Promise<void> {
    await this.init();
    if (soft) {
      await db.topics.update(id, { deleted: true, updatedAt: Date.now() });
    } else {
      await db.topics.delete(id);
    }

    // Also remove or mark associated links
    await db.links
      .filter((link) => link.sourceTopicId === id || link.targetTopicId === id)
      .delete();
  }

  async updatePosition(id: string, x: number, y: number): Promise<void> {
    await db.topics.update(id, {
      positionX: Math.round(x),
      positionY: Math.round(y),
      updatedAt: Date.now(),
    });
  }

  async getAllLinks(): Promise<TopicLink[]> {
    await this.init();
    return await db.links.toArray();
  }

  async saveLink(
    linkData: Omit<TopicLink, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }
  ): Promise<TopicLink> {
    await this.init();
    const now = Date.now();
    // Check if an existing link exists between these two nodes
    const matches = await db.links
      .filter(
        (l) =>
          (l.sourceTopicId === linkData.sourceTopicId && l.targetTopicId === linkData.targetTopicId) ||
          (l.sourceTopicId === linkData.targetTopicId && l.targetTopicId === linkData.sourceTopicId)
      )
      .toArray();

    const existing = matches[0];
    const linkId = existing?.id || linkData.id || crypto.randomUUID();

    // Clean up any extra duplicates in the database
    if (matches.length > 1) {
      for (let i = 1; i < matches.length; i++) {
        await db.links.delete(matches[i].id);
      }
    }

    const link: TopicLink = {
      id: linkId,
      sourceTopicId: linkData.sourceTopicId,
      targetTopicId: linkData.targetTopicId,
      type: linkData.type,
      score: linkData.score,
      reason: linkData.reason,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await db.links.put(link);
    return link;
  }

  async deleteLink(id: string): Promise<void> {
    await this.init();
    await db.links.delete(id);
  }

  async hideLink(sourceTopicId: string, targetTopicId: string): Promise<void> {
    await this.init();
    const matches = await db.links
      .filter(
        (l) =>
          (l.sourceTopicId === sourceTopicId && l.targetTopicId === targetTopicId) ||
          (l.sourceTopicId === targetTopicId && l.targetTopicId === sourceTopicId)
      )
      .toArray();

    if (matches.length > 0) {
      for (const link of matches) {
        await db.links.update(link.id, {
          type: 'hidden',
          updatedAt: Date.now(),
        });
      }
    } else {
      await db.links.add({
        id: crypto.randomUUID(),
        sourceTopicId,
        targetTopicId,
        type: 'hidden',
        score: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  async storeImage(blob: Blob, mimeType: string, topicId?: string): Promise<string> {
    await this.init();
    const id = crypto.randomUUID();
    const item: StoredImage = {
      id,
      blob,
      mimeType,
      topicId,
      createdAt: Date.now(),
    };
    await db.images.add(item);
    return id;
  }

  async getImageBlob(id: string): Promise<Blob | undefined> {
    await this.init();
    const record = await db.images.get(id);
    return record?.blob;
  }

  async exportBackup(): Promise<ExportPayload> {
    await this.init();
    const allTopics = await db.topics.toArray();
    const allLinks = await db.links.toArray();

    const exportTopics: ExportTopic[] = await Promise.all(
      allTopics.map(async (topic) => {
        let previewImageBase64: string | null = null;
        if (topic.previewImage) {
          try {
            previewImageBase64 = await blobToBase64(topic.previewImage);
          } catch (e) {
            console.warn('Failed to convert preview image to base64', e);
          }
        }
        return {
          id: topic.id,
          title: topic.title,
          previewText: topic.previewText,
          previewImageBase64,
          notesContent: topic.notesContent,
          notesPlainText: topic.notesPlainText,
          embedding: topic.embedding,
          positionX: topic.positionX,
          positionY: topic.positionY,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt,
          deleted: topic.deleted,
          synced: topic.synced,
        };
      })
    );

    const exportLinks: ExportLink[] = allLinks.map((link) => ({
      id: link.id,
      sourceTopicId: link.sourceTopicId,
      targetTopicId: link.targetTopicId,
      type: link.type,
      score: link.score,
      reason: link.reason,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }));

    return {
      version: 1,
      appName: 'Constellation',
      exportedAt: new Date().toISOString(),
      topics: exportTopics,
      links: exportLinks,
    };
  }

  async importBackup(payload: ExportPayload): Promise<void> {
    await this.init();
    if (!payload.topics || !Array.isArray(payload.topics)) {
      throw new Error('Invalid backup file structure: missing topics array.');
    }

    const topicsToInsert: Topic[] = payload.topics.map((t) => {
      let previewImage: Blob | null = null;
      if (t.previewImageBase64) {
        try {
          previewImage = base64ToBlob(t.previewImageBase64);
        } catch (e) {
          console.warn('Failed to decode base64 preview image', e);
        }
      }
      return {
        id: t.id,
        title: t.title,
        previewText: t.previewText,
        previewImage,
        notesContent: t.notesContent,
        notesPlainText: t.notesPlainText || '',
        embedding: t.embedding || null,
        positionX: t.positionX ?? 300,
        positionY: t.positionY ?? 300,
        createdAt: t.createdAt || Date.now(),
        updatedAt: t.updatedAt || Date.now(),
        deleted: !!t.deleted,
        synced: !!t.synced,
      };
    });

    const linksToInsert: TopicLink[] = (payload.links || []).map((l) => ({
      id: l.id || crypto.randomUUID(),
      sourceTopicId: l.sourceTopicId,
      targetTopicId: l.targetTopicId,
      type: l.type || 'auto',
      score: l.score ?? 0.5,
      reason: l.reason,
      createdAt: l.createdAt || Date.now(),
      updatedAt: l.updatedAt || Date.now(),
    }));

    await db.transaction('rw', db.topics, db.links, async () => {
      await db.topics.clear();
      await db.links.clear();
      await db.topics.bulkAdd(topicsToInsert);
      await db.links.bulkAdd(linksToInsert);
    });
  }

  async resetToDefaults(): Promise<void> {
    await db.transaction('rw', db.topics, db.links, db.images, async () => {
      await db.topics.clear();
      await db.links.clear();
      await db.images.clear();
      await db.topics.bulkAdd(INITIAL_SEEDS);
      await db.links.bulkAdd(INITIAL_LINKS);
    });
  }
}

// Singleton repository instance with LocalAdapter
export const topicRepository: ITopicRepository = new LocalAdapter();
