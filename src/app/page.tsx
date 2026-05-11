'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
import { Send, Bot, User, Sparkles, Loader2, X, Image as ImageIcon, Upload, Square, LayoutGrid, Search, Download, Trash2, ArrowUp, Paperclip, RefreshCw, Copy } from 'lucide-react';
import { saveChatImageToHistory, getChatHistory, getChatHistoryWithUrls, deleteChatImage, clearChatHistory, ChatImageHistoryItem, saveChatMessages, getChatMessages } from '@/lib/history-manager';
import { getImageUrl } from '@/lib/idb-storage';
import { PERSONAS, PersonaConfig } from '@/lib/persona';
import InfiniteCanvas from '@/components/InfiniteCanvas';
import ImageGeneratorWorkflow from '@/components/workflows/ImageGeneratorWorkflow';
import EcommerceWorkflow from '@/components/workflows/EcommerceWorkflow';
import { downloadImageByUrl } from '@/lib/download';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  userImages?: string[];
  product?: string;
  scene?: string;
  isGenerating?: boolean;
}

type ImageModelId = 'gpt-image-2' | 'gpt-image-2-gen' | 'gpt-image-2-edit';
type TextModelId = 'gpt-5-nano' | 'gpt-5.4';
type ImageMode = 'generate' | 'analyze';

export default function Home() {
  const [currentWorkflow, setCurrentWorkflow] = useState('chat');
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
        };
      });
      setMessages(prev => [prev[0], ...migrated]);
    }
  }, []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ImageModelId | TextModelId>('gpt-5-nano');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [selectedCount, setSelectedCount] = useState(1);
  const [currentImage, setCurrentImage] = useState<{
    url: string;
    product: string;
    scene: string;
  } | null>(null);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [showImageHistory, setShowImageHistory] = useState(false);
  const [imageMode, setImageMode] = useState<ImageMode>('generate');
  const [chatImageHistory, setChatImageHistory] = useState<ChatImageHistoryItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>('default');
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    getChatHistoryWithUrls().then(setChatImageHistory);
  }, []);

  useLayoutEffect(() => {
    if (currentWorkflow === 'chat' && !showImageHistory && scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [currentWorkflow, showImageHistory]);

  useEffect(() => {
    return () => {
      if (scrollRef.current) {
        setScrollPosition(scrollRef.current.scrollTop);
      }
    };
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollTop);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveChatMessages(messages);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSaveChatImage = async (url: string, prompt: string, messageId?: string) => {
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
  };

  const handleDeleteChatImage = async (imageId: string) => {
    await deleteChatImage(imageId);
    const updated = await getChatHistoryWithUrls();
    setChatImageHistory(updated);
  };

  const handleClearChatHistory = async () => {
    if (confirm('确定要清空所有图片历史记录吗？')) {
      await clearChatHistory();
      setChatImageHistory([]);
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
              // SSE 完成，关闭 isGenerating 状态
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, isGenerating: false }
                    : msg
                )
              );
              continue;
            }
            
            const data = JSON.parse(jsonString);

            if (data.type === 'image' && data.url) {
              const isAccessible = await checkImageUrl(data.url);
              if (isAccessible) {
                setCurrentImage({
                  url: data.url,
                  product: data.product || '生成图片',
                  scene: data.scene || '',
                });
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: '', imageUrls: [...(msg.imageUrls || []), data.url], isGenerating: data.index !== undefined && data.total !== undefined ? data.index < data.total - 1 : false }
                      : msg
                  )
                );
              }
            } else if (data.type === 'text') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: data.content || msg.content, isGenerating: data.done === false }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('[Parse Error]', e);
          }
        }
      }
    } catch (error) {
      console.error('[Retry Error]', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: '❌ 图片生成失败，请稍后重试', isGenerating: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && userImages.length === 0) || isLoading) return;

    const effectiveContent = input.trim();
    const currentImages = [...userImages];
    
    // 使用用户选择的模型（文本模型也能识别图片）
    // 图片识别模式下强制使用 gpt-image-2 模型
    const effectiveModel = (imageMode === 'analyze' && currentImages.length > 0) ? 'gpt-image-2' : selectedModel;

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
    const timeoutMs = 120000; // 120秒超时（流式响应可能需要更长时间）
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeoutMs);

    const imageModels: ImageModelId[] = ['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit'];
    const isImageGeneration = imageModels.includes(effectiveModel as ImageModelId);
    console.log('[Analytics] Check isImageGeneration:', {
      effectiveModel,
      imageModels,
      isImageGeneration
    });
    
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
              // SSE 完成，关闭 isGenerating 状态
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, isGenerating: false }
                    : msg
                )
              );
              continue;
            }
            
            const data = JSON.parse(jsonString);

            if (data.type === 'image' && data.url) {
              console.log('[Chat] 收到图片 URL:', data.url);
              handleSaveChatImage(data.url, effectiveContent || '生成图片', aiMessageId);
              setCurrentImage({
                url: data.url,
                product: data.product || '生成图片',
                scene: data.scene || '',
              });
              if (generationIdRef.current) {
                const duration = Date.now() - requestStartTimeRef.current;
                updateGeneration(generationIdRef.current, {
                  status: 'success',
                  duration,
                  imageUrl: data.url,
                });
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: '', imageUrls: [...(msg.imageUrls || []), data.url], isGenerating: data.index !== undefined && data.total !== undefined ? data.index < data.total - 1 : false }
                    : msg
                )
              );
            } else if (data.type === 'text') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: data.content || msg.content, isGenerating: data.done === false }
                    : msg
                )
              );
            } else if (data.type === 'generating') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: data.message || '生成中...', isGenerating: true }
                    : msg
                )
              );
            } else if (data.type === 'error') {
              if (generationIdRef.current) {
                const duration = Date.now() - requestStartTimeRef.current;
                updateGeneration(generationIdRef.current, {
                  status: 'failed',
                  duration,
                  error: data.message || '生成失败',
                });
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: `❌ ${data.message || '生成失败'}`, isGenerating: false }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('[Parse Error]', e);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[Chat Error]', error);
        if (generationIdRef.current) {
          const duration = Date.now() - requestStartTimeRef.current;
          updateGeneration(generationIdRef.current, {
            status: 'failed',
            duration,
            error: error instanceof Error ? error.message : '网络错误',
          });
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: `❌ 请求失败: ${error instanceof Error ? error.message : '网络错误'}`, isGenerating: false }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
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
              { id: 'chat', name: '对话助手', icon: Bot },
              { id: 'image-generator', name: '图片生成', icon: Sparkles },
              { id: 'ecommerce', name: '电商套图', icon: LayoutGrid },
            ].map((workflow) => {
              const Icon = workflow.icon;
              const isActive = currentWorkflow === workflow.id;
              return (
                <button
                  key={workflow.id}
                  onClick={() => setCurrentWorkflow(workflow.id)}
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
                <SelectItem value="gpt-5.4">
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium text-xs">GPT-5.4</span>
                    <span className="text-[10px] text-gray-400">旗舰推理能力</span>
                  </div>
                </SelectItem>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">图片生成</div>
                <SelectItem value="gpt-image-2">
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium text-xs">GPT Image 2</span>
                    <span className="text-[10px] text-gray-400">对话生图 + 图片识别</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-image-2-gen">
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium text-xs">GPT Image 2 生成</span>
                    <span className="text-[10px] text-gray-400">纯文本生图，多尺寸</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-image-2-edit">
                  <div className="flex flex-col py-0.5">
                    <span className="font-medium text-xs">GPT Image 2 编辑</span>
                    <span className="text-[10px] text-gray-400">图片编辑 + 多图合并</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">人设</label>
            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="人设" />
              </SelectTrigger>
              <SelectContent>
                {PERSONAS.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    <span className="text-xs">{persona.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <main className="flex-1 overflow-hidden h-screen">
        <div style={{ display: currentWorkflow === 'image-generator' ? 'flex' : 'none' }} className="h-full">
          <ImageGeneratorWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'ecommerce' ? 'flex' : 'none' }} className="h-full">
          <EcommerceWorkflow />
        </div>
        <div style={{ display: currentWorkflow === 'chat' ? 'flex' : 'none' }} className="h-full overflow-hidden flex flex-row-reverse">
          <div className="w-[480px] flex-shrink-0 flex flex-col border-l border-gray-200 h-full">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  if (scrollRef.current) {
                    setScrollPosition(scrollRef.current.scrollTop);
                  }
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
                  setScrollPosition(scrollRef.current.scrollTop);
                }
                setShowImageHistory(true);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                showImageHistory ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              图片历史 ({chatImageHistory.length})
            </button>
          </div>
          
          {showImageHistory ? (
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
                      className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      清空全部
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {chatImageHistory.map((item) => (
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
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-xs text-white truncate">{item.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-6">
                    {messages.filter(m => m.id !== 'welcome').map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gray-100 text-gray-900 rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                          }`}
                        >
                          {message.userImages && message.userImages.length > 0 && (
                            <div className="mb-3">
                              {message.userImages.length === 1 ? (
                                <img
                                  src={message.userImages[0]}
                                  alt="Uploaded"
                                  className="max-w-full max-h-48 rounded-lg object-contain cursor-grab active:cursor-grabbing"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/uri-list', message.userImages![0]);
                                    e.dataTransfer.setData('text/plain', message.userImages![0]);
                                    e.dataTransfer.effectAllowed = 'copy';
                                  }}
                                />
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {message.userImages.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative">
                                      <img
                                        src={img}
                                        alt={`图${imgIdx + 1}`}
                                        className="w-full max-h-32 rounded-lg object-contain cursor-grab active:cursor-grabbing"
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('text/uri-list', img);
                                          e.dataTransfer.setData('text/plain', img);
                                          e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                      />
                                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium">
                                        图{imgIdx + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {message.content && (
                            <div className="flex items-start gap-2 group">
                              <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                              <button
                                onClick={() => {
                                  copyToClipboard(message.content);
                                }}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          )}
                          {message.imageUrls && message.imageUrls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {message.imageUrls.length === 1 ? (
                                <img
                                  src={message.imageUrls[0]}
                                  alt="Generated"
                                  className="max-w-full max-h-64 rounded-lg object-contain cursor-grab active:cursor-grabbing"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/uri-list', message.imageUrls![0]);
                                    e.dataTransfer.setData('text/plain', message.imageUrls![0]);
                                    e.dataTransfer.effectAllowed = 'copy';
                                  }}
                                />
                              ) : (
                                <div className={`grid gap-2 ${message.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                  {message.imageUrls.map((url, idx) => (
                                    <div key={idx} className="relative">
                                      <img
                                        src={url}
                                        alt={`Generated ${idx + 1}`}
                                        className="w-full aspect-square rounded-lg object-contain cursor-grab active:cursor-grabbing bg-gray-50"
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('text/uri-list', url);
                                          e.dataTransfer.setData('text/plain', url);
                                          e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                      />
                                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium">
                                        {idx + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {message.isGenerating && (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}</div>
              </div>

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
        </>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">画布</h3>
              {currentImage && (
                <span className="text-xs text-gray-500">{currentImage.product}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <InfiniteCanvas generatedImageUrl={currentImage?.url} generatedProductName={currentImage?.product} />
          </div>
        </div>
      </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500 z-40">
        <p>
          我们会收集您的使用数据（包括生成请求、工作流选择等）以优化服务。
          <a href="#" className="text-blue-500 hover:underline ml-1">隐私政策</a>
          <span className="mx-2">|</span>
          <a href="/analytics" className="text-blue-500 hover:underline">数据分析</a>
        </p>
      </footer>

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
  currentWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
}

function WorkflowTabs({ currentWorkflow, onWorkflowChange }: WorkflowTabsProps) {
  const workflows = [
    { id: 'chat', name: '对话助手', icon: Bot },
    { id: 'image-generator', name: '图片生成', icon: Sparkles },
    { id: 'ecommerce', name: '电商套图', icon: LayoutGrid },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {workflows.map((workflow) => {
        const Icon = workflow.icon;
        const isActive = currentWorkflow === workflow.id;

        return (
          <button
            key={workflow.id}
            onClick={() => onWorkflowChange(workflow.id)}
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