'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, Paperclip, Sparkles, Image as ImageIcon, Download, RefreshCw, Trash2, X, History, Eye } from 'lucide-react';
import { saveImgGenHistory, getImgGenHistoryWithUrls, deleteImgGenImage, clearImgGenHistory, ImgGenHistoryItem } from '@/lib/history-manager';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ImageGeneratorWorkflow() {
  const { trackGeneration, updateGeneration, isInitialized } = useAnalytics();
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedModel, setSelectedModel] = useState('gpt-image-2-all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [imageHistory, setImageHistory] = useState<ImgGenHistoryItem[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [englishPrompt, setEnglishPrompt] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      getImgGenHistoryWithUrls().then(setImageHistory);
    }
  }, []);

  const sizes = [
    { value: '1024x1024', label: '1024×1024 (1:1)' },
    { value: '1536x1024', label: '1536×1024 (3:2)' },
    { value: '1024x1536', label: '1024×1536 (2:3)' },
    { value: '2000x1125', label: '2000×1125 (16:9)' },
    { value: '1125x2000', label: '1125×2000 (9:16)' },
    { value: '2000x2000', label: '2000×2000 (1:1 高清)' },
  ];

  const models = [
    { value: 'gpt-image-2-all', label: 'GPT Image 2 All' },
  ];

  const presetTemplates = [
    { label: '主图白底', prompt: 'Professional product photography on pure white background, studio lighting, centered composition, clean and minimal, Amazon main image style, high resolution product shot' },
    { label: '场景图', prompt: 'Product in lifestyle scene, natural environment setting, warm ambient lighting, contextual usage display, professional e-commerce photography' },
    { label: '细节图', prompt: 'Extreme close-up product detail shot, macro photography, highlighting texture and material quality, sharp focus, professional studio lighting' },
    { label: '生活方式图', prompt: 'Product in real-life usage scenario, model interacting with product, aspirational lifestyle setting, natural lighting, editorial photography style' },
    { label: '对比图', prompt: 'Before and after comparison, split composition showing product effectiveness, clean layout, professional advertising style' },
    { label: '节日主题', prompt: 'Product with festive holiday decoration, seasonal theme, celebratory atmosphere, gift-ready presentation, warm and inviting mood' },
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;

    console.log('[Analytics] ImageGeneratorWorkflow: generateImage called');
    setIsGenerating(true);
    const startTime = Date.now();

    // 确保 analytics 初始化完成
    if (!isInitialized) {
      console.log('[Analytics] ImageGeneratorWorkflow: Waiting for initialization...');
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

    console.log('[Analytics] ImageGeneratorWorkflow: Calling trackGeneration...');
    const generationId = await trackGeneration({
      prompt: englishPrompt || prompt.trim(),
      size: selectedSize,
      quality: selectedQuality,
      model: selectedModel,
      count: selectedCount,
    });
    generationIdRef.current = generationId;
    console.log('[Analytics] ImageGeneratorWorkflow: Tracked generation:', generationId);

    const maxRetries = 2;
    const timeoutMs = 60000; // 60秒超时

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: englishPrompt || prompt.trim(),
            size: selectedSize,
            quality: selectedQuality,
            n: selectedCount,
            model: selectedModel,
            ...(referenceImage ? { referenceImage } : {}),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (result.success) {
          const urls = result.urls || (result.url ? [result.url] : []);
          if (urls.length > 0) {
            for (const url of urls) {
              await saveImgGenHistory(url, prompt.trim(), selectedSize, selectedModel);
            }
            const updatedHistory = await getImgGenHistoryWithUrls();
            setImageHistory(updatedHistory);
            setGeneratedImages(urls);
            setEnglishPrompt('');
            
            if (generationId) {
              await updateGeneration(generationId, {
                status: 'success',
                imageUrl: urls[0],
                duration: Date.now() - startTime,
              });
            }
          } else {
            const errorMsg = '生成失败: 未获取到图片';
            alert(errorMsg);
            if (generationId) {
              await updateGeneration(generationId, {
                status: 'failed',
                error: errorMsg,
                duration: Date.now() - startTime,
              });
            }
          }
        } else {
          if (retry < maxRetries) {
            console.log(`[Generate] 第 ${retry + 1} 次请求失败，正在重试...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          const errorMsg = '生成失败: ' + (result.error || '未知错误');
          alert(errorMsg);
          if (generationId) {
            await updateGeneration(generationId, {
              status: 'failed',
              error: result.error || '未知错误',
              duration: Date.now() - startTime,
            });
          }
        }
        break;
      } catch (error) {
        console.error(`[Generate] 第 ${retry + 1} 次请求失败:`, error);
        if (retry < maxRetries) {
          console.log(`[Generate] 等待 2 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        const errorMsg = '生成失败，请重试: ' + (error instanceof Error ? error.message : '网络错误');
        alert(errorMsg);
        if (generationId) {
          await updateGeneration(generationId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '网络错误',
            duration: Date.now() - startTime,
          });
        }
      }
    }

    setIsGenerating(false);
  };

  const enhancePrompt = async () => {
    if (!referenceImage) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: referenceImage,
          userDescription: prompt.trim() || undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPrompt(result.displayPrompt || '');
        setEnglishPrompt(result.prompt || '');
      } else {
        alert('AI识别失败: ' + (result.error || '请重试'));
      }
    } catch (error) {
      console.error('AI识别失败:', error);
      alert('AI识别失败，请重试');
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyTemplate = (template: typeof presetTemplates[number]) => {
    setPrompt(template.prompt);
    setEnglishPrompt('');
    setShowTemplates(false);
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
              className={`px-3 py-1 text-xs font-medium rounded-l-lg transition-colors ${
                activeTab === 'generator' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              图片生成
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-xs font-medium rounded-r-lg transition-colors flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <History size={12} />
              图片历史 ({imageHistory.length})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-36 h-8 text-xs border-gray-200">
              <SelectValue placeholder="选择模型" />
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
            <SelectTrigger className="w-36 h-8 text-xs border-gray-200">
              <SelectValue placeholder="选择尺寸" />
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
                    <div className="relative group rounded-xl overflow-hidden border border-gray-100">
                      <img
                        src={generatedImages[0]}
                        alt="Generated"
                        className="w-full max-h-96 object-contain bg-gray-50"
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadImage(generatedImages[0])}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                          <Download size={14} />
                          下载
                        </button>
                        <button
                          onClick={generateImage}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
                        >
                          <RefreshCw size={14} />
                          重新生成
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`grid gap-3 ${generatedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {generatedImages.map((url, index) => (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-100">
                            <img
                              src={url}
                              alt={`Generated ${index + 1}`}
                              className="w-full aspect-square object-contain bg-gray-50"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => downloadImage(url)}
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
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          <div className="space-y-6">
            <div className="py-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">图片历史</h3>
              <p className="text-gray-400 text-center font-light">共 {imageHistory.length} 张历史图片</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                点击图片可放大查看，悬停可删除
              </span>
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
                {imageHistory.map((item) => (
                  <div key={item.id} className="group relative">
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setGeneratedImages([item.url]);
                        setActiveTab('generator');
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/70 text-[10px]">{item.size}</span>
                          <span className="text-white/70 text-[10px]">·</span>
                          <span className="text-white/70 text-[10px]">{item.model}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteImgGenImage(item.id);
                        setImageHistory(await getImgGenHistoryWithUrls());
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="p-6 pt-2">
          <div className="relative border border-gray-200 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图片..."
              className="w-full h-24 p-4 resize-none outline-none text-gray-700 placeholder-gray-300 bg-transparent rounded-t-2xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating) generateImage();
                }
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  setReferenceImage(event.target?.result as string);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
            {referenceImage && (
              <div className="px-4 py-2 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                    <img src={referenceImage} alt="参考图" className="w-10 h-10 object-cover rounded" />
                    <span className="text-xs text-gray-500">参考图</span>
                    <button
                      onClick={() => { setReferenceImage(null); setEnglishPrompt(''); }}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    onClick={enhancePrompt}
                    disabled={isEnhancing}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isEnhancing
                        ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm'
                    }`}
                  >
                    <Sparkles size={14} className={isEnhancing ? 'animate-pulse' : ''} />
                    {isEnhancing ? 'AI识别中...' : 'AI识别生成提示词'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50">
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
              <div className="flex items-center gap-2">
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
                    disabled={!prompt.trim()}
                    className={`p-2 rounded-full transition-all ${
                      prompt.trim()
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
      )}
    </div>
  );
}
