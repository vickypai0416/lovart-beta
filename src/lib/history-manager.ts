import { idbPut, idbGetAll, idbDelete, idbClear, STORES, saveImageBlobFromUrl, getImageUrl, idbDeleteImageBlob } from './idb-storage';

export interface ImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  productName: string;
  scene: string;
  platform: string;
  timestamp: number;
  size: string;
}

export interface GenerationSession {
  id: string;
  productName: string;
  scene: string;
  platform: string;
  images: ImageHistoryItem[];
  createdAt: number;
}

const STORAGE_KEY = 'ecommerce_image_history';
const MAX_SESSIONS = 20;
const MAX_IMAGES_PER_SESSION = 12;

export async function saveImageToHistory(item: Omit<ImageHistoryItem, 'id' | 'timestamp'>): Promise<ImageHistoryItem> {
  const history = getHistory();
  const newItem: ImageHistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  let currentSession = history.sessions.find(
    s => s.productName === item.productName && 
         s.scene === item.scene && 
         s.platform === item.platform &&
         Date.now() - s.createdAt < 30 * 60 * 1000
  );

  if (!currentSession) {
    currentSession = {
      id: `session-${Date.now()}`,
      productName: item.productName,
      scene: item.scene,
      platform: item.platform,
      images: [],
      createdAt: Date.now(),
    };
    history.sessions.unshift(currentSession);
  }

  if (currentSession.images.length < MAX_IMAGES_PER_SESSION) {
    currentSession.images.push(newItem);
  }

  if (history.sessions.length > MAX_SESSIONS) {
    const removedSessions = history.sessions.slice(MAX_SESSIONS);
    for (const session of removedSessions) {
      for (const img of session.images) {
        idbDeleteImageBlob(img.id).catch(() => {});
      }
    }
    history.sessions = history.sessions.slice(0, MAX_SESSIONS);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  if (item.url && !item.url.startsWith('data:')) {
    saveImageBlobFromUrl(newItem.id, item.url).catch((e) => {
      console.warn('[History] 保存图片 Blob 失败:', e);
    });
  }

  return newItem;
}

export function getHistory(): { sessions: GenerationSession[] } {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { sessions: [] };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { sessions: [] };
  }
}

export async function getRecentImages(limit: number = 20): Promise<ImageHistoryItem[]> {
  const history = getHistory();
  const allImages: ImageHistoryItem[] = [];
  
  history.sessions.forEach(session => {
    session.images.forEach(image => {
      allImages.push(image);
    });
  });

  const sorted = allImages.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

  return Promise.all(sorted.map(async (img) => {
    const url = await getImageUrl(img.id, img.url);
    return { ...img, url };
  }));
}

export async function deleteSession(sessionId: string): Promise<void> {
  const history = getHistory();
  const session = history.sessions.find(s => s.id === sessionId);
  if (session) {
    for (const img of session.images) {
      await idbDeleteImageBlob(img.id).catch(() => {});
    }
  }
  history.sessions = history.sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export async function deleteImage(imageId: string): Promise<void> {
  const history = getHistory();
  
  history.sessions.forEach(session => {
    session.images = session.images.filter(img => img.id !== imageId);
  });
  
  history.sessions = history.sessions.filter(s => s.images.length > 0);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearHistory(): Promise<void> {
  const history = getHistory();
  for (const session of history.sessions) {
    for (const img of session.images) {
      await idbDeleteImageBlob(img.id).catch(() => {});
    }
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function getSessionById(sessionId: string): GenerationSession | undefined {
  const history = getHistory();
  return history.sessions.find(s => s.id === sessionId);
}

// ==================== 对话助手图片历史记录 ====================

export interface ChatImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const CHAT_STORAGE_KEY = 'chat_image_history';
const CHAT_MAX_IMAGES = 50;

export async function saveChatImageToHistory(url: string, prompt: string): Promise<ChatImageHistoryItem> {
  const history = getChatHistory();
  const newItem: ChatImageHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    timestamp: Date.now(),
  };

  history.unshift(newItem);
  
  if (history.length > CHAT_MAX_IMAGES) {
    const removed = history.slice(CHAT_MAX_IMAGES);
    for (const img of removed) {
      idbDeleteImageBlob(img.id).catch(() => {});
    }
    history.length = CHAT_MAX_IMAGES;
  }

  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));

  if (url && !url.startsWith('data:')) {
    saveImageBlobFromUrl(newItem.id, url).catch((e) => {
      console.warn('[ChatHistory] 保存图片 Blob 失败:', e);
    });
  }

  return newItem;
}

export function getChatHistory(): ChatImageHistoryItem[] {
  const stored = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getChatHistoryWithUrls(): Promise<ChatImageHistoryItem[]> {
  const history = getChatHistory();
  return Promise.all(history.map(async (img) => {
    const url = await getImageUrl(img.id, img.url);
    return { ...img, url };
  }));
}

export async function deleteChatImage(imageId: string): Promise<void> {
  const history = getChatHistory();
  const filtered = history.filter(img => img.id !== imageId);
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearChatHistory(): Promise<void> {
  const history = getChatHistory();
  for (const img of history) {
    await idbDeleteImageBlob(img.id).catch(() => {});
  }
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

// ==================== 聊天消息持久化 ====================

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  userImages?: string[];
  userImage?: string;
  product?: string;
  scene?: string;
  timestamp: number;
}

const CHAT_MESSAGES_KEY = 'chat_messages_history';
const MAX_PERSISTED_MESSAGES = 100;

export async function saveChatMessages(messages: Omit<PersistedMessage, 'timestamp'>[]): Promise<void> {
  const persistedMessages: PersistedMessage[] = messages
    .filter(m => m.id !== 'welcome')
    .map(m => ({
      ...m,
      timestamp: Date.now(),
    }));

  if (persistedMessages.length > MAX_PERSISTED_MESSAGES) {
    persistedMessages.length = MAX_PERSISTED_MESSAGES;
  }

  try {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(persistedMessages));
  } catch (e) {
    console.warn('[ChatMessages] 保存聊天记录失败:', e);
    try {
      const oldData = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (oldData) {
        const oldMessages: PersistedMessage[] = JSON.parse(oldData);
        const merged = [...persistedMessages, ...oldMessages];
        const uniqueMap = new Map<string, PersistedMessage>();
        merged.forEach(m => uniqueMap.set(m.id, m));
        const uniqueMessages = Array.from(uniqueMap.values()).slice(0, MAX_PERSISTED_MESSAGES);
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(uniqueMessages));
      }
    } catch {
      console.warn('[ChatMessages] 合并聊天记录也失败');
    }
  }
}

export function getChatMessages(): PersistedMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function clearChatMessages(): void {
  localStorage.removeItem(CHAT_MESSAGES_KEY);
}

// ==================== 图片生成器历史记录 ====================

export interface ImgGenHistoryItem {
  id: string;
  url: string;
  prompt: string;
  size: string;
  model: string;
  timestamp: number;
}

const IMGGEN_STORAGE_KEY = 'imggen_image_history';
const IMGGEN_MAX_IMAGES = 50;

export async function saveImgGenHistory(url: string, prompt: string, size: string, model: string): Promise<ImgGenHistoryItem> {
  const history = getImgGenHistory();
  const newItem: ImgGenHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
    size,
    model,
    timestamp: Date.now(),
  };

  history.unshift(newItem);

  if (history.length > IMGGEN_MAX_IMAGES) {
    const removed = history.slice(IMGGEN_MAX_IMAGES);
    for (const img of removed) {
      idbDeleteImageBlob(img.id).catch(() => {});
    }
    history.length = IMGGEN_MAX_IMAGES;
  }

  localStorage.setItem(IMGGEN_STORAGE_KEY, JSON.stringify(history));

  if (url && !url.startsWith('data:')) {
    saveImageBlobFromUrl(newItem.id, url).catch((e) => {
      console.warn('[ImgGenHistory] 保存图片 Blob 失败:', e);
    });
  }

  return newItem;
}

export function getImgGenHistory(): ImgGenHistoryItem[] {
  const stored = localStorage.getItem(IMGGEN_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getImgGenHistoryWithUrls(): Promise<ImgGenHistoryItem[]> {
  const history = getImgGenHistory();
  return Promise.all(history.map(async (img) => {
    const url = await getImageUrl(img.id, img.url);
    return { ...img, url };
  }));
}

export async function deleteImgGenImage(imageId: string): Promise<void> {
  const history = getImgGenHistory();
  const filtered = history.filter(img => img.id !== imageId);
  localStorage.setItem(IMGGEN_STORAGE_KEY, JSON.stringify(filtered));
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearImgGenHistory(): Promise<void> {
  const history = getImgGenHistory();
  for (const img of history) {
    await idbDeleteImageBlob(img.id).catch(() => {});
  }
  localStorage.removeItem(IMGGEN_STORAGE_KEY);
}
