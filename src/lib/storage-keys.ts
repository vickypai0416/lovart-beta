export namespace ChatSession {
  export const SESSIONS = 'chat_sessions';
  export const PREFERENCES = 'chat_preferences';
}

export namespace UserMemory {
  export const MEMORY = 'chat_memory';
  export const PREFERENCES = 'user_preferences';
  export const SUMMARY = 'conversation_summary';
}

export namespace ImageHistory {
  export const ECOMMERCE = 'ecommerce_image_history';
  export const CHAT = 'chat_image_history';
  export const MESSAGES = 'chat_messages_history';
}

export namespace Workflow {
  export const PROMPT_ANALYZER_STATE = 'prompt_analyzer_workflow_state';
  export const ECOMMERCE_LOGS = 'ecommerce_workflow_logs';
  export const ECOMMERCE_IMAGES = 'ecommerce_workflow_images';
  export const ECOMMERCE_HISTORY = 'ecommerce_workflow_history';
}

export namespace Amazon {
  export const PROMPT_HISTORY = 'amazon_prompt_history';
}

export namespace Analytics {
  export const SESSION_ID = 'analytics_session_id';
}

export type StorageKey = 
  | ChatSession.SESSIONS
  | ChatSession.PREFERENCES
  | UserMemory.MEMORY
  | UserMemory.PREFERENCES
  | UserMemory.SUMMARY
  | ImageHistory.ECOMMERCE
  | ImageHistory.CHAT
  | ImageHistory.MESSAGES
  | Workflow.PROMPT_ANALYZER_STATE
  | Workflow.ECOMMERCE_LOGS
  | Workflow.ECOMMERCE_IMAGES
  | Workflow.ECOMMERCE_HISTORY
  | Amazon.PROMPT_HISTORY
  | Analytics.SESSION_ID;

export type StorageKeyGroup = 
  | 'chat_session'
  | 'user_memory'
  | 'image_history'
  | 'workflow'
  | 'amazon'
  | 'analytics';

export function getStorageKeyGroup(key: StorageKey): StorageKeyGroup {
  if (key.startsWith('chat_sessions') || key.startsWith('chat_preferences')) return 'chat_session';
  if (key.startsWith('user_') || key.startsWith('chat_memory')) return 'user_memory';
  if (key.includes('image') || key === 'chat_messages_history') return 'image_history';
  if (key.includes('workflow')) return 'workflow';
  if (key.startsWith('amazon_')) return 'amazon';
  if (key.startsWith('analytics_')) return 'analytics';
  return 'chat_session';
}

export function isValidStorageKey(key: string): key is StorageKey {
  const allKeys: StorageKey[] = [
    ChatSession.SESSIONS,
    ChatSession.PREFERENCES,
    UserMemory.MEMORY,
    UserMemory.PREFERENCES,
    UserMemory.SUMMARY,
    ImageHistory.ECOMMERCE,
    ImageHistory.CHAT,
    ImageHistory.MESSAGES,
    Workflow.PROMPT_ANALYZER_STATE,
    Workflow.ECOMMERCE_LOGS,
    Workflow.ECOMMERCE_IMAGES,
    Workflow.ECOMMERCE_HISTORY,
    Amazon.PROMPT_HISTORY,
    Analytics.SESSION_ID,
  ];
  return allKeys.includes(key as StorageKey);
}