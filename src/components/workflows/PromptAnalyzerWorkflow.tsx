
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  Loader2,
  X,
  FileImage,
  Wand2,
  Download,
  ZoomIn,
  ImageIcon as ImageIconLucide,
  RefreshCw,
  Edit3,
  Save,
} from 'lucide-react';

const ANALYSIS_STYLES = [
  { id: 'detailed', name: '详细描述', description: '完整的风格描述，适合精细控制' },
  { id: 'concise', name: '简洁提示词', description: '精简关键词，适合快速生成' },
];

const IMAGE_SIZE_OPTIONS = [
  { id: '1:1', name: '1:1 方形', size: '1024x1024', description: '适合社交媒体' },
  { id: '4:3', name: '4:3 横版', size: '1024x768', description: '适合产品展示' },
  { id: '16:9', name: '16:9 宽屏', size: '1920x1080', description: '适合横屏展示' },
];

interface AnalysisResult {
  prompt: string;
  style: string;
  timestamp: Date;
}

export default function PromptAnalyzerWorkflow() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('detailed');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [productImage, setProductImage] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['1:1']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ size: string; url: string }[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const analyzeAbortControllerRef = useRef<AbortController | null>(null);
  const generateAbortControllerRef = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const productDragCounterRef = useRef(0);
  const [isProductDragging, setIsProductDragging] = useState(false);

  const STORAGE_KEY = 'prompt_analyzer_workflow_state';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.timestamp && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          if (state.uploadedImage) setUploadedImage(state.uploadedImage);
          if (state.analysisResult) {
            const result = state.analysisResult;
            if (typeof result.timestamp === 'string') result.timestamp = new Date(result.timestamp);
            setAnalysisResult(result);
          }
          if (state.productName) setProductName(state.productName);
          if (state.refinedPrompt) setRefinedPrompt(state.refinedPrompt);
          if (state.productImage) setProductImage(state.productImage);
          if (state.selectedStyle) setSelectedStyle(state.selectedStyle);
          if (state.selectedSizes) setSelectedSizes(state.selectedSizes);
        }
      }
    } catch (e) {
      console.warn('Failed to restore state:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const state = {
        timestamp: Date.now(),
        uploadedImage,
        analysisResult,
        productName,
        refinedPrompt,
        productImage,
        selectedStyle,
        selectedSizes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [uploadedImage, analysisResult, productName, refinedPrompt, productImage, selectedStyle, selectedSizes]);

  const clearSavedState = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const compressImage = useCallback((base64: string, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('图片压缩失败'));
      img.src = base64;
    });
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片大小不能超过10MB'); return; }
    setError(null);
    setAnalysisResult(null);
    setProductName('');
    setRefinedPrompt(null);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  }, [handleFileSelect]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleClickUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounterRef.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleProductDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    productDragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsProductDragging(true);
  };
  const handleProductDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    productDragCounterRef.current--;
    if (productDragCounterRef.current === 0) setIsProductDragging(false);
  };
  const handleProductDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleProductDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsProductDragging(false); productDragCounterRef.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && isStep3Ready) handleProductFileSelect(files[0]);
  };

  const clearImage = () => {
    setUploadedImage(null); setAnalysisResult(null); setProductName('');
    setRefinedPrompt(null); setError(null); setProductImage(null);
    setGeneratedImages([]); setGenerateError(null); clearSavedState();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (productFileInputRef.current) productFileInputRef.current.value = '';
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;
    if (analyzeAbortControllerRef.current) analyzeAbortControllerRef.current.abort();
    analyzeAbortControllerRef.current = new AbortController();
    const signal = analyzeAbortControllerRef.current.signal;

    setIsAnalyzing(true); setError(null); setAnalysisResult(null);
    setProductName(''); setRefinedPrompt(null);

    const systemPrompt = selectedStyle === 'detailed' 
      ? `你是一个专业的AI图像风格分析专家。请仔细分析用户上传的图片，提取出完整的风格特征。

请按以下格式输出（使用中文）：

**构图分析**
- 画面布局、主体位置、视觉重心

**色彩特征**
- 主色调、配色方案、色彩情感

**光影效果**
- 光线方向、阴影处理、氛围营造

**风格元素**
- 艺术风格、设计语言、视觉特征

**生成提示词**
请输出一个详细的中文提示词，用于生成类似风格的图片。提示词应包含：
主体描述、场景环境、光线设置、色彩方案、构图方式、艺术风格、画质要求等关键要素。`
      : `你是一个专业的AI图像风格分析专家。请分析用户上传的图片，提取关键风格特征并输出简洁的提示词。

请输出以下内容（使用中文）：
1. 简要风格描述（2-3句话）
2. 简洁提示词（关键词形式，用逗号分隔，适合AI绘图使用）`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张图片的风格特征，并生成可用于AI绘图的提示词。' },
              { type: 'image_url', image_url: { url: uploadedImage } }
            ]
          }],
          model: 'gpt-5-nano',
          persona: 'default',
        }),
        signal,
      });

      if (signal.aborted) return;
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '分析失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (signal.aborted) return;
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'error') throw new Error(data.message);
              if (data.type === 'text' && data.content) {
                accumulatedContent = data.content;
                setAnalysisResult({ prompt: accumulatedContent, style: selectedStyle, timestamp: new Date() });
              }
            } catch {}
          }
        }
      }

      if (accumulatedContent) {
        setAnalysisResult({ prompt: accumulatedContent, style: selectedStyle, timestamp: new Date() });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      if (!signal.aborted) setIsAnalyzing(false);
      analyzeAbortControllerRef.current = null;
    }
  };

  const refinePrompt = useCallback(async () => {
    if (isAnalyzing) { setAlertMessage('正在分析图片，请稍候...'); return; }
    if (!analysisResult?.prompt) { setAlertMessage('请先上传并分析图片'); return; }
    if (!productName.trim()) { setAlertMessage('请输入产品名称'); return; }

    setIsRefining(true); setRefineError(null); setRefinedPrompt(null);

    const systemPrompt = `你是一个专业的电商产品图提示词专家。用户会提供：
1. 一个基础的风格提示词
2. 一个产品名称
${productImage ? '3. 一张产品图片' : ''}

请根据这些信息，生成一个专业的、适合AI绘图的产品图提示词。

要求：
- 保持原风格的核心特征
- 突出产品特点
- 符合电商产品图标准（清晰、专业、吸引人）
- 使用中文输出
- 输出格式：直接输出提示词，不需要其他解释`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: `基础风格提示词：\n${analysisResult.prompt}\n\n产品名称：${productName.trim()}\n\n请生成适合这个产品的专业商品图提示词。` }
    ];

    if (productImage) {
      content.push({ type: 'image_url', image_url: { url: productImage } });
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          model: 'gpt-5-nano',
          persona: 'default',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '生成提示词失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text' && data.content) {
                accumulatedContent = data.content;
                setRefinedPrompt(accumulatedContent);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : '生成提示词失败');
      setRefinedPrompt(null);
    } finally {
      setIsRefining(false);
    }
  }, [productName, analysisResult?.prompt, isAnalyzing, productImage]);

  const copyPrompt = async () => {
    const textToCopy = refinedPrompt || analysisResult?.prompt;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProductFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setGenerateError('请上传图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setGenerateError('图片大小不能超过10MB'); return; }
    setGenerateError(null); setGeneratedImages([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try { setProductImage(await compressImage(base64, 1024)); }
      catch { setProductImage(base64); }
    };
    reader.readAsDataURL(file);
  }, [compressImage]);

  const clearProductImage = () => {
    setProductImage(null); setGeneratedImages([]); setGenerateError(null);
    if (productFileInputRef.current) productFileInputRef.current.value = '';
  };

  const getFinalPrompt = () => refinedPrompt || analysisResult?.prompt || '';

  useEffect(() => {
    return () => {
      if (analyzeAbortControllerRef.current) { analyzeAbortControllerRef.current.abort(); analyzeAbortControllerRef.current = null; }
      if (generateAbortControllerRef.current) { generateAbortControllerRef.current.abort(); generateAbortControllerRef.current = null; }
    };
  }, []);

  const handleGenerateImage = async () => {
    const finalPrompt = getFinalPrompt();
    if (!finalPrompt) { setGenerateError('请先分析图片'); return; }
    if (selectedSizes.length === 0) { setGenerateError('请选择至少一个尺寸'); return; }

    if (generateAbortControllerRef.current) generateAbortControllerRef.current.abort();
    generateAbortControllerRef.current = new AbortController();
    const signal = generateAbortControllerRef.current.signal;

    setIsGenerating(true); setGenerateError(null); setGeneratedImages([]);

    try {
      let compressedImage: string | undefined;
      if (productImage) {
        try { compressedImage = await compressImage(productImage, 1024); }
        catch (e) { console.warn('图片压缩失败，使用原图:', e); compressedImage = productImage; }
      }

      const generatePromises = selectedSizes.map(async (sizeId) => {
        const sizeConfig = IMAGE_SIZE_OPTIONS.find(s => s.id === sizeId);
        try {
          const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: 'text', text: finalPrompt }
          ];

          if (compressedImage) {
            content.push({ type: 'image_url', image_url: { url: compressedImage } });
          }

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content }],
              model: 'gpt-image-2-edit',
              size: sizeConfig?.size || '1024x1024',
              quality: 'high',
              n: 1,
            }),
            signal,
          });

          if (signal.aborted) return { size: sizeId, error: 'Request aborted' };
          if (!response.ok) {
            let errorMsg = `请求失败 (${response.status})`;
            try { const errorJson = await response.json(); errorMsg = errorJson.error || errorMsg; } catch {}
            return { size: sizeId, error: errorMsg };
          }

          const reader = response.body?.getReader();
          if (!reader) return { size: sizeId, error: '无法读取响应' };

          const decoder = new TextDecoder();
          let imageUrl: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'image' && data.url) {
                    imageUrl = data.url;
                  }
                } catch {}
              }
            }
          }

          if (imageUrl) return { size: sizeId, url: imageUrl };
          return { size: sizeId, error: '图片生成失败' };
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return { size: sizeId, error: 'Request aborted' };
          return { size: sizeId, error: err instanceof Error ? err.message : '图片生成失败' };
        }
      });

      const results = await Promise.all(generatePromises);
      if (signal.aborted) return;

      const successResults = results.filter((r): r is { size: string; url: string } => 'url' in r);
      const failedResults = results.filter((r): r is { size: string; error: string } => 'error' in r && r.error !== 'Request aborted');

      if (successResults.length > 0) {
        setGeneratedImages(successResults);
        setProductImage(null);
        if (productFileInputRef.current) productFileInputRef.current.value = '';
      }
      if (failedResults.length > 0) {
        setGenerateError(`部分生成失败: ${failedResults.map(r => `${r.size}: ${r.error}`).join('; ')}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setGenerateError(err instanceof Error ? err.message : '图片生成失败，请重试');
    } finally {
      if (!signal.aborted) setIsGenerating(false);
      generateAbortControllerRef.current = null;
    }
  };

  const downloadGeneratedImage = async (url: string, size: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-${size}-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { console.error('Download failed:', err); }
  };

  const isStep3Ready = !!(refinedPrompt || analysisResult?.prompt);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="border-b border-slate-200/50 bg-white/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">提示词分析助手</h1>
              <p className="text-xs text-slate-500">上传参考图，提取风格，一键生成你的产品图</p>
            </div>
          </div>
          {(uploadedImage || productImage || generatedImages.length > 0) && (
            <button
              onClick={clearImage}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4" />
              清除全部
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-3 gap-4">
          <div className="flex min-h-0 flex-col rounded-xl border-0 bg-white/80 shadow-lg backdrop-blur-sm">
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">1</div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">上传参考图</h3>
                  <p className="text-xs text-slate-500">选择喜欢的风格图，AI将提取风格特征</p>
                </div>
              </div>

              <div
                className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
                onClick={handleClickUpload}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {uploadedImage ? (
                  <div className="relative h-full w-full">
                    <img src={uploadedImage} alt="参考图" className="h-full w-full rounded-lg object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded bg-indigo-500/90 px-2 py-1 text-xs text-white">参考图</div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                      <Upload className="h-7 w-7 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">点击上传参考图</p>
                    <p className="mt-1 text-xs text-slate-500">支持 Ctrl+V 粘贴</p>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">提示词风格</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ANALYSIS_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`rounded-lg border p-2 text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-700">{style.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={analyzeImage}
                disabled={!uploadedImage || isAnalyzing}
                className="mt-3 h-10 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-medium text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" />分析中...</>
                  : <><Sparkles className="h-4 w-4" />开始分析</>}
              </button>

              {error && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className={`flex min-h-0 flex-col rounded-xl shadow-lg backdrop-blur-sm transition-all ${
            analysisResult ? 'bg-white/80 ring-2 ring-purple-500/30'
              : 'bg-slate-100/80 opacity-60'
          }`}>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">2</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">定制提示词<span className="text-slate-400 font-normal">（可选）</span></h3>
                    <p className="text-xs text-slate-500">输入产品名称，AI将生成专属提示词</p>
                  </div>
                </div>
                {analysisResult && (
                  <button onClick={copyPrompt} className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    {copied ? <><Check className="h-3 w-3 text-green-500" />已复制</> : <><Copy className="h-3 w-3" />复制</>}
                  </button>
                )}
              </div>

              {analysisResult && !refinedPrompt && (
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                  <p className="text-xs text-blue-700">💡 如果第一步生成的提示词已满足需求，可直接跳到第三步生成图片</p>
                </div>
              )}

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">你的产品名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="如：不锈钢保温杯"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      if (e.target.value !== productName) { setRefinedPrompt(null); setRefineError(null); }
                    }}
                    disabled={!analysisResult || isAnalyzing}
                    className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={refinePrompt}
                    disabled={isAnalyzing || isRefining}
                    className="h-9 shrink-0 rounded-md bg-purple-500 px-3 text-xs text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isRefining ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Wand2 className="h-3 w-3" />生成提示词</>}
                  </button>
                </div>
                {refineError && <p className="mt-1 text-xs text-red-500">{refineError}</p>}
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {isEditing ? (
                  <div className="flex h-full flex-col p-2">
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="flex-1 min-h-0 resize-none border-0 bg-transparent p-1 text-xs focus:outline-none"
                      placeholder="编辑提示词..."
                    />
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-200">
                      <button onClick={() => { setIsEditing(false); setEditedPrompt(''); }} className="rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">取消</button>
                      <button onClick={() => { setRefinedPrompt(editedPrompt); setIsEditing(false); }} className="rounded-md bg-purple-500 px-2 py-1 text-xs text-white hover:bg-purple-600 flex items-center gap-1">
                        <Save className="h-3 w-3" />保存
                      </button>
                    </div>
                  </div>
                ) : refinedPrompt ? (
                  <div className="h-full overflow-y-auto p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600">已生成</span>
                      </div>
                      <button onClick={() => { setEditedPrompt(refinedPrompt); setIsEditing(true); }} className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700">
                        <Edit3 className="h-3 w-3" />编辑
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{refinedPrompt}</p>
                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <p className="text-xs text-slate-400">产品：{productName}</p>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="h-full overflow-y-auto p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs text-slate-400">风格提示词（输入产品名称后点击"生成提示词"）：</p>
                      <button onClick={() => { setEditedPrompt(analysisResult.prompt); setIsEditing(true); }} className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700">
                        <Edit3 className="h-3 w-3" />编辑
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{analysisResult.prompt}</p>
                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{ANALYSIS_STYLES.find((s) => s.id === analysisResult.style)?.name}</span>
                        <span>•</span>
                        <span>{analysisResult.timestamp instanceof Date ? analysisResult.timestamp.toLocaleTimeString('zh-CN') : new Date(analysisResult.timestamp).toLocaleTimeString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <FileImage className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">等待分析</p>
                    <p className="mt-1 text-xs text-slate-400">上传参考图后点击分析</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`flex min-h-0 flex-col rounded-xl shadow-lg backdrop-blur-sm transition-all ${
            isStep3Ready ? 'bg-white/80 ring-2 ring-green-500/30'
              : 'bg-slate-100/80 opacity-60'
          }`}>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">3</div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">生成图片</h3>
                  <p className="text-xs text-slate-500">应用风格生成你的产品图</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-xs font-medium text-slate-600">产品图（可选）</label>
                  <span className="text-[10px] text-slate-400">上传后可保持产品外观一致</span>
                </div>
                <div
                  className={`relative flex h-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                    isStep3Ready
                      ? isProductDragging ? 'border-green-500 bg-green-50'
                        : 'border-slate-300 hover:border-green-400'
                      : 'border-slate-200 cursor-not-allowed'
                  }`}
                  onClick={() => isStep3Ready && productFileInputRef.current?.click()}
                  onDragEnter={handleProductDragEnter}
                  onDragLeave={handleProductDragLeave}
                  onDragOver={handleProductDragOver}
                  onDrop={handleProductDrop}
                >
                  <input ref={productFileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleProductFileSelect(file); }} className="hidden" disabled={!isStep3Ready} />
                  {productImage ? (
                    <div className="relative h-full w-full p-1">
                      <img src={productImage} alt="产品图" className="h-full w-full rounded object-contain" />
                      <button onClick={(e) => { e.stopPropagation(); clearProductImage(); }} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white">
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-green-500/90 px-1.5 py-0.5 text-[10px] text-white">产品图</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-4 w-4 text-slate-400" />
                      <p className="mt-0.5 text-[10px] text-slate-500">点击或拖动上传</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">图片尺寸</label>
                  <span className="text-[10px] text-slate-400">{selectedSizes.length > 0 ? `已选 ${selectedSizes.length} 个` : '请选择'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {IMAGE_SIZE_OPTIONS.map(size => {
                    const isSelected = selectedSizes.includes(size.id);
                    return (
                      <button
                        key={size.id}
                        onClick={() => {
                          if (isSelected) { if (selectedSizes.length > 1) setSelectedSizes(prev => prev.filter(s => s !== size.id)); }
                          else setSelectedSizes(prev => [...prev, size.id]);
                        }}
                        disabled={!isStep3Ready}
                        title={size.description}
                        className={`rounded-lg border p-1.5 text-center transition-all ${
                          isSelected ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-green-300'
                        } ${!isStep3Ready ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          {isSelected && <Check className="h-2.5 w-2.5 text-green-500" />}
                          <p className="text-[10px] font-medium text-slate-700">{size.name}</p>
                        </div>
                        <p className="text-[8px] text-slate-400 truncate">{size.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">生成结果</label>
                  {generatedImages.length > 0 && <span className="text-[10px] text-green-600">已生成 {generatedImages.length} 张</span>}
                </div>
                <div className="relative flex-1 min-h-[120px] items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50 overflow-hidden">
                  {isGenerating ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                      <span className="text-xs text-slate-500">正在生成 {selectedSizes.length} 张图片...</span>
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <div className={`grid gap-1 p-1 h-full w-full ${
                      generatedImages.length === 1 ? 'grid-cols-1' : generatedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'
                    }`}>
                      {generatedImages.map((img) => (
                        <div key={img.size} className="relative h-full w-full min-h-[60px]">
                          <img src={img.url} alt={`生成结果 ${img.size}`} className="cursor-pointer rounded object-contain h-full w-full" onClick={() => setViewerImage(img.url)} />
                          <div className="absolute left-1 top-1 rounded bg-green-500/90 px-1 py-0.5 text-[10px] text-white">
                            {IMAGE_SIZE_OPTIONS.find(s => s.id === img.size)?.name || img.size}
                          </div>
                          <div className="absolute bottom-1 right-1 flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); setViewerImage(img.url); }} className="flex h-4 w-4 items-center justify-center rounded bg-white/90 text-slate-600 shadow hover:bg-white" title="放大查看">
                              <ZoomIn className="h-2.5 w-2.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); downloadGeneratedImage(img.url, img.size); }} className="flex h-4 w-4 items-center justify-center rounded bg-white/90 text-slate-600 shadow hover:bg-white" title="下载图片">
                              <Download className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <ImageIconLucide className="h-8 w-8 text-slate-300" />
                      <p className="mt-1 text-xs text-slate-400">{isStep3Ready ? '点击下方按钮生成' : '完成第一步后可生成图片'}</p>
                    </div>
                  )}
                </div>
                {generateError && <p className="mt-1 text-xs text-red-500">{generateError}</p>}
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={!isStep3Ready || isGenerating}
                className="h-10 w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-sm font-medium text-white shadow-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />生成中 ({selectedSizes.length} 张)...</>
                  : generatedImages.length > 0 ? <><RefreshCw className="h-4 w-4" />重新生成</>
                  : <><Sparkles className="h-4 w-4" />生成图片</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewerImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setViewerImage(null)}>
          <button className="absolute right-4 top-4 text-white hover:text-slate-300" onClick={() => setViewerImage(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={viewerImage} alt="预览" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setAlertMessage('')}>
          <div className="rounded-xl bg-white p-6 shadow-xl max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">提示</h3>
            <p className="text-sm text-slate-600">{alertMessage}</p>
            <button onClick={() => setAlertMessage('')} className="mt-4 w-full rounded-lg bg-indigo-500 py-2 text-sm text-white hover:bg-indigo-600">知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}
