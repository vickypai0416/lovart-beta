import fs from 'fs';
import path from 'path';

// 数据存储目录
const DATA_DIR = path.join(process.cwd(), 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 获取文件路径
function getFilePath(type: string): string {
  return path.join(DATA_DIR, `${type}.json`);
}

// 读取数据
function readData<T>(type: string): T[] {
  const filePath = getFilePath(type);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    // 将 ISO 日期字符串转换为 Date 对象
    return data.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    })) as T[];
  } catch {
    return [];
  }
}

// 写入数据
function writeData<T>(type: string, data: T[]): void {
  const filePath = getFilePath(type);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 创建会话
export function createSession(userId?: string): Session {
  const session: Session = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  };
  const sessions = readData<Session>('sessions');
  sessions.push(session);
  writeData('sessions', sessions);
  return session;
}

// 获取会话
export function getSession(id: string): Session | undefined {
  const sessions = readData<Session>('sessions');
  return sessions.find(s => s.id === id);
}

// 创建事件
export function createEvent(sessionId: string, type: string, payload: Record<string, unknown>): Event {
  const event: Event = {
    id: generateId(),
    sessionId,
    type,
    payload,
    createdAt: new Date(),
  };
  const events = readData<Event>('events');
  events.push(event);
  writeData('events', events);
  return event;
}

// 获取会话的所有事件
export function getEventsBySession(sessionId: string): Event[] {
  const events = readData<Event>('events');
  return events.filter(e => e.sessionId === sessionId);
}

// 创建生成记录
export function createGeneration(data: Omit<Generation, 'id' | 'createdAt'>): Generation {
  const generation: Generation = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  };
  const generations = readData<Generation>('generations');
  generations.push(generation);
  writeData('generations', generations);
  return generation;
}

// 更新生成记录
export function updateGeneration(id: string, updates: Partial<Generation>): void {
  const generations = readData<Generation>('generations');
  const index = generations.findIndex(g => g.id === id);
  if (index !== -1) {
    generations[index] = { ...generations[index], ...updates };
    writeData('generations', generations);
  }
}

// 获取会话的所有生成记录
export function getGenerationsBySession(sessionId: string): Generation[] {
  const generations = readData<Generation>('generations');
  return generations.filter(g => g.sessionId === sessionId);
}

// 创建反馈
export function createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
  const feedback: Feedback = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  };
  const feedbacks = readData<Feedback>('feedbacks');
  feedbacks.push(feedback);
  writeData('feedbacks', feedbacks);
  return feedback;
}

// 获取会话的所有反馈
export function getFeedbacksBySession(sessionId: string): Feedback[] {
  const feedbacks = readData<Feedback>('feedbacks');
  return feedbacks.filter(f => f.sessionId === sessionId);
}

// 获取汇总数据
export function getSummary(startDate?: Date, endDate?: Date): {
  totalSessions: number;
  totalEvents: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalFeedbacks: number;
  averageRating: number;
  averageDuration: number;
  topModels: { model: string; count: number }[];
  topSizes: { size: string; count: number }[];
  workflowDistribution: { workflow: string; count: number }[];
} {
  const sessions = readData<Session>('sessions');
  const events = readData<Event>('events');
  const generations = readData<Generation>('generations');
  const feedbacks = readData<Feedback>('feedbacks');

  // 按日期过滤
  const filterByDate = <T extends { createdAt: Date }>(items: T[]): T[] => {
    if (!startDate && !endDate) return items;
    return items.filter(item => {
      const itemDate = item.createdAt;
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
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
export function getGenerations(page: number = 1, pageSize: number = 20, status?: string): {
  data: Generation[];
  total: number;
  totalPages: number;
} {
  let generations = readData<Generation>('generations');
  
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
export function getFeedbacks(page: number = 1, pageSize: number = 20): {
  data: Feedback[];
  total: number;
  totalPages: number;
} {
  let feedbacks = readData<Feedback>('feedbacks');
  
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
export function getEventStats(startDate?: Date, endDate?: Date): {
  events: { type: string; count: number }[];
  dailyStats: { date: string; count: number }[];
} {
  let events = readData<Event>('events');
  
  // 按日期过滤
  if (startDate || endDate) {
    events = events.filter(e => {
      if (startDate && e.createdAt < startDate) return false;
      if (endDate && e.createdAt > endDate) return false;
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