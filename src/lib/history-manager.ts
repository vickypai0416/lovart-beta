import { saveImageBlobFromUrl, getImageUrl, idbDeleteImageBlob } from './idb-storage';
import { ImageHistory } from './storage-keys';

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

  localStorage.setItem(ImageHistory.ECOMMERCE, JSON.stringify(history));

  if (item.url && !item.url.startsWith('data:')) {
    saveImageBlobFromUrl(newItem.id, item.url).catch((e) => {
      console.warn('[History] 保存图片 Blob 失败:', e);
    });
  }

  return newItem;
}

export function getHistory(): { sessions: GenerationSession[] } {
  const stored = localStorage.getItem(ImageHistory.ECOMMERCE);
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
  localStorage.setItem(ImageHistory.ECOMMERCE, JSON.stringify(history));
}

export async function deleteImage(imageId: string): Promise<void> {
  const history = getHistory();
  
  history.sessions.forEach(session => {
    session.images = session.images.filter(img => img.id !== imageId);
  });
  
  history.sessions = history.sessions.filter(s => s.images.length > 0);
  localStorage.setItem(ImageHistory.ECOMMERCE, JSON.stringify(history));
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearHistory(): Promise<void> {
  const history = getHistory();
  for (const session of history.sessions) {
    for (const img of session.images) {
      await idbDeleteImageBlob(img.id).catch(() => {});
    }
  }
  localStorage.removeItem(ImageHistory.ECOMMERCE);
}

export function getSessionById(sessionId: string): GenerationSession | undefined {
  const history = getHistory();
  return history.sessions.find(s => s.id === sessionId);
}

export interface ChatImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const CHAT_MAX_IMAGES = 50;

function toStorageSafeUrl(url: string): string {
  if (url.startsWith('data:')) {
    return '';
  }
  return url;
}

function safeSetChatHistory(history: ChatImageHistoryItem[]): void {
  try {
    localStorage.setItem(ImageHistory.CHAT, JSON.stringify(history));
    return;
  } catch {}

  const trimmed = [...history];
  while (trimmed.length > 0) {
    trimmed.pop();
    try {
      localStorage.setItem(ImageHistory.CHAT, JSON.stringify(trimmed));
      return;
    } catch {}
  }

  localStorage.removeItem(ImageHistory.CHAT);
}

export async function saveChatImageToHistory(url: string, prompt: string): Promise<ChatImageHistoryItem> {
  const history = getChatHistory();
  const newItem: ChatImageHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: toStorageSafeUrl(url),
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

  safeSetChatHistory(history);

  if (url && !url.startsWith('data:')) {
    saveImageBlobFromUrl(newItem.id, url).catch((e) => {
      console.warn('[ChatHistory] 保存图片 Blob 失败:', e);
    });
  }

  return newItem;
}

export function getChatHistory(): ChatImageHistoryItem[] {
  const stored = localStorage.getItem(ImageHistory.CHAT);
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
  safeSetChatHistory(filtered);
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearChatHistory(): Promise<void> {
  const history = getChatHistory();
  for (const img of history) {
    await idbDeleteImageBlob(img.id).catch(() => {});
  }
  localStorage.removeItem(ImageHistory.CHAT);
}

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  userImages?: string[];
  userImage?: string;
  product?: string;
  scene?: string;
  isAmazonPlan?: boolean;
  planImages?: Array<{
    index: number;
    title: string;
    prompt: string;
    imageUrl?: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
  }>;
  timestamp: number;
}

const MAX_PERSISTED_MESSAGES = 100;

function stripLargeDataUrls(messages: PersistedMessage[]): PersistedMessage[] {
  return messages.map((m) => ({
    ...m,
    userImages: m.userImages?.map((img) => (img.startsWith('data:') ? '' : img)).filter(Boolean),
    imageUrls: m.imageUrls?.map((img) => (img.startsWith('data:') ? '' : img)).filter(Boolean),
    planImages: m.planImages?.map((p) => ({
      ...p,
      imageUrl: p.imageUrl && p.imageUrl.startsWith('data:') ? undefined : p.imageUrl,
    })),
  }));
}

function safeSetChatMessages(messages: PersistedMessage[]): void {
  try {
    localStorage.setItem(ImageHistory.MESSAGES, JSON.stringify(messages));
    return;
  } catch {}

  const sanitized = stripLargeDataUrls(messages);
  try {
    localStorage.setItem(ImageHistory.MESSAGES, JSON.stringify(sanitized));
    return;
  } catch {}

  const trimmed = [...sanitized];
  while (trimmed.length > 0) {
    trimmed.pop();
    try {
      localStorage.setItem(ImageHistory.MESSAGES, JSON.stringify(trimmed));
      return;
    } catch {}
  }

  localStorage.removeItem(ImageHistory.MESSAGES);
}

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

  safeSetChatMessages(persistedMessages);
}

export function getChatMessages(): PersistedMessage[] {
  try {
    const stored = localStorage.getItem(ImageHistory.MESSAGES);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export {
  saveImageToHistory as saveImgGenHistory,
  getRecentImages as getImgGenHistoryWithUrls,
  deleteImage as deleteImgGenImage,
  clearHistory as clearImgGenHistory,
  ImageHistoryItem as ImgGenHistoryItem,
};
