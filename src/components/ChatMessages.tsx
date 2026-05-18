'use client';

import React from 'react';
import { Copy, Sparkles } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';

interface GeneratedImagePlan {
  index: number;
  title: string;
  prompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'error';
  error?: string;
}

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

interface ChatMessagesProps {
  messages: Message[];
  onCopyContent: (content: string) => void;
  onGenerateFromPlan: (messageId: string, referenceImage: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const ChatMessages = React.memo<ChatMessagesProps>(({
  messages,
  onCopyContent,
  onGenerateFromPlan,
  scrollRef,
  onScroll,
}) => {
  return (
    <ErrorBoundary>
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-6 pb-4">
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
                      onClick={() => onCopyContent(message.content)}
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
                {message.isAmazonPlan && message.planImages && message.planImages.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">📋 亚马逊6图视觉方案</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          const userMsg = messages.find(m => m.id !== 'welcome' && m.role === 'user');
                          if (userMsg?.userImages?.[0]) {
                            onGenerateFromPlan(message.id, userMsg.userImages[0]);
                          }
                        }}
                        disabled={message.planImages.some(img => img.status === 'generating')}
                        className="flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {message.planImages.some(img => img.status === 'generating') ? '生成中...' : '按照方案生成图片'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {message.planImages.map((plan) => {
                        if (!plan || typeof plan !== 'object') return null;
                        return (
                          <div key={plan.index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                            {plan.status === 'completed' && plan.imageUrl ? (
                              <img
                                src={plan.imageUrl}
                                alt={plan.title || ''}
                                className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/uri-list', plan.imageUrl!);
                                  e.dataTransfer.setData('text/plain', plan.imageUrl!);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                              />
                            ) : plan.status === 'generating' ? (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="flex gap-1 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-gray-500">生成中...</span>
                              </div>
                            ) : plan.status === 'failed' ? (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <span className="text-2xl mb-2">❌</span>
                                <span className="text-xs text-gray-500">生成失败</span>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <span className="text-xs text-gray-600 text-center font-medium">{plan.title}</span>
                                <span className="text-[10px] text-gray-400 mt-1 line-clamp-2">{plan.prompt.substring(0, 50)}...</span>
                              </div>
                            )}
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium">
                              {plan.index}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;