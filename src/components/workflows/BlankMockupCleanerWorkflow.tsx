'use client';

import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Image as ImageIcon, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MockupFile {
  id: string;
  file: File;
  preview: string;
  name: string;
}

interface CleanupResult {
  id: string;
  mockupId: string;
  status: 'pending' | 'cleaning' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

const OUTPUT_SIZE_PRESETS = [
  { size: '1024x1024', ratio: 1 },
  { size: '1365x1024', ratio: 1365 / 1024 },
  { size: '1536x1024', ratio: 1536 / 1024 },
  { size: '1792x1008', ratio: 1792 / 1008 },
  { size: '1024x1365', ratio: 1024 / 1365 },
  { size: '1024x1536', ratio: 1024 / 1536 },
  { size: '1008x1792', ratio: 1008 / 1792 },
];

const PRODUCT_TYPE_PRESETS = ['毛毯', 'T恤', '马克杯', '抱枕', '帆布画', '夜灯', '手机壳', '帆布袋'];

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error('无法读取样机图尺寸'));
    img.src = src;
  });
}

function getBestOutputSizeForImage(width: number, height: number): string {
  if (!width || !height) return '1024x1024';
  const ratio = width / height;
  return OUTPUT_SIZE_PRESETS.reduce((best, preset) => {
    const bestDistance = Math.abs(best.ratio - ratio);
    const currentDistance = Math.abs(preset.ratio - ratio);
    return currentDistance < bestDistance ? preset : best;
  }).size;
}

function getTargetProductName(productType: string): string {
  const normalized = productType.trim().toLowerCase();
  if (!normalized) return 'target product';
  if (normalized.includes('毛毯') || normalized.includes('毯') || normalized.includes('blanket')) return 'blanket';
  if (normalized.includes('t恤') || normalized.includes('衣服') || normalized.includes('shirt') || normalized.includes('卫衣') || normalized.includes('hoodie')) return 'clothing item';
  if (normalized.includes('马克杯') || normalized.includes('杯') || normalized.includes('mug') || normalized.includes('cup')) return 'mug';
  if (normalized.includes('抱枕') || normalized.includes('枕') || normalized.includes('pillow') || normalized.includes('cushion')) return 'pillow';
  if (normalized.includes('画') || normalized.includes('canvas') || normalized.includes('poster')) return 'canvas print';
  if (normalized.includes('夜灯') || normalized.includes('lamp') || normalized.includes('light')) return 'night light';
  if (normalized.includes('手机壳') || normalized.includes('phone')) return 'phone case';
  if (normalized.includes('帆布袋') || normalized.includes('包') || normalized.includes('bag') || normalized.includes('tote')) return 'bag';
  return productType.trim();
}

async function requestGeneratedImage({ prompt, referenceImages, size, signal }: {
  prompt: string;
  referenceImages: string[];
  size: string;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      referenceImages,
      model: 'gpt-image-2-edit',
      size,
      quality: 'medium',
      n: 1,
      scope: 'toolbox',
    }),
    signal,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `HTTP error! status: ${response.status}`);
  if (data?.success && data.url) return data.url;
  throw new Error(data?.error || 'Generation failed');
}

async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas context'));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export default function BlankMockupCleanerWorkflow() {
  const [mockupFiles, setMockupFiles] = useState<MockupFile[]>([]);
  const [productType, setProductType] = useState('毛毯');
  const [results, setResults] = useState<CleanupResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const preview = await compressImage(file);
      setMockupFiles(prev => [...prev, {
        id: `blank-mockup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview,
        name: file.name,
      }]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeMockup = (id: string) => {
    setMockupFiles(prev => prev.filter(file => file.id !== id));
    setResults(prev => prev.filter(result => result.mockupId !== id));
  };

  const clearAll = () => {
    setMockupFiles([]);
    setResults([]);
  };

  const buildCleanupPrompt = (targetProduct: string) => `Use image 1 as the base mockup photo. First, IDENTIFY the main product in the image (the user expects it to be: ${targetProduct}, but you must visually detect and confirm the actual product type — it could be a blanket, clothing item, mug, phone case, canvas print, night light, acrylic sheet, cutting board, pillow, or any other physical object).

Once identified, clean ONLY the surface of that main product into a blank white product mockup, while keeping everything else untouched.

UNIVERSAL PRESERVATION RULES (apply to EVERY product type):
1. Preserve the original product's EXACT position, size, silhouette, edges, perspective, thickness, and outline.
2. Preserve the product's material-appropriate physical behavior: fabric draping & wrinkles for soft materials (blankets, clothing), smooth surface & edge bevel for hard materials (acrylic, cutting board, mug, phone case), printed texture & frame for flat materials (canvas, poster).
3. Preserve the original lighting: shadows, highlights, ambient light direction, and color temperature.
4. Preserve depth and 3D form: the product must NOT become a flat 2D shape. Keep its natural material thickness, surface curvature, and physical volume.
5. Preserve occlusion relationships: how the product interacts with hands, the chair, the table, the ground, or other objects around it.
6. Preserve any physical marks that are part of the material itself (stitching, wood grain, fabric weave, plastic gloss, transparent refraction) — only clean the PRINTED GRAPHIC on top.

WHAT TO REMOVE:
- ONLY remove the printed graphics, photos, text, patterns, logos, and decorative artwork that are printed or engraved on the product surface.
- Do NOT change the underlying material, color, structure, or shape of the product itself.

WHAT TO PRESERVE (UNTOUCHABLE):
- Person, face, skin, hair, hands
- Other clothing the person is wearing
- Chair, table, background, props
- All text overlays and marketing typography outside the product
- Camera angle, composition, lighting direction

OUTPUT: The result should look like the same photo from image 1, with only the printed artwork on the product surface cleaned into a blank white or off-white mockup. The product itself must remain physically realistic — its material, texture, edges, lighting, and form are preserved exactly as in the reference.`;

  const generateOne = async (resultId: string, mockup: MockupFile, signal?: AbortSignal) => {
    const dimensions = await getImageDimensions(mockup.preview);
    const size = getBestOutputSizeForImage(dimensions.width, dimensions.height);
    const url = await requestGeneratedImage({
      prompt: buildCleanupPrompt(getTargetProductName(productType)),
      referenceImages: [mockup.preview],
      size,
      signal,
    });
    setResults(prev => prev.map(result => result.id === resultId ? { ...result, status: 'completed', resultUrl: url, error: undefined } : result));
  };

  const startGeneration = async () => {
    if (isGenerating || mockupFiles.length === 0) return;
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const initialResults = mockupFiles.map(file => ({
      id: `cleanup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      mockupId: file.id,
      status: 'pending' as const,
    }));
    setResults(initialResults);

    for (const result of initialResults) {
      const mockup = mockupFiles.find(file => file.id === result.mockupId);
      if (!mockup) continue;
      if (signal.aborted) break;
      setResults(prev => prev.map(item => item.id === result.id ? { ...item, status: 'cleaning' } : item));
      try {
        await generateOne(result.id, mockup, signal);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setResults(prev => prev.map(item => item.id === result.id ? { ...item, status: 'failed', error: '已取消' } : item));
          break;
        }
        setResults(prev => prev.map(item => item.id === result.id ? { ...item, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' } : item));
      }
    }

    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const stopGeneration = () => abortControllerRef.current?.abort();

  const downloadResult = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const completedCount = results.filter(result => result.status === 'completed').length;
  const failedCount = results.filter(result => result.status === 'failed').length;

  return (
    <div className="h-full min-h-0 flex bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">白底样机清洗</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">样机图</h3>
              <span className="text-xs text-gray-500">{mockupFiles.length} 张</span>
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            <Button variant="outline" className="w-full h-20 border-dashed" onClick={() => inputRef.current?.click()}>
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">点击上传样机图</span>
              </div>
            </Button>

            {mockupFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {mockupFiles.map(mockup => (
                  <div key={mockup.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                    <img src={mockup.preview} alt={mockup.name} className="w-10 h-10 object-cover rounded" />
                    <span className="flex-1 text-xs text-gray-600 truncate">{mockup.name}</span>
                    <button onClick={() => removeMockup(mockup.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">产品类型</h3>
              <span className="text-xs text-gray-400">用于锁定清洗区域</span>
            </div>
            <Input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="例如：毛毯、马克杯、帆布画" className="h-9 text-sm" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRODUCT_TYPE_PRESETS.map(type => (
                <button key={type} onClick={() => setProductType(type)} className={`px-2 py-1 text-xs rounded-md transition-colors ${productType === type ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          {isGenerating ? (
            <Button variant="destructive" className="w-full" onClick={stopGeneration}>
              中止清洗 ({completedCount}/{mockupFiles.length})
            </Button>
          ) : (
            <Button className="w-full" disabled={mockupFiles.length === 0} onClick={startGeneration}>
              <Sparkles className="w-4 h-4 mr-2" />
              开始生成白底样机
              {mockupFiles.length > 0 && ` (${mockupFiles.length} 张)`}
            </Button>
          )}
          {mockupFiles.length > 0 && <Button variant="outline" className="w-full" onClick={clearAll} disabled={isGenerating}>清空全部</Button>}
          <Alert className="bg-blue-50 border-blue-200 mt-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              只清洗目标产品表面为白底空白样机，保留原始光影、纹理、褶皱、边缘和遮挡关系。
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">清洗结果</h2>
            <p className="text-sm text-gray-500">{results.length === 0 ? '等待清洗...' : `已完成 ${completedCount} / ${results.length} 张${failedCount > 0 ? `，失败 ${failedCount} 张` : ''}`}</p>
          </div>
          {completedCount > 0 && <Button variant="outline" size="sm" onClick={() => results.filter(result => result.status === 'completed' && result.resultUrl).forEach((result, index) => setTimeout(() => downloadResult(result.resultUrl!, `blank-mockup-${index + 1}.png`), index * 300))}><Download className="w-4 h-4 mr-2" />下载全部</Button>}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {results.length === 0 ? (
              <div className="h-[calc(100vh-300px)] flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">上传样机图开始生成白底空白样机</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(result => {
                  const mockup = mockupFiles.find(file => file.id === result.mockupId);
                  return (
                    <div key={result.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : result.status === 'failed' ? <AlertCircle className="w-3 h-3 text-red-500" /> : <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                          <span className={`text-xs font-medium ${result.status === 'completed' ? 'text-green-600' : result.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                            {result.status === 'pending' && '等待中'}
                            {result.status === 'cleaning' && '清洗样机中'}
                            {result.status === 'completed' && '已完成'}
                            {result.status === 'failed' && '失败'}
                          </span>
                        </div>
                        {result.status === 'completed' && result.resultUrl && <button onClick={() => downloadResult(result.resultUrl!, `blank-${mockup?.name || result.id}.png`)} className="p-1 text-gray-400 hover:text-gray-600" title="下载"><Download className="w-4 h-4" /></button>}
                      </div>
                      <div className="aspect-[4/3] bg-gray-200 relative">
                        {result.status === 'completed' && result.resultUrl ? <img src={result.resultUrl} alt="Blank mockup" className="w-full h-full object-contain" /> : result.status === 'failed' ? <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs text-red-500">{result.error || '清洗失败'}</div> : <div className="w-full h-full flex items-center justify-center"><RefreshCw className="w-8 h-8 text-blue-400 animate-spin" /></div>}
                      </div>
                      <div className="p-3"><p className="text-xs text-gray-600 truncate" title={mockup?.name}><span className="text-gray-400">样机:</span> {mockup?.name || 'Unknown'}</p></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
