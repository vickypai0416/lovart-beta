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
const CHAT_MAX_IMAGES = 50;
const MAX_PERSISTED_MESSAGES = 100;
const STORAGE_USAGE_THRESHOLD = 0.8;
const STORAGE_CLEANUP_BATCH = 10;

function createImageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function toStorageSafeUrl(url?: string): string {
  if (!url) return '';
  return url.startsWith('data:') ? '' : url;
}

function writeEcommerceHistory(history: { sessions: GenerationSession[] }): void {
  try {
    localStorage.setItem(ImageHistory.ECOMMERCE, JSON.stringify(history));
  } catch (error) {
    console.warn('[History] 写入图片历史失败:', error);
  }
}


async function cleanupOldestImagesIfStorageNearQuota(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    if (!quota || usage / quota < STORAGE_USAGE_THRESHOLD) return;

    const history = getHistory();
    const chatHistory = getChatHistory();
    const candidates: Array<{ id: string; timestamp: number }> = [];

    history.sessions.forEach((session) => {
      session.images.forEach((img) => candidates.push({ id: img.id, timestamp: img.timestamp }));
    });
    chatHistory.forEach((img) => candidates.push({ id: img.id, timestamp: img.timestamp }));

    candidates.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = candidates.slice(0, STORAGE_CLEANUP_BATCH);
    if (toRemove.length === 0) return;

    const removeIds = new Set(toRemove.map((item) => item.id));

    history.sessions.forEach((session) => {
      session.images = session.images.filter((img) => !removeIds.has(img.id));
    });
    history.sessions = history.sessions.filter((session) => session.images.length > 0);
    writeEcommerceHistory(history);

    const filteredChatHistory = chatHistory.filter((img) => !removeIds.has(img.id));
    safeSetChatHistory(filteredChatHistory);

    await Promise.all(toRemove.map((item) => idbDeleteImageBlob(item.id).catch(() => {})));
    console.warn(`[History] 存储占用接近上限，已自动清理最旧的 ${toRemove.length} 张图片缓存`);
  } catch (error) {
    console.warn('[History] 检查存储占用失败:', error);
  }
}

export async function saveImageToHistory(item: Omit<ImageHistoryItem, 'id' | 'timestamp' | 'url'> & { url?: string }): Promise<ImageHistoryItem> {
  const history = getHistory();
  const newItem: ImageHistoryItem = {
    ...item,
    id: createImageId(),
    url: toStorageSafeUrl(item.url),
    timestamp: Date.now(),
  };

  if (item.url) {
    await cleanupOldestImagesIfStorageNearQuota();
    await saveImageBlobFromUrl(newItem.id, item.url).catch((error) => {
      console.warn('[History] 缓存电商图片失败，保留原始 URL:', error);
    });
  }

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

  writeEcommerceHistory(history);

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
    const url = await getImageUrl(img.id, img.url || '');
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
  writeEcommerceHistory(history);
}

export async function deleteImage(imageId: string): Promise<void> {
  const history = getHistory();
  
  history.sessions.forEach(session => {
    session.images = session.images.filter(img => img.id !== imageId);
  });
  
  history.sessions = history.sessions.filter(s => s.images.length > 0);
  writeEcommerceHistory(history);
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
    id: createImageId(),
    url: toStorageSafeUrl(url),
    prompt: prompt,
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

  if (url?.startsWith('data:')) {
    await saveImageBlobFromUrl(newItem.id, url).catch((error) => {
      console.warn('[History] 缓存聊天图片失败，保留原始 URL:', error);
    });
  } else if (url) {
    cleanupOldestImagesIfStorageNearQuota()
      .then(() => saveImageBlobFromUrl(newItem.id, url))
      .catch((error) => {
        console.warn('[History] 缓存聊天图片失败，保留原始 URL:', error);
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
    const parsed = JSON.parse(stored);
    // 确保返回的是数组
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getChatHistoryWithUrls(): Promise<ChatImageHistoryItem[]> {
  const history = getChatHistory();
  // 确保 history 是数组
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }
  const results = await Promise.all(
    history.filter(img => img && img.id).map(async (img) => {
      try {
        const url = await getImageUrl(img.id, img.url || '');
        return { ...img, url };
      } catch {
        // 如果获取 URL 失败，返回原始数据
        return img;
      }
    })
  );
  return results;
}

export async function deleteChatImage(imageId: string): Promise<void> {
  if (!imageId) return;
  const history = getChatHistory();
  // 确保 history 是数组
  if (!Array.isArray(history)) {
    localStorage.removeItem(ImageHistory.CHAT);
    return;
  }
  const filtered = history.filter(img => img && img.id !== imageId);
  safeSetChatHistory(filtered);
  await idbDeleteImageBlob(imageId).catch(() => {});
}

export async function clearChatHistory(): Promise<void> {
  const history = getChatHistory();
  // 确保 history 是数组
  if (!Array.isArray(history)) {
    localStorage.removeItem(ImageHistory.CHAT);
    return;
  }
  for (const img of history) {
    // 确保 img 和 img.id 存在
    if (img && img.id) {
      await idbDeleteImageBlob(img.id).catch(() => {});
    }
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
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'error';
  }>;
  timestamp: number;
}

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
};

export type { ImageHistoryItem as ImgGenHistoryItem };
