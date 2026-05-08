import fs from 'fs';
import path from 'path';
// 类型定义
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
// 存储适配器接口
interface StorageAdapter {
 // Session operations
 createSession(userId?: string): Promise<Session>;
 getSession(id: string): Promise<Session | undefined>;
 getAllSessions(): Promise<Session[]>;
 // Event operations
 createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event>;
 getEventsBySession(sessionId: string): Promise<Event[]>;
 getAllEvents(): Promise<Event[]>;
 // Generation operations
 createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation>;
 updateGeneration(id: string, updates: Partial<Generation>): Promise<void>;
 getGenerationsBySession(sessionId: string): Promise<Generation[]>;
 getAllGenerations(): Promise<Generation[]>;
 // Feedback operations
 createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback>;
 getFeedbacksBySession(sessionId: string): Promise<Feedback[]>;
 getAllFeedbacks(): Promise<Feedback[]>;
 // Message operations
 createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
 getMessagesBySession(sessionId: string): Promise<Message[]>;
 getAllMessages(): Promise<Message[]>;
}
// 生成唯一ID
function generateId(): string {
 return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
// 文件存储适配器
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
 private readData<T>(type: string): T[] {
 const filePath = this.getFilePath(type);
 if (!fs.existsSync(filePath)) {
 return [];
 }
 try {
 const content = fs.readFileSync(filePath, 'utf-8');
 const data = JSON.parse(content);
 return data.map((item: any) => ({
 ...item,
 createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
 updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
 })) as T[];
 }
 catch {
 return [];
 }
 }
 private writeData<T>(type: string, data: T[]): void {
 const filePath = this.getFilePath(type);
 fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
 }
 async createSession(userId?: string): Promise<Session> {
 const session: Session = {
 id: generateId(),
 createdAt: new Date(),
 updatedAt: new Date(),
 userId,
 };
 const sessions = this.readData<Session>('sessions');
 sessions.push(session);
 this.writeData('sessions', sessions);
 return session;
 }
 async getSession(id: string): Promise<Session | undefined> {
 const sessions = this.readData<Session>('sessions');
 return sessions.find(s => s.id === id);
 }
 async getAllSessions(): Promise<Session[]> {
 return this.readData<Session>('sessions');
 }
 async createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> {
 const event: Event = {
 id: generateId(),
 sessionId,
 type,
 payload,
 createdAt: new Date(),
 };
 const events = this.readData<Event>('events');
 events.push(event);
 this.writeData('events', events);
 return event;
 }
 async getEventsBySession(sessionId: string): Promise<Event[]> {
 const events = this.readData<Event>('events');
 return events.filter(e => e.sessionId === sessionId);
 }
 async getAllEvents(): Promise<Event[]> {
 return this.readData<Event>('events');
 }
 async createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
 const generation: Generation = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 const generations = this.readData<Generation>('generations');
 generations.push(generation);
 this.writeData('generations', generations);
 return generation;
 }
 async updateGeneration(id: string, updates: Partial<Generation>): Promise<void> {
 const generations = this.readData<Generation>('generations');
 const index = generations.findIndex(g => g.id === id);
 if (index !== -1) {
 generations[index] = { ...generations[index], ...updates };
 this.writeData('generations', generations);
 }
 }
 async getGenerationsBySession(sessionId: string): Promise<Generation[]> {
 const generations = this.readData<Generation>('generations');
 return generations.filter(g => g.sessionId === sessionId);
 }
 async getAllGenerations(): Promise<Generation[]> {
 return this.readData<Generation>('generations');
 }
 async createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
 const feedback: Feedback = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 const feedbacks = this.readData<Feedback>('feedbacks');
 feedbacks.push(feedback);
 this.writeData('feedbacks', feedbacks);
 return feedback;
 }
 async getFeedbacksBySession(sessionId: string): Promise<Feedback[]> {
 const feedbacks = this.readData<Feedback>('feedbacks');
 return feedbacks.filter(f => f.sessionId === sessionId);
 }
 async getAllFeedbacks(): Promise<Feedback[]> {
 return this.readData<Feedback>('feedbacks');
 }
 async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
 const message: Message = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 const messages = this.readData<Message>('messages');
 messages.push(message);
 this.writeData('messages', messages);
 return message;
 }
 async getMessagesBySession(sessionId: string): Promise<Message[]> {
 const messages = this.readData<Message>('messages');
 return messages.filter(m => m.sessionId === sessionId);
 }
 async getAllMessages(): Promise<Message[]> {
 return this.readData<Message>('messages');
 }
}
// KV 存储适配器（使用 Vercel KV）
class KVStorageAdapter implements StorageAdapter {
 private kv: any;
 private initialized: boolean = false;
 private async init(): Promise<void> {
 if (this.initialized)
 return;
 try {
 const { kv } = await import('@vercel/kv');
 this.kv = kv;
 this.initialized = true;
 }
 catch {
 throw new Error('@vercel/kv is not installed');
 }
 }
 private getKey(type: string, id?: string): string {
 if (id) {
 return `analytics:${type}:${id}`;
 }
 return `analytics:${type}`;
 }
 async createSession(userId?: string): Promise<Session> {
 await this.init();
 const session: Session = {
 id: generateId(),
 createdAt: new Date(),
 updatedAt: new Date(),
 userId,
 };
 await this.kv.hset(this.getKey('sessions', session.id), session);
 await this.kv.sadd('analytics:sessions:ids', session.id);
 return session;
 }
 async getSession(id: string): Promise<Session | undefined> {
 await this.init();
 const data = await this.kv.hgetall(this.getKey('sessions', id));
 if (!data || Object.keys(data).length === 0)
 return undefined;
 return {
 ...data,
 createdAt: new Date(data.createdAt),
 updatedAt: new Date(data.updatedAt),
 };
 }
 async getAllSessions(): Promise<Session[]> {
 await this.init();
 const ids = await this.kv.smembers('analytics:sessions:ids');
 const sessions: Session[] = [];
 for (const id of ids) {
 const session = await this.getSession(id);
 if (session)
 sessions.push(session);
 }
 return sessions;
 }
 async createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> {
 await this.init();
 const event: Event = {
 id: generateId(),
 sessionId,
 type,
 payload,
 createdAt: new Date(),
 };
 await this.kv.hset(this.getKey('events', event.id), event);
 await this.kv.sadd('analytics:events:ids', event.id);
 await this.kv.sadd(`analytics:sessions:${sessionId}:events`, event.id);
 return event;
 }
 async getEventsBySession(sessionId: string): Promise<Event[]> {
 await this.init();
 const eventIds = await this.kv.smembers(`analytics:sessions:${sessionId}:events`);
 const events: Event[] = [];
 for (const id of eventIds) {
 const data = await this.kv.hgetall(this.getKey('events', id));
 if (data && Object.keys(data).length > 0) {
 events.push({
 ...data,
 payload: typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return events;
 }
 async getAllEvents(): Promise<Event[]> {
 await this.init();
 const ids = await this.kv.smembers('analytics:events:ids');
 const events: Event[] = [];
 for (const id of ids) {
 const data = await this.kv.hgetall(this.getKey('events', id));
 if (data && Object.keys(data).length > 0) {
 events.push({
 ...data,
 payload: typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return events;
 }
 async createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
 await this.init();
 const generation: Generation = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 await this.kv.hset(this.getKey('generations', generation.id), generation);
 await this.kv.sadd('analytics:generations:ids', generation.id);
 await this.kv.sadd(`analytics:sessions:${generation.sessionId}:generations`, generation.id);
 return generation;
 }
 async updateGeneration(id: string, updates: Partial<Generation>): Promise<void> {
 await this.init();
 await this.kv.hset(this.getKey('generations', id), updates);
 }
 async getGenerationsBySession(sessionId: string): Promise<Generation[]> {
 await this.init();
 const generationIds = await this.kv.smembers(`analytics:sessions:${sessionId}:generations`);
 const generations: Generation[] = [];
 for (const id of generationIds) {
 const data = await this.kv.hgetall(this.getKey('generations', id));
 if (data && Object.keys(data).length > 0) {
 generations.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return generations;
 }
 async getAllGenerations(): Promise<Generation[]> {
 await this.init();
 const ids = await this.kv.smembers('analytics:generations:ids');
 const generations: Generation[] = [];
 for (const id of ids) {
 const data = await this.kv.hgetall(this.getKey('generations', id));
 if (data && Object.keys(data).length > 0) {
 generations.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return generations;
 }
 async createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
 await this.init();
 const feedback: Feedback = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 await this.kv.hset(this.getKey('feedbacks', feedback.id), feedback);
 await this.kv.sadd('analytics:feedbacks:ids', feedback.id);
 await this.kv.sadd(`analytics:sessions:${feedback.sessionId}:feedbacks`, feedback.id);
 return feedback;
 }
 async getFeedbacksBySession(sessionId: string): Promise<Feedback[]> {
 await this.init();
 const feedbackIds = await this.kv.smembers(`analytics:sessions:${sessionId}:feedbacks`);
 const feedbacks: Feedback[] = [];
 for (const id of feedbackIds) {
 const data = await this.kv.hgetall(this.getKey('feedbacks', id));
 if (data && Object.keys(data).length > 0) {
 feedbacks.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return feedbacks;
 }
 async getAllFeedbacks(): Promise<Feedback[]> {
 await this.init();
 const ids = await this.kv.smembers('analytics:feedbacks:ids');
 const feedbacks: Feedback[] = [];
 for (const id of ids) {
 const data = await this.kv.hgetall(this.getKey('feedbacks', id));
 if (data && Object.keys(data).length > 0) {
 feedbacks.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return feedbacks;
 }
 async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
 await this.init();
 const message: Message = {
 ...data,
 id: generateId(),
 createdAt: new Date(),
 };
 await this.kv.hset(this.getKey('messages', message.id), message);
 await this.kv.sadd('analytics:messages:ids', message.id);
 await this.kv.sadd(`analytics:sessions:${message.sessionId}:messages`, message.id);
 return message;
 }
 async getMessagesBySession(sessionId: string): Promise<Message[]> {
 await this.init();
 const messageIds = await this.kv.smembers(`analytics:sessions:${sessionId}:messages`);
 const messages: Message[] = [];
 for (const id of messageIds) {
 const data = await this.kv.hgetall(this.getKey('messages', id));
 if (data && Object.keys(data).length > 0) {
 messages.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return messages;
 }
 async getAllMessages(): Promise<Message[]> {
 await this.init();
 const ids = await this.kv.smembers('analytics:messages:ids');
 const messages: Message[] = [];
 for (const id of ids) {
 const data = await this.kv.hgetall(this.getKey('messages', id));
 if (data && Object.keys(data).length > 0) {
 messages.push({
 ...data,
 createdAt: new Date(data.createdAt),
 });
 }
 }
 return messages;
 }
}
// 获取存储适配器实例
let storageInstance: StorageAdapter | null = null;
function getStorage(): StorageAdapter {
 if (storageInstance)
 return storageInstance;
 // 判断是否在 Vercel 环境（使用 KV）
 const isVercel = process.env.VERCEL === '1' || process.env.KV_REST_API_URL;
 if (isVercel) {
 try {
 // 尝试导入 @vercel/kv 检查是否安装
 require.resolve('@vercel/kv');
 storageInstance = new KVStorageAdapter();
 }
 catch {
 // @vercel/kv 未安装，回退到文件存储
 console.warn('[Analytics] @vercel/kv not installed, falling back to file storage');
 storageInstance = new FileStorageAdapter();
 }
 }
 else {
 storageInstance = new FileStorageAdapter();
 }
 return storageInstance;
}
// 创建会话
export async function createSession(userId?: string): Promise<Session> {
 return getStorage().createSession(userId);
}
// 获取会话
export async function getSession(id: string): Promise<Session | undefined> {
 return getStorage().getSession(id);
}
// 创建事件
export async function createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Promise<Event> {
 return getStorage().createEvent(sessionId, type, payload);
}
// 获取会话的所有事件
export async function getEventsBySession(sessionId: string): Promise<Event[]> {
 return getStorage().getEventsBySession(sessionId);
}
// 创建生成记录
export async function createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation> {
 return getStorage().createGeneration(data);
}
// 更新生成记录
export async function updateGeneration(id: string, updates: Partial<Generation>): Promise<void> {
 return getStorage().updateGeneration(id, updates);
}
// 获取会话的所有生成记录
export async function getGenerationsBySession(sessionId: string): Promise<Generation[]> {
 return getStorage().getGenerationsBySession(sessionId);
}
// 创建反馈
export async function createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> {
 return getStorage().createFeedback(data);
}
// 获取会话的所有反馈
export async function getFeedbacksBySession(sessionId: string): Promise<Feedback[]> {
 return getStorage().getFeedbacksBySession(sessionId);
}
// 创建消息记录
export async function createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
 return getStorage().createMessage(data);
}
// 获取会话的所有消息
export async function getMessagesBySession(sessionId: string): Promise<Message[]> {
 return getStorage().getMessagesBySession(sessionId);
}
// 获取所有消息
export async function getAllMessages(): Promise<Message[]> {
 return getStorage().getAllMessages();
}
// 获取汇总数据
export async function getSummary(startDate?: Date, endDate?: Date): Promise<{
 totalSessions: number;
 totalEvents: number;
 totalGenerations: number;
 successfulGenerations: number;
 failedGenerations: number;
 totalFeedbacks: number;
 averageRating: number;
 averageDuration: number;
 topModels: {
 model: string;
 count: number;
 }[];
 topSizes: {
 size: string;
 count: number;
 }[];
 workflowDistribution: {
 workflow: string;
 count: number;
 }[];
}> {
 const sessions = await getStorage().getAllSessions();
 const events = await getStorage().getAllEvents();
 const generations = await getStorage().getAllGenerations();
 const feedbacks = await getStorage().getAllFeedbacks();
 // 按日期过滤
 const filterByDate = <T extends {
 createdAt: Date;
 }>(items: T[]): T[] => {
 if (!startDate && !endDate)
 return items;
 return items.filter(item => {
 const itemDate = item.createdAt;
 if (startDate && itemDate < startDate)
 return false;
 if (endDate && itemDate > endDate)
 return false;
 return true;
 });
 };
 const filteredGenerations = filterByDate(generations);
 const filteredFeedbacks = filterByDate(feedbacks);
 // 计算统计数据
 const totalSessions = sessions.length;
 const totalEvents = events.length;
 const totalGenerations = filteredGenerations.length;
 const successfulGenerations = filteredGenerations.filter(g => g.status === 'success').length;
 const failedGenerations = filteredGenerations.filter(g => g.status === 'failed').length;
 const totalFeedbacks = filteredFeedbacks.length;
 // 平均评分
 const ratings = filteredFeedbacks.filter(f => f.rating !== undefined).map(f => f.rating!);
 const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
 // 平均耗时
 const durations = filteredGenerations.filter(g => g.duration !== undefined).map(g => g.duration!);
 const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
 // 热门模型
 const modelCounts: Record<string, number> = {};
 filteredGenerations.forEach(g => {
 modelCounts[g.model] = (modelCounts[g.model] || 0) + 1;
 });
 const topModels = Object.entries(modelCounts)
 .map(([model, count]) => ({ model, count }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 5);
 // 热门尺寸
 const sizeCounts: Record<string, number> = {};
 filteredGenerations.forEach(g => {
 sizeCounts[g.size] = (sizeCounts[g.size] || 0) + 1;
 });
 const topSizes = Object.entries(sizeCounts)
 .map(([size, count]) => ({ size, count }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 5);
 // 工作流分布
 const workflowCounts: Record<string, number> = {};
 const workflowEvents = events.filter(e => e.type === 'workflow_switch');
 workflowEvents.forEach(e => {
 const workflow = e.payload.workflow as string || 'unknown';
 workflowCounts[workflow] = (workflowCounts[workflow] || 0) + 1;
 });
 const workflowDistribution = Object.entries(workflowCounts)
 .map(([workflow, count]) => ({ workflow, count }))
 .sort((a, b) => b.count - a.count);
 return {
 totalSessions,
 totalEvents,
 totalGenerations,
 successfulGenerations,
 failedGenerations,
 totalFeedbacks,
 averageRating: Math.round(averageRating * 10) / 10,
 averageDuration: Math.round(averageDuration),
 topModels,
 topSizes,
 workflowDistribution,
 };
}
// 获取生成记录列表（支持分页）
export async function getGenerations(page: number = 1, pageSize: number = 20, status?: string): Promise<{
 data: Generation[];
 total: number;
 totalPages: number;
}> {
 let generations = await getStorage().getAllGenerations();
 // 按状态过滤
 if (status) {
 generations = generations.filter(g => g.status === status);
 }
 // 按创建时间降序排序
 generations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
 // 分页
 const total = generations.length;
 const totalPages = Math.ceil(total / pageSize);
 const offset = (page - 1) * pageSize;
 const data = generations.slice(offset, offset + pageSize);
 return { data, total, totalPages };
}
// 获取反馈列表
export async function getFeedbacks(page: number = 1, pageSize: number = 20): Promise<{
 data: Feedback[];
 total: number;
 totalPages: number;
}> {
 let feedbacks = await getStorage().getAllFeedbacks();
 // 按创建时间降序排序
 feedbacks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
 // 分页
 const total = feedbacks.length;
 const totalPages = Math.ceil(total / pageSize);
 const offset = (page - 1) * pageSize;
 const data = feedbacks.slice(offset, offset + pageSize);
 return { data, total, totalPages };
}
// 获取事件统计
export async function getEventStats(startDate?: Date, endDate?: Date): Promise<{
 events: {
 type: string;
 count: number;
 }[];
 dailyStats: {
 date: string;
 count: number;
 }[];
}> {
 let events = await getStorage().getAllEvents();
 // 按日期过滤
 if (startDate || endDate) {
 events = events.filter(e => {
 if (startDate && e.createdAt < startDate)
 return false;
 if (endDate && e.createdAt > endDate)
 return false;
 return true;
 });
 }
 // 按类型统计
 const typeCounts: Record<string, number> = {};
 events.forEach(e => {
 typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
 });
 const eventTypes = Object.entries(typeCounts)
 .map(([type, count]) => ({ type, count }))
 .sort((a, b) => b.count - a.count);
 // 按日期统计
 const dailyCounts: Record<string, number> = {};
 events.forEach(e => {
 const dateStr = e.createdAt.toISOString().split('T')[0];
 dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
 });
 const dailyStats = Object.entries(dailyCounts)
 .map(([date, count]) => ({ date, count }))
 .sort((a, b) => a.date.localeCompare(b.date));
 return { events: eventTypes, dailyStats };
}
