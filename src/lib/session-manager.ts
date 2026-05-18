
export interface Session {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    imageUrls?: string[];
    userImages?: string[];
    product?: string;
    scene?: string;
    isGenerating?: boolean;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  model: string;
  size: string;
  quality: string;
  count: number;
  persona: string;
}

const SESSIONS_KEY = 'chat_sessions';
const PREFERENCES_KEY = 'chat_preferences';

const MAX_SESSIONS = 10;
const MAX_MESSAGES_PER_SESSION = 50;
const MAX_LOCALSTORAGE_SIZE = 4 * 1024 * 1024; // 4MB

export function createSession(title: string = '新会话'): Session {
  const now = Date.now();
  return {
    id: `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getSessions(): Session[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getLocalStorageUsed(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  return total;
}

function cleanupOldSessions(): void {
  let sessions = getSessions();
  
  if (sessions.length > MAX_SESSIONS) {
    sessions = sessions.slice(-MAX_SESSIONS);
  }
  
  sessions = sessions.map(session => ({
    ...session,
    messages: session.messages.slice(-MAX_MESSAGES_PER_SESSION)
  }));
  
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function trySaveToStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      cleanupOldSessions();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = { ...session, updatedAt: Date.now() };
  } else {
    sessions.push({ ...session, updatedAt: Date.now() });
  }
  
  const data = JSON.stringify(sessions);
  
  if (!trySaveToStorage(SESSIONS_KEY, data)) {
    console.warn('Failed to save session: localStorage quota exceeded');
  }
}

export function deleteSession(sessionId: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
}

export function clearAllSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

export function getDefaultPreferences(): UserPreferences {
  return {
    model: 'gpt-5-nano',
    size: '1024x1024',
    quality: 'high',
    count: 1,
    persona: 'default',
  };
}

export function getPreferences(): UserPreferences {
  try {
    const data = localStorage.getItem(PREFERENCES_KEY);
    return data ? { ...getDefaultPreferences(), ...JSON.parse(data) } : getDefaultPreferences();
  } catch {
    return getDefaultPreferences();
  }
}

export function savePreferences(preferences: Partial<UserPreferences>): void {
  const current = getPreferences();
  const updated = { ...current, ...preferences };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
}
