'use client';

import React from 'react';
import { Copy, Sparkles, XCircle } from 'lucide-react';
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
  onGenerateSingleImage?: (messageId: string, planIndex: number, referenceImage: string) => void;
  onCancelRequest?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

function fallbackParseAmazonPlan(content: string): GeneratedImagePlan[] {
  if (!content || typeof content !== 'string') return [];
  const normalized = content.replace(/[-–—]/g, '-');
  const plans: GeneratedImagePlan[] = [];
  const used = new Set<number>();

  for (let i = 1; i <= 9; i++) {
    if (used.has(i)) continue;
    
    const regex1 = new RegExp(`Image\\s*${i}\\s*-\\s*([\\s\\S]*?)(?=Image\\s*${i + 1}\\s*-|$)`, 'i');
    let match = normalized.match(regex1);
    
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
      used.add(i);
    } else {
      const regex2 = new RegExp(`^\\s*${i}\\s*[\\.\\、\\)]\\s*([^\\n]+)`, 'm');
      match = normalized.match(regex2);
      if (match) {
        const title = match[1].trim().split('\n')[0].slice(0, 60);
        if (title) {
          plans.push({
            index: i,
            title,
            prompt: `专业亚马逊产品摄影，${title}，cinematic commercial photography风格`,
            status: 'pending',
          });
          used.add(i);
        }
      }
    }
  }
  return plans;
}

function shouldRenderAmazonPlanButton(content: string): boolean {
  if (!content) return false;
  const normalized = content.replace(/[-–—]/g, '-');
  const hasKeyword =
    normalized.includes('6图亚马逊视觉方案') ||
    normalized.includes('9图亚马逊视觉方案') ||
    normalized.includes('Image 1 -') ||
    normalized.includes('亚马逊定制商品视觉方案') ||
    normalized.includes('最终生图提示词');
  if (hasKeyword) return true;
  const hasList = /^\s*1\s*[\.\、\)]/m.test(normalized) && /^\s*2\s*[\.\、\)]/m.test(normalized);
  return hasList;
}

const ChatMessages = React.memo<ChatMessagesProps>(({ 
  messages, 
  onCopyContent, 
  onGenerateFromPlan,
  onGenerateSingleImage,
  onCancelRequest,
  scrollRef,
  onScroll,
}) => {
  return (
    <ErrorBoundary>
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-6">
          {messages.filter(m => m.id !== 'welcome').map((message) => {
            const validUserImages = (message.userImages || []).filter((img) => typeof img === 'string' && img.trim().length > 0);
            const validGeneratedImages = (message.imageUrls || []).filter((img) => typeof img === 'string' && img.trim().length > 0);
            let validPlanImages = (message.planImages || []).filter((plan) => !!plan && typeof plan === 'object');
            if (validPlanImages.length === 0 && message.role === 'assistant' && shouldRenderAmazonPlanButton(message.content)) {
              validPlanImages = fallbackParseAmazonPlan(message.content);
            }

            return (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gray-100 text-gray-900 rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                  }`}
                >
                  {validUserImages.length > 0 && (
                    <div className="mb-3">
                      {validUserImages.length === 1 ? (
                        <img
                          src={validUserImages[0]}
                          alt="Uploaded"
                          className="max-w-full max-h-48 rounded-lg object-contain cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/uri-list', validUserImages[0]);
                            e.dataTransfer.setData('text/plain', validUserImages[0]);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {validUserImages.map((img, imgIdx) => (
                            <div key={`${message.id}-user-${imgIdx}`} className="relative">
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
                  {validGeneratedImages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {validGeneratedImages.length === 1 ? (
                        <img
                          src={validGeneratedImages[0]}
                          alt="Generated"
                          className="max-w-full max-h-64 rounded-lg object-contain cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/uri-list', validGeneratedImages[0]);
                            e.dataTransfer.setData('text/plain', validGeneratedImages[0]);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                        />
                      ) : (
                        <div className="grid gap-2 grid-cols-2">
                          {validGeneratedImages.map((url, idx) => (
                            <div key={`${message.id}-gen-${idx}`} className="relative">
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
                  {validPlanImages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">📋 亚马逊{validPlanImages.length}图视觉方案</span>
                        {validPlanImages.some(img => img.status === 'generating') && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">生成中...</span>
                            <button
                              onClick={onCancelRequest}
                              className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {validPlanImages.map((plan, idx) => (
                          <div key={`${message.id}-plan-${plan.index}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group">
                            {plan.status === 'completed' && plan.imageUrl && plan.imageUrl.trim().length > 0 ? (
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
                                <span className="text-xs text-gray-500 mb-2">生成失败</span>
                                {onGenerateSingleImage && (
                                  <button
                                    onClick={() => {
                                      const msgIndex = messages.findIndex(m => m.id === message.id);
                                      let refImage: string | undefined;
                                      for (let i = msgIndex - 1; i >= 0; i--) {
                                        const m = messages[i];
                                        if (m.role === 'user' && m.userImages && m.userImages.length > 0) {
                                          refImage = m.userImages.find((img) => typeof img === 'string' && img.trim().length > 0);
                                          if (refImage) break;
                                        }
                                      }
                                      if (refImage) {
                                        onGenerateSingleImage(message.id, plan.index, refImage);
                                      }
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-600 underline"
                                  >
                                    重试
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <span className="text-xs text-gray-600 text-center font-medium">{plan.title}</span>
                                <span className="text-[10px] text-gray-400 mt-1 line-clamp-2">{plan.prompt.substring(0, 50)}...</span>
                                {onGenerateSingleImage && (
                                  <button
                                    onClick={() => {
                                      const msgIndex = messages.findIndex(m => m.id === message.id);
                                      let refImage: string | undefined;
                                      for (let i = msgIndex - 1; i >= 0; i--) {
                                        const m = messages[i];
                                        if (m.role === 'user' && m.userImages && m.userImages.length > 0) {
                                          refImage = m.userImages.find((img) => typeof img === 'string' && img.trim().length > 0);
                                          if (refImage) break;
                                        }
                                      }
                                      if (refImage) {
                                        onGenerateSingleImage(message.id, plan.index, refImage);
                                      } else {
                                        alert('请先上传产品图片');
                                      }
                                    }}
                                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 underline"
                                  >
                                    生成此图
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium">
                              {plan.index}
                            </div>
                          </div>
                        ))}
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
            );
          })}
        </div>
      </div>
    </ErrorBoundary>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
