'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { saveImageToHistory, getRecentImages, deleteImage, clearHistory, ImageHistoryItem } from '@/lib/history-manager';
import { getImageUrl } from '@/lib/idb-storage';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  ShoppingBag, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Check,
  Edit3,
  RefreshCw,
  FileText,
  Search,
  X,
  History,
  Eye,
  Palette,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Paperclip
} from 'lucide-react';

type WorkflowStep = 1 | 2 | 3 | 4 | 5;

interface AnalysisResult {
  productName: string;
  keyFeatures: string[];
  description: string;
}

interface WorkflowLog {
  id: string;
  step: number;
  action: 'upload' | 'analyze' | 'confirm' | 'select' | 'generate';
  timestamp: string;
  data: {
    imageUrl?: string;
    analysis?: AnalysisResult;
    confirmed?: boolean;
    platform?: string;
    scene?: string;
    prompts?: Array<{ index: number; type: string; prompt: string }>;
  };
  modelUsed: string;
  status: 'success' | 'failed';
}

interface VariantOption {
  id: string;
  name: string;
  color: string;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  productName: string;
  sceneName: string;
  promptCount: number;
  hasImages: boolean;
}

const STORAGE_KEY = 'workflow_logs';
const IMAGES_STORAGE_KEY = 'generated_images';
const HISTORY_STORAGE_KEY = 'ecommerce_workflow_history';

const saveLog = (log: WorkflowLog) => {
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (error) {
    console.warn('保存日志失败:', error);
  }
};

const saveGeneratedImages = (images: Array<{ index: number; type: string; url: string }>) => {
  try {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(images));
  } catch (error) {
    console.warn('保存图片失败:', error);
  }
};

const loadGeneratedImages = (): Array<{ index: number; type: string; url: string }> => {
  try {
    const data = localStorage.getItem(IMAGES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('加载图片失败:', error);
    return [];
  }
};

const saveHistoryEntry = (entry: Omit<HistoryEntry, 'id'>) => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    history.unshift({ ...entry, id: Date.now().toString() });
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
  } catch (error) {
    console.warn('保存历史失败:', error);
  }
};

const loadHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(HISTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('加载历史失败:', error);
    return [];
  }
};

const platforms = [
  { value: 'amazon_us', label: 'Amazon US', description: '亚马逊美国站' },
  { value: 'amazon_eu', label: 'Amazon EU', description: '亚马逊欧洲站' },
  { value: 'taobao', label: '淘宝', description: '淘宝/天猫' },
  { value: 'jd', label: '京东', description: '京东商城' },
  { value: 'wish', label: 'Wish', description: 'Wish平台' },
];

const scenes = [
  { value: 'everyday', label: '日常', description: '日常使用场景' },
  { value: 'father', label: '父亲节', description: '父亲节礼物' },
  { value: 'mother', label: '母亲节', description: '母亲节礼物' },
  { value: 'christmas', label: '圣诞节', description: '圣诞节礼物' },
  { value: 'birthday', label: '生日', description: '生日礼物' },
  { value: 'wedding', label: '婚礼', description: '婚礼礼品' },
  { value: 'valentine', label: '情人节', description: '情人节礼物' },
  { value: 'graduation', label: '毕业季', description: '毕业礼物' },
];

const imageTypes = [
  { index: 1, type: 'main', label: '主图', description: '白底高清，产品居中，突出定制区域' },
  { index: 2, type: 'customization', label: '定制说明', description: '定制区域突出展示，包含可定制标识' },
  { index: 3, type: 'emotional', label: '情绪场景', description: '人物互动，温暖氛围' },
  { index: 4, type: 'detail', label: '细节图', description: '展示产品细节 + Made in USA' },
  { index: 5, type: 'gift', label: '送礼图', description: '送礼场景，无包装' },
  { index: 6, type: 'closing', label: '收尾图', description: '情绪收尾，引发购买冲动' },
];

const defaultVariants: VariantOption[] = [
  { id: '1', name: '经典黑', color: '#1a1a1a' },
  { id: '2', name: '优雅白', color: '#f5f5f5' },
  { id: '3', name: '海军蓝', color: '#1e3a5f' },
];

const colorSchemes = [
  { value: 'auto', label: '自动', description: '根据场景自动匹配', colors: [] as string[] },
  { value: 'blue', label: '蓝色系', description: '冷静专业', colors: ['#1B3A5C', '#4A90D9', '#E8F1FA'] },
  { value: 'warm', label: '暖色系', description: '温暖亲切', colors: ['#C8963E', '#D4A574', '#FFF8F0'] },
  { value: 'green', label: '绿色系', description: '自然清新', colors: ['#2D5A27', '#9DC183', '#F0F7EC'] },
  { value: 'red', label: '红色系', description: '热情活力', colors: ['#8B1A1A', '#C41E3A', '#FFF0F0'] },
  { value: 'purple', label: '紫色系', description: '优雅神秘', colors: ['#4A1A6B', '#9B59B6', '#F5E6FF'] },
  { value: 'monochrome', label: '黑白灰', description: '简约高级', colors: ['#1A1A1A', '#808080', '#F5F5F5'] },
  { value: 'pink', label: '粉色系', description: '柔美浪漫', colors: ['#C41E5A', '#FFB6C1', '#FFF0F5'] },
];

const visualStyles = [
  { value: 'auto', label: '自动', description: '根据场景自动匹配' },
  { value: 'minimalist', label: '简约', description: '干净简洁，留白多' },
  { value: 'luxury', label: '奢华', description: '高端质感，金色点缀' },
  { value: 'natural', label: '自然', description: '自然光线，真实感' },
  { value: 'vibrant', label: '活力', description: '色彩鲜明，动感十足' },
  { value: 'retro', label: '复古', description: '怀旧色调，经典氛围' },
  { value: 'modern', label: '现代', description: '时尚前卫，几何元素' },
  { value: 'dreamy', label: '梦幻', description: '柔焦光晕，浪漫氛围' },
];

export default function EcommerceWorkflow() {
  const [step, setStep] = useState<WorkflowStep>(1);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedScene, setSelectedScene] = useState('');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [prompts, setPrompts] = useState<Array<{ index: number; type: string; prompt: string; url?: string; displayPrompt?: string; purpose?: string }>>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ index: number; type: string; url: string }>>(() => {
    if (typeof window !== 'undefined') {
      return loadGeneratedImages();
    }
    return [];
  });
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');
  const [styleAnchor, setStyleAnchor] = useState<{
    colorPalette: string;
    lightingStyle: string;
    visualStyle: string;
    moodKeyword: string;
  } | null>(null);
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedColorScheme, setSelectedColorScheme] = useState('auto');
  const [selectedVisualStyle, setSelectedVisualStyle] = useState('auto');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHistory(loadHistory());
      getRecentImages(50).then(setImageHistory);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setReferenceImage(imageUrl);
      saveLog({
        id: Date.now().toString(),
        step: 1,
        action: 'upload',
        timestamp: new Date().toISOString(),
        data: { imageUrl },
        modelUsed: '-',
        status: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const analyzeProduct = useCallback(async () => {
    if (!referenceImage) return;

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: referenceImage, productName: productName }),
      });

      const result = await response.json();

      if (result.success) {
        const analysis: AnalysisResult = {
          productName: result.productName || '未识别产品',
          keyFeatures: result.keyFeatures || [],
          description: result.description || '',
        };
        setAnalysisResult(analysis);
        setEditedAnalysis(analysis);
        
        saveLog({
          id: Date.now().toString(),
          step: 1,
          action: 'analyze',
          timestamp: new Date().toISOString(),
          data: { imageUrl: referenceImage, analysis },
          modelUsed: 'GPT-5.4 nano',
          status: 'success',
        });
        
        setStep(2);
      } else {
        alert('分析失败: ' + (result.error || '未知错误'));
        saveLog({
          id: Date.now().toString(),
          step: 1,
          action: 'analyze',
          timestamp: new Date().toISOString(),
          data: { imageUrl: referenceImage },
          modelUsed: 'GPT-5.4 nano',
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请重试');
      saveLog({
        id: Date.now().toString(),
        step: 1,
        action: 'analyze',
        timestamp: new Date().toISOString(),
        data: { imageUrl: referenceImage },
        modelUsed: 'GPT-5.4 nano',
        status: 'failed',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [referenceImage]);

  const confirmAnalysis = useCallback((confirmed: boolean) => {
    saveLog({
      id: Date.now().toString(),
      step: 2,
      action: 'confirm',
      timestamp: new Date().toISOString(),
      data: { analysis: editedAnalysis || undefined, confirmed },
      modelUsed: '-',
      status: 'success',
    });

    if (confirmed) {
      setAnalysisResult(editedAnalysis);
      setStep(3);
    } else {
      setAnalysisResult(null);
      setEditedAnalysis(null);
      setStep(1);
    }
  }, [editedAnalysis]);

  const addVariant = () => {
    const newVariant: VariantOption = {
      id: Date.now().toString(),
      name: `变体 ${variants.length + 1}`,
      color: '#1b1b1bff',
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: 'name' | 'color', value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const generatePrompts = useCallback(async () => {
    if (!editedAnalysis || !selectedPlatform || !selectedScene) return;

    setIsGeneratingPrompts(true);

    try {
      const variantData = showVariants && variants.length > 0 
        ? variants.map(v => ({ name: v.name, color: v.color }))
        : undefined;

      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: editedAnalysis,
          platform: selectedPlatform,
          scene: selectedScene,
          variants: variantData,
          colorScheme: selectedColorScheme,
          visualStyle: selectedVisualStyle,
        }),
      });

      const result = await response.json();

      if (result.success && result.prompts) {
        const promptList = result.prompts.map((p: any, index: number) => {
          return {
            index: p.index || index + 1,
            type: p.type || `image${index + 1}`,
            prompt: typeof p === 'string' ? p : p.prompt || '',
            purpose: p.purpose || '',
          };
        });
        setPrompts(promptList);
        
        if (result.styleAnchor) {
          setStyleAnchor(result.styleAnchor);
        }
        
        saveLog({
          id: Date.now().toString(),
          step: 3,
          action: 'select',
          timestamp: new Date().toISOString(),
          data: { 
            platform: selectedPlatform, 
            scene: selectedScene,
            prompts: promptList 
          },
          modelUsed: 'GPT-5.4 nano',
          status: 'success',
        });
        
        setGeneratedImages([]);
        setStep(4);
      } else {
        alert('生成提示词失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('生成提示词失败:', error);
      alert('生成提示词失败，请重试');
    } finally {
      setIsGeneratingPrompts(false);
    }
  }, [editedAnalysis, selectedPlatform, selectedScene, showVariants, variants]);

  const generateImages = useCallback(async () => {
    if (!prompts.length || !referenceImage || selectedPrompts.length === 0) return;

    setIsGeneratingImages(true);
    setGeneratedImages([]);

    const selectedPromptItems = prompts.filter(p => selectedPrompts.includes(p.index));
    
    const mainPrompt = selectedPromptItems.find(p => p.type === 'main');
    const restPrompts = selectedPromptItems.filter(p => p.type !== 'main');
    
    let styleReferenceImage: string | null = null;
    let mainImageFailed = false;

    if (mainPrompt) {
      try {
        console.log(`[EcommerceWorkflow] 🎯 首先生成主图（风格锚定）`);
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: mainPrompt.prompt,
            referenceImage,
            size: selectedSize,
            quality: selectedQuality,
            n: selectedCount,
          }),
        });

        const result = await response.json();

        if (result.success) {
          const urls = result.urls || (result.url ? [result.url] : []);
          if (urls.length > 0) {
            styleReferenceImage = urls[0];
            setGeneratedImages(prev => {
              const updated = [...prev, {
                index: mainPrompt.index,
                type: mainPrompt.type,
                url: urls[0],
              }];
              saveGeneratedImages(updated);
              return updated;
            });
            
            saveImageToHistory({
              url: urls[0],
              prompt: mainPrompt.prompt,
              productName: editedAnalysis?.productName || '产品',
              scene: selectedScene,
              platform: selectedPlatform,
              size: selectedSize,
            }).then(async (savedItem) => {
              const persistedUrl = await getImageUrl(savedItem.id, urls[0]);
              setGeneratedImages(prev => {
                const updated = prev.map(img =>
                  img.url === urls[0] ? { ...img, url: persistedUrl } : img
                );
                saveGeneratedImages(updated);
                return updated;
              });
              setImageHistory(await getRecentImages(50));
            });
            
            for (let i = 1; i < urls.length; i++) {
              const variantIndex = mainPrompt.index + (i * 0.1);
              setGeneratedImages(prev => {
                const updated = [...prev, {
                  index: variantIndex,
                  type: `${mainPrompt.type}_${i + 1}`,
                  url: urls[i],
                }];
                saveGeneratedImages(updated);
                return updated;
              });
              saveImageToHistory({
                url: urls[i],
                prompt: mainPrompt.prompt,
                productName: editedAnalysis?.productName || '产品',
                scene: selectedScene,
                platform: selectedPlatform,
                size: selectedSize,
              });
            }
            
            console.log(`[EcommerceWorkflow] ✅ 主图生成成功，将作为风格参考`);
          } else {
            mainImageFailed = true;
            console.log(`[EcommerceWorkflow] ❌ 主图生成失败，将降级为独立生成`);
          }
        } else {
          mainImageFailed = true;
          console.log(`[EcommerceWorkflow] ❌ 主图生成失败，将降级为独立生成`);
        }
      } catch (error) {
        mainImageFailed = true;
        console.error(`[EcommerceWorkflow] 主图生成异常:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const promptsToGenerate = mainImageFailed
      ? selectedPromptItems
      : mainPrompt
        ? restPrompts
        : selectedPromptItems;

    for (const promptItem of promptsToGenerate) {
      try {
        console.log(`[EcommerceWorkflow] 生成第 ${promptItem.index} 张图片，类型: ${promptItem.type}${styleReferenceImage ? '（使用风格参考）' : '（独立生成）'}`);
        
        const requestBody: Record<string, any> = {
          prompt: promptItem.prompt,
          referenceImage,
          size: selectedSize,
          quality: selectedQuality,
          n: selectedCount,
        };
        
        if (styleReferenceImage) {
          requestBody.styleReferenceImage = styleReferenceImage;
        }
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (result.success) {
          const urls = result.urls || (result.url ? [result.url] : []);
          if (urls.length > 0) {
            console.log(`[EcommerceWorkflow] ✅ 第 ${promptItem.index} 张图片生成成功`);
            setGeneratedImages(prev => {
              const updated = [...prev, {
                index: promptItem.index,
                type: promptItem.type,
                url: urls[0],
              }];
              saveGeneratedImages(updated);
              return updated;
            });
            
            saveImageToHistory({
              url: urls[0],
              prompt: promptItem.prompt,
              productName: editedAnalysis?.productName || '产品',
              scene: selectedScene,
              platform: selectedPlatform,
              size: selectedSize,
            }).then(async (savedItem) => {
              const persistedUrl = await getImageUrl(savedItem.id, urls[0]);
              setGeneratedImages(prev => {
                const updated = prev.map(img =>
                  img.url === urls[0] ? { ...img, url: persistedUrl } : img
                );
                saveGeneratedImages(updated);
                return updated;
              });
              setImageHistory(await getRecentImages(50));
            });
            
            for (let i = 1; i < urls.length; i++) {
              const variantIndex = promptItem.index + (i * 0.1);
              setGeneratedImages(prev => {
                const updated = [...prev, {
                  index: variantIndex,
                  type: `${promptItem.type}_${i + 1}`,
                  url: urls[i],
                }];
                saveGeneratedImages(updated);
                return updated;
              });
              saveImageToHistory({
                url: urls[i],
                prompt: promptItem.prompt,
                productName: editedAnalysis?.productName || '产品',
                scene: selectedScene,
                platform: selectedPlatform,
                size: selectedSize,
              });
            }
          } else {
            console.log(`[EcommerceWorkflow] ❌ 第 ${promptItem.index} 张图片生成失败`);
            if (result.error) {
              console.log(`[EcommerceWorkflow] 错误信息: ${result.error}`);
            }
          }
        } else {
          console.log(`[EcommerceWorkflow] ❌ 第 ${promptItem.index} 张图片生成失败`);
          if (result.error) {
            console.log(`[EcommerceWorkflow] 错误信息: ${result.error}`);
          }
        }
      } catch (error) {
        console.error(`[EcommerceWorkflow] 生成第 ${promptItem.index} 张图片异常:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    saveLog({
      id: Date.now().toString(),
      step: 4,
      action: 'generate',
      timestamp: new Date().toISOString(),
      data: { prompts, imageUrl: referenceImage },
      modelUsed: 'GPT Image 2',
      status: 'success',
    });

    saveHistoryEntry({
      timestamp: new Date().toISOString(),
      productName: editedAnalysis?.productName || '未命名产品',
      sceneName: scenes.find(s => s.value === selectedScene)?.label || '未知场景',
      promptCount: prompts.length,
      hasImages: true,
    });

    setIsGeneratingImages(false);
  }, [prompts, referenceImage, selectedPrompts, editedAnalysis?.productName, selectedScene, selectedPlatform, selectedSize]);

  const downloadAll = useCallback(() => {
    downloadMultipleImages(
      generatedImages.map((img) => ({
        url: img.url,
        filename: `${editedAnalysis?.productName || 'product'}-${img.type}-${img.index}.png`,
      }))
    );
  }, [generatedImages, editedAnalysis]);

  const resetWorkflow = useCallback(() => {
    setStep(1);
    setReferenceImage(null);
    setAnalysisResult(null);
    setEditedAnalysis(null);
    setSelectedPlatform('');
    setSelectedScene('');
    setPrompts([]);
    setGeneratedImages([]);
    setVariants([]);
    setShowVariants(false);
    setExpandedPromptId(null);
    setStyleAnchor(null);
  }, []);

  const getImageTypeByType = (type: string) => {
    return imageTypes.find(t => t.type === type) || { index: 0, type, label: type, description: '' };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getSceneLabel = (scene: string) => {
    const sceneMap: Record<string, string> = {
      'everyday': '日常',
      'father': '父亲节',
      'mother': '母亲节',
      'christmas': '圣诞节',
      'birthday': '生日',
      'wedding': '婚礼',
      'valentine': '情人节',
      'graduation': '毕业季',
    };
    return sceneMap[scene] || scene;
  };

  const Step1 = () => (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-2xl p-12 text-center hover:border-gray-300 transition-colors cursor-pointer"
        onClick={() => document.getElementById('product-upload')?.click()}
      >
        <input
          id="product-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Paperclip className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">点击或拖拽上传图片</p>
        <p className="text-sm text-gray-400 mt-2">支持 JPG、PNG 格式</p>
      </div>

      {referenceImage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">已上传图片</h4>
            <button
              onClick={() => setReferenceImage(null)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="aspect-square rounded-xl overflow-hidden border border-gray-100">
            <img src={referenceImage} alt="Product" className="w-full h-full object-contain bg-gray-50" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">产品名称（可选）</label>
        <Input
          type="text"
          placeholder="输入产品名称，帮助AI更准确分析产品卖点"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-gray-400">输入产品名称可以帮助AI更好地理解产品特性和卖点</p>
      </div>

      <button
        onClick={analyzeProduct}
        disabled={!referenceImage || isAnalyzing}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          referenceImage && !isAnalyzing
            ? 'bg-black text-white hover:bg-gray-800 shadow-md'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isAnalyzing ? (
          <>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            正在分析...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            开始分析
          </>
        )}
      </button>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">确认分析结果</h3>
        <p className="text-gray-500">请确认系统分析的商品信息是否正确</p>
      </div>

      {referenceImage && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img src={referenceImage} alt="Product" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">参考图片</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
          <Input
            value={editedAnalysis?.productName || ''}
            onChange={(e) => setEditedAnalysis(prev => ({
              ...(prev || { productName: '', keyFeatures: [], description: '' }),
              productName: e.target.value
            }))}
            placeholder="请输入商品名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">产品卖点</label>
          <Textarea
            value={editedAnalysis?.keyFeatures.join('\n') || ''}
            onChange={(e) => setEditedAnalysis(prev => ({
              ...(prev || { productName: '', keyFeatures: [], description: '' }),
              keyFeatures: e.target.value.split('\n').filter(Boolean)
            }))}
            placeholder="每行一个卖点"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">产品简介</label>
          <Textarea
            value={editedAnalysis?.description || ''}
            onChange={(e) => setEditedAnalysis(prev => ({
              ...(prev || { productName: '', keyFeatures: [], description: '' }),
              description: e.target.value
            }))}
            placeholder="请输入产品简介"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={() => confirmAnalysis(false)}
        >
          <ArrowLeft className="w-4 h-4" />
          重新上传
        </button>
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-black text-white hover:bg-gray-800 shadow-md transition-colors flex items-center justify-center gap-2"
          onClick={() => confirmAnalysis(true)}
        >
          <Check className="w-4 h-4" />
          确认无误
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">选择平台和场景</h3>
        <p className="text-gray-500">根据您的销售需求选择平台站点和场景节日</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="text-sm font-medium text-gray-700 mb-3">分析结果</h4>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">商品名称：</span>{editedAnalysis?.productName}</p>
          <p><span className="text-gray-500">卖点：</span>{editedAnalysis?.keyFeatures.join(', ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">销售平台</label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="选择平台" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex items-center justify-between">
                    <span>{p.label}</span>
                    <span className="text-xs text-gray-400">{p.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">场景节日</label>
          <Select value={selectedScene} onValueChange={setSelectedScene}>
            <SelectTrigger>
              <SelectValue placeholder="选择场景" />
            </SelectTrigger>
            <SelectContent>
              {scenes.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <div className="flex items-center justify-between">
                    <span>{s.label}</span>
                    <span className="text-xs text-gray-400">{s.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">配色方案</label>
          <Select value={selectedColorScheme} onValueChange={setSelectedColorScheme}>
            <SelectTrigger>
              <SelectValue placeholder="选择配色" />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    {c.colors.length > 0 && (
                      <div className="flex gap-0.5">
                        {c.colors.map((color, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    )}
                    <span>{c.label}</span>
                    <span className="text-xs text-gray-400">{c.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedColorScheme !== 'auto' && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-gray-400">预览：</span>
              {colorSchemes.find(c => c.value === selectedColorScheme)?.colors.map((color, i) => (
                <div key={i} className="w-5 h-5 rounded-md border border-gray-200" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">视觉风格</label>
          <Select value={selectedVisualStyle} onValueChange={setSelectedVisualStyle}>
            <SelectTrigger>
              <SelectValue placeholder="选择风格" />
            </SelectTrigger>
            <SelectContent>
              {visualStyles.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  <div className="flex items-center justify-between">
                    <span>{v.label}</span>
                    <span className="text-xs text-gray-400">{v.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowVariants(!showVariants)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">变体图片生成</span>
            {variants.length > 0 && (
              <span className="text-xs text-gray-400">({variants.length} 个变体)</span>
            )}
          </div>
          {showVariants ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {showVariants && (
          <div className="p-4 border-t space-y-3">
            {variants.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                点击下方按钮添加变体
              </div>
            ) : (
              variants.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: v.color }}
                  />
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="变体名称"
                  />
                  <input
                    type="color"
                    value={v.color}
                    onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                    className="w-10 h-10 rounded-md cursor-pointer border border-gray-200"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(v.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加变体
            </Button>
            {variants.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVariants(defaultVariants)}
                className="w-full text-gray-500"
              >
                使用默认变体（黑、白、蓝）
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={() => setStep(2)}
        >
          <ArrowLeft className="w-4 h-4" />
          返回修改
        </button>
        <button
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            selectedPlatform && selectedScene && !isGeneratingPrompts
              ? 'bg-black text-white hover:bg-gray-800 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          onClick={generatePrompts}
          disabled={!selectedPlatform || !selectedScene || isGeneratingPrompts}
        >
          {isGeneratingPrompts ? (
            <>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              生成提示词...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              生成提示词
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const togglePromptSelection = (index: number) => {
    setSelectedPrompts(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index].sort();
    });
  };

  const selectAllPrompts = () => {
    setSelectedPrompts(prompts.map(p => p.index));
  };

  const deselectAllPrompts = () => {
    setSelectedPrompts([]);
  };

  const Step4 = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">提示词预览</h3>
        <p className="text-gray-500">选择要生成的图片，然后点击生成按钮</p>
      </div>

      {(selectedColorScheme !== 'auto' || selectedVisualStyle !== 'auto') && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <h4 className="text-sm font-medium text-gray-700">风格设置</h4>
          <div className="flex items-center gap-4">
            {selectedColorScheme !== 'auto' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">配色：</span>
                <span className="text-sm font-medium text-gray-800">
                  {colorSchemes.find(c => c.value === selectedColorScheme)?.label}
                </span>
                <div className="flex gap-1">
                  {colorSchemes.find(c => c.value === selectedColorScheme)?.colors.map((color, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            )}
            {selectedVisualStyle !== 'auto' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">风格：</span>
                <span className="text-sm font-medium text-gray-800">
                  {visualStyles.find(v => v.value === selectedVisualStyle)?.label}
                </span>
                <span className="text-xs text-gray-400">
                  {visualStyles.find(v => v.value === selectedVisualStyle)?.description}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">已选择 {selectedPrompts.length} / {prompts.length} 张图片</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAllPrompts}>
              全选
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAllPrompts}>
              取消全选
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {prompts.length === 0 ? (
          <div className="border rounded-xl p-8 text-center bg-gray-50">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">提示词尚未生成</p>
            <p className="text-sm text-gray-400 mt-1">请返回上一步重新生成提示词</p>
          </div>
        ) : (
          prompts.map((p) => {
            const imgType = getImageTypeByType(p.type);
            const isExpanded = expandedPromptId === p.index;
            const isSelected = selectedPrompts.includes(p.index);
            
            return (
              <div key={p.index} className={`border rounded-xl overflow-hidden ${isSelected ? 'border-blue-500 bg-blue-50/30' : ''}`}>
                <div
                  onClick={() => setExpandedPromptId(isExpanded ? null : p.index)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePromptSelection(p.index);
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {p.index}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{imgType.label}</span>
                      <span className="text-xs text-gray-400">{imgType.description}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {p.displayPrompt || p.purpose}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">提示词预览</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {p.displayPrompt || p.purpose}
                      </p>
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">查看英文原始提示词</summary>
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap mt-1">
                          {p.prompt}
                        </p>
                      </details>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">尺寸: 1000x1000</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-400">类型: {imgType.label}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">品牌风格应用</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 光影: cinematic lighting, high contrast, soft glow</li>
          <li>• 品质: premium quality, high-end commercial photography</li>
          <li>• 定制标识: customizable icon, editable area highlight</li>
        </ul>
      </div>

      <button
        onClick={generateImages}
        disabled={isGeneratingImages || selectedPrompts.length === 0}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          !isGeneratingImages && generatedImages.length === 0 && selectedPrompts.length > 0
            ? 'bg-black text-white hover:bg-gray-800 shadow-md'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isGeneratingImages ? (
          <>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            {generatedImages.length === 0 && selectedPrompts.some(i => prompts.find(p => p.index === i)?.type === 'main')
              ? '正在生成主图（风格锚定）...'
              : generatedImages.length === 0
              ? '正在生成图片...'
              : `正在以主图风格生成其余图片... (${generatedImages.length}/${selectedPrompts.length})`
            }
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            生成选中的 {selectedPrompts.length} 张图片
          </>
        )}
      </button>

      <div className="flex gap-4">
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={() => setStep(3)}
        >
          <ArrowLeft className="w-4 h-4" />
          返回修改
        </button>
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={resetWorkflow}
        >
          <RefreshCw className="w-4 h-4" />
          开始新任务
        </button>
      </div>
    </div>
  );

  const Step5 = () => (
    <div className="space-y-6">
      <div className="py-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">生成结果</h3>
        <p className="text-gray-400 text-center font-light">共生成 {generatedImages.length} 张商品图</p>
      </div>

      {generatedImages.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">生成的图片</h4>
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <Download size={14} />
              下载全部
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {prompts.map((promptItem) => {
              const imgType = getImageTypeByType(promptItem.type);
              const img = generatedImages.find((i) => i.type === promptItem.type);
              
              return (
                <div key={promptItem.index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {promptItem.index}
                    </span>
                    <span className="text-sm font-medium">{imgType.label}</span>
                    {img && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer group">
                    {img ? (
                      <>
                        <img 
                          src={img.url} 
                          alt={imgType.label} 
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-95"
                          onClick={() => setPreviewImage({ url: img.url, title: imgType.label })}
                        />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ url: img.url, title: imgType.label });
                            }}
                            className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                            title="放大查看"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImageByUrl(img.url, `${editedAnalysis?.productName || 'product'}-${img.type}-${img.index}.png`);
                            }}
                            className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                            title="下载图片"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{imgType.description}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">任务历史</span>
            {history.length > 0 && (
              <span className="text-xs text-gray-400">({history.length} 条)</span>
            )}
          </div>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {showHistory && history.length > 0 && (
          <div className="p-4 border-t max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.productName}</p>
                    <p className="text-xs text-gray-400">
                      {entry.sceneName} · {entry.promptCount} 张图 · {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                  {entry.hasImages && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={() => setStep(4)}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <button
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={resetWorkflow}
        >
          <RefreshCw className="w-4 h-4" />
          开始新任务
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-4 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">
            E
          </div>
          <span className="text-sm font-semibold text-gray-700">电商商品图生成</span>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'workflow'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            生成工作流
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            图片历史
            {imageHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {imageHistory.length}
              </span>
            )}
          </button>
        </div>
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger className="w-36 h-8 text-xs border-gray-200">
            <SelectValue placeholder="图片尺寸" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1024x1024">1024×1024 (1:1)</SelectItem>
            <SelectItem value="1536x1024">1536×1024 (3:2)</SelectItem>
            <SelectItem value="1024x1536">1024×1536 (2:3)</SelectItem>
            <SelectItem value="2000x1125">2000×1125 (16:9)</SelectItem>
            <SelectItem value="1125x2000">1125×2000 (9:16)</SelectItem>
            <SelectItem value="2000x2000">2000×2000 (1:1 高清)</SelectItem>
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

      {activeTab === 'workflow' && (
        <>
          <div className="px-8 py-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs
                    ${step >= s
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-400'
                    }
                  `}
                >
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
                    ${step === s ? 'bg-black text-white' : step > s ? 'bg-black text-white' : 'bg-gray-200'}
                  `}>
                    {step > s ? <Check className="w-3 h-3" /> : s}
                  </span>
                  <span className="font-medium">
                    {s === 1 && '上传'}
                    {s === 2 && '确认'}
                    {s === 3 && '场景'}
                    {s === 4 && '预览'}
                    {s === 5 && '结果'}
                  </span>
                  {s < 5 && step >= s && (
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-4 max-w-2xl mx-auto w-full">
            {step === 1 && Step1()}
            {step === 2 && Step2()}
            {step === 3 && Step3()}
            {step === 4 && Step4()}
            {step === 5 && Step5()}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto px-8 pb-4 max-w-2xl mx-auto w-full">
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
                  onClick={async () => { await clearHistory(); setImageHistory([]); }}
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
                  生成商品图后会自动保存到这里
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    setActiveTab('workflow');
                    setStep(1);
                  }}
                >
                  开始生成图片
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageHistory.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 hover:border-gray-300 transition-colors">
                      <img 
                        src={item.url} 
                        alt={item.productName}
                        className="w-full h-full object-contain"
                        onClick={() => setPreviewImage({ url: item.url, title: item.productName })}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({ url: item.url, title: item.productName });
                        }}
                        className="w-10 h-10 rounded-full bg-white/90 shadow-lg text-gray-600 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all hover:scale-110"
                        title="放大查看"
                      >
                        <Search className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImageByUrl(item.url, `${item.productName || 'product'}-${item.id}.png`);
                        }}
                        className="w-10 h-10 rounded-full bg-white/90 shadow-lg text-gray-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all hover:scale-110"
                        title="下载图片"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteImage(item.id);
                          setImageHistory(await getRecentImages(50));
                        }}
                        className="w-10 h-10 rounded-full bg-white/90 shadow-lg text-gray-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all hover:scale-110"
                        title="删除"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-400">
                        {getSceneLabel(item.scene)} · {formatTimestamp(new Date(item.timestamp).toISOString())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{previewImage.title}</h3>
              </div>
              <div className="p-6 flex items-center justify-center bg-gray-900">
                <img 
                  src={previewImage.url} 
                  alt={previewImage.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setPreviewImage(null)}
                >
                  关闭
                </button>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                  onClick={() => {
                    downloadImageByUrl(previewImage.url, `${previewImage.title}.png`);
                  }}
                >
                  <Download size={14} />
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
