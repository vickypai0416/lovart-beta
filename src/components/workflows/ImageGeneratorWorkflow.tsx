'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, Paperclip, Sparkles, Image as ImageIcon, Download, RefreshCw, Trash2, X, ZoomIn } from 'lucide-react';
import { saveImgGenHistory, getImgGenHistoryWithUrls, deleteImgGenImage, clearImgGenHistory, ImgGenHistoryItem } from '@/lib/history-manager';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';
import { useAnalytics } from '@/hooks/useAnalytics';
import { isRateLimitError } from '@/lib/upstream-api-error';

const compressImageToDataUrl = async (
    file: File,
    maxBytes = 1 * 1024 * 1024,
    maxDimension = 1600
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

    const tryEncode = (quality: number) =>
      canvas.toDataURL('image/jpeg', quality);

    let q = 0.9;
    let dataUrl = tryEncode(q);

    const getBytes = (url: string) => {
      const base64 = url.split(',')[1] || '';
      return Math.floor((base64.length * 3) / 4);
    };

    while (getBytes(dataUrl) > maxBytes && q > 0.4) {
      q -= 0.1;
      dataUrl = tryEncode(q);
    }

    return dataUrl;
  };

export default function ImageGeneratorWorkflow() {
  const { trackGeneration, updateGeneration, isInitialized } = useAnalytics();
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedModel, setSelectedModel] = useState('gpt-image-2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'prompts'>('generator');
  const [imageHistory, setImageHistory] = useState<ImgGenHistoryItem[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [englishPrompt, setEnglishPrompt] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<Array<{id: string; content: string; author?: string; likes: number}>>([]);
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptAuthor, setNewPromptAuthor] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef(false);
  const generationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 从 localStorage 恢复状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      getImgGenHistoryWithUrls().then(setImageHistory);
      
      // 恢复输入状态
      const savedState = localStorage.getItem('imageGeneratorState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.prompt) setPrompt(state.prompt);
          if (state.englishPrompt) setEnglishPrompt(state.englishPrompt);
          if (state.selectedSize) setSelectedSize(state.selectedSize);
          if (state.selectedQuality) setSelectedQuality(state.selectedQuality);
          if (state.selectedCount) setSelectedCount(state.selectedCount);
          if (state.selectedModel) setSelectedModel('gpt-image-2');
        } catch (e) {
          console.warn('恢复图片生成状态失败:', e);
          localStorage.removeItem('imageGeneratorState');
        }
      }
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 自动保存状态到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        prompt,
        englishPrompt,
        selectedSize,
        selectedQuality,
        selectedCount,
        selectedModel,
      };
      try {
        localStorage.setItem('imageGeneratorState', JSON.stringify(state));
      } catch (e) {
        console.warn('保存图片生成状态失败:', e);
        localStorage.removeItem('imageGeneratorState');
      }
    }
  }, [prompt, referenceImages, englishPrompt, selectedSize, selectedQuality, selectedCount, selectedModel]);

  useEffect(() => {
    if (activeTab === 'prompts') {
      fetchPromptTemplates();
    }
  }, [activeTab]);

  const fetchPromptTemplates = async () => {
    try {
      const response = await fetch('/api/prompt-templates');
      const data = await response.json();
      setPromptTemplates(data.templates || []);
    } catch {
      console.error('Failed to fetch templates');
    }
  };

  const savePromptTemplate = async () => {
    if (!newPromptContent.trim()) return;
    try {
      await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPromptContent, author: newPromptAuthor }),
      });
      setNewPromptContent('');
      setNewPromptAuthor('');
      fetchPromptTemplates();
    } catch {
      console.error('Failed to save template');
    }
  };

  const likeTemplate = async (id: string) => {
    try {
      await fetch('/api/prompt-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPromptTemplates();
    } catch {
      console.error('Failed to like template');
    }
  };

  const models = [
    { value: 'gpt-image-2', label: 'GPT Image 2' },
  ];

  const sizes = [
    { value: '1024x1024', label: '1:1 方形' },
    { value: '1024x1536', label: '2:3 竖版' },
    { value: '1536x1024', label: '3:2 横版' },
    { value: '2880x2880', label: '1:1 大方形-九宫格用' },
    { value: '1024x1365', label: '4:3 竖版' },
    { value: '1365x1024', label: '4:3 横版' },
    { value: '1792x1008', label: '16:9 横版' },
    { value: '1008x1792', label: '16:9 竖版' },
  ];

  const presetTemplates = [
    { label: '白底主图', prompt: 'Professional product photography, clean white background, studio lighting, commercial quality, high detail, e-commerce style' },
    { label: '场景展示', prompt: 'Product in lifestyle setting, natural environment, soft lighting, authentic atmosphere, commercial photography' },
    { label: '节日主题', prompt: 'Product with festive holiday decoration, seasonal theme, celebratory atmosphere, gift-ready presentation, warm and inviting mood' },
  ];

  const generateImage = async () => {
    if (isGeneratingRef.current) return;
    if (!prompt.trim() && referenceImages.length === 0) {
      console.log('[Generate] Abort: No prompt and no reference images');
      return;
    }

    console.log('[Generate] generateImage called');
    console.log('[Generate] prompt:', prompt.trim());
    console.log('[Generate] referenceImages:', referenceImages.length, 'images');
    console.log('[Generate] selectedSize:', selectedSize);
    console.log('[Generate] selectedQuality:', selectedQuality);
    console.log('[Generate] selectedCount:', selectedCount);
    console.log('[Generate] selectedModel:', selectedModel);

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImages([]); // 清空之前生成的图片
    const startTime = Date.now();
    const clientRequestId = `image-generator-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const cleanupAndExit = () => {
      console.log(`[Generate] 清理并退出，isGenerating: ${isGeneratingRef.current}`);
      abortControllerRef.current = null;
      isGeneratingRef.current = false;
      setIsGenerating(false);
    };

    try {

    const applyGeneratedImages = async (urls: string[]) => {
      console.log(`[Generate] 图片生成成功: ${urls.length} 张`);
      setGeneratedImages(urls);
      setEnglishPrompt('');
      setGenerationError(null);

      try {
        for (const url of urls) {
          await saveImgGenHistory({
            url,
            prompt: englishPrompt || prompt.trim() || '图片生成',
            size: selectedSize,
            productName: 'Custom Product',
            scene: 'Everyday',
            platform: 'general',
          });
        }

        const updated = await getImgGenHistoryWithUrls();
        setImageHistory(updated);

        if (generationIdRef.current) {
          await updateGeneration(generationIdRef.current, {
            status: 'success',
            imageUrl: urls[0],
            duration: Date.now() - startTime,
          });
        }
      } catch (saveError) {
        console.error('[Generate] 保存历史记录失败:', saveError);
        // 保存失败不影响图片显示
      }
    };

    const recoverGeneratedImage = async () => {
      console.log(`[Generate] 开始恢复轮询，clientRequestId: ${clientRequestId}`);
      for (let i = 0; i < 40; i++) {
        try {
          const response = await fetch(`/api/generate/status?clientRequestId=${encodeURIComponent(clientRequestId)}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          if (!response.ok) {
            console.log(`[Generate] 恢复轮询第 ${i+1} 次: HTTP ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          const data = await response.json().catch((err) => {
            console.error(`[Generate] 恢复轮询解析失败:`, err);
            return null;
          });
          
          console.log(`[Generate] 恢复轮询第 ${i+1} 次:`, data);
          
          if (data?.success && data.status === 'success' && data.url) {
            console.log(`[Generate] 恢复成功，图片URL:`, data.url);
            await applyGeneratedImages([data.url]);
            return true;
          }
          if (data?.success && data.status === 'failed') {
            console.log(`[Generate] 恢复失败:`, data.error);
            setGenerationError(data.error || '图片生成失败');
            return false;
          }
        } catch (err) {
          console.error(`[Generate] 恢复轮询异常:`, err);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log(`[Generate] 恢复轮询超时`);
      return false;
    };

    if (!isInitialized) {
      console.log('[Generate] Waiting for analytics initialization...');
      await Promise.race([
        new Promise((resolve) => {
          const interval = setInterval(() => {
            const id = localStorage.getItem('analytics_session_id');
            if (id) {
              clearInterval(interval);
              resolve(id);
            }
          }, 50);
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    console.log('[Generate] Calling trackGeneration...');
    const generationId = await trackGeneration({
      prompt: englishPrompt || prompt.trim(),
      size: selectedSize,
      quality: selectedQuality,
      model: selectedModel,
      count: selectedCount,
    });
    generationIdRef.current = generationId;
    console.log('[Generate] Tracked generation:', generationId);

    const maxRetries = 0;
    const timeoutMs = 300000;

    abortControllerRef.current = new AbortController();

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        const timeoutId = setTimeout(() => {
          console.log(`[Generate] Timeout after ${timeoutMs}ms, aborting request`);
          abortControllerRef.current?.abort();
        }, timeoutMs);

        abortControllerRef.current.signal.addEventListener('abort', (ev) => {
          console.log(`[Generate] AbortController signal aborted, reason:`, ev);
        });

        console.log(`[Generate] Attempt ${retry + 1}: Sending request to /api/generate`);
        console.log(`[Generate] Request body:`, {
          clientRequestId,
          prompt: englishPrompt || prompt.trim(),
          size: selectedSize,
          quality: selectedQuality,
          n: selectedCount,
          model: selectedModel,
          referenceImageCount: referenceImages.length,
        });

        console.log('[Generate] fetch /api/generate start');
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientRequestId,
            prompt: englishPrompt || prompt.trim(),
            size: selectedSize,
            quality: selectedQuality,
            n: selectedCount,
            model: selectedModel,
            ...(referenceImages.length > 0 ? { referenceImages } : {}),
          }),
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[Generate] Response received, status: ${response.status}`);

        const rawText = await response.text();
        console.log(`[Generate] Response body (first 500 chars):`, rawText.substring(0, 500));
        let result: {
          success?: boolean;
          status?: string;
          url?: string;
          urls?: string[];
          error?: string;
          message?: string;
        } | null = null;

        try {
          result = rawText ? JSON.parse(rawText) : null;
        } catch (parseError) {
          console.error(`[Generate] JSON解析失败:`, parseError);
          if (retry < maxRetries) {
            console.log(`[Generate] 第 ${retry + 1} 次响应非 JSON，正在重试...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          if (await recoverGeneratedImage()) break;
          const safeText = (rawText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const errorMessage = safeText
            ? `服务器返回异常响应：${safeText.substring(0, 100)}`
            : '服务器返回空响应';
          setGenerationError(errorMessage);
          if (generationId) {
            await updateGeneration(generationId, {
              status: 'failed',
              error: errorMessage,
              duration: Date.now() - startTime,
            });
          }
          break;
        }

        console.log(`[Generate] Parsed result summary:`, {
          success: result?.success,
          status: result?.status,
          hasUrl: Boolean(result?.url),
          urlCount: Array.isArray(result?.urls) ? result.urls.length : 0,
          error: result?.error,
          message: result?.message,
        });

        if (response.status === 202 && result?.status === 'pending') {
          console.log(`[Generate] 收到202响应，进入恢复轮询`);
          if (await recoverGeneratedImage()) break;
          setGenerationError('图片仍在生成中，请稍后查看历史记录或重新打开页面');
          break;
        }

        if (response.ok && result) {
          const urls = result.urls || (result.url ? [result.url] : []);

          if (urls.length > 0) {
            console.log(`[Generate] 获取到${urls.length}张图片，应用结果`);
            await applyGeneratedImages(urls);
          } else {
            console.log(`[Generate] 响应成功但未包含图片URL，尝试恢复`);
            if (await recoverGeneratedImage()) break;
            const errorMsg = '生成失败：未获取到图片';
            setGenerationError(errorMsg);
            if (generationId) {
              await updateGeneration(generationId, {
                status: 'failed',
                error: errorMsg,
                duration: Date.now() - startTime,
              });
            }
          }
        } else {
          const errorText = String(result?.error || result?.message || '');
          const rateLimited = isRateLimitError(response.status, errorText);
          console.log(`[Generate] 请求失败，status: ${response.status}, error: ${errorText}, rateLimited: ${rateLimited}`);
          if (retry < maxRetries && !rateLimited) {
            console.log(`[Generate] 第 ${retry + 1} 次请求失败，正在重试...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          if (await recoverGeneratedImage()) break;
          const errorMsg = rateLimited
            ? '生成失败：上游图片生成服务繁忙，请稍后再试，勿重复点击'
            : '生成失败：' + (errorText || '未知错误');
          setGenerationError(errorMsg);
          if (generationId) {
            await updateGeneration(generationId, {
              status: 'failed',
              error: result?.error || result?.message || '未知错误',
              duration: Date.now() - startTime,
            });
          }
        }
        break;
      } catch (error) {
        console.error(`[Generate] 第 ${retry + 1} 次请求失败:`, error);
        console.error(`[Generate] Error type:`, error instanceof Error ? error.name : typeof error);
        console.error(`[Generate] Error stack:`, error instanceof Error ? error.stack : null);

        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[Generate] 请求被中止，可能是超时或手动取消`);
        }

        const rateLimited = error instanceof Error && isRateLimitError(429, error.message);
        if (retry < maxRetries && !rateLimited) {
          console.log(`[Generate] 等待 2 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        if (await recoverGeneratedImage()) break;
        const errorMsg = rateLimited
          ? '生成失败：上游图片生成服务繁忙，请稍后再试，勿重复点击'
          : '生成失败，请重试：' + (error instanceof Error ? error.message : '网络错误');
        setGenerationError(errorMsg);
        if (generationId) {
          await updateGeneration(generationId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '网络错误',
            duration: Date.now() - startTime,
          });
        }
      }
    }
    } finally {
      cleanupAndExit();
    }
  };

  const enhancePrompt = async () => {
    if (referenceImages.length === 0) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: referenceImages }),
      });
      const data = await response.json();
      if (data.prompt) {
        setEnglishPrompt(data.prompt);
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
    }
    setIsEnhancing(false);
  };

  const applyTemplate = (template: { label: string; prompt: string }) => {
    setPrompt(template.prompt);
    setShowTemplates(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImageToDataUrl(file);
          setReferenceImages(prev => [...prev, compressed]);
        } catch {
          console.error('Failed to compress image');
        }
      }
    }
    e.target.value = '';
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const downloadImage = (url?: string) => {
    const targetUrl = url || generatedImages[0];
    if (!targetUrl) return;
    downloadImageByUrl(targetUrl, `generated-${Date.now()}.png`);
  };

  const downloadAllImages = () => {
    downloadMultipleImages(
      generatedImages.map((url, index) => ({
        url,
        filename: `generated-${index + 1}-${Date.now()}.png`,
      }))
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-4 text-gray-400 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
              I
            </div>
            <span className="text-sm font-semibold text-gray-700">图片生成器</span>
          </div>
          <div className="flex border-l border-gray-200 pl-3">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'generator'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              生成
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              历史
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              提示词
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-36 h-8 text-xs border-gray-200">
              <SelectValue placeholder="模型" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="w-28 h-8 text-xs border-gray-200">
              <SelectValue placeholder="尺寸" />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedQuality} onValueChange={setSelectedQuality}>
            <SelectTrigger className="w-24 h-8 text-xs border-gray-200">
              <SelectValue placeholder="画质" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(selectedCount)} onValueChange={(v) => setSelectedCount(Number(v))}>
            <SelectTrigger className="w-20 h-8 text-xs border-gray-200">
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
      </div>

      {activeTab === 'generator' && (
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          {generatedImages.length > 0 || isGenerating ? (
            <div className="space-y-6">
              {generatedImages.length > 0 && (
                  <div className="mt-3 pt-3">
                  {generatedImages.length === 1 ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-100 cursor-pointer" onClick={() => setPreviewImage(generatedImages[0])}>
                      <img
                        src={generatedImages[0]}
                        alt="Generated"
                        className="w-full max-h-96 object-contain bg-gray-50"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadImage(generatedImages[0]); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                          <Download size={14} />
                          下载
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); generateImage(); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                          <RefreshCw size={14} />
                          重新生成
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`grid gap-3 ${generatedImages.length === 2 ? 'grid-cols-2' : generatedImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {generatedImages.map((url, index) => (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-100 cursor-pointer" onClick={() => setPreviewImage(url)}>
                            <img
                              src={url}
                              alt={`Generated ${index + 1}`}
                              className="w-full aspect-square object-contain bg-gray-50"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(url); }}
                                className="p-1.5 bg-black/80 text-white rounded-lg text-xs hover:bg-black transition-colors"
                              >
                                <Download size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={downloadAllImages}
                          className="flex-1 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors justify-center"
                        >
                          <Download size={14} />
                          下载全部 ({generatedImages.length} 张)
                        </button>
                        <button
                          onClick={generateImage}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw size={14} />
                          重新生成
                        </button>
                      </div>
                    </div>
                  )}
                  {generatedImages.length === 1 && (
                    <button
                      onClick={() => downloadImage(generatedImages[0])}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors w-full justify-center"
                    >
                      <Download size={14} />
                      下载图片
                    </button>
                  )}
                </div>
              )}
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-sm">正在生成图片...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm">输入提示词开始生成图片</p>
              <p className="text-xs mt-1">支持中英文提示词</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">生成历史</h3>
            {imageHistory.length > 0 && (
              <button
                onClick={async () => { await clearImgGenHistory(); setImageHistory([]); }}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 size={14} />
                清空全部
              </button>
            )}
          </div>

          {imageHistory.length === 0 ? (
            <div className="border border-gray-100 rounded-2xl p-12 text-center bg-gray-50">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">暂无图片历史</p>
              <p className="text-gray-400 mt-2">
                生成图片后会自动保存到这里
              </p>
              <button
                className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                onClick={() => setActiveTab('generator')}
              >
                开始生成图片
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageHistory.map((item) => {
                const hasImage = Boolean(item.url);
                return (
                  <div key={item.id} className="group relative">
                    <div
                      className={`aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 ${
                        hasImage ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => hasImage && setPreviewImage(item.url)}
                    >
                      {hasImage ? (
                        <img
                          src={item.url}
                          alt={item.prompt || 'Generated'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    {/* 提示词显示 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p 
                        className="text-xs text-white line-clamp-2 cursor-pointer hover:text-blue-200"
                        title={item.prompt}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(item.prompt);
                        }}
                      >
                        {item.prompt}
                      </p>
                    </div>
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      <button
                        onClick={() => hasImage && downloadImage(item.url)}
                        className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => deleteImgGenImage(item.id).then(() => getImgGenHistoryWithUrls().then(setImageHistory))}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">保存提示词模板</h3>
            <textarea
              value={newPromptContent}
              onChange={(e) => setNewPromptContent(e.target.value)}
              placeholder="输入提示词内容..."
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-black"
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newPromptAuthor}
                onChange={(e) => setNewPromptAuthor(e.target.value)}
                placeholder="作者（可选）"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                onClick={savePromptTemplate}
                disabled={!newPromptContent.trim()}
                className="px-4 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-2">已保存的模板</h3>
          {promptTemplates.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无保存的模板</p>
          ) : (
            <div className="space-y-2">
              {promptTemplates.map((template) => (
                <div key={template.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700">{template.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {template.author || '匿名'}
                    </span>
                    <button
                      onClick={() => likeTemplate(template.id)}
                      className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      {template.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 pt-2 border-t border-gray-100">
        {referenceImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {referenceImages.map((img, index) => (
              <div key={index} className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                <img src={img} alt={`参考图 ${index + 1}`} className="w-10 h-10 object-cover rounded" />
                <span className="text-xs text-gray-500">{index + 1}</span>
                <button onClick={() => removeReferenceImage(index)} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {generationError && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{generationError}</span>
            <button onClick={() => setGenerationError(null)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating) generateImage();
                }
              }}
              placeholder="描述你想要生成的图片..."
              className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-black min-h-[48px] max-h-32"
              rows={1}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {referenceImages.length > 0 && (
                <button
                  onClick={enhancePrompt}
                  disabled={isEnhancing}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                  title="AI 优化提示词"
                >
                  <Sparkles size={18} className={isEnhancing ? 'animate-pulse' : ''} />
                </button>
              )}
              {isGenerating ? (
                <button
                  onClick={() => {}}
                  className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                </button>
              ) : (
                <button
                  onClick={generateImage}
                  disabled={!prompt.trim() && referenceImages.length === 0}
                  className={`p-2 rounded-full transition-all ${
                    prompt.trim() || referenceImages.length > 0
                      ? 'bg-black text-white hover:bg-gray-800 shadow-md'
                      : 'bg-gray-200 text-white cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors" title="上传参考图">
              <Paperclip size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                title="预设模板"
              >
                <ImageIcon size={18} />
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">商品图场景模板</div>
                    {presetTemplates.map((template) => (
                      <button
                        key={template.label}
                        onClick={() => applyTemplate(template)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
