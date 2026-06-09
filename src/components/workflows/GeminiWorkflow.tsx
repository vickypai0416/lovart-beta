'use client';

import { ChangeEvent, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, Download, Gem, Image as ImageIcon, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';

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

export default function GeminiWorkflow() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-image-preview');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [responseText, setResponseText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('9:16');
  const [selectedImageSize, setSelectedImageSize] = useState('1K');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = [
    { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image Preview' },
    { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image Preview' },
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
  ];

  const aspectRatios = [
    { value: '1:1', label: '1:1 (正方形)' },
    { value: '9:16', label: '9:16 (竖版)' },
    { value: '16:9', label: '16:9 (横版)' },
    { value: '4:3', label: '4:3' },
  ];

  const imageSizes = [
    { value: '1K', label: '1K (小尺寸)' },
    { value: '2K', label: '2K (中尺寸)' },
    { value: '4K', label: '4K (大尺寸)' },
  ];

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const remainingSlots = Math.max(0, 14 - referenceImages.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const urls = await Promise.all(selectedFiles.map((file) => compressImageToDataUrl(file)));
      setReferenceImages((prev) => [...prev, ...urls]);
      setError('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '图片上传失败');
    } finally {
      e.target.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateImage = async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;

    setIsGenerating(true);
    setError('');
    setResponseText('');

    try {
      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          referenceImages,
          aspectRatio: selectedAspectRatio,
          imageSize: selectedImageSize,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `请求失败 (${response.status})`);
      }

      const urls = result.urls || (result.url ? [result.url] : []);
      setGeneratedImages(urls);
      setResponseText(result.text || '');
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Gemini 生图失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAll = () => {
    downloadMultipleImages(
      generatedImages.map((url, index) => ({
        url,
        filename: `gemini-${index + 1}-${Date.now()}.png`,
      }))
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center">
            <Gem className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Gemini 生图</h2>
            <p className="text-xs text-gray-400">接入 Gemini / Nano Banana 图片生成与编辑</p>
          </div>
        </div>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-64 h-9 text-xs border-gray-200">
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想生成或编辑的图片，例如：Create a premium product photo of a ceramic coffee mug on a minimalist desk, soft morning light, commercial photography..."
                className="w-full h-48 resize-none rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <p className="mt-2 text-xs text-gray-400">如果需要在图片中生成文字，建议使用英文文案。</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">参考图</label>
                <span className="text-xs text-gray-400">{referenceImages.length}/14</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={referenceImages.length >= 14}
                className="w-full h-24 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="w-5 h-5" />
                <span className="text-sm">上传参考图，可用于图片编辑</span>
              </button>

              {referenceImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {referenceImages.map((image, index) => (
                    <div key={`${image.slice(0, 32)}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                      <img src={image} alt={`参考图 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeReferenceImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">宽高比</label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                    <SelectTrigger className="w-full h-9 text-xs border-gray-200">
                      <SelectValue placeholder="选择宽高比" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">图片尺寸</label>
                  <Select value={selectedImageSize} onValueChange={setSelectedImageSize}>
                    <SelectTrigger className="w-full h-9 text-xs border-gray-200">
                      <SelectValue placeholder="选择尺寸" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={generateImage}
              disabled={isGenerating || (!prompt.trim() && referenceImages.length === 0)}
              className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini 生成中...
                </>
              ) : (
                <>
                  <ArrowUp className="w-4 h-4" />
                  生成图片
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 min-h-[560px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">生成结果</h3>
                <p className="text-xs text-gray-400">Gemini 返回的图片会展示在这里</p>
              </div>
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-2">
                  {generatedImages.length > 1 && (
                    <button onClick={downloadAll} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                      下载全部
                    </button>
                  )}
                  <button
                    onClick={() => setGeneratedImages([])}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {generatedImages.length === 0 ? (
              <div className="h-[480px] rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">暂无生成图片</p>
                <p className="text-xs mt-1">输入提示词后点击生成</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={`${image.slice(0, 32)}-${index}`} className="group relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img
                      src={image}
                      alt={`Gemini 生成图 ${index + 1}`}
                      className="w-full aspect-square object-contain bg-gray-50 cursor-zoom-in"
                      onClick={() => setPreviewImage(image)}
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => downloadImageByUrl(image, `gemini-${index + 1}-${Date.now()}.png`)}
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow-sm"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {responseText && (
              <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700 whitespace-pre-wrap">
                {responseText}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} />
          </button>
          <img src={previewImage} alt="预览" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
