
import { UserMemory } from './storage-keys';

export interface MemoryEntry {
  id: string;
  type: 'preference' | 'product' | 'scene' | 'summary' | 'context';
  key: string;
  value: any;
  timestamp: number;
  expiresAt?: number;
}

export interface ConversationSummary {
  id: string;
  messages: MessageReference[];
  summary: string;
  keyPoints: string[];
  timestamp: number;
}

export interface MessageReference {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
}

export function getMemory(): MemoryEntry[] {
  try {
    const data = localStorage.getItem(UserMemory.MEMORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveMemory(entry: MemoryEntry): void {
  try {
    const memory = getMemory();
    const existingIndex = memory.findIndex(m => m.type === entry.type && m.key === entry.key);
    if (existingIndex >= 0) {
      memory[existingIndex] = entry;
    } else {
      memory.push(entry);
    }
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('[Memory] Failed to save:', e);
  }
}

export function getMemoryByType(type: MemoryEntry['type']): MemoryEntry[] {
  const memory = getMemory();
  const now = Date.now();
  return memory.filter(m => m.type === type && (!m.expiresAt || m.expiresAt > now));
}

export function getMemoryByKey(type: MemoryEntry['type'], key: string): MemoryEntry | undefined {
  const memory = getMemory();
  const now = Date.now();
  return memory.find(m => m.type === type && m.key === key && (!m.expiresAt || m.expiresAt > now));
}

export function deleteMemory(type: MemoryEntry['type'], key: string): void {
  try {
    const memory = getMemory();
    const filtered = memory.filter(m => !(m.type === type && m.key === key));
    localStorage.setItem(MEMORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[Memory] Failed to delete:', e);
  }
}

export function clearMemory(): void {
  try {
    localStorage.removeItem(UserMemory.MEMORY);
    localStorage.removeItem(UserMemory.PREFERENCES);
    localStorage.removeItem(UserMemory.SUMMARY);
  } catch (e) {
    console.error('[Memory] Failed to clear:', e);
  }
}

export interface UserPreferences {
  defaultModel: string;
  defaultSize: string;
  defaultQuality: string;
  defaultCount: number;
  defaultPersona: string;
  imageMode: 'generate' | 'analyze';
  autoGenerate: boolean;
}

export function getPreferences(): UserPreferences {
  try {
    const data = localStorage.getItem(UserMemory.PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Preferences] Failed to load:', e);
  }
  return {
    defaultModel: 'gpt-5-nano',
    defaultSize: '1024x1024',
    defaultQuality: 'high',
    defaultCount: 1,
    defaultPersona: 'default',
    imageMode: 'generate',
    autoGenerate: false,
  };
}

export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(UserMemory.PREFERENCES, JSON.stringify(preferences));
  } catch (e) {
    console.error('[Preferences] Failed to save:', e);
  }
}

export function updatePreferences(updates: Partial<UserPreferences>): void {
  const current = getPreferences();
  const updated = { ...current, ...updates };
  savePreferences(updated);
}

export function getConversationSummary(): ConversationSummary | null {
  try {
    const data = localStorage.getItem(UserMemory.SUMMARY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('[Summary] Failed to load:', e);
    return null;
  }
}

export function saveConversationSummary(summary: ConversationSummary): void {
  try {
    localStorage.setItem(UserMemory.SUMMARY, JSON.stringify(summary));
  } catch (e) {
    console.error('[Summary] Failed to save:', e);
  }
}

export function clearConversationSummary(): void {
  try {
    localStorage.removeItem(UserMemory.SUMMARY);
  } catch (e) {
    console.error('[Summary] Failed to clear:', e);
  }
}

export function rememberProduct(productName: string, details?: Record<string, any>): void {
  const entry: MemoryEntry = {
    id: `product-${productName}-${Date.now()}`,
    type: 'product',
    key: productName.toLowerCase(),
    value: {
      name: productName,
      details,
      mentions: 1,
      lastMentioned: Date.now(),
    },
    timestamp: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, 
  };
  saveMemory(entry);
}

export function rememberScene(sceneName: string): void {
  const entry: MemoryEntry = {
    id: `scene-${sceneName}-${Date.now()}`,
    type: 'scene',
    key: sceneName.toLowerCase(),
    value: {
      name: sceneName,
      mentions: 1,
      lastMentioned: Date.now(),
    },
    timestamp: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  saveMemory(entry);
}

export function rememberContext(key: string, value: any, expiresInMs?: number): void {
  const entry: MemoryEntry = {
    id: `context-${key}-${Date.now()}`,
    type: 'context',
    key,
    value,
    timestamp: Date.now(),
    expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined,
  };
  saveMemory(entry);
}

export function getRememberedProducts(): Array<{ name: string; details?: any; mentions: number; lastMentioned: number }> {
  const entries = getMemoryByType('product');
  return entries.map(e => e.value);
}

export function getRememberedScenes(): Array<{ name: string; mentions: number; lastMentioned: number }> {
  const entries = getMemoryByType('scene');
  return entries.map(e => e.value);
}

export function buildMemoryPrompt(messages: Array<{ role: string; content: string }>, maxTokens: number = 2000): string {
  const products = getRememberedProducts();
  const scenes = getRememberedScenes();
  const summary = getConversationSummary();
  
  let memoryContext = '';
  
  if (products.length > 0) {
    const productList = products.slice(0, 5).map(p => p.name).join(', ');
    memoryContext += `用户之前讨论过的产品：${productList}\n`;
  }
  
  if (scenes.length > 0) {
    const sceneList = scenes.slice(0, 5).map(s => s.name).join(', ');
    memoryContext += `用户之前提到的场景：${sceneList}\n`;
  }
  
  if (summary) {
    memoryContext += `对话摘要：${summary.summary}\n`;
  }
  
  const recentMessages = messages.slice(-10);
  const messageHistory = recentMessages.map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`).join('\n');
  
  let combined = '';
  if (memoryContext) {
    combined += `记忆信息：\n${memoryContext}\n\n`;
  }
  combined += `对话历史：\n${messageHistory}`;
  
  const avgCharsPerToken = 4;
  const maxChars = maxTokens * avgCharsPerToken;
  if (combined.length > maxChars) {
    combined = combined.substring(0, maxChars - 3) + '...';
  }
  
  return combined;
}

export async function generateSummary(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (messages.length < 5) {
    return '';
  }
  
  const recentMessages = messages.slice(-20);
  const messageText = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `请总结以下对话内容，提取关键点：\n\n${messageText}\n\n总结要求：\n1. 简短扼要（不超过100字）\n2. 包含讨论的主要产品、场景、主题\n3. 使用中文`
        }],
        model: 'gpt-5-nano',
      }),
    });
    
    if (!response.ok) {
      throw new Error('总结生成失败');
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应');
    }
    
    const decoder = new TextDecoder();
    let summary = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text' && data.content) {
              summary += data.content;
            }
          } catch {}
        }
      }
    }
    
    return summary.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    return '';
  }
}
