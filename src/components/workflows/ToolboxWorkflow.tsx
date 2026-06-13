'use client';

import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw,
  Copy,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BlankMockupCleanerWorkflow from './BlankMockupCleanerWorkflow';

// 文件信息接口
interface MockupFile {
  id: string;
  file: File;
  preview: string;
  name: string;
}

interface ProductFile {
  id: string;
  file: File;
  preview: string;
  name: string;
}

type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

// 生成结果接口
interface GenerationResult {
  id: string;
  mockupId: string;
  productId: string;
  status: GenerationStatus;
  resultUrl?: string;
  error?: string;
}

// 产品类型预设选项（用于快速填充）
const PRODUCT_TYPE_PRESETS = [
  'T恤',
  '马克杯',
  '抱枕',
  '海报',
  '手机壳',
  '帆布袋',
  '帽子',
  '卫衣',
  '围裙',
  '相框',
  '鼠标垫',
  '钥匙扣',
];

const OUTPUT_SIZE_PRESETS = [
  { size: '1024x1024', ratio: 1 },
  { size: '1365x1024', ratio: 1365 / 1024 },
  { size: '1536x1024', ratio: 1536 / 1024 },
  { size: '1792x1008', ratio: 1792 / 1008 },
  { size: '1024x1365', ratio: 1024 / 1365 },
  { size: '1024x1536', ratio: 1024 / 1536 },
  { size: '1008x1792', ratio: 1008 / 1792 },
];

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
  if (normalized.includes('手机壳') || normalized.includes('phone')) return 'phone case';
  if (normalized.includes('帆布袋') || normalized.includes('包') || normalized.includes('bag') || normalized.includes('tote')) return 'bag';
  return productType.trim();
}

async function requestGeneratedImage({
  prompt,
  referenceImages,
  size,
  signal,
}: {
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
    }),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP error! status: ${response.status}`);
  }

  if (data?.success && data.url) {
    return data.url;
  }

  throw new Error(data?.error || 'Generation failed');
}

export default function ToolboxWorkflow() {
  const [activeTool, setActiveTool] = useState<'batch-replace' | 'blank-cleaner'>('batch-replace');
  // 样机图列表
  const [mockupFiles, setMockupFiles] = useState<MockupFile[]>([]);
  // 产品图案列表
  const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
  // 提示词
  const [prompt, setPrompt] = useState<string>('');
  // 产品类型
  const [productType, setProductType] = useState<string>('');
  // 是否保留人脸细节
  const [preserveFaces, setPreserveFaces] = useState<boolean>(false);
  // 是否为镂空/铁艺设计
  const [isHollowDesign, setIsHollowDesign] = useState<boolean>(false);
  // 生成结果
  const [results, setResults] = useState<GenerationResult[]>([]);
  // 是否正在生成
  const [isGenerating, setIsGenerating] = useState(false);
  // 复制状态
  const [copied, setCopied] = useState(false);
  // 中止信号
  const abortControllerRef = useRef<AbortController | null>(null);
  // 当前生成索引
  const currentIndexRef = useRef<number>(0);
  
  const mockupInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  // 压缩图片
  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 计算缩放后的尺寸
        let width = img.width;
        let height = img.height;
        
        // 如果图片尺寸超过限制，进行等比例缩放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        // 使用高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 计算压缩效果
        const originalSize = file.size / 1024; // KB
        const compressedSize = Math.ceil((compressedDataUrl.length * 0.75) / 1024); // KB (base64 大约是原始数据的 4/3)
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        console.log(`[Toolbox] 图片压缩: ${file.name}`);
        console.log(`  原始尺寸: ${img.width}x${img.height}, ${originalSize.toFixed(1)}KB`);
        console.log(`  压缩后: ${width}x${height}, ~${compressedSize}KB`);
        console.log(`  压缩率: ${compressionRatio}%`);
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      // 读取文件
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理样机图上传
  const handleMockupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      try {
        // 压缩图片
        const compressedPreview = await compressImage(file, 1024, 1024, 0.85);
        
        const newMockup: MockupFile = {
          id: `mockup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: compressedPreview,
          name: file.name,
        };
        setMockupFiles((prev) => [...prev, newMockup]);
      } catch (error) {
        console.error('[Toolbox] 样机图压缩失败:', error);
        // 如果压缩失败，使用原图
        const reader = new FileReader();
        reader.onload = (event) => {
          const newMockup: MockupFile = {
            id: `mockup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: event.target?.result as string,
            name: file.name,
          };
          setMockupFiles((prev) => [...prev, newMockup]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (mockupInputRef.current) {
      mockupInputRef.current.value = '';
    }
  };

  // 处理产品图案上传
  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      try {
        // 压缩图片
        const compressedPreview = await compressImage(file, 1024, 1024, 0.85);
        
        const newProduct: ProductFile = {
          id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: compressedPreview,
          name: file.name,
        };
        setProductFiles((prev) => [...prev, newProduct]);
      } catch (error) {
        console.error('[Toolbox] 产品图案压缩失败:', error);
        // 如果压缩失败，使用原图
        const reader = new FileReader();
        reader.onload = (event) => {
          const newProduct: ProductFile = {
            id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: event.target?.result as string,
            name: file.name,
          };
          setProductFiles((prev) => [...prev, newProduct]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (productInputRef.current) {
      productInputRef.current.value = '';
    }
  };

  // 删除样机图
  const removeMockup = (id: string) => {
    setMockupFiles((prev) => prev.filter((m) => m.id !== id));
  };

  // 删除产品图案
  const removeProduct = (id: string) => {
    setProductFiles((prev) => prev.filter((p) => p.id !== id));
  };

  // 清空所有
  const clearAll = () => {
    setMockupFiles([]);
    setProductFiles([]);
    setResults([]);
    setPrompt('');
  };

  // 生成提示词模板
  const generatePromptTemplate = () => {
    const productTypeText = productType ? `图1中的产品是${productType}。` : '图1中的产品类型请仔细识别（可能是T恤、马克杯、抱枕、海报等）。';
    
    const facePreservationText = preserveFaces ? `
【人脸/细节保留 - 重要】
- 图2包含人脸照片/头像/人物图像
- 必须保留所有人脸的清晰度和可识别性
- 保持人脸的五官特征、表情、肤色完全不变
- 禁止模糊、变形或修改人脸细节
- 确保人脸在应用后仍然清晰可辨
` : '';

    const hollowDesignText = isHollowDesign ? `
【镂空/铁艺设计 - 重要】
- 图2是镂空设计、铁艺字母、金属字或带有透明/镂空区域的图案
- 必须精确识别图2的镂空部分（透明/空白区域）和实体部分
- 镂空区域必须保持透明，显示图1的背景，禁止填充任何颜色或图案
- 实体部分（文字、线条、边框）必须完整保留，禁止被遮挡或截断
- 保持镂空设计的精细边缘和轮廓清晰度
- 确保镂空部分与实体部分的边界清晰分明
` : '';
    
    const template = `将图2的产品图案/设计应用到图1的样机产品上。

【产品类型确认】
${productTypeText}
这是最重要的信息：必须保持产品类型不变，只替换表面图案。

【图1分析 - 样机图】
- 图1展示的是一个产品样机/实物照片
- 保持图1中的产品形状、轮廓、褶皱、材质质感完全不变
- 保持图1的场景、光线方向、阴影、反射、透视角度完全不变
- 保持图1的背景、环境、道具完全不变

【图2分析 - 产品图案】
- 图2是需要应用到产品上的图案/设计/印花
- 提取图2的图案内容、颜色、纹理${preserveFaces ? '、人脸细节' : ''}${isHollowDesign ? '、镂空结构' : ''}
${facePreservationText}${hollowDesignText}
【核心指令 - 必须遵守】
1. 产品识别：图1展示的是${productType || '一个产品'}，不要将其识别或改变为其他物品
2. 图案替换：将图2的图案精确应用到图1产品的相应表面
3. 贴合处理：根据图1产品的形状、褶皱、曲面进行透视变形，让图案自然贴合
4. 光影保持：应用图1原有的光照、阴影、高光效果到图案上
${preserveFaces ? '5. 人脸保护：人脸区域必须保持清晰，禁止模糊处理\n' : ''}${isHollowDesign ? '5. 镂空保护：镂空区域必须保持透明，显示背景，禁止填充\n' : ''}5. 禁止事项：
   - 绝对禁止将产品替换成其他物品
   - 禁止改变产品颜色（除非图案本身包含颜色）
   - 禁止添加或删除场景中的元素
   - 禁止改变相机角度或透视
${preserveFaces ? '   - 绝对禁止模糊或修改人脸细节\n' : ''}${isHollowDesign ? '   - 绝对禁止遮挡镂空区域或填充透明部分\n' : ''}
【输出要求】
输出应该看起来像原始样机照片，但产品表面展示了图2的新图案，其他一切保持不变。${preserveFaces ? '人脸必须清晰可辨。' : ''}${isHollowDesign ? '镂空区域必须保持透明可见。' : ''}`;
    
    setPrompt(template);
  };

  // 复制提示词
  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateResultStatus = (resultId: string, status: GenerationStatus, error?: string) => {
    setResults(prev => prev.map(r =>
      r.id === resultId ? { ...r, status, error } : r
    ));
  };

  const buildDirectReplacementPrompt = (targetProduct: string) => {
    if (prompt.trim()) return prompt.trim();

    return `Use image 1 as the base mockup photo. Replace ONLY the ${targetProduct} in image 1 with the product/design from image 2.

Preserve the exact position, size, shape, folds, draping, perspective, shadows, highlights, texture, edges, and occlusion of the original ${targetProduct}. The new design must stay strictly inside the original ${targetProduct} boundaries.

Do not apply the design to the person, face, skin, clothing, chair, table, background, text overlays, props, or any other area. Keep the scene, lighting, typography, camera angle, and composition unchanged.

The result should look like the same photo from image 1, with only the ${targetProduct} replaced by image 2's design.`;
  };

  const generateMockupReplacement = async ({
    resultId,
    mockupPreview,
    productPreview,
    outputSize,
    signal,
  }: {
    resultId: string;
    mockupPreview: string;
    productPreview: string;
    outputSize: string;
    signal?: AbortSignal;
  }): Promise<string> => {
    const targetProduct = getTargetProductName(productType);
    updateResultStatus(resultId, 'generating');
    return requestGeneratedImage({
      prompt: buildDirectReplacementPrompt(targetProduct),
      referenceImages: [mockupPreview, productPreview],
      size: outputSize,
      signal,
    });
  };

  // 开始批量生成
  const startBatchGeneration = async () => {
    // 防止重复点击导致的重复执行
    if (isGenerating) {
      console.log('[Toolbox] 生成已在进行中，忽略重复点击');
      return;
    }
    
    if (mockupFiles.length === 0 || productFiles.length === 0) return;
    
    console.log('[Toolbox] 开始批量生成', { 
      mockupCount: mockupFiles.length, 
      productCount: productFiles.length,
      totalTasks: mockupFiles.length * productFiles.length 
    });
    
    setIsGenerating(true);
    setResults([]);
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 为每个样机图和产品图案的组合创建生成任务
    const newResults: GenerationResult[] = [];
    
    for (const mockup of mockupFiles) {
      for (const product of productFiles) {
        const result: GenerationResult = {
          id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mockupId: mockup.id,
          productId: product.id,
          status: 'pending',
        };
        newResults.push(result);
      }
    }
    
    setResults(newResults);

    // 逐个执行生成
    for (let i = 0; i < newResults.length; i++) {
      currentIndexRef.current = i;
      const result = newResults[i];
      const mockup = mockupFiles.find(m => m.id === result.mockupId);
      const product = productFiles.find(p => p.id === result.productId);
      
      if (!mockup || !product) continue;

      // 检查是否已中止
      if (signal.aborted) {
        // 将剩余任务标记为已取消
        setResults(prev => prev.map((r, idx) => 
          idx >= i ? { ...r, status: 'failed', error: '已取消' } : r
        ));
        break;
      }

      // 更新状态为生成中
      setResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, status: 'generating' } : r
      ));

      try {
        const mockupDimensions = await getImageDimensions(mockup.preview);
        const outputSize = getBestOutputSizeForImage(mockupDimensions.width, mockupDimensions.height);
        const finalUrl = await generateMockupReplacement({
          resultId: result.id,
          mockupPreview: mockup.preview,
          productPreview: product.preview,
          outputSize,
          signal,
        });

        setResults(prev => prev.map(r =>
          r.id === result.id ? { ...r, status: 'completed', resultUrl: finalUrl, error: undefined } : r
        ));
      } catch (error) {
        // 如果是中止错误，不显示为失败
        if (error instanceof Error && error.name === 'AbortError') {
          setResults(prev => prev.map((r, idx) => 
            idx >= i ? { ...r, status: 'failed', error: '已取消' } : r
          ));
          break;
        }
        
        setResults(prev => prev.map(r => 
          r.id === result.id ? { 
            ...r, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } : r
        ));
      }

      // 添加延迟避免请求过快（检查是否已中止）
      if (i < newResults.length - 1 && !signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  // 重新生成单个结果
  const regenerateResult = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    
    const mockup = mockupFiles.find(m => m.id === result.mockupId);
    const product = productFiles.find(p => p.id === result.productId);
    
    if (!mockup || !product) {
      console.error('[Toolbox] 无法找到对应的样机图或产品图案');
      return;
    }

    // 更新状态为生成中
    setResults(prev => prev.map(r => 
      r.id === resultId ? { ...r, status: 'generating', error: undefined } : r
    ));

    try {
      const mockupDimensions = await getImageDimensions(mockup.preview);
      const outputSize = getBestOutputSizeForImage(mockupDimensions.width, mockupDimensions.height);
      const finalUrl = await generateMockupReplacement({
        resultId,
        mockupPreview: mockup.preview,
        productPreview: product.preview,
        outputSize,
      });

      setResults(prev => prev.map(r =>
        r.id === resultId ? { ...r, status: 'completed', resultUrl: finalUrl, error: undefined } : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r =>
        r.id === resultId ? {
          ...r,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : r
      ));
    }
  };

  // 中止生成
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 下载单个结果
  const downloadResult = async (url: string, filename: string) => {
    try {
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
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 获取结果对应的样机和产品名称
  const getResultNames = (result: GenerationResult) => {
    const mockup = mockupFiles.find(m => m.id === result.mockupId);
    const product = productFiles.find(p => p.id === result.productId);
    return {
      mockupName: mockup?.name || 'Unknown',
      productName: product?.name || 'Unknown',
    };
  };

  // 计算总任务数
  const totalTasks = mockupFiles.length * productFiles.length;
  const completedTasks = results.filter(r => r.status === 'completed').length;
  const failedTasks = results.filter(r => r.status === 'failed').length;

  return (
    <div className="h-full min-h-0 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTool('batch-replace')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTool === 'batch-replace'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          批量样机替换
        </button>
        <button
          onClick={() => setActiveTool('blank-cleaner')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTool === 'blank-cleaner'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          白底样机清洗
        </button>
      </div>

      {activeTool === 'blank-cleaner' ? (
        <div className="flex-1 min-h-0 p-4 bg-gray-50">
          <BlankMockupCleanerWorkflow />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex bg-white overflow-hidden">
      {/* 左侧：上传区域 */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">批量样机替换</span>
          </div>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 样机图上传 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">样机图</h3>
              <span className="text-xs text-gray-500">{mockupFiles.length} 张</span>
            </div>
            <input
              ref={mockupInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMockupUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-20 border-dashed"
              onClick={() => mockupInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">点击上传样机图</span>
              </div>
            </Button>
            
            {/* 样机图列表 */}
            {mockupFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {mockupFiles.map((mockup) => (
                  <div key={mockup.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                    <img
                      src={mockup.preview}
                      alt={mockup.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="flex-1 text-xs text-gray-600 truncate">{mockup.name}</span>
                    <button
                      onClick={() => removeMockup(mockup.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 产品图案上传 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">产品图案</h3>
              <span className="text-xs text-gray-500">{productFiles.length} 张</span>
            </div>
            <input
              ref={productInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-20 border-dashed"
              onClick={() => productInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">点击上传产品图案</span>
              </div>
            </Button>
            
            {/* 产品图案列表 */}
            {productFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {productFiles.map((product) => (
                  <div key={product.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                    <img
                      src={product.preview}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="flex-1 text-xs text-gray-600 truncate">{product.name}</span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 产品类型输入 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">产品类型</h3>
              <span className="text-xs text-gray-400">帮助AI准确识别</span>
            </div>
            <Input
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="例如：T恤、马克杯、抱枕..."
              className="h-9 text-sm"
            />
            {/* 快速选择标签 */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRODUCT_TYPE_PRESETS.map((type) => (
                <button
                  key={type}
                  onClick={() => setProductType(type)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    productType === type
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              输入或选择产品类型，帮助AI更准确地识别样机中的产品
            </p>
          </div>

          {/* 人脸细节保留选项 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <input
              type="checkbox"
              id="preserve-faces"
              checked={preserveFaces}
              onChange={(e) => setPreserveFaces(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
            />
            <div className="flex-1">
              <label htmlFor="preserve-faces" className="text-sm font-medium text-amber-800 cursor-pointer">
                图案包含人脸/头像
              </label>
              <p className="text-xs text-amber-600 mt-0.5">
                勾选后AI会特别注意保留人脸清晰度，避免模糊处理
              </p>
            </div>
          </div>

          {/* 镂空/铁艺设计选项 */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <input
              type="checkbox"
              id="hollow-design"
              checked={isHollowDesign}
              onChange={(e) => setIsHollowDesign(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <label htmlFor="hollow-design" className="text-sm font-medium text-purple-800 cursor-pointer">
                镂空/铁艺/金属字设计
              </label>
              <p className="text-xs text-purple-600 mt-0.5">
                勾选后AI会保持镂空区域透明，避免字母被遮挡或填充
              </p>
            </div>
          </div>

          {/* 提示词设置 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">生成提示词</h3>
              <div className="flex gap-1">
                <button
                  onClick={generatePromptTemplate}
                  className="text-xs text-blue-500 hover:text-blue-600 px-2 py-1"
                  title="使用模板"
                >
                  模板
                </button>
                {prompt && (
                  <button
                    onClick={copyPrompt}
                    className="text-xs text-gray-500 hover:text-gray-600 px-2 py-1"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入提示词，描述如何将产品图案应用到样机图中..."
              className="min-h-[120px] text-xs resize-none"
            />
          </div>
        </div>

        {/* 底部固定按钮区域 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          {isGenerating ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={stopGeneration}
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              中止生成 ({completedTasks}/{totalTasks})
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={mockupFiles.length === 0 || productFiles.length === 0 || isGenerating}
              onClick={() => {
                if (!isGenerating) {
                  startBatchGeneration();
                }
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              开始批量生成
              {totalTasks > 0 && ` (${totalTasks} 张)`}
            </Button>
          )}
          
          {(mockupFiles.length > 0 || productFiles.length > 0) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={clearAll}
              disabled={isGenerating}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空全部
            </Button>
          )}
          
          {/* 说明 */}
          <Alert className="bg-blue-50 border-blue-200 mt-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              上传样机图和产品图案，系统会自动将每个产品图案应用到每个样机图上。
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* 右侧：结果展示 */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">生成结果</h2>
              <p className="text-sm text-gray-500">
                {results.length === 0 
                  ? '等待生成...' 
                  : `已完成 ${completedTasks} / ${results.length} 张${failedTasks > 0 ? `，失败 ${failedTasks} 张` : ''}`
                }
              </p>
            </div>
            {completedTasks > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  results
                    .filter(r => r.status === 'completed' && r.resultUrl)
                    .forEach((result, index) => {
                      const names = getResultNames(result);
                      setTimeout(() => {
                        downloadResult(result.resultUrl!, `mockup-${names.mockupName}-product-${names.productName}.png`);
                      }, index * 500);
                    });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                下载全部
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
          {results.length === 0 ? (
            <div className="h-[calc(100vh-300px)] flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm">上传样机图和产品图案开始批量生成</p>
              <p className="text-xs mt-1 text-gray-300">
                系统将自动为每个样机图应用每个产品图案
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => {
                const names = getResultNames(result);
                return (
                  <div key={result.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    {/* 状态指示 */}
                    <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                        {result.status === 'generating' && (
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                        {result.status === 'completed' && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        {result.status === 'failed' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          result.status === 'completed' ? 'text-green-600' :
                          result.status === 'failed' ? 'text-red-600' :
                          result.status === 'generating' ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {result.status === 'pending' && '等待中'}
                          {result.status === 'generating' && '生成中'}
                          {result.status === 'completed' && '已完成'}
                          {result.status === 'failed' && '失败'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 重新生成按钮 - 失败或已完成都可以重新生成 */}
                        {(result.status === 'failed' || result.status === 'completed') && (
                          <button
                            onClick={() => regenerateResult(result.id)}
                            className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50"
                            title="重新生成"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {result.status === 'completed' && result.resultUrl && (
                          <button
                            onClick={() => downloadResult(result.resultUrl!, `result-${result.id}.png`)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 图片预览 */}
                    <div className="aspect-[4/3] bg-gray-200 relative">
                      {result.status === 'completed' && result.resultUrl ? (
                        <img
                          src={result.resultUrl}
                          alt="Generated"
                          className="w-full h-full object-contain"
                        />
                      ) : result.status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-500">{result.error || '生成失败'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            {result.status === 'generating' ? (
                              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            )}
                            <p className="text-xs text-gray-400">
                              {result.status === 'generating' ? '生成中...' : '等待生成'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="p-3 space-y-1">
                      <p className="text-xs text-gray-600 truncate" title={names.mockupName}>
                        <span className="text-gray-400">样机:</span> {names.mockupName}
                      </p>
                      <p className="text-xs text-gray-600 truncate" title={names.productName}>
                        <span className="text-gray-400">图案:</span> {names.productName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </ScrollArea>
      </div>
        </div>
      )}
    </div>
  );
}
