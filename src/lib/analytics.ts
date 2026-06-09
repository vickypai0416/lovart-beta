import fs from 'fs';
import path from 'path';

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface Event {
  id: string;
  sessionId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface Generation {
  id: string;
  sessionId: string;
  clientRequestId?: string;
  prompt: string;
  displayPrompt?: string;
  size: string;
  quality: string;
  model: string;
  count: number;
  status: 'success' | 'failed' | 'pending';
  duration?: number;
  imageUrl?: string;
  error?: string;
  createdAt: Date;
  // Deep workflow specific fields
  workflow?: string;
  listingIndex?: number;
  listingType?: string;
  designBibleId?: string;
}

export interface Feedback {
  id: string;
  sessionId: string;
  generationId?: string;
  rating?: number;
  comment?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  model: string;
  hasImages?: boolean;
  imageCount?: number;
  createdAt: Date;
}

export interface PromptTemplate {
  id: string;
  content: string;
  author?: string;
  likes: number;
  createdAt: Date;
}

export interface GridTemplatePreset {
  id: string;
  key: string; // 唯一标识符，如 'amazon-9-grid-default'
  name: string; // 显示名称
  content: string; // 模板内容
  description?: string; // 描述
  isDefault: boolean; // 是否为默认模板
  updatedAt: Date;
  updatedBy?: string;
}

interface StorageAdapter {
  createSession(userId?: string): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event>;
  getEventsBySession(sessionId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation>;
  updateGeneration(id: string, updates: Partial<Generation>): Promise<void>;
  getGenerationsBySession(sessionId: string): Promise<Generation[]>;
  getAllGenerations(): Promise<Generation[]>;
  cleanupFailedGenerations(): Promise<void>;
  cleanupOldGenerations(days: number): Promise<void>;
  createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback>;
  getFeedbacksBySession(sessionId: string): Promise<Feedback[]>;
  getAllFeedbacks(): Promise<Feedback[]>;
  createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  createPromptTemplate(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'likes'>): Promise<PromptTemplate>;
  getAllPromptTemplates(): Promise<PromptTemplate[]>;
  likePromptTemplate(id: string): Promise<void>;
  deletePromptTemplate(id: string): Promise<void>;
  // Grid Template Preset methods
  getGridTemplatePreset(key: string): Promise<GridTemplatePreset | undefined>;
  getAllGridTemplatePresets(): Promise<GridTemplatePreset[]>;
  saveGridTemplatePreset(data: Omit<GridTemplatePreset, 'id' | 'updatedAt'>): Promise<GridTemplatePreset>;
  deleteGridTemplatePreset(key: string): Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function toDateSafe(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

class FileStorageAdapter implements StorageAdapter {
  private DATA_DIR: string;

  constructor() {
    this.DATA_DIR = path.join(process.cwd(), 'data');
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }
  }

  private getFilePath(type: string): string {
    return path.join(this.DATA_DIR, `${type}.json`);
  }

  private readData<T extends { createdAt?: unknown; updatedAt?: unknown }>(type: string): T[] {
    const filePath = this.getFilePath(type);
    if (!fs.existsSync(filePath)) return [];
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
      return raw.map((item) => ({
        ...item,
        createdAt: toDateSafe(item.createdAt),
        updatedAt: item.updatedAt ? toDateSafe(item.updatedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private writeData<T>(type: string, data: T[]): void {
    fs.writeFileSync(this.getFilePath(type), JSON.stringify(data, null, 2));
  }

  async createSession(userId?: string): Promise<Session> {
    const session: Session = { id: generateId(), createdAt: new Date(), updatedAt: new Date(), userId };
    const sessions = this.readData<Session>('sessions');
    sessions.push(session);
    this.writeData('sessions', sessions);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.readData<Session>('sessions').find((s) => s.id === id);
  }

  async getAllSessions(): Promise<Session[]> {
    return this.readData<Session>('sessions');
  }

  async createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> {
    return { id: generateId(), sessionId, type, payload, createdAt: new Date() };
  }

  async getEventsBySession(sessionId: string): Promise<Event[]> {
    return [];
  }

  async getAllEvents(): Promise<Event[]> {
    return [];
  }

  async createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
    const generation: Generation = { ...data, id: generateId(), createdAt: new Date() };
    const list = this.readData<Generation>('generations');
    list.push(generation);
    this.writeData('generations', list);
    return generation;
  }

  async updateGeneration(id: string, updates: Partial<Generation>): Promise<void> {
    const list = this.readData<Generation>('generations');
    const idx = list.findIndex((g) => g.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.writeData('generations', list);
    }
  }

  async getGenerationsBySession(sessionId: string): Promise<Generation[]> {
    return this.readData<Generation>('generations').filter((g) => g.sessionId === sessionId);
  }

  async getAllGenerations(): Promise<Generation[]> {
    return this.readData<Generation>('generations');
  }

  async cleanupFailedGenerations(): Promise<void> {
    const list = this.readData<Generation>('generations');
    const filtered = list.filter(g => g.status !== 'failed');
    this.writeData('generations', filtered);
  }

  async cleanupOldGenerations(days: number): Promise<void> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = this.readData<Generation>('generations');
    const filtered = list.filter(g => g.createdAt > cutoff);
    this.writeData('generations', filtered);
  }

  async createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    return { ...data, id: generateId(), createdAt: new Date() };
  }

  async getFeedbacksBySession(sessionId: string): Promise<Feedback[]> {
    return [];
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    return [];
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    return { ...data, id: generateId(), createdAt: new Date() };
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return [];
  }

  async getAllMessages(): Promise<Message[]> {
    return [];
  }

  async createPromptTemplate(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'likes'>): Promise<PromptTemplate> {
    const template: PromptTemplate = { ...data, id: generateId(), likes: 0, createdAt: new Date() };
    const list = this.readData<PromptTemplate>('prompt-templates');
    list.push(template);
    this.writeData('prompt-templates', list);
    return template;
  }

  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    return this.readData<PromptTemplate>('prompt-templates').sort((a, b) => b.likes - a.likes);
  }

  async likePromptTemplate(id: string): Promise<void> {
    const list = this.readData<PromptTemplate>('prompt-templates');
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx].likes += 1;
      this.writeData('prompt-templates', list);
    }
  }

  async deletePromptTemplate(id: string): Promise<void> {
    const list = this.readData<PromptTemplate>('prompt-templates').filter(t => t.id !== id);
    this.writeData('prompt-templates', list);
  }

  // Grid Template Preset implementations for FileStorageAdapter
  async getGridTemplatePreset(key: string): Promise<GridTemplatePreset | undefined> {
    const list = this.readData<GridTemplatePreset>('grid-template-presets');
    return list.find(t => t.key === key);
  }

  async getAllGridTemplatePresets(): Promise<GridTemplatePreset[]> {
    return this.readData<GridTemplatePreset>('grid-template-presets');
  }

  async saveGridTemplatePreset(data: Omit<GridTemplatePreset, 'id' | 'updatedAt'>): Promise<GridTemplatePreset> {
    const list = this.readData<GridTemplatePreset>('grid-template-presets');
    const existingIndex = list.findIndex(t => t.key === data.key);

    if (existingIndex !== -1) {
      // Update existing
      list[existingIndex] = {
        ...list[existingIndex],
        ...data,
        updatedAt: new Date(),
      };
      this.writeData('grid-template-presets', list);
      return list[existingIndex];
    } else {
      // Create new
      const preset: GridTemplatePreset = {
        ...data,
        id: generateId(),
        updatedAt: new Date(),
      };
      list.push(preset);
      this.writeData('grid-template-presets', list);
      return preset;
    }
  }

  async deleteGridTemplatePreset(key: string): Promise<void> {
    const list = this.readData<GridTemplatePreset>('grid-template-presets').filter(t => t.key !== key);
    this.writeData('grid-template-presets', list);
  }
}

class KVStorageAdapter implements StorageAdapter {
  private kv: any;
  private initialized = false;
  private static readonly TTL_SECONDS = 1 * 60 * 60;

  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const { Redis } = await import('@upstash/redis');
      this.kv = Redis.fromEnv();
      this.initialized = true;
      return;
    } catch {}
    const { kv } = await import('@vercel/kv');
    this.kv = kv;
    this.initialized = true;
  }

  private key(type: string, id?: string): string {
    return id ? `analytics:${type}:${id}` : `analytics:${type}`;
  }

  private cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  private normalize<T extends { createdAt?: unknown; updatedAt?: unknown }>(obj: T): T {
    return {
      ...obj,
      createdAt: toDateSafe(obj.createdAt),
      updatedAt: obj.updatedAt ? toDateSafe(obj.updatedAt) : undefined,
    } as T;
  }

  private async getByIds<T extends { createdAt?: unknown; updatedAt?: unknown }>(
    type: string,
    ids: string[],
    idsSetKey?: string,
  ): Promise<T[]> {
    const out: T[] = [];
    const staleIds: string[] = [];
    for (const id of ids) {
      const data = await this.kv.hgetall(this.key(type, id));
      if (data && Object.keys(data).length > 0) {
        out.push(this.normalize(data as T));
      } else {
        staleIds.push(id);
      }
    }
    if (idsSetKey && staleIds.length > 0) {
      await this.kv.srem(idsSetKey, ...staleIds);
    }
    return out;
  }

  async createSession(userId?: string): Promise<Session> {
    await this.init();
    const session: Session = { id: generateId(), createdAt: new Date(), updatedAt: new Date(), userId };
    const key = this.key('sessions', session.id);
    await this.kv.hset(key, this.cleanObject(session as any));
    await this.kv.sadd('analytics:sessions:ids', session.id);
    await this.kv.expire(key, KVStorageAdapter.TTL_SECONDS);
    await this.kv.expire('analytics:sessions:ids', KVStorageAdapter.TTL_SECONDS);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    await this.init();
    const data = await this.kv.hgetall(this.key('sessions', id));
    if (!data || Object.keys(data).length === 0) return undefined;
    return this.normalize(data as Session);
  }

  async getAllSessions(): Promise<Session[]> {
    await this.init();
    const ids: string[] = await this.kv.smembers('analytics:sessions:ids');
    return this.getByIds<Session>('sessions', ids || [], 'analytics:sessions:ids');
  }

  async createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> {
    return { id: generateId(), sessionId, type, payload, createdAt: new Date() };
  }

  async getEventsBySession(sessionId: string): Promise<Event[]> {
    return [];
  }

  async getAllEvents(): Promise<Event[]> {
    return [];
  }

  async createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
    await this.init();
    const generation: Generation = { ...data, id: generateId(), createdAt: new Date() };
    const key = this.key('generations', generation.id);
    await this.kv.hset(key, this.cleanObject(generation as any));
    await this.kv.sadd('analytics:generations:ids', generation.id);
    await this.kv.sadd(`analytics:sessions:${generation.sessionId}:generations`, generation.id);
    await this.kv.expire(key, KVStorageAdapter.TTL_SECONDS);
    await this.kv.expire('analytics:generations:ids', KVStorageAdapter.TTL_SECONDS);
    await this.kv.expire(`analytics:sessions:${generation.sessionId}:generations`, KVStorageAdapter.TTL_SECONDS);
    return generation;
  }

  async updateGeneration(id: string, updates: Partial<Generation>): Promise<void> {
    await this.init();
    const key = this.key('generations', id);
    await this.kv.hset(key, this.cleanObject(updates as any));
    await this.kv.expire(key, KVStorageAdapter.TTL_SECONDS);
  }

  async getGenerationsBySession(sessionId: string): Promise<Generation[]> {
    await this.init();
    const setKey = `analytics:sessions:${sessionId}:generations`;
    const ids: string[] = await this.kv.smembers(setKey);
    return this.getByIds<Generation>('generations', ids || [], setKey);
  }

  async getAllGenerations(): Promise<Generation[]> {
    await this.init();
    const ids: string[] = await this.kv.smembers('analytics:generations:ids');
    return this.getByIds<Generation>('generations', ids || [], 'analytics:generations:ids');
  }

  async cleanupFailedGenerations(): Promise<void> {
    await this.init();
    const ids: string[] = await this.kv.smembers('analytics:generations:ids');
    for (const id of ids) {
      const data = await this.kv.hgetall(this.key('generations', id));
      if (data && data.status === 'failed') {
        await this.kv.del(this.key('generations', id));
        await this.kv.srem('analytics:generations:ids', id);
        const sessionId = data.sessionId;
        if (sessionId) {
          await this.kv.srem(`analytics:sessions:${sessionId}:generations`, id);
        }
      }
    }
  }

  async cleanupOldGenerations(days: number): Promise<void> {
    await this.init();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const ids: string[] = await this.kv.smembers('analytics:generations:ids');
    for (const id of ids) {
      const data = await this.kv.hgetall(this.key('generations', id));
      if (data && data.createdAt) {
        const createdAt = new Date(data.createdAt).getTime();
        if (createdAt < cutoff) {
          await this.kv.del(this.key('generations', id));
          await this.kv.srem('analytics:generations:ids', id);
          const sessionId = data.sessionId;
          if (sessionId) {
            await this.kv.srem(`analytics:sessions:${sessionId}:generations`, id);
          }
        }
      }
    }
  }

  async createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
    return { ...data, id: generateId(), createdAt: new Date() };
  }

  async getFeedbacksBySession(sessionId: string): Promise<Feedback[]> {
    return [];
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    return [];
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    return { ...data, id: generateId(), createdAt: new Date() };
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return [];
  }

  async getAllMessages(): Promise<Message[]> {
    return [];
  }

  async createPromptTemplate(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'likes'>): Promise<PromptTemplate> {
    await this.init();
    const template: PromptTemplate = { ...data, id: generateId(), likes: 0, createdAt: new Date() };
    const key = this.key('prompt-templates', template.id);
    await this.kv.hset(key, this.cleanObject(template as any));
    await this.kv.sadd('analytics:prompt-templates:ids', template.id);
    await this.kv.expire(key, KVStorageAdapter.TTL_SECONDS);
    await this.kv.expire('analytics:prompt-templates:ids', KVStorageAdapter.TTL_SECONDS);
    return template;
  }

  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    await this.init();
    const ids: string[] = await this.kv.smembers('analytics:prompt-templates:ids');
    const templates = await this.getByIds<PromptTemplate>('prompt-templates', ids || [], 'analytics:prompt-templates:ids');
    return templates.sort((a, b) => b.likes - a.likes);
  }

  async likePromptTemplate(id: string): Promise<void> {
    await this.init();
    const data = await this.kv.hgetall(this.key('prompt-templates', id));
    if (data && Object.keys(data).length > 0) {
      const currentLikes = Number(data.likes) || 0;
      await this.kv.hset(this.key('prompt-templates', id), { likes: currentLikes + 1 });
    }
  }

  async deletePromptTemplate(id: string): Promise<void> {
    await this.init();
    await this.kv.del(this.key('prompt-templates', id));
    await this.kv.srem('analytics:prompt-templates:ids', id);
  }

  // Grid Template Preset implementations for KVStorageAdapter
  async getGridTemplatePreset(key: string): Promise<GridTemplatePreset | undefined> {
    await this.init();
    const data = await this.kv.hgetall(this.key('grid-template-presets', key));
    if (!data || Object.keys(data).length === 0) return undefined;
    return this.normalize(data as GridTemplatePreset);
  }

  async getAllGridTemplatePresets(): Promise<GridTemplatePreset[]> {
    await this.init();
    const keys: string[] = await this.kv.smembers('analytics:grid-template-presets:keys');
    if (!keys || keys.length === 0) return [];

    const presets: GridTemplatePreset[] = [];
    for (const key of keys) {
      const data = await this.kv.hgetall(this.key('grid-template-presets', key));
      if (data && Object.keys(data).length > 0) {
        presets.push(this.normalize(data as GridTemplatePreset));
      }
    }
    return presets;
  }

  async saveGridTemplatePreset(data: Omit<GridTemplatePreset, 'id' | 'updatedAt'>): Promise<GridTemplatePreset> {
    await this.init();

    // Check if exists
    const existing = await this.getGridTemplatePreset(data.key);
    const preset: GridTemplatePreset = {
      ...data,
      id: existing?.id || generateId(),
      updatedAt: new Date(),
    };

    const key = this.key('grid-template-presets', preset.key);
    await this.kv.hset(key, this.cleanObject(preset as any));
    await this.kv.sadd('analytics:grid-template-presets:keys', preset.key);
    await this.kv.expire(key, KVStorageAdapter.TTL_SECONDS);
    await this.kv.expire('analytics:grid-template-presets:keys', KVStorageAdapter.TTL_SECONDS);

    return preset;
  }

  async deleteGridTemplatePreset(key: string): Promise<void> {
    await this.init();
    await this.kv.del(this.key('grid-template-presets', key));
    await this.kv.srem('analytics:grid-template-presets:keys', key);
  }
}

let storageInstance: StorageAdapter | null = null;

function getStorage(): StorageAdapter {
  if (storageInstance) return storageInstance;

  const hasKVEnv = Boolean(process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);
  const isProd = process.env.NODE_ENV === 'production' || process.env.COZE_PROJECT_ENV === 'PROD' || process.env.VERCEL === '1';

  if (hasKVEnv) {
    storageInstance = new KVStorageAdapter();
    return storageInstance;
  }

  if (isProd) {
    throw new Error('Analytics storage is not configured: missing KV/Redis env in production');
  }

  storageInstance = new FileStorageAdapter();
  return storageInstance;
}

export async function createSession(userId?: string): Promise<Session> { return getStorage().createSession(userId); }
export async function getSession(id: string): Promise<Session | undefined> { return getStorage().getSession(id); }
export async function createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> { return getStorage().createEvent(sessionId, type, payload); }
export async function getEventsBySession(sessionId: string): Promise<Event[]> { return getStorage().getEventsBySession(sessionId); }
export async function createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> { return getStorage().createGeneration(data); }
export async function updateGeneration(id: string, updates: Partial<Generation>): Promise<void> { return getStorage().updateGeneration(id, updates); }
export async function getGenerationsBySession(sessionId: string): Promise<Generation[]> { return getStorage().getGenerationsBySession(sessionId); }
export async function getAllGenerationRecords(): Promise<Generation[]> { return getStorage().getAllGenerations(); }
export async function createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> { return getStorage().createFeedback(data); }
export async function getFeedbacksBySession(sessionId: string): Promise<Feedback[]> { return getStorage().getFeedbacksBySession(sessionId); }
export async function createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> { return getStorage().createMessage(data); }
export async function getMessagesBySession(sessionId: string): Promise<Message[]> { return getStorage().getMessagesBySession(sessionId); }
export async function getAllMessages(): Promise<Message[]> { 
  return getStorage().getAllMessages();
}
export async function createPromptTemplate(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'likes'>): Promise<PromptTemplate> { return getStorage().createPromptTemplate(data); }
export async function getAllPromptTemplates(): Promise<PromptTemplate[]> { return getStorage().getAllPromptTemplates(); }
export async function likePromptTemplate(id: string): Promise<void> { return getStorage().likePromptTemplate(id); }
export async function deletePromptTemplate(id: string): Promise<void> { return getStorage().deletePromptTemplate(id); }

// Grid Template Preset exports
export async function getGridTemplatePreset(key: string): Promise<GridTemplatePreset | undefined> { return getStorage().getGridTemplatePreset(key); }
export async function getAllGridTemplatePresets(): Promise<GridTemplatePreset[]> { return getStorage().getAllGridTemplatePresets(); }
export async function saveGridTemplatePreset(data: Omit<GridTemplatePreset, 'id' | 'updatedAt'>): Promise<GridTemplatePreset> { return getStorage().saveGridTemplatePreset(data); }
export async function deleteGridTemplatePreset(key: string): Promise<void> { return getStorage().deleteGridTemplatePreset(key); }

export async function cleanupFailedGenerations(): Promise<void> {
  return getStorage().cleanupFailedGenerations();
}

export async function cleanupOldGenerations(days: number): Promise<void> { 
  return getStorage().cleanupOldGenerations(days); 
}

export async function cleanupGenerations(options: { deleteFailed?: boolean; maxAgeDays?: number } = {}): Promise<void> {
  const { deleteFailed = false, maxAgeDays = 30 } = options;
  if (deleteFailed) {
    await getStorage().cleanupFailedGenerations();
  }
  await getStorage().cleanupOldGenerations(maxAgeDays);
}

function inRange<T extends { createdAt: Date }>(items: T[], startDate?: Date, endDate?: Date): T[] {
  return items.filter((i) => {
    const t = i.createdAt.getTime();
    if (startDate && t < startDate.getTime()) return false;
    if (endDate && t > endDate.getTime()) return false;
    return true;
  });
}

function hasGeneratedImage(g: Generation): boolean {
  return g.status === 'success' && typeof g.imageUrl === 'string' && g.imageUrl.trim().length > 0;
}

export async function getSummary(startDate?: Date, endDate?: Date) {
  const sessions = await getStorage().getAllSessions();
  const events = await getStorage().getAllEvents();
  const allGenerations = inRange(await getStorage().getAllGenerations(), startDate, endDate);
  const generations = allGenerations.filter(hasGeneratedImage);
  const feedbacks = inRange(await getStorage().getAllFeedbacks(), startDate, endDate);

  const ratings = feedbacks.filter((f) => typeof f.rating === 'number').map((f) => f.rating as number);
  const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const durations = generations.filter((g) => typeof g.duration === 'number').map((g) => g.duration as number);
  const averageDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const modelCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};
  for (const g of generations) {
    modelCounts[g.model] = (modelCounts[g.model] || 0) + 1;
    sizeCounts[g.size] = (sizeCounts[g.size] || 0) + 1;
  }

  const workflowCounts: Record<string, number> = {};
  for (const e of events.filter((e) => e.type === 'workflow_switch')) {
    const w = String((e.payload as any)?.workflow || 'unknown');
    workflowCounts[w] = (workflowCounts[w] || 0) + 1;
  }

  return {
    totalSessions: sessions.length,
    totalEvents: events.length,
    totalGenerations: generations.length,
    successfulGenerations: generations.length,
    failedGenerations: allGenerations.filter((g) => g.status === 'failed').length,
    totalFeedbacks: feedbacks.length,
    averageRating: Math.round(averageRating * 10) / 10,
    averageDuration: Math.round(averageDuration),
    topModels: Object.entries(modelCounts).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    topSizes: Object.entries(sizeCounts).map(([size, count]) => ({ size, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    workflowDistribution: Object.entries(workflowCounts).map(([workflow, count]) => ({ workflow, count })).sort((a, b) => b.count - a.count),
  };
}

export async function getGenerations(page = 1, pageSize = 20, status?: string) {
  let list = await getStorage().getAllGenerations();
  list = list.filter(hasGeneratedImage);
  if (status) list = list.filter((g) => g.status === status);
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (Math.max(1, page) - 1) * pageSize;
  return {
    data: list.slice(start, start + pageSize).map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    })),
    total,
    totalPages,
  };
}

export async function getFeedbacks(page = 1, pageSize = 20) {
  const list = await getStorage().getAllFeedbacks();
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (Math.max(1, page) - 1) * pageSize;
  return {
    data: list.slice(start, start + pageSize).map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    })),
    total,
    totalPages,
  };
}

export async function getEventStats(startDate?: Date, endDate?: Date) {
  const events = inRange(await getStorage().getAllEvents(), startDate, endDate);
  const byType: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    const d = e.createdAt.toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  }
  return {
    total: events.length,
    byType,
    dailyStats: Object.entries(byDate).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
