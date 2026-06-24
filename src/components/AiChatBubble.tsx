'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, GripHorizontal, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  imageUrl?: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export default function AiChatBubble() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的吗？',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // 悬浮球位置
  const [bubblePosition, setBubblePosition] = useState<Position>({ x: 0, y: 0 });
  
  // 对话框位置和大小
  const [chatPosition, setChatPosition] = useState<Position>({ x: 0, y: 0 });
  const [chatSize, setChatSize] = useState<Size>({ width: 380, height: 500 });
  
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; hasMoved: boolean; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const resizeRef = useRef<{ isResizing: boolean; startX: number; startY: number; initialWidth: number; initialHeight: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化悬浮球位置（右下角）
  useEffect(() => {
    setBubblePosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 100,
    });
    setIsMounted(true);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 悬浮球拖动逻辑
  const handleBubbleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isOpen) return;
    dragRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: bubblePosition.x,
      initialY: bubblePosition.y,
    };
  }, [isOpen, bubblePosition]);

  // 对话框标题栏拖动逻辑
  const handleChatHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: chatPosition.x,
      initialY: chatPosition.y,
    };
  }, [chatPosition]);

  // 调整大小逻辑
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: chatSize.width,
      initialHeight: chatSize.height,
    };
  }, [chatSize]);

  // 全局鼠标移动和释放事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 处理拖动
      if (dragRef.current?.isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        // 如果移动距离超过5像素，认为是拖动而不是点击
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragRef.current.hasMoved = true;
        }
        
        if (isOpen) {
          // 拖动对话框
          setChatPosition({
            x: Math.max(0, Math.min(window.innerWidth - chatSize.width, dragRef.current.initialX + dx)),
            y: Math.max(0, Math.min(window.innerHeight - chatSize.height, dragRef.current.initialY + dy)),
          });
        } else {
          // 拖动悬浮球
          setBubblePosition({
            x: Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.initialX + dx)),
            y: Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.initialY + dy)),
          });
        }
      }
      
      // 处理调整大小
      if (resizeRef.current?.isResizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        
        setChatSize({
          width: Math.max(300, Math.min(window.innerWidth - 40, resizeRef.current.initialWidth + dx)),
          height: Math.max(350, Math.min(window.innerHeight - 100, resizeRef.current.initialHeight + dy)),
        });
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current.isDragging = false;
        // 延迟重置 hasMoved，确保 click 事件先执行
        setTimeout(() => {
          if (dragRef.current) {
            dragRef.current.hasMoved = false;
          }
        }, 50);
      }
      if (resizeRef.current) {
        resizeRef.current.isResizing = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, chatSize]);

  // 打开对话框时计算位置
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    
    // 计算对话框初始位置（在悬浮球上方或左侧）
    if (typeof window !== 'undefined') {
      const chatWidth = chatSize.width;
      const chatHeight = chatSize.height;
      
      let x = bubblePosition.x - chatWidth + 56;
      let y = bubblePosition.y - chatHeight - 10;
      
      // 边界检查
      if (x < 10) x = 10;
      if (y < 10) y = bubblePosition.y + 66;
      if (x + chatWidth > window.innerWidth - 10) x = window.innerWidth - chatWidth - 10;
      if (y + chatHeight > window.innerHeight - 10) y = window.innerHeight - chatHeight - 10;
      
      setChatPosition({ x, y });
    }
  }, [bubblePosition, chatSize]);

  // 发送消息
  const sendMessage = useCallback(async () => {
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      imageUrl: attachedImages[0], // 显示第一张图片
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentImages = [...attachedImages];
    setAttachedImages([]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);

    abortControllerRef.current = new AbortController();

    try {
      // 构建消息内容
      const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

      if (input.trim()) {
        messageContent.push({ type: 'text', text: input.trim() });
      }

      // 添加所有图片
      currentImages.forEach(img => {
        messageContent.push({
          type: 'image_url',
          image_url: { url: img }
        });
      });

      // 调用本地 API 路由，由服务器转发到 api.apiyi.com
      const response = await fetch('/api/chat-bubble', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            {
              role: 'user',
              content: messageContent.length === 1 && messageContent[0].type === 'text'
                ? messageContent[0].text
                : messageContent
            },
          ],
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`请求失败: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            let jsonString = line;
            if (jsonString.startsWith('data: ')) {
              jsonString = jsonString.slice(6);
            }

            if (jsonString.trim() === '[DONE]') continue;

            const data = JSON.parse(jsonString);

            // 处理 OpenAI 格式的流式响应
            if (data.choices && data.choices[0]?.delta?.content) {
              const content = data.choices[0].delta.content;
              setMessages(prev => prev.map(m => {
                if (m.id !== aiMessageId) return m;
                return {
                  ...m,
                  content: m.content + content,
                  isStreaming: true,
                };
              }));
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 标记流结束
      setMessages(prev => prev.map(m => {
        if (m.id !== aiMessageId) return m;
        return { ...m, isStreaming: false };
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('[AiChatBubble] Error:', error);
      setMessages(prev => prev.map(m => {
        if (m.id !== aiMessageId) return m;
        return {
          ...m,
          content: `抱歉，发生了错误: ${error instanceof Error ? error.message : '未知错误'}`,
          isStreaming: false,
        };
      }));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading]);

  // 取消请求
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // 清空对话
  const handleClear = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的吗？',
    }]);
    setAttachedImages([]);
  }, []);

  // 处理图片文件
  const processImageFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('只能上传图片文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) resolve(result);
        else reject(new Error('读取图片失败'));
      };
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(file);
    });
  }, []);

  // 处理拖拽事件
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    try {
      const images = await Promise.all(files.map(processImageFile));
      setAttachedImages(prev => [...prev, ...images].slice(0, 5)); // 最多5张图片
    } catch (error) {
      console.error('处理拖入图片失败:', error);
    }
  }, [processImageFile]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    try {
      const images = await Promise.all(files.map(processImageFile));
      setAttachedImages(prev => [...prev, ...images].slice(0, 5));
    } catch (error) {
      console.error('处理选择图片失败:', error);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processImageFile]);

  // 处理粘贴事件
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      try {
        const images = await Promise.all(
          imageItems.map(item => {
            const file = item.getAsFile();
            if (!file) throw new Error('获取粘贴图片失败');
            return processImageFile(file);
          })
        );
        setAttachedImages(prev => [...prev, ...images].slice(0, 5));
      } catch (error) {
        console.error('处理粘贴图片失败:', error);
      }
    }
  }, [processImageFile]);

  // 移除已附加的图片
  const removeAttachedImage = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 全局粘贴事件监听
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!isOpen || isMinimized) return;

      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();
        try {
          const images = await Promise.all(
            imageItems.map(item => {
              const file = item.getAsFile();
              if (!file) throw new Error('获取粘贴图片失败');
              return processImageFile(file);
            })
          );
          setAttachedImages(prev => [...prev, ...images].slice(0, 5));
        } catch (error) {
          console.error('处理全局粘贴图片失败:', error);
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen, isMinimized, processImageFile]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* 悬浮球 */}
      {!isOpen && (
        <div
          ref={bubbleRef}
          onMouseDown={handleBubbleMouseDown}
          onClick={() => {
            // 只有在没有拖动的情况下才打开对话框
            if (!dragRef.current?.hasMoved) {
              handleOpen();
            }
          }}
          className="fixed z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg cursor-pointer flex items-center justify-center hover:shadow-xl transition-shadow select-none"
          style={{
            left: bubblePosition.x,
            top: bubblePosition.y,
          }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
      )}

      {/* 对话框 */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed z-50 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{
            left: chatPosition.x,
            top: chatPosition.y,
            width: isMinimized ? 280 : chatSize.width,
            height: isMinimized ? 48 : chatSize.height,
            transition: dragRef.current?.isDragging || resizeRef.current?.isResizing ? 'none' : 'height 0.2s ease',
          }}
        >
          {/* 标题栏 */}
          <div
            onMouseDown={handleChatHeaderMouseDown}
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-white/70" />
              <span className="text-white font-medium text-sm">AI助手</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-white" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-white" />
                )}
              </button>
              <button
                onClick={() => {
                  handleCancel();
                  setIsOpen(false);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* 消息区域 */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4 min-h-0">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                          style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="用户上传的图片"
                              className="max-w-full max-h-32 rounded-lg mb-2 object-contain"
                            />
                          )}
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-1.5 h-3 ml-1 bg-current animate-pulse" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* 输入区域 */}
              <div className="p-4 border-t border-gray-100">
                {/* 拖拽区域 */}
                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                  className={`relative border-2 border-dashed rounded-lg p-3 mb-3 transition-colors ${
                    isDraggingOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* 已附加的图片预览 */}
                  {attachedImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attachedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`预览 ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeAttachedImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {attachedImages.length < 5 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center py-2 cursor-pointer"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 text-center">
                        拖拽图片到此处，或点击上传<br />
                        支持粘贴图片 (Ctrl+V)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (isLoading) {
                          handleCancel();
                        } else {
                          sendMessage();
                        }
                      }
                    }}
                    placeholder={attachedImages.length > 0 ? '描述图片或输入消息...' : '输入消息...'}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={isLoading ? handleCancel : sendMessage}
                      disabled={!input.trim() && attachedImages.length === 0 && !isLoading}
                      size="icon"
                      className="h-[60px] w-10"
                    >
                      {isLoading ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={handleClear}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    清空对话
                  </button>
                  <span className="text-xs text-gray-400">
                    {attachedImages.length > 0 ? `已附加 ${attachedImages.length} 张图片 · ` : ''}
                    Enter发送，Shift+Enter换行
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 调整大小手柄 */}
          {!isMinimized && (
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end group"
            >
              <div className="w-3 h-3 border-r-2 border-b-2 border-gray-300 group-hover:border-blue-500 transition-colors" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
