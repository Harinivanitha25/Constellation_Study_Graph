import Dexie, { type Table } from 'dexie';
import type { Topic, TopicLink } from './types';

export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  topicId?: string;
  createdAt: number;
}

export class ConstellationDatabase extends Dexie {
  topics!: Table<Topic, string>;
  links!: Table<TopicLink, string>;
  images!: Table<StoredImage, string>;

  constructor() {
    super('ConstellationDB');

    this.version(1).stores({
      topics: 'id, title, createdAt, updatedAt, deleted, synced',
      links: 'id, sourceTopicId, targetTopicId, type, score, createdAt, updatedAt',
      images: 'id, topicId, createdAt',
    });
  }
}

export const db = new ConstellationDatabase();
