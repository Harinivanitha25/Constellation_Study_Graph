export type LinkType = 'auto' | 'manual' | 'hidden';

export interface Topic {
  id: string; // uuid
  title: string;
  previewText: string;
  previewImage?: Blob | null;
  notesContent: any; // Tiptap JSON document
  notesPlainText: string;
  embedding?: number[] | null;
  positionX: number;
  positionY: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  synced: boolean;
}

export interface TopicLink {
  id: string; // uuid
  sourceTopicId: string;
  targetTopicId: string;
  type: LinkType;
  score: number;
  reason?: string;
  createdAt: number;
  updatedAt: number;
}

export type TopicCreateInput = {
  title: string;
  previewText?: string;
  previewImage?: Blob | null;
  notesContent?: any;
  notesPlainText?: string;
  positionX?: number;
  positionY?: number;
};

export type TopicUpdateInput = Partial<Omit<Topic, 'id' | 'createdAt'>>;

export interface ExportTopic {
  id: string;
  title: string;
  previewText: string;
  previewImageBase64?: string | null;
  notesContent: any;
  notesPlainText: string;
  embedding?: number[] | null;
  positionX: number;
  positionY: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  synced: boolean;
}

export interface ExportLink {
  id: string;
  sourceTopicId: string;
  targetTopicId: string;
  type: LinkType;
  score: number;
  reason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  appName: string;
  topics: ExportTopic[];
  links: ExportLink[];
}
