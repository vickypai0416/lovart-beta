'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useReducer } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Bot, User, Sparkles, Loader2, X, Image as ImageIcon, Upload, Square, LayoutGrid, Search, Download, Trash2, ArrowUp, Paperclip, RefreshCw, Copy, Wand2, Plus, Gem, Calculator, Grid3X3, Crown } from 'lucide-react';
import { saveChatImageToHistory, getChatHistory, getChatHistoryWithUrls, deleteChatImage, clearChatHistory, ChatImageHistoryItem, saveChatMessages, getChatMessages } from '@/lib/history-manager';
import { getImageUrl } from '@/lib/idb-storage';
import { PERSONAS, PersonaConfig } from '@/lib/persona';
import { AMAZON_9_GRID_PROMPT } from '@/lib/amazon/grid-prompt';

import ImageGeneratorWorkflow from '@/components/workflows/ImageGeneratorWorkflow';
import DeepEcommerceWorkflow from '@/components/deep-workflow/DeepEcommerceWorkflow';
import PromptAnalyzerWorkflow from '@/components/workflows/PromptAnalyzerWorkflow';
import ToolboxWorkflow from '@/components/workflows/ToolboxWorkflow';
import ProductDetailWorkflow from '@/components/workflows/ProductDetailWorkflow';
import GptImage2VipWorkflow from '@/components/workflows/GptImage2VipWorkflow';
import AnnouncementBar, { WorkflowType } from '@/components/AnnouncementBar';
import { downloadImageByUrl } from '@/lib/download';
import { Session, createSession, getSessions, saveSession, deleteSession } from '@/lib/session-manager';
import ErrorBoundary from '@/components/ErrorBoundary';
import ChatSessionList from '@/components/ChatSessionList';
import ChatMessages from '@/components/ChatMessages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  userImages?: string[];
  product?: string;
  scene?: string;
  isGenerating?: boolean;
  isAmazonPlan?: boolean;
  planImages?: GeneratedImagePlan[];
}

interface GeneratedImagePlan {
  index: number;
  title: string;
  prompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'error';
  error?: string;
}

type ImageModelId = 'gpt-image-2' | 'gpt-image-2-gen' | 'gpt-image-2-edit';
type TextModelId = 'gpt-5-nano' | 'gpt-5.4';
type ImageMode = 'generate' | 'analyze';

type ChatState = {
  sessions: Session[];
  currentSessionId: string | null;
};

type ChatAction =
  | { type: 'INIT_SESSIONS'; sessions: Session[]; currentSessionId: string }
  | { type: 'CREATE_SESSION'; session: Session }
  | { type: 'SWITCH_SESSION'; sessionId: string }
  | { type: 'DELETE_SESSION'; sessionId: string }
  | { type: 'UPDATE_SESSION'; sessionId: string; updatedSession: Session };

function areSessionMessagesEqual(a: Session['messages'], b: Session['messages']): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'INIT_SESSIONS':
      return { sessions: action.sessions, currentSessionId: action.currentSessionId };
    case 'CREATE_SESSION':
      return { sessions: [...state.sessions, action.session], currentSessionId: action.session.id };
    case 'SWITCH_SESSION':
      return { ...state, currentSessionId: action.sessionId };
    case 'DELETE_SESSION': {
      const updatedSessions = state.sessions.filter(s => s.id !== action.sessionId);
      const newCurrentId = state.currentSessionId === action.sessionId && updatedSessions.length > 0
        ? updatedSessions[updatedSessions.length - 1].id
        : state.currentSessionId;
      return { sessions: updatedSessions, currentSessionId: newCurrentId };
    }
    case 'UPDATE_SESSION': {
      const existingSession = state.sessions.find(s => s.id === action.sessionId);
      if (
        existingSession &&
        existingSession.title === action.updatedSession.title &&
        areSessionMessagesEqual(existingSession.messages, action.updatedSession.messages)
      ) {
        return state;
      }

      return {
        ...state,
        sessions: state.sessions.map(s => s.id === action.sessionId ? action.updatedSession : s),
      };
    }
    default:
      return state;
  }
}

export default function Home() {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowType>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
    },
  ]);

  useEffect(() => {
    const persisted = getChatMessages();
    if (persisted.length > 0) {
      const migrated = persisted.map((m): Message => {
        const userImages = m.userImages || (m.userImage ? [m.userImage] : undefined);
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls,
          userImages,
          product: m.product,
          scene: m.scene,
          isAmazonPlan: m.isAmazonPlan,
          planImages: m.planImages,
        };
      });
      setMessages(prev => [prev[0], ...migrated]);
    }
  }, []);

  // 自动保存对话消息到 localStorage
  useEffect(() => {
    // 排除欢迎消息，只保存用户和助手的对话
    const messagesToSave = messages.filter(m => m.id !== 'welcome');
    if (messagesToSave.length > 0) {
      saveChatMessages(messagesToSave);
    }
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ImageModelId | TextModelId>('gpt-5-nano');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [selectedCount, setSelectedCount] = useState(1);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [showImageHistory, setShowImageHistory] = useState(false);
  const [imageMode, setImageMode] = useState<ImageMode>('generate');
  const [confirmingClearHistory, setConfirmingClearHistory] = useState(false);
  const [chatImageHistory, setChatImageHistory] = useState<ChatImageHistoryItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>('amazon-expert');
  // 多模板管理状态
  const [gridTemplates, setGridTemplates] = useState<Array<{ key: string; name: string; content: string; description?: string }>>([
    { key: 'default', name: '默认模板', content: AMAZON_9_GRID_PROMPT, description: 'Amazon Listing 九宫格套图通用导演级框架' }
  ]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('default');
  const [amazonGridTemplate, setAmazonGridTemplate] = useState<string>(AMAZON_9_GRID_PROMPT);
  const [showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);
  const [showTemplateManager, setShowTemplateManager] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateContent, setNewTemplateContent] = useState<string>('');
  const [templateMessage, setTemplateMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmingDeleteTemplateKey, setConfirmingDeleteTemplateKey] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);
  const [chatState, dispatchChat] = useReducer(chatReducer, { sessions: [], currentSessionId: null });
  const { sessions, currentSessionId } = chatState;
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 使用 ref 存储最新的状态值，避免闭包问题
  const sessionsRef = useRef<Session[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const userImagesRef = useRef<string[]>([]);
  const amazonGridTemplateRef = useRef<string>(AMAZON_9_GRID_PROMPT);
  
  // 组件挂载状态，用于防止卸载后更新状态
  const isMounted = useRef(true);
  
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    userImagesRef.current = userImages;
  }, [userImages]);

  // 从服务器获取所有模板预设
  useEffect(() => {
    const fetchServerTemplates = async () => {
      try {
        const response = await fetch('/api/grid-template');
        const data = await response.json();

        if (data.success && data.presets && data.presets.length > 0) {
          console.log('[AmazonGridTemplate] Loaded templates from server:', data.presets.length);
          const templates = data.presets.map((p: { key: string; name: string; content: string; description?: string }) => ({
            key: p.key,
            name: p.name,
            content: p.content,
            description: p.description,
          }));
          setGridTemplates(templates);

          // 设置当前选中的模板
          const defaultTemplate = templates.find((t: { key: string }) => t.key === 'default') || templates[0];
          setSelectedTemplateKey(defaultTemplate.key);
          setAmazonGridTemplate(defaultTemplate.content);
        } else {
          console.log('[AmazonGridTemplate] Using built-in default template');
        }
      } catch (error) {
        console.error('[AmazonGridTemplate] Failed to load from server:', error);
      }
    };

    fetchServerTemplates();
  }, []);

  // 当选择不同模板时更新当前模板内容
  useEffect(() => {
    const selected = gridTemplates.find(t => t.key === selectedTemplateKey);
    if (selected) {
      setAmazonGridTemplate(selected.content);
    }
  }, [selectedTemplateKey, gridTemplates]);

  useEffect(() => {
    amazonGridTemplateRef.current = amazonGridTemplate;
    console.log('[AmazonGridTemplate] Updated:', {
      length: amazonGridTemplate.length,
      isDefault: amazonGridTemplate === AMAZON_9_GRID_PROMPT,
      preview: amazonGridTemplate.substring(0, 100) + '...',
    });
  }, [amazonGridTemplate]);

  useEffect(() => {
    if (!templateMessage) return;
    const timeoutId = setTimeout(() => {
      setTemplateMessage(null);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [templateMessage]);

  useEffect(() => {
    if (!confirmingDeleteTemplateKey) return;
    const timeoutId = setTimeout(() => {
      setConfirmingDeleteTemplateKey(null);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [confirmingDeleteTemplateKey]);

  const { trackGeneration, updateGeneration, trackMessage, isInitialized } = useAnalytics();
  const generationIdRef = useRef<string | null>(null);
  const requestStartTimeRef = useRef<number>(0);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('Copy failed:', e);
      }
      document.body.removeChild(textarea);
    }
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNewMessageRef = useRef(false);

  // 组件卸载时取消所有正在进行的请求
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    getChatHistoryWithUrls().then(setChatImageHistory);
  }, []);

  useEffect(() => {
    const loadedSessions = getSessions();
    if (loadedSessions.length === 0) {
      const newSession = createSession();
      saveSession(newSession);
      dispatchChat({ type: 'INIT_SESSIONS', sessions: [newSession], currentSessionId: newSession.id });
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
        },
      ]);
    } else {
      const lastSession = loadedSessions[loadedSessions.length - 1];
      dispatchChat({ type: 'INIT_SESSIONS', sessions: loadedSessions, currentSessionId: lastSession.id });
      if (lastSession.messages.length > 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
          },
          ...lastSession.messages,
        ]);
      }
    }
  }, []);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = parseInt(savedPosition, 10);
        }
      });
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (scrollRef.current) {
        sessionStorage.setItem('scrollPosition', scrollRef.current.scrollTop.toString());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const createNewSession = useCallback(() => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const newSession = createSession();
    dispatchChat({ type: 'CREATE_SESSION', session: newSession });
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
      },
    ]);
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const session = sessionsRef.current.find(s => s.id === sessionId);
    if (session) {
      dispatchChat({ type: 'SWITCH_SESSION', sessionId });
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
        },
        ...session.messages,
      ]);
    }
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (!isMounted.current) return;
    
    const currentSessions = sessionsRef.current;
    if (currentSessions.length <= 1) {
      console.warn('至少需要保留一个会话');
      return;
    }
    
    // 立即取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const updatedSessions = currentSessions.filter(s => s.id !== sessionId);
    const needSwitchMessages = currentSessionIdRef.current === sessionId && updatedSessions.length > 0;
    const newSession = needSwitchMessages ? updatedSessions[updatedSessions.length - 1] : null;
    
    dispatchChat({ type: 'DELETE_SESSION', sessionId });
    
    if (newSession) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 AI 商品图生成助手 ✨\n\n告诉我商品和场景，或上传产品图，帮你生成专业图片。',
        },
        ...newSession.messages,
      ]);
    }
    
    setTimeout(() => {
      deleteSession(sessionId);
    }, 0);
  }, []);

  const updateCurrentSession = useCallback(() => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    const session = sessionsRef.current.find(s => s.id === sessionId);
    if (!session) return;

    const userMessages = messagesRef.current.filter(m => m.id !== 'welcome');
    const title = userMessages.length > 0
      ? userMessages[0].content.substring(0, 30) + (userMessages[0].content.length > 30 ? '...' : '')
      : '新会话';

    if (session.title === title && areSessionMessagesEqual(session.messages, userMessages)) {
      return;
    }

    const updatedSession = {
      ...session,
      messages: userMessages,
      title,
    };
    saveSession(updatedSession);
    dispatchChat({ type: 'UPDATE_SESSION', sessionId, updatedSession });
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentSessionIdRef.current && sessionsRef.current.some(s => s.id === currentSessionIdRef.current)) {
        updateCurrentSession();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, updateCurrentSession]);

  const handleSaveChatImage = async (url: string, prompt: string, messageId?: string) => {
    try {
      const item = await saveChatImageToHistory(url, prompt);
      const updated = await getChatHistoryWithUrls();
      setChatImageHistory(updated);
      const persistedUrl = await getImageUrl(item.id, url);
      if (messageId) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          const urls = m.imageUrls || [];
          const idx = urls.indexOf(url);
          if (idx >= 0) {
            const newUrls = [...urls];
            newUrls[idx] = persistedUrl;
            return { ...m, imageUrls: newUrls };
          }
          return m;
        }));
      }
    } catch (error) {
      console.warn('[Chat Image] 保存图片历史失败，保留当前消息图片:', error);
    }
  };

  const formatGenerationError = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return '未知错误';
    }
  };

  const recoverGeneratedImage = async (clientRequestId: string): Promise<string | null> => {
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch(`/api/generate/status?clientRequestId=${encodeURIComponent(clientRequestId)}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.url) return data.url;
          if (data.status === 'failed') throw new Error(data.error || '图片生成失败');
        }
      } catch (error) {
        console.warn('[Generate Recovery] 查询生成状态失败:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return null;
  };

  const recoverChatGeneratedImage = async (clientRequestId: string): Promise<string | null> => {
    for (let i = 0; i < 17; i++) {
      try {
        const response = await fetch(`/api/generate/status?clientRequestId=${encodeURIComponent(clientRequestId)}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.url) return data.url;
          if (data.status === 'failed') throw new Error(data.error || '图片生成失败');
        }
      } catch (error) {
        console.warn('[Chat Recovery] 查询生成状态失败:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    return null;
  };

  const handleDeleteChatImage = async (imageId: string) => {
    await deleteChatImage(imageId);
    const updated = await getChatHistoryWithUrls();
    setChatImageHistory(updated);
  };

  useEffect(() => {
    if (!confirmingClearHistory) return;
    const timeoutId = setTimeout(() => {
      setConfirmingClearHistory(false);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [confirmingClearHistory]);

  const handleClearChatHistory = async () => {
    if (!confirmingClearHistory) {
      setConfirmingClearHistory(true);
      return;
    }

    try {
      await clearChatHistory();
      setChatImageHistory([]);
    } catch (error) {
      console.error('[handleClearChatHistory] Error:', error);
      // 即使出错也清空本地状态
      setChatImageHistory([]);
    } finally {
      setConfirmingClearHistory(false);
    }
  };

  const checkImageUrl = async (url: string, maxRetries: number = 3, delayMs: number = 2000): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const controller = new AbortController();
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (response.ok) return true;
      } catch {
        // 忽略错误，继续重试
      }
      if (i < maxRetries - 1) {
        console.log(`[Image Check] 图片 URL 不可访问，重试 ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    return false;
  };

  const isAmazonVisualPlan = (content: string): boolean => {
  const normalized = content.replace(/[-–—]/g, '-');
  return normalized.includes('6图亚马逊视觉方案') || 
         normalized.includes('9图亚马逊视觉方案') ||
         normalized.includes('Image 1 -') ||
         normalized.includes('亚马逊定制商品视觉方案');
};

const parseAmazonVisualPlan = (content: string): GeneratedImagePlan[] => {
  const plans: GeneratedImagePlan[] = [];
  const normalized = content.replace(/[-–—]/g, '-');
  
  for (let i = 1; i <= 9; i++) {
    const regex = new RegExp(`[Ii]mage\\s*${i}\\s*[-:]\\s*([\\s\\S]*?)(?=[Ii]mage\\s*${i + 1}\\s*[-:]|$)`);
    const match = normalized.match(regex);
    if (match) {
      const planContent = match[1].trim();
      const titleMatch = planContent.match(/^([^\n]+)/);
      const compositionMatch = planContent.match(/构图[：:]([\s\S]*?)(?=风格[：:]|$)/);
      
      const title = titleMatch ? titleMatch[1].trim() : `图${i}`;
      let prompt = compositionMatch ? compositionMatch[1].trim().replace(/\n/g, ' ') : '';
      
      if (!prompt) {
        prompt = `专业亚马逊产品摄影，${title}，cinematic commercial photography风格`;
      } else {
        prompt = `专业亚马逊产品摄影，${title}，${prompt}，cinematic commercial photography风格`;
      }
      
      plans.push({
        index: i,
        title,
        prompt,
        status: 'pending',
      });
    }
  }
  
  return plans;
};

const isSelectiveGenerationRequest = (content: string): { match: boolean; indices: number[] } => {
  const patterns = [
    /生成第(\d+)张图/,
    /生成第(\d+)张/,
    /生成图(\d+)/,
    /只生成第(\d+)张/,
    /只要第(\d+)张/,
    /请生成第(\d+)张/,
    /生成第(\d+)张图片/,
  ];
  
  const indices: number[] = [];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const idx = parseInt(match[1]);
      if (idx >= 1 && idx <= 9) {
        indices.push(idx);
      }
    }
  }
  
  return {
    match: indices.length > 0,
    indices: [...new Set(indices)],
  };
};

const parseAmazonPlan = (content: string): GeneratedImagePlan[] => {
  const plans: GeneratedImagePlan[] = [];
  const normalized = content.replace(/[-–—]/g, '-');
  const imagePattern = /Image (\d+) - ([^\n]+)\n用途[：:]([^\n]+)\n构图[：:]\n((?:- [^\n]+\n?)+)(?:风格[：:]([^\n]+))?/g;
  
  let match;
  while ((match = imagePattern.exec(normalized)) !== null) {
    const index = parseInt(match[1]);
    const title = match[2].trim();
    const purpose = match[3].trim();
    const composition = match[4].trim();
    const style = match[5]?.trim() || '';
    
    const prompt = `Professional product photography for Amazon listing, ${title}, ${purpose}, ${composition.replace(/\n-/g, ', ')}, ${style}, cinematic lighting, premium quality, high-end commercial photography`;
    
    plans.push({
      index,
      title,
      prompt,
      status: 'pending' as const,
    });
  }
  
  return plans;
};

const isAmazonPlanResponse = (content: string, persona: string): boolean => {
  if (persona !== 'amazon-expert') return false;
  const normalized = content.replace(/[-–—]/g, '-');
  return normalized.includes('6图亚马逊视觉方案') || 
         normalized.includes('9图亚马逊视觉方案') ||
         normalized.includes('Image 1 -') || 
         normalized.includes('亚马逊定制商品视觉方案');
};

const getLastAmazonPlan = (): { planImages: GeneratedImagePlan[], userImage: string } | undefined => {
  const reversedMessages = [...messagesRef.current].reverse();
  
  console.log('[getLastAmazonPlan] Searching for Amazon plan in', reversedMessages.length, 'messages');
  
  let lastUserImage: string | undefined;
  for (const msg of reversedMessages) {
    if (msg.role === 'user' && msg.userImages && msg.userImages.length > 0) {
      lastUserImage = msg.userImages[0];
      console.log('[getLastAmazonPlan] Found user image, length:', lastUserImage.length);
      break;
    }
  }
  
  for (const msg of reversedMessages) {
    console.log('[getLastAmazonPlan] Checking message:', msg.id, 'isAmazonPlan:', msg.isAmazonPlan, 'planImages length:', msg.planImages?.length);
    if (msg.planImages && msg.planImages.length > 0) {
      console.log('[getLastAmazonPlan] Found Amazon plan with', msg.planImages.length, 'images, hasUserImage:', !!lastUserImage);
      return {
        planImages: msg.planImages,
        userImage: lastUserImage || '',
      };
    }
    if (msg.role === 'assistant' && isAmazonVisualPlan(msg.content)) {
      const planImages = parseAmazonVisualPlan(msg.content);
      if (planImages.length > 0) {
        console.log('[getLastAmazonPlan] Re-parsed Amazon plan from content with', planImages.length, 'images, hasUserImage:', !!lastUserImage);
        return {
          planImages,
          userImage: lastUserImage || '',
        };
      }
    }
  }
  console.log('[getLastAmazonPlan] No Amazon plan found');
  return undefined;
};

// 已废弃：使用 generateAmazonGridImage 代替
const generateImagesFromPlan = async (messageId: string, referenceImage: string) => {
  console.log('[Deprecated] generateImagesFromPlan called, using generateAmazonGridImage instead');
  await generateAmazonGridImage(messageId, referenceImage, '');
};

const generateAmazonGridImage = async (messageId: string, referenceImage: string | undefined, userContent: string = '') => {
  abortControllerRef.current = new AbortController();
  const clientRequestId = `amazon-grid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const isValidReferenceImage = !!referenceImage && (referenceImage.startsWith('data:') || referenceImage.startsWith('http://') || referenceImage.startsWith('https://'));
    if (!isValidReferenceImage) {
      throw new Error('gpt-image-2 编辑接口需要上传至少一张产品图，请先上传产品图后再生成亚马逊套图');
    }

    // 使用 ref 获取最新的模板值，避免闭包问题
    const basePrompt = amazonGridTemplateRef.current;
    
    // 检查模板是否为空或过短
    if (!basePrompt || basePrompt.length < 100) {
      throw new Error('模板内容太短或为空，请检查模板编辑器中的内容');
    }
    
    const gridPrompt = userContent ? `${basePrompt}\n\n用户补充：${userContent}` : basePrompt;
    
    // 检查最终 prompt 长度
    const MAX_PROMPT_LENGTH = 15000; // API 通常有长度限制
    if (gridPrompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`提示词太长 (${gridPrompt.length} 字符)，超过限制 ${MAX_PROMPT_LENGTH} 字符。请精简模板内容。`);
    }

    // 调试日志：确认使用的模板
    console.log('[Amazon Grid Generation] Template check:', {
      isDefaultTemplate: basePrompt === AMAZON_9_GRID_PROMPT,
      templateLength: basePrompt.length,
      defaultTemplateLength: AMAZON_9_GRID_PROMPT.length,
      userContent: userContent || '(none)',
      finalPromptLength: gridPrompt.length,
    });

    const requestBody: Record<string, unknown> = {
      clientRequestId,
      prompt: gridPrompt,
      // 九宫格大图：使用云雾 edits 接口支持的 2048 正方形（3840 不在支持列表会导致上游拒绝）
      size: '2048x2048',
      n: 1,
      model: 'gpt-image-2',
      referenceImage,
      skipTranslation: true, // 亚马逊九宫格模板包含大量中文说明，跳过翻译以保持模板结构
      scope: 'amazon-grid',
    };

    console.log('[Amazon Grid Generation] Requesting /api/generate', {
      model: requestBody.model,
      size: requestBody.size,
      n: requestBody.n,
      hasReferenceImage: true,
      promptLength: gridPrompt.length,
      clientRequestId,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), 300000) // 5分钟，与后端 maxDuration 一致
    );

    const fetchPromise = fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortControllerRef.current?.signal,
    });

    const gridResponse = await Promise.race([fetchPromise, timeoutPromise]);
    console.log('[Amazon Grid Generation] Response received, status:', gridResponse.status);
    
    const rawText = await gridResponse.text().catch(() => null);
    console.log('[Amazon Grid Generation] Response body (first 500 chars):', rawText?.substring(0, 500));
    
    let gridData: { error?: string; message?: string; url?: string; urls?: string[]; images?: string[] } | null = null;
    if (rawText) {
      try {
        gridData = JSON.parse(rawText);
      } catch {
        console.error('[Amazon Grid Generation] Failed to parse response as JSON');
      }
    }
    
    if (!gridResponse.ok) {
      const errorMessage = gridData?.error || gridData?.message || rawText || `/api/generate 请求失败：${gridResponse.status}`;
      console.error('[Amazon Grid Generation] API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    const gridUrl = gridData?.url || gridData?.urls?.[0] || (gridData?.images && gridData.images[0]);
    
    if (!gridUrl) throw new Error('生成接口未返回图片 URL');
    
    const croppedImages = await cropGridImages(gridUrl);
    const validImages = croppedImages.filter(Boolean) as string[];
    const displayImages = validImages.length > 0 ? [gridUrl, ...validImages] : [gridUrl];

    if (validImages.length === 0) {
      console.warn('[Amazon Grid Generation] Grid crop failed, showing original grid image instead');
    }

    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          isGenerating: false,
          content: '',
          imageUrls: displayImages,
        };
      }));
    }

    for (let i = 0; i < displayImages.length; i++) {
      const label = validImages.length > 0 && i > 0 ? `亚马逊listing套图 - 图${i}` : '亚马逊listing完整九宫格';
      await handleSaveChatImage(displayImages[i], label, messageId);
    }
    
    const updatedHistory = await getChatHistoryWithUrls();
    setChatImageHistory(updatedHistory);
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Amazon Grid Generation] Aborted');
      return;
    }
    console.error('[Amazon Grid Generation] Failed:', error);
    
    const isTimeout = error instanceof Error && error.message.includes('请求超时');
    if (isTimeout) {
      console.log('[Amazon Grid Generation] 请求超时，尝试从历史记录恢复...');
    }
    
    const recoveredUrl = await recoverGeneratedImage(clientRequestId);
    if (recoveredUrl) {
      const croppedImages = await cropGridImages(recoveredUrl);
      const validImages = croppedImages.filter(Boolean) as string[];
      const displayImages = validImages.length > 0 ? [recoveredUrl, ...validImages] : [recoveredUrl];

      if (isMounted.current) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            isGenerating: false,
            content: '',
            imageUrls: displayImages,
          };
        }));
      }

      for (let i = 0; i < displayImages.length; i++) {
        const label = validImages.length > 0 && i > 0 ? `亚马逊listing套图 - 图${i}` : '亚马逊listing完整九宫格';
        await handleSaveChatImage(displayImages[i], label, messageId);
      }

      const updatedHistory = await getChatHistoryWithUrls();
      setChatImageHistory(updatedHistory);
      return;
    }

    const errorMessage = formatGenerationError(error);

    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          isGenerating: false,
          content: `❌ 图片生成失败：${errorMessage}`,
        };
      }));
    }
  }
  
  abortControllerRef.current = null;
};

// 裁剪九宫格图片（保持原始尺寸，不放大）
async function cropGridImagesToSize(gridUrl: string, targetWidth: number, targetHeight: number): Promise<(string | null)[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const results: (string | null)[] = [];
        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;
        
        // 使用原始裁剪尺寸，不进行放大
        const outputWidth = Math.min(cellWidth, targetWidth);
        const outputHeight = Math.min(cellHeight, targetHeight);
        
        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          
          const canvas = document.createElement('canvas');
          canvas.width = outputWidth;
          canvas.height = outputHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 关闭图像平滑，保持清晰度
            ctx.imageSmoothingEnabled = false;
            
            ctx.drawImage(
              img,
              col * cellWidth,
              row * cellHeight,
              cellWidth,
              cellHeight,
              0,
              0,
              outputWidth,
              outputHeight
            );
            results.push(canvas.toDataURL('image/png'));
          } else {
            results.push(null);
          }
        }
        resolve(results);
      } catch {
        resolve(Array(9).fill(null));
      }
    };
    
    img.onerror = () => resolve(Array(9).fill(null));
    img.src = gridUrl;
  });
}

async function getCanvasSafeImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl;

  try {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`, { cache: 'no-store' });
    if (!response.ok) return imageUrl;
    const data = await response.json();
    return typeof data.dataUrl === 'string' ? data.dataUrl : imageUrl;
  } catch (error) {
    console.warn('[Amazon Grid Generation] Proxy image for crop failed:', error);
    return imageUrl;
  }
}

async function cropGridImages(gridUrl: string): Promise<(string | null)[]> {
  const canvasSafeUrl = await getCanvasSafeImageUrl(gridUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const finish = (results: (string | null)[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(results);
    };

    const timeoutId = window.setTimeout(() => {
      console.warn('[Amazon Grid Generation] Grid image load timed out');
      finish(Array(9).fill(null));
    }, 30000);

    img.onload = () => {
      try {
        const results: (string | null)[] = [];
        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;

        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;

          const canvas = document.createElement('canvas');
          canvas.width = cellWidth;
          canvas.height = cellHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
            results.push(canvas.toDataURL('image/png'));
          } else {
            results.push(null);
          }
        }
        finish(results);
      } catch (error) {
        console.warn('[Amazon Grid Generation] Grid crop failed:', error);
        finish(Array(9).fill(null));
      }
    };

    img.onerror = () => finish(Array(9).fill(null));
    img.src = canvasSafeUrl;
  });
}

const generateImagesFromPlanOld = async (messageId: string, referenceImage: string) => {
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;
  
  const message = messages[messageIndex];
  if (!message.planImages || message.planImages.length === 0) return;
  
  if (isMounted.current) {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        planImages: m.planImages?.map(img => ({ ...img, status: 'pending' as const })),
      };
    }));
  }
  
  abortControllerRef.current = new AbortController();
  
  for (let i = 0; i < message.planImages.length; i++) {
    if (!isMounted.current) break;
    
    const plan = message.planImages[i];
    
    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          planImages: m.planImages?.map((img, idx) => 
            idx === i ? { ...img, status: 'generating' as const } : img
          ),
        };
      }));
    }
    
    try {
      const requestBody: Record<string, unknown> = {
        prompt: plan.prompt,
        size: selectedSize,
        quality: selectedQuality,
        n: 1,
      };
      
      const isValidImageUrl = referenceImage && (
        referenceImage.startsWith('data:') || 
        referenceImage.startsWith('http://') || 
        referenceImage.startsWith('https://')
      );
      
      if (isValidImageUrl) {
        requestBody.referenceImage = referenceImage;
        requestBody.model = 'gpt-image-2-edit';
      } else {
        requestBody.model = 'gpt-image-2';
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal,
      });
      
      if (!isMounted.current) break;
      if (!response.ok) throw new Error('生成失败');
      
      const data = await response.json();
      const generatedUrl = data.url || data.urls?.[0] || (data.images && data.images[0]);
      
      if (!isMounted.current) break;
      
      if (generatedUrl) {
        await handleSaveChatImage(generatedUrl, plan.prompt, messageId);
      }
      
      if (isMounted.current) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            planImages: m.planImages?.map((img, idx) => 
              idx === i ? { ...img, status: generatedUrl ? 'completed' as const : 'failed' as const, imageUrl: generatedUrl } : img
            ),
            imageUrls: generatedUrl ? [...(m.imageUrls || []), generatedUrl] : m.imageUrls,
          };
        }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        break;
      }
      console.error(`[Plan Generation] Image ${i + 1} failed:`, error);
      if (isMounted.current) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            planImages: m.planImages?.map((img, idx) => 
              idx === i ? { ...img, status: 'failed' as const } : img
            ),
          };
        }));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  abortControllerRef.current = null;
};

const generateSingleImageFromPlan = async (messageId: string, planIndex: number, referenceImage: string) => {
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;
  
  const message = messages[messageIndex];
  
  let planImages = message.planImages || [];
  if (planImages.length === 0 && message.content) {
    planImages = parseAmazonVisualPlan(message.content);
  }
  
  if (planImages.length === 0) return;
  
  const arrayIndex = planIndex - 1;
  if (arrayIndex < 0 || arrayIndex >= planImages.length) return;
  
  const plan = planImages[arrayIndex];
  
  if (isMounted.current) {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const currentPlanImages = m.planImages && m.planImages.length > 0 ? m.planImages : planImages;
      return {
        ...m,
        planImages: currentPlanImages.map((img, idx) => 
          idx === arrayIndex ? { ...img, status: 'generating' as const } : img
        ),
      };
    }));
  }
  
  try {
    const requestBody: Record<string, unknown> = {
      prompt: plan.prompt,
      size: selectedSize,
      quality: selectedQuality,
      n: 1,
      scope: 'amazon-grid',
    };

    const isValidImageUrl = referenceImage && (
      referenceImage.startsWith('data:') ||
      referenceImage.startsWith('http://') ||
      referenceImage.startsWith('https://')
    );

    if (isValidImageUrl) {
      requestBody.referenceImage = referenceImage;
      requestBody.model = 'gpt-image-2-edit';
    } else {
      requestBody.model = 'gpt-image-2';
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!isMounted.current) return;
    if (!response.ok) throw new Error('生成失败');
    
    const data = await response.json();
    const generatedUrl = data.url || data.urls?.[0] || (data.images && data.images[0]);
    
    if (!isMounted.current) return;
    
    if (generatedUrl) {
      await handleSaveChatImage(generatedUrl, plan.prompt, messageId);
    }
    
    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const currentPlanImages = m.planImages && m.planImages.length > 0 ? m.planImages : planImages;
        return {
          ...m,
          planImages: currentPlanImages.map((img, idx) => 
            idx === arrayIndex ? { ...img, status: generatedUrl ? 'completed' as const : 'failed' as const, imageUrl: generatedUrl } : img
          ),
          imageUrls: generatedUrl ? [...(m.imageUrls || []), generatedUrl] : m.imageUrls,
        };
      }));
    }
  } catch (error) {
    console.error(`[Single Plan Generation] Image ${planIndex} failed:`, error);
    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const currentPlanImages = m.planImages && m.planImages.length > 0 ? m.planImages : planImages;
        return {
          ...m,
          planImages: currentPlanImages.map((img, idx) => 
            idx === arrayIndex ? { ...img, status: 'failed' as const } : img
          ),
        };
      }));
    }
  }
};

const retryGenerateImage = async (originalUrl: string, aiMessageId: string): Promise<void> => {
    console.log(`[Retry] 尝试重新生成图片...`);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '重新生成图片' }],
          referenceImages: userImages,
          model: selectedModel,
          size: selectedSize,
          quality: selectedQuality,
          n: selectedCount,
          regenerate: true,
        }),
      });

      if (!response.ok) throw new Error('重试失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let retryBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        retryBuffer += decoder.decode(value, { stream: true });
        const lines = retryBuffer.split('\n');
        retryBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            let jsonString = line;
            if (jsonString.startsWith('data: ')) {
              jsonString = jsonString.slice(6);
            }
            
            if (jsonString.trim() === '[DONE]') {
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, isGenerating: false }
                      : msg
                  )
                );
              }
              continue;
            }
            
            const data = JSON.parse(jsonString);

            if (data.type === 'image' && data.url) {
              const isAccessible = await checkImageUrl(data.url);
              if (isAccessible && isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: '', imageUrls: [...(msg.imageUrls || []), data.url], isGenerating: data.index !== undefined && data.total !== undefined ? data.index < data.total - 1 : false }
                      : msg
                  )
                );
              }
            } else if (data.type === 'text') {
              const content = data.content || '';
              const isPlan = isAmazonVisualPlan(content);
              const planImages = isPlan && data.done === true ? parseAmazonVisualPlan(content) : undefined;
              
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { 
                          ...msg, 
                          content, 
                          isGenerating: data.done === false,
                          isAmazonPlan: isPlan,
                          planImages: data.done === true ? planImages : msg.planImages,
                        }
                      : msg
                  )
                );
              }
            }
          } catch (e) {
            console.error('[Parse Error]', e);
          }
        }
      }
    } catch (error) {
      console.error('[Retry Error]', error);
      if (isMounted.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: '❌ 图片生成失败，请稍后重试', isGenerating: false }
              : msg
          )
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    const effectiveContent = input.trim();
    const currentImages = [...userImagesRef.current];
    
    // 添加详细的日志输出
    console.log('[SendMessage] Starting sendMessage');
    console.log('[SendMessage] Content:', effectiveContent);
    console.log('[SendMessage] Images:', currentImages.length);
    console.log('[SendMessage] Selected persona:', selectedPersona);
    console.log('[SendMessage] Template state:', {
      stateLength: amazonGridTemplate.length,
      refLength: amazonGridTemplateRef.current.length,
      isDefault: amazonGridTemplate === AMAZON_9_GRID_PROMPT,
    });
    
    // 亚马逊专家模式：直接生成九宫格图片
    if (selectedPersona === 'amazon-expert' && (currentImages.length > 0 || effectiveContent.trim().length > 0)) {
      console.log('[SendMessage] Amazon expert mode - generating grid image directly');
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: effectiveContent || '',
        userImages: currentImages.length > 0 ? currentImages : undefined,
      };
      
      const aiMessageId = (Date.now() + 1).toString();
      
      setMessages((prev) => [
        ...prev,
        userMessage,
        { 
          id: aiMessageId, 
          role: 'assistant', 
          content: '🎨 正在生成亚马逊listing九宫格套图...', 
          isGenerating: true,
          // 不设置 planImages，避免触发9图视觉方案界面
        },
      ]);
      setInput('');
      setIsLoading(true);
      
      try {
        // 生成九宫格图片（传递用户输入内容）
        await generateAmazonGridImage(aiMessageId, currentImages[0], effectiveContent);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
      
      // 确保不会继续执行后续代码
      return;
    }
    
    // 检测是否是选择性生图请求（仅在亚马逊专家模式下，且没有上传新图片，且输入包含"生成"关键词时）
    const selectiveRequest = (selectedPersona === 'amazon-expert' && currentImages.length === 0 && effectiveContent.includes('生成')) 
      ? isSelectiveGenerationRequest(effectiveContent) 
      : { match: false, indices: [] };
    if (selectiveRequest.match) {
      console.log('[SendMessage] Detected selective generation request');
      const lastPlan = getLastAmazonPlan();
      if (lastPlan && lastPlan.planImages.length > 0) {
        console.log('[SendMessage] Found existing plan, generating selected images:', selectiveRequest.indices);
        
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: effectiveContent || '',
          userImages: currentImages.length > 0 ? currentImages : undefined,
        };
        
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        
        const aiMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { 
            id: aiMessageId, 
            role: 'assistant', 
            content: '', 
            isGenerating: true,
            planImages: lastPlan.planImages.map((plan, idx) => ({
              ...plan,
              status: selectiveRequest.indices.includes(idx + 1) ? 'pending' : 'completed'
            })),
          },
        ]);
        
        // 生成选中的图片
        if (lastPlan.planImages.length > 0) {
          // 过滤出用户选择的图片索引
          const filteredPlans = lastPlan.planImages.filter((_, idx) => 
            selectiveRequest.indices.includes(idx + 1)
          );
          
          // 更新消息状态
          if (isMounted.current) {
            setMessages(prev => prev.map(m => {
              if (m.id !== aiMessageId) return m;
              return {
                ...m,
                planImages: m.planImages?.map((plan, idx) => ({
                  ...plan,
                  status: selectiveRequest.indices.includes(idx + 1) ? 'generating' : 'completed'
                }))
              };
            }));
          }
          
          abortControllerRef.current = new AbortController();
          
          // 逐个生成选中的图片
          for (const idx of selectiveRequest.indices) {
            if (!isMounted.current) break;
            
            const plan = lastPlan.planImages[idx - 1];
            if (plan) {
              try {
                console.log(`[SendMessage] Generating image ${idx}:`, {
                  title: plan.title,
                  prompt: plan.prompt.substring(0, 100),
                  hasUserImage: !!lastPlan.userImage,
                });
                const requestBody: Record<string, unknown> = {
                  prompt: plan.prompt,
                  size: selectedSize,
                  quality: selectedQuality,
                  n: 1,
                  scope: 'amazon-grid',
                };
                const isValidImageUrl = lastPlan.userImage && (
                  lastPlan.userImage.startsWith('data:') || 
                  lastPlan.userImage.startsWith('http://') || 
                  lastPlan.userImage.startsWith('https://')
                );
                if (isValidImageUrl) {
                  requestBody.referenceImage = lastPlan.userImage;
                  requestBody.model = 'gpt-image-2-edit';
                } else {
                  requestBody.model = 'gpt-image-2';
                }
                const response = await fetch('/api/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody),
                  signal: abortControllerRef.current?.signal,
                });
                
                if (!isMounted.current) return;
                
                if (response.ok) {
                  const data = await response.json();
                  const imageUrl = data.url || data.urls?.[0] || (data.images && data.images[0]);
                  if (imageUrl) {
                    console.log(`[SendMessage] Generated image ${idx}:`, imageUrl);
                    
                    if (isMounted.current) {
                      setMessages(prev => prev.map(m => {
                        if (m.id !== aiMessageId) return m;
                        return {
                          ...m,
                          planImages: m.planImages?.map((p, i) => 
                            i === idx - 1 ? { ...p, status: 'completed' as const, imageUrl: imageUrl } : p
                          ),
                          imageUrls: [...(m.imageUrls || []), imageUrl],
                        };
                      }));
                    }
                  }
                } else {
                  const status = response.status;
                  const statusText = response.statusText;
                  let errorData;
                  try {
                    errorData = await response.json();
                  } catch {
                    const text = await response.text().catch(() => '');
                    errorData = { status, statusText, rawText: text };
                  }
                  console.error(`[SendMessage] Failed to generate image ${idx}: HTTP ${status} ${statusText}`, errorData);
                  if (isMounted.current) {
                    setMessages(prev => prev.map(m => {
                      if (m.id !== aiMessageId) return m;
                      return {
                        ...m,
                        planImages: m.planImages?.map((p, i) => 
                          i === idx - 1 ? { ...p, status: 'failed' as const, error: errorData.error || `HTTP ${status}` } : p
                        ),
                      };
                    }));
                  }
                }
              } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                  console.log(`[SendMessage] Image generation ${idx} aborted`);
                  continue;
                }
                console.error(`[SendMessage] Failed to generate image ${idx}:`, error);
                if (isMounted.current) {
                  setMessages(prev => prev.map(m => {
                    if (m.id !== aiMessageId) return m;
                    return {
                      ...m,
                      planImages: m.planImages?.map((p, i) => 
                        i === idx - 1 ? { ...p, status: 'failed' as const } : p
                      ),
                    };
                  }));
                }
              }
            }
          }
          
          if (isMounted.current) {
            setMessages(prev => prev.map(m => {
              if (m.id !== aiMessageId) return m;
              return { ...m, isGenerating: false };
            }));
          }
        }
        return;
      }
    }
    
    // 使用用户选择的模型（文本模型也能识别图片）
    // 图片识别模式下强制使用 gpt-image-2 模型
    const effectiveModel = (imageMode === 'analyze' && currentImages.length > 0) ? 'gpt-image-2' : selectedModel;
    console.log('[SendMessage] Using model:', effectiveModel);

    let currentUserMessage: { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> };
    
    if (currentImages.length > 0) {
      const contentItems: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      if (effectiveContent) {
        contentItems.push({ type: 'text', text: effectiveContent });
      }
      currentImages.forEach((img) => {
        contentItems.push({ type: 'image_url', image_url: { url: img } });
      });
      currentUserMessage = {
        role: 'user',
        content: contentItems
      };
    } else {
      currentUserMessage = {
        role: 'user',
        content: effectiveContent
      };
    }

    // 构建完整的消息历史（包含当前消息）
    const messageHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => {
        if (m.userImages && m.userImages.length > 0) {
          const contentItems: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: 'text', text: m.content }
          ];
          m.userImages.forEach((img) => {
            contentItems.push({ type: 'image_url', image_url: { url: img } });
          });
          return { role: m.role, content: contentItems };
        }
        return { role: m.role, content: m.content };
      });

    // 添加当前用户消息到消息列表（用于UI显示）
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: effectiveContent || '',
      userImages: currentImages.length > 0 ? currentImages : undefined,
    };

    isNewMessageRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    clearAllImages();

    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, role: 'assistant', content: '', isGenerating: true },
    ]);

    abortControllerRef.current = new AbortController();
    const timeoutMs = 300000; // 300秒超时（图片生成可能需要较长时间）
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeoutMs);

    const imageModels: ImageModelId[] = ['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit'];
    const isImageGeneration = imageModels.includes(effectiveModel as ImageModelId) && currentImages.length > 0;
    console.log('[Analytics] Check isImageGeneration:', {
      effectiveModel,
      imageModels,
      selectedPersona,
      currentImagesCount: currentImages.length,
      isImageGeneration,
    });

    const clientRequestId = `chat-image-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (isImageGeneration) {
      console.log('[Analytics] isImageGeneration is true, starting to track generation...');
      requestStartTimeRef.current = Date.now();
      // 确保 analytics 初始化完成
      if (!isInitialized) {
        console.log('[Analytics] Waiting for initialization...');
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            const id = localStorage.getItem('analytics_session_id');
            if (id) {
              clearInterval(interval);
              resolve(id);
            }
          }, 50);
        });
      }
      const generationId = await trackGeneration({
        prompt: effectiveContent,
        displayPrompt: effectiveContent,
        size: selectedSize,
        quality: selectedQuality,
        model: effectiveModel,
        count: selectedCount,
        clientRequestId,
      });
      generationIdRef.current = generationId;
      console.log('[Analytics] Tracked generation:', generationId);
    }

    // 追踪所有用户消息（文本或图片）
    if (effectiveContent.trim()) {
      console.log('[Analytics] Preparing to track message:', effectiveContent.trim());
      const messageId = await trackMessage({
        content: effectiveContent.trim(),
        model: effectiveModel,
        hasImages: currentImages.length > 0,
        imageCount: currentImages.length,
      });
      console.log('[Analytics] Message tracking completed, ID:', messageId);
    } else {
      console.log('[Analytics] Empty content, skipping message tracking');
    }

    try {
      console.log('[SendMessage] Making API request to /api/chat');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientRequestId,
          messages: [...messageHistory, currentUserMessage],
          model: effectiveModel,
          autoGenerate: autoGenerate,
          size: selectedSize,
          quality: selectedQuality,
          n: selectedCount,
          imageMode: imageMode,
          persona: selectedPersona,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      console.log('[SendMessage] API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SendMessage] API error:', errorData);
        throw new Error(errorData.error || errorData.message || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let sseBuffer = '';

      console.log('[SendMessage] Starting to read SSE stream');
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[SendMessage] SSE stream done');
          break;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            let jsonString = line;
            if (jsonString.startsWith('data: ')) {
              jsonString = jsonString.slice(6);
            }
            
            if (jsonString.trim() === '[DONE]') {
              console.log('[SendMessage] Received [DONE] signal');
              // SSE 完成，关闭 isGenerating 状态
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, isGenerating: false }
                      : msg
                  )
                );
              }
              continue;
            }
            
            const data = JSON.parse(jsonString);
            console.log('[SendMessage] Received SSE data:', data.type);

            if (data.type === 'image' && data.url) {
              console.log('[Chat] 收到图片 URL:', data.url);
              handleSaveChatImage(data.url, effectiveContent || '生成图片', aiMessageId);
              if (generationIdRef.current) {
                const duration = Date.now() - requestStartTimeRef.current;
                updateGeneration(generationIdRef.current, {
                  status: 'success',
                  duration,
                  imageUrl: data.url,
                });
              }
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: '', imageUrls: [...(msg.imageUrls || []), data.url], isGenerating: data.index !== undefined && data.total !== undefined ? data.index < data.total - 1 : false }
                      : msg
                  )
                );
              }
            } else if (data.type === 'text') {
              const content = data.content || '';
              const isPlan = isAmazonVisualPlan(content);
              console.log('[SendMessage] Is Amazon plan:', isPlan);
              const planImages = isPlan && data.done === true ? parseAmazonVisualPlan(content) : undefined;
              
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { 
                          ...msg, 
                          content, 
                          isGenerating: data.done === false,
                          isAmazonPlan: isPlan,
                          planImages: data.done === true ? planImages : msg.planImages,
                        }
                      : msg
                  )
                );
              }
            } else if (data.type === 'generating') {
              console.log('[SendMessage] Generating message');
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: data.message || '生成中...', isGenerating: true }
                      : msg
                  )
                );
              }
            } else if (data.type === 'error') {
              console.error('[SendMessage] Error message:', data.message);
              if (generationIdRef.current) {
                const duration = Date.now() - requestStartTimeRef.current;
                updateGeneration(generationIdRef.current, {
                  status: 'failed',
                  duration,
                  error: data.message || '生成失败',
                });
              }
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: `❌ ${data.message || '生成失败'}`, isGenerating: false }
                      : msg
                  )
                );
              }
            }
          } catch (e) {
            console.error('[Parse Error]', e);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        const recoveredUrl = await recoverChatGeneratedImage(clientRequestId);
        if (recoveredUrl) {
          handleSaveChatImage(recoveredUrl, effectiveContent || '生成图片', aiMessageId);
          if (generationIdRef.current) {
            const duration = Date.now() - requestStartTimeRef.current;
            updateGeneration(generationIdRef.current, {
              status: 'success',
              duration,
              imageUrl: recoveredUrl,
            });
          }
          if (isMounted.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: '', imageUrls: [...(msg.imageUrls || []), recoveredUrl], isGenerating: false }
                  : msg
              )
            );
          }
          return;
        }
      }

      if (error instanceof Error && error.name === 'AbortError') {
        if (generationIdRef.current) {
          const duration = Date.now() - requestStartTimeRef.current;
          updateGeneration(generationIdRef.current, {
            status: 'failed',
            duration,
            error: '请求超时',
          });
        }
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: '❌ 图片生成失败：请求超时', isGenerating: false }
                : msg
            )
          );
        }
      } else if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[Chat Error]', error);
        if (generationIdRef.current) {
          const duration = Date.now() - requestStartTimeRef.current;
          updateGeneration(generationIdRef.current, {
            status: 'failed',
            duration,
            error: error instanceof Error ? error.message : '网络错误',
          });
        }
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: `❌ 请求失败: ${error instanceof Error ? error.message : '网络错误'}`, isGenerating: false }
                : msg
            )
          );
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      abortControllerRef.current = null;
      generationIdRef.current = null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 16;
    const maxTotalSize = 50 * 1024 * 1024; // 50MB
    
    let totalSize = userImages.reduce((acc, img) => {
      // 估算 Base64 大小：原始大小 * 1.33
      if (img.startsWith('data:')) {
        const base64Data = img.split(',')[1];
        return acc + Math.floor((base64Data.length * 3) / 4);
      }
      return acc;
    }, 0);

    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 检查数量限制
      if (userImages.length + newImages.length >= maxImages) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `❌ 最多上传 ${maxImages} 张图片`,
          },
        ]);
        break;
      }
      
      // 检查总大小限制
      if (totalSize + file.size > maxTotalSize) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `❌ 总文件大小不能超过 50MB`,
          },
        ]);
        break;
      }
      
      totalSize += file.size;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setUserImages((prev) => [...prev, imageDataUrl]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUserImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setUserImages([]);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (userImages.length >= 16) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setUserImages((prev) => [...prev, imageDataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => processFile(file));
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (scrollRef.current && isNewMessageRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isNewMessageRef.current = false;
    }
  }, [messages]);

  return (
    <div className="h-screen flex bg-gray-50">
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">AI 创意工作台</h1>
              <p className="text-[10px] text-gray-400 leading-tight">多工作流智能助手</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            {[
              { id: 'chat', name: '快速九宫格', icon: Bot },
              { id: 'image-generator', name: '图片生成', icon: Sparkles },
              { id: 'product-detail', name: '详情页套图', icon: Grid3X3 },
              { id: 'prompt-analyzer', name: '提示词分析助手', icon: Wand2 },
              { id: 'ecommerce', name: '商品图套图', icon: LayoutGrid },
              { id: 'toolbox', name: '工具箱', icon: Calculator },
              { id: 'vip-chat', name: 'VIP 对话生图', icon: Crown },
              { id: 'apiplus', name: 'APIPLUS', icon: Gem },
            ].map((workflow) => {
              const Icon = workflow.icon;
              const isActive = currentWorkflow === workflow.id;
              return (
                <button
                  key={workflow.id}
                  onClick={() => setCurrentWorkflow(workflow.id as WorkflowType)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{workflow.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ display: currentWorkflow === 'chat' ? 'block' : 'none' }}>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">模型</label>
            <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as ImageModelId | TextModelId)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">文本对话</div>
                <SelectItem value="gpt-5-nano">
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium text-xs">GPT-5.4 nano</span>
                    <span className="text-[10px] text-gray-400">轻量对话 + 图片识别</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">人设</label>
            <div className="w-full h-8 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center">
              <span className="text-gray-700">亚马逊专家</span>
            </div>
          </div>

          {['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit'].includes(selectedModel) && (
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">尺寸</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="图片尺寸" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024×1024 (1:1)</SelectItem>
                  <SelectItem value="1536x1024">1536×1024 (3:2)</SelectItem>
                  <SelectItem value="1024x1536">1024×1536 (2:3)</SelectItem>
                  <SelectItem value="2000x1125">2000×1125 (16:9)</SelectItem>
                  <SelectItem value="1125x2000">1125×2000 (9:16)</SelectItem>
                  <SelectItem value="2000x2000">2000×2000 (1:1 高清)</SelectItem>
                  <SelectItem value="2880x2880">2880×2880 (1:1 大方形-九宫格用)</SelectItem>
                  <SelectItem value="2416x1008">2416×1008 (A+ 电脑端)</SelectItem>
                  <SelectItem value="1664x1008">1664×1008 (A+ 移动端)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit'].includes(selectedModel) && (
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">画质</label>
              <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="画质" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit'].includes(selectedModel) && (
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">数量</label>
              <Select value={String(selectedCount)} onValueChange={(v) => setSelectedCount(Number(v))}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="数量" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 张</SelectItem>
                  <SelectItem value="2">2 张</SelectItem>
                  <SelectItem value="3">3 张</SelectItem>
                  <SelectItem value="4">4 张</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden h-screen flex flex-col">
        {/* 公告栏 */}
        <AnnouncementBar currentWorkflow={currentWorkflow} />
        
        <div style={{ display: currentWorkflow === 'image-generator' ? 'flex' : 'none' }} className="flex-1 overflow-hidden">
          <ImageGeneratorWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'product-detail' ? 'flex' : 'none' }} className="flex-1 overflow-hidden">
          <ProductDetailWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'prompt-analyzer' ? 'flex' : 'none' }} className="flex-1 overflow-hidden">
          <PromptAnalyzerWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'ecommerce' ? 'block' : 'none' }} className="flex-1 overflow-y-auto">
          <DeepEcommerceWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'toolbox' ? 'flex' : 'none' }} className="flex-1 min-h-0 overflow-hidden p-4">
          <ToolboxWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'vip-chat' ? 'flex' : 'none' }} className="flex-1 min-h-0 overflow-hidden">
          <GptImage2VipWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'apiplus' ? 'flex' : 'none' }} className="flex-1 bg-white">
          <iframe
            src="https://web.apiplus.org"
            title="APIPLUS"
            className="w-full h-full border-0"
            referrerPolicy="no-referrer"
          />
        </div>
        <div style={{ display: currentWorkflow === 'chat' ? 'flex' : 'none' }} className="h-full overflow-hidden">
          {/* 会话列表侧边栏 */}
          <ChatSessionList
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSwitch={switchSession}
            onDelete={handleDeleteSession}
            onCreate={createNewSession}
          />
          
          {/* 聊天区域 */}
          <div className="flex-1 flex flex-col border-l border-gray-200 h-full">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  if (scrollRef.current) {
                    scrollPositionRef.current = scrollRef.current.scrollTop;
                  }
                  setConfirmingClearHistory(false);
                  setShowImageHistory(false);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  !showImageHistory ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
              聊天助手
            </button>
            <button
              onClick={() => {
                if (scrollRef.current) {
                  scrollPositionRef.current = scrollRef.current.scrollTop;
                }
                setConfirmingClearHistory(false);
                setShowImageHistory(true);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                showImageHistory ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              图片历史 ({chatImageHistory.length})
            </button>
            {selectedPersona === 'amazon-expert' && (
              <button
                onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  showTemplateEditor ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                模板编辑
              </button>
            )}
          </div>
          
          {showTemplateEditor && selectedPersona === 'amazon-expert' ? (
            <div className="flex-1 overflow-y-auto p-4 bg-amber-50/30">
              {/* 模板选择器 */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">九宫格套图模板编辑器</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    共 {gridTemplates.length} 个模板可用
                    {gridTemplates.filter(t => t.key !== 'default').length > 0 &&
                      ` (${gridTemplates.filter(t => t.key !== 'default').length} 个用户上传模板)`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplateKey}
                    onChange={(e) => setSelectedTemplateKey(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    {gridTemplates.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.key === 'default' ? '📋 ' : '👤 '}{t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      // 手动刷新模板列表
                      try {
                        const response = await fetch('/api/grid-template');
                        const data = await response.json();
                        if (data.success && data.presets) {
                          const templates = data.presets.map((p: { key: string; name: string; content: string; description?: string }) => ({
                            key: p.key,
                            name: p.name,
                            content: p.content,
                            description: p.description,
                          }));
                          setGridTemplates(templates);
                          console.log('[AmazonGridTemplate] Refreshed templates:', templates.length);
                        }
                      } catch (error) {
                        console.error('[AmazonGridTemplate] Failed to refresh:', error);
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                    title="刷新模板列表"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => setShowTemplateManager(!showTemplateManager)}
                    className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                  >
                    管理模板
                  </button>
                  <button
                    onClick={() => setShowTemplateEditor(false)}
                    className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                  >
                    完成
                  </button>
                </div>
              </div>

              {/* 模板管理面板 */}
              {showTemplateManager && (
                <div className="mb-4 p-3 bg-white border border-amber-200 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">上传新模板</h4>
                  {templateMessage && (
                    <div className={`mb-2 rounded-md px-3 py-2 text-xs ${
                      templateMessage.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : templateMessage.type === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {templateMessage.text}
                    </div>
                  )}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="模板名称"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <textarea
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    placeholder="粘贴模板内容..."
                    className="w-full h-24 p-2 text-xs font-mono border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!newTemplateName.trim() || !newTemplateContent.trim()) {
                          setTemplateMessage({ type: 'error', text: '请输入模板名称和内容' });
                          return;
                        }
                        const key = `custom-${Date.now()}`;
                        try {
                          const response = await fetch('/api/grid-template', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key,
                              name: newTemplateName.trim(),
                              content: newTemplateContent.trim(),
                              description: '用户自定义模板',
                              isDefault: false,
                            }),
                          });
                          const data = await response.json();
                          if (data.success) {
                            setGridTemplates([...gridTemplates, { key, name: newTemplateName.trim(), content: newTemplateContent.trim() }]);
                            setNewTemplateName('');
                            setNewTemplateContent('');
                            setTemplateMessage({ type: 'success', text: '模板上传成功' });
                          }
                        } catch (error) {
                          console.error('上传模板失败:', error);
                          setTemplateMessage({ type: 'error', text: '上传失败，请检查模板内容或稍后重试' });
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                    >
                      上传模板
                    </button>
                    <button
                      onClick={() => {
                        setNewTemplateName('');
                        setNewTemplateContent('');
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      清空
                    </button>
                  </div>

                  {/* 删除模板 */}
                  {gridTemplates.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">删除模板</h4>
                      <div className="flex flex-wrap gap-2">
                        {gridTemplates.filter(t => t.key !== 'default').map((t) => (
                          <button
                            key={t.key}
                            onClick={async () => {
                              if (confirmingDeleteTemplateKey !== t.key) {
                                setConfirmingDeleteTemplateKey(t.key);
                                setTemplateMessage({ type: 'info', text: `再次点击“删除 ${t.name}”确认删除` });
                                return;
                              }

                              try {
                                await fetch(`/api/grid-template?key=${t.key}`, { method: 'DELETE' });
                                setGridTemplates(gridTemplates.filter(template => template.key !== t.key));
                                setConfirmingDeleteTemplateKey(null);
                                setTemplateMessage({ type: 'success', text: `已删除模板：${t.name}` });
                                if (selectedTemplateKey === t.key) {
                                  setSelectedTemplateKey('default');
                                }
                              } catch (error) {
                                console.error('删除模板失败:', error);
                                setTemplateMessage({ type: 'error', text: '删除模板失败' });
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              confirmingDeleteTemplateKey === t.key
                                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            }`}
                          >
                            {confirmingDeleteTemplateKey === t.key ? `确认删除 ${t.name}` : `删除 ${t.name}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 当前模板编辑器 */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">当前编辑: {gridTemplates.find(t => t.key === selectedTemplateKey)?.name}</span>
                <button
                  onClick={async () => {
                    // 保存当前模板到服务器
                    const currentTemplate = gridTemplates.find(t => t.key === selectedTemplateKey);
                    if (!currentTemplate) return;
                    try {
                      const response = await fetch('/api/grid-template', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          key: selectedTemplateKey,
                          name: currentTemplate.name,
                          content: amazonGridTemplate,
                          description: currentTemplate.description || '自定义模板',
                          isDefault: selectedTemplateKey === 'default',
                        }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        // 更新本地模板列表
                        setGridTemplates(gridTemplates.map(t =>
                          t.key === selectedTemplateKey ? { ...t, content: amazonGridTemplate } : t
                        ));
                        setTemplateMessage({ type: 'success', text: '模板保存成功' });
                      }
                    } catch (error) {
                      console.error('保存模板失败:', error);
                      setTemplateMessage({ type: 'error', text: '保存失败，请稍后重试' });
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                >
                  保存修改
                </button>
              </div>
              <textarea
                value={amazonGridTemplate}
                onChange={(e) => setAmazonGridTemplate(e.target.value)}
                className="w-full h-[calc(100%-200px)] p-4 text-xs font-mono bg-white border border-amber-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 leading-relaxed"
                placeholder="在此编辑九宫格套图模板..."
                spellCheck={false}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>当前模板长度: {amazonGridTemplate.length} 字符</span>
                <span className={selectedTemplateKey === 'default' ? 'text-green-600' : 'text-amber-600'}>
                  {selectedTemplateKey === 'default' ? '✓ 使用默认模板' : `⚠ 使用自定义模板: ${gridTemplates.find(t => t.key === selectedTemplateKey)?.name}`}
                </span>
              </div>
            </div>
          ) : showImageHistory ? (
            <div className="flex-1 overflow-y-auto p-4">
              {chatImageHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无图片历史</p>
                  <p className="text-sm">发送图片生成请求后，图片会保存在这里</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">共 {chatImageHistory.length} 张图片</span>
                    <button
                      onClick={handleClearChatHistory}
                      className={`text-sm flex items-center gap-1 ${
                        confirmingClearHistory
                          ? 'text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded'
                          : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      {confirmingClearHistory ? '再次点击确认清空' : '清空全部'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {chatImageHistory.filter(Boolean).map((item) => {
                      if (!item || !item.id || !item.url || item.url.trim().length === 0) return null;
                      return (
                      <div
                        key={item.id}
                        className="relative group aspect-square rounded-lg overflow-hidden shadow-md"
                      >
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/uri-list', item.url);
                            e.dataTransfer.setData('text/plain', item.url);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => setPreviewImage(item.url)}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewImage(item.url)}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Search className="w-4 h-4 text-gray-800" />
                          </button>
                          <button
                            onClick={() => {
                              downloadImageByUrl(item.url, `image_${item.id}.png`);
                            }}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Download className="w-4 h-4 text-gray-800" />
                          </button>
                          <button
                            onClick={() => handleDeleteChatImage(item.id)}
                            className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p 
                            className="text-xs text-white line-clamp-2 cursor-pointer hover:text-blue-200 transition-colors"
                            title={item.prompt}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.prompt);
                            }}
                          >
                            {item.prompt}
                          </p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <React.Fragment>
			<ChatMessages
              messages={messages}
              onCopyContent={copyToClipboard}
              onGenerateFromPlan={generateImagesFromPlan}
              onGenerateSingleImage={generateSingleImageFromPlan}
              onCancelRequest={cancelRequest}
              scrollRef={scrollRef as React.RefObject<HTMLDivElement | null>}
              onScroll={handleScroll}
            />

          <div className="p-4 pt-2">
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative border rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all ${
                isDragging ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              {userImages.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {userImages.map((img, index) => {
                      const numberLabels = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯'];
                      const isValidUrl = typeof img === 'string' && img.trim().length > 0;
                      if (!isValidUrl) return null;
                      return (
                        <div key={index} className="relative group flex-shrink-0">
                          <div className="relative">
                            <img
                              src={img}
                              alt={`preview ${index + 1}`}
                              className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                            />
                            <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                              {numberLabels[index]}
                            </span>
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">已附加 {userImages.length} 张图片</p>
                    <div className="flex items-center gap-2">
                      {selectedPersona !== 'amazon-expert' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => setImageMode('generate')}
                            className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                              imageMode === 'generate'
                                ? 'bg-black text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            生成图片
                          </button>
                          <button
                            onClick={() => setImageMode('analyze')}
                            className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                              imageMode === 'analyze'
                                ? 'bg-black text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            图片识别
                          </button>
                        </div>
                      )}
                      <button
                        onClick={clearAllImages}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={userImages.length > 0
                  ? (imageMode === 'analyze' ? '描述你想识别的内容...' : '描述你对这些图片的需求...')
                  : '请输入你的需求...'}
                className="w-full h-24 p-4 resize-none outline-none text-gray-700 placeholder-gray-300 bg-transparent rounded-t-2xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) sendMessage();
                  }
                }}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                    title="上传图片"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <button
                      onClick={cancelRequest}
                      className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      <Square size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() && userImages.length === 0}
                      className={`p-2 rounded-full transition-all ${
                        (input.trim() || userImages.length > 0)
                          ? 'bg-black text-white hover:bg-gray-800 shadow-md'
                          : 'bg-gray-200 text-white cursor-not-allowed'
                      }`}
                    >
                      <ArrowUp size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
        )}
        </div>
      </div>
      </main>

      

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[80vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
interface WorkflowTabsProps {
  currentWorkflow: WorkflowType;
  onWorkflowChange: (workflow: WorkflowType) => void;
}

function WorkflowTabs({ currentWorkflow, onWorkflowChange }: WorkflowTabsProps) {
  const workflows = [
    { id: 'chat', name: '对话助手', icon: Bot },
    { id: 'image-generator', name: '图片生成', icon: Sparkles },
    { id: 'product-detail', name: '详情页套图', icon: Grid3X3 },
    { id: 'ecommerce', name: '商品图套图', icon: LayoutGrid },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {workflows.map((workflow) => {
        const Icon = workflow.icon;
        const isActive = currentWorkflow === workflow.id;

        return (
          <button
            key={workflow.id}
            onClick={() => onWorkflowChange(workflow.id as WorkflowType)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {workflow.name}
          </button>
        );
      })}
    </div>
  );
}
