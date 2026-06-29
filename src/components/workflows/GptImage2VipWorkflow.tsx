'use client';

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, Crown, Download, Image as ImageIcon, Loader2, Paperclip, Trash2, X, ZoomIn } from 'lucide-react';
import { downloadImageByUrl } from '@/lib/download';
import { saveChatImageToHistory } from '@/lib/history-manager';

const compressImageToDataUrl = async (
  file: File,
  maxBytes = 4 * 1024 * 1024,
  maxDimension = 1800
): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  ctx.drawImage(bitmap, 0, 0, width, height);

  const getBytes = (url: string) => {
    const base64 = url.split(',')[1] || '';
    return Math.floor((base64.length * 3) / 4);
  };

  let quality = 0.92;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (getBytes(dataUrl) > maxBytes && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (getBytes(dataUrl) > maxBytes) {
    throw new Error('图片压缩后仍过大');
  }

  return dataUrl;
};

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  images?: string[];
  generatedImage?: string;
  isGenerating?: boolean;
  error?: string;
}

// 刷新后保留对话：localStorage 持久化 key
const VIP_STORAGE_KEY = 'gptImage2VipState';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是 GPT Image 2 VIP 对话式生图助手。\n\n支持：\n• 纯文本文生图\n• 上传参考图改图\n• 基于已生成图片继续多轮迭代',
};

/** 从 localStorage 读取上次的会话（messages + size）；读不到则返回欢迎语 */
function loadPersistedState(): { messages: ChatMessage[]; selectedSize: string } {
  if (typeof window === 'undefined') {
    return { messages: [WELCOME_MESSAGE], selectedSize: 'auto' };
  }
  try {
    const raw = localStorage.getItem(VIP_STORAGE_KEY);
    if (!raw) return { messages: [WELCOME_MESSAGE], selectedSize: 'auto' };
    const parsed = JSON.parse(raw) as { messages?: ChatMessage[]; selectedSize?: string };
    const messages = Array.isArray(parsed.messages) && parsed.messages.length > 0
      // 清掉可能残留的"生成中"中间态，避免刷新后卡在 loading
      ? parsed.messages.map((m) => ({ ...m, isGenerating: false }))
      : [WELCOME_MESSAGE];
    return { messages, selectedSize: parsed.selectedSize || 'auto' };
  } catch {
    return { messages: [WELCOME_MESSAGE], selectedSize: 'auto' };
  }
}

const SIZE_OPTIONS = [
  { value: 'auto', label: '自动 (跟随提示词/参考图)' },
  { value: '1280x1280', label: '1280×1280 (1:1)' },
  { value: '2048x2048', label: '2048×2048 (1:1)' },
  { value: '2880x2880', label: '2880×2880 (1:1 高清)' },
  { value: '1280x720', label: '1280×720 (16:9)' },
  { value: '2048x1152', label: '2048×1152 (16:9)' },
  { value: '3840x2160', label: '3840×2160 (16:9 4K)' },
  { value: '720x1280', label: '720×1280 (9:16)' },
  { value: '1152x2048', label: '1152×2048 (9:16)' },
  { value: '2160x3840', label: '2160×3840 (9:16 4K)' },
  { value: '1280x960', label: '1280×960 (4:3)' },
  { value: '2048x1536', label: '2048×1536 (4:3)' },
  { value: '960x1280', label: '960×1280 (3:4)' },
  { value: '1536x2048', label: '1536×2048 (3:4)' },
];

export default function GptImage2VipWorkflow() {
  // 惰性初始化：刷新后从 localStorage 恢复上次会话
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadPersistedState().messages);
  const [input, setInput] = useState('');
  const [selectedSize, setSelectedSize] = useState(() => loadPersistedState().selectedSize);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingImages]);

  // 自动持久化会话到 localStorage（刷新后可恢复）。
  // 全量保留（含用户上传的参考图 data URL）；若超出配额则降级：
  // 逐步剔除最旧消息里的参考图 images 再重试，最坏只保留文字+生成图。
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 不持久化“生成中”的中间态
    if (messages.some((m) => m.isGenerating)) return;

    const trySave = (msgs: ChatMessage[]): boolean => {
      try {
        localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify({ messages: msgs, selectedSize }));
        return true;
      } catch {
        return false;
      }
    };

    if (trySave(messages)) return;

    // 超配额降级：从最旧消息开始逐个丢弃 images（用户上传的大 data URL），保留 generatedImage
    const stripped = messages.map((m) => ({ ...m }));
    for (let i = 0; i < stripped.length; i++) {
      if (stripped[i].images && stripped[i].images!.length > 0) {
        delete stripped[i].images;
        if (trySave(stripped)) return;
      }
    }
    // 仍失败则放弃持久化（不影响当前使用）
    console.warn('[VIP] 会话过大，localStorage 持久化失败');
  }, [messages, selectedSize]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const remainingSlots = Math.max(0, 8 - pendingImages.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const urls = await Promise.all(selectedFiles.map((file) => compressImageToDataUrl(file)));
      setPendingImages((prev) => [...prev, ...urls]);
      setError('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '图片上传失败');
    } finally {
      e.target.value = '';
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getHistoryMessages = (currentMessages: ChatMessage[]): Array<{ role: MessageRole; content: string }> => {
    return currentMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.generatedImage
          ? `[已生成图片]: ${m.generatedImage}\n${m.content}`
          : m.content,
      }));
  };

  const handleSend = async () => {
    if (!input.trim() && pendingImages.length === 0) return;
    if (isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      isGenerating: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setPendingImages([]);
    setError('');
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const history = getHistoryMessages(messages);

      // 关键：该逆向模型只认「最后一条 user 消息里的真实 image_url」作为底图，
      // 历史里的图片会被忽略。为实现"记住之前的产品/图"，总是把上一张生成图
      // 作为参考图自动带上；与用户本轮上传的参考图合并去重。
      const lastGeneratedImage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant' && m.generatedImage)?.generatedImage;
      const effectiveReferenceImages = Array.from(
        new Set([
          ...(lastGeneratedImage ? [lastGeneratedImage] : []),
          ...(userMessage.images || []),
        ])
      );

      const response = await fetch('/api/gpt-image-2-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          history,
          referenceImages: effectiveReferenceImages,
          size: selectedSize,
        }),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `请求失败 (${response.status})`);
      }

      const imageUrl = result.url || result.urls?.[0];
      if (!imageUrl) {
        throw new Error('未返回图片');
      }

      // 保存到本地历史
      saveChatImageToHistory(imageUrl, userMessage.content).catch((e) => {
        console.warn('[VIP] 保存图片历史失败:', e);
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: '已根据你的描述生成图片。',
                generatedImage: imageUrl,
                isGenerating: false,
              }
            : m
        )
      );
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : '生成失败';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: message, isGenerating: false, error: message }
            : m
        )
      );
      setError(message);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '对话已清空。继续输入提示词开始新的创作吧。',
      },
    ]);
    setPendingImages([]);
    setError('');
    // 同时清除持久化内容，避免刷新后又恢复出来
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(VIP_STORAGE_KEY);
      } catch {
        // 忽略
      }
    }
  };

  const useAsReference = (imageUrl: string) => {
    setPendingImages((prev) => (prev.length >= 8 ? prev : [...prev, imageUrl]));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center">
            <Crown className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">GPT Image 2 VIP</h2>
            <p className="text-xs text-gray-400">对话式文生图 / 参考图改图 / 多轮迭代</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="w-44 h-9 text-xs border-gray-200">
              <SelectValue placeholder="输出尺寸" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="h-9 text-xs border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            清空
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
                } rounded-2xl px-4 py-3`}
              >
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                )}

                {message.images && message.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {message.images.map((img, idx) => (
                      <div
                        key={`${message.id}-img-${idx}`}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                      >
                        <img src={img} alt="参考图" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {message.isGenerating && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在生成图片…
                  </div>
                )}

                {message.generatedImage && (
                  <div className="mt-3">
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img
                        src={message.generatedImage}
                        alt="生成结果"
                        className="w-full max-h-[70vh] object-contain cursor-zoom-in"
                        onClick={() => setPreviewImage(message.generatedImage || null)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => setPreviewImage(message.generatedImage || null)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                        >
                          <ZoomIn size={14} />
                        </button>
                        <button
                          onClick={() => downloadImageByUrl(message.generatedImage || '', `vip-${Date.now()}.png`)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => useAsReference(message.generatedImage || '')}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                          title="作为下一张参考图"
                        >
                          <Paperclip size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {message.error && (
                  <div className="mt-2 text-sm text-red-400">{message.error}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingImages.map((img, idx) => (
                <div
                  key={`pending-${idx}`}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img src={img} alt="待发送参考图" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePendingImage(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想生成的图片，或上传参考图进行改图…"
              className="w-full resize-none rounded-2xl px-4 py-3 pr-24 text-sm text-gray-700 outline-none min-h-[80px] max-h-[200px]"
              rows={2}
              disabled={isGenerating}
            />

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={isGenerating}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || pendingImages.length >= 8}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="上传参考图"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="停止生成"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && pendingImages.length === 0}
                  className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400 text-center">
            Enter 发送，Shift + Enter 换行。支持基于已生成图片继续迭代。
          </p>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
