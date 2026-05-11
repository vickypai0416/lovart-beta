'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Gift,
  Star,
  TrendingUp,
  Palette,
  Eye,
  Download,
  RefreshCw,
  X,
  History,
  Copy,
  Camera,
  Users,
  Target,
  Zap,
  Trash2,
} from 'lucide-react';
import { saveImgGenHistory, getImgGenHistoryWithUrls, deleteImgGenImage, clearImgGenHistory, ImgGenHistoryItem } from '@/lib/history-manager';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';
import { useAnalytics } from '@/hooks/useAnalytics';

// 产品类型预设
const productTypes = [
  { value: 'blanket', label: '毛毯', scene: '客厅场景,家庭氛围,沙发环境,暖光灯效' },
  { value: 'canvas', label: '无框帆布画', scene: '墙面展示,艺术画廊风格,家居装饰,自然光线' },
  { value: 'nightlight', label: '亚克力夜灯', scene: '暗环境,夜晚氛围,发光效果,情绪感表达' },
  { value: 'clothing', label: '刺绣服装', scene: '真人模特,胸口细节,穿搭氛围,生活方式镜头' },
  { value: 'mug', label: '陶瓷马克杯', scene: '早餐场景,热饮蒸汽,手持镜头,礼品感表达' },
  { value: 'wooden_sign', label: '定制木牌', scene: '家居装饰,自然光线,质感展示,温暖场景' },
  { value: 'crystal', label: '水晶摆件', scene: '精致展示,光线折射,高端礼品,优雅环境' },
  { value: 'metal_sign', label: '金属牌', scene: '质感展示,工业风格,复古氛围,坚固感' },
  { value: 'pet_memorial', label: '宠物纪念品', scene: '温暖回忆,柔和光线,情感表达,治愈氛围' },
  { value: 'frame', label: '定制相框', scene: '家居展示,温馨回忆,光线柔和,情感表达' },
  { value: 'keychain', label: '定制钥匙扣', scene: '手持展示,日常使用,便携感,礼品感' },
  { value: 'jewelry_box', label: '定制首饰盒', scene: '高端展示,优雅环境,礼品感,精致光线' },
];

// 节日/情绪预设
const holidays = [
  { value: 'mothers_day', label: '母亲节', emotion: '感恩、陪伴', mood: 'warm' },
  { value: 'fathers_day', label: '父亲节', emotion: '崇拜、回忆', mood: 'retro' },
  { value: 'valentines_day', label: '情人节', emotion: '爱、浪漫', mood: 'romantic' },
  { value: 'christmas', label: '圣诞节', emotion: '家庭、温暖', mood: 'festive' },
  { value: 'new_baby', label: '新生儿', emotion: '幸福、仪式感', mood: 'gentle' },
  { value: 'pet_memorial', label: '宠物纪念', emotion: '治愈、思念', mood: 'warm' },
  { value: 'graduation', label: '毕业季', emotion: '成长、青春', mood: 'energetic' },
  { value: 'birthday', label: '生日', emotion: '庆祝、惊喜', mood: 'festive' },
  { value: 'anniversary', label: '纪念日', emotion: '珍惜、浪漫', mood: 'romantic' },
  { value: 'wedding', label: '婚礼', emotion: '幸福、庄重', mood: 'elegant' },
];

// 风格预设
const styles = [
  { value: 'watercolor', label: '水彩风', prompt: 'watercolor illustration, soft edges, artistic painting' },
  { value: 'cartoon', label: '卡通风', prompt: 'cartoon style, cute illustration, vibrant colors' },
  { value: 'vintage', label: '美式复古', prompt: 'vintage American style, retro aesthetic, nostalgic mood' },
  { value: 'minimal', label: '北欧极简', prompt: 'Nordic minimalist style, clean lines, neutral palette' },
  { value: 'luxury', label: '高端商业', prompt: 'luxury commercial photography, professional studio lighting' },
  { value: 'lifestyle', label: '生活方式', prompt: 'lifestyle photography, natural setting, authentic moment' },
];

// 亚马逊6图结构
const sixImageStructure = [
  {
    id: 'main',
    name: '主图',
    purpose: '提高CTR（点击率）',
    requirements: '纯白背景,产品居中,无文字,无装饰',
    defaultPrompt: 'Professional product photography on pure white background, studio lighting, centered composition, clean and minimal, Amazon main image style, high resolution product shot',
  },
  {
    id: 'feature',
    name: '核心卖点图',
    purpose: '展示产品核心价值',
    requirements: '突出特点,清晰展示,简洁构图',
    defaultPrompt: 'Product feature showcase, close-up shot highlighting key features, professional studio lighting, clean composition',
  },
  {
    id: 'scene',
    name: '情绪场景图',
    purpose: '触发情感共鸣',
    requirements: '真实场景,情绪氛围,模特互动',
    defaultPrompt: 'Product in lifestyle scene, emotional atmosphere, model interacting with product, natural lighting, aspirational setting',
  },
  {
    id: 'customization',
    name: '定制展示图',
    purpose: '展示个性化',
    requirements: '放大定制区域,强调专属感',
    defaultPrompt: 'Customization detail showcase, highlighting personalized area, emphasizing exclusivity, close-up shot',
  },
  {
    id: 'gift',
    name: '礼物属性图',
    purpose: '强调礼品属性',
    requirements: '礼盒包装,礼物氛围,送礼场景',
    defaultPrompt: 'Product as gift, gift box packaging, festive wrapping, gifting scenario, warm atmosphere',
  },
  {
    id: 'detail',
    name: '材质/尺寸细节图',
    purpose: '建立信任',
    requirements: '放大细节,质感展示,尺寸对比',
    defaultPrompt: 'Extreme close-up product detail shot, macro photography, highlighting texture and material quality, sharp focus, professional studio lighting',
  },
];

export default function AmazonCreativeDirectorWorkflow() {
  const { trackGeneration, updateGeneration, isInitialized } = useAnalytics();
  const [selectedProduct, setSelectedProduct] = useState('blanket');
  const [selectedHoliday, setSelectedHoliday] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('luxury');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>(['main', 'scene']);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [imageHistory, setImageHistory] = useState<ImgGenHistoryItem[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      getImgGenHistoryWithUrls().then(setImageHistory);
    }
  }, []);

  // 获取当前产品的场景提示词
  const getProductScene = () => {
    const product = productTypes.find(p => p.value === selectedProduct);
    return product?.scene || '';
  };

  // 获取节日情绪描述
  const getHolidayEmotion = () => {
    if (!selectedHoliday) return '';
    const holiday = holidays.find(h => h.value === selectedHoliday);
    return holiday?.emotion || '';
  };

  // 为每张图生成完整提示词
  const generatePromptForImage = (imageType: string, basePrompt: string) => {
    const product = productTypes.find(p => p.value === selectedProduct);
    const style = styles.find(s => s.value === selectedStyle);
    const holiday = selectedHoliday ? holidays.find(h => h.value === selectedHoliday) : null;
    
    let prompt = basePrompt;
    
    // 添加产品场景
    if (product?.scene) {
      prompt += `, ${product.scene}`;
    }
    
    // 添加风格
    if (style?.prompt) {
      prompt += `, ${style.prompt}`;
    }
    
    // 添加节日情绪
    if (holiday?.value) {
      const moodDescriptions = {
        warm: 'warm lighting, cozy atmosphere',
        retro: 'vintage color palette, nostalgic mood',
        romantic: 'soft lighting, romantic atmosphere',
        festive: 'festive decorations, celebratory mood',
        gentle: 'soft lighting, gentle atmosphere',
        energetic: 'bright, vibrant atmosphere',
        elegant: 'elegant, sophisticated atmosphere',
      };
      const mood = holiday.mood as keyof typeof moodDescriptions;
      if (moodDescriptions[mood]) {
        prompt += `, ${moodDescriptions[mood]}`;
      }
    }
    
    // 添加自定义描述
    if (customDescription.trim()) {
      prompt += `, ${customDescription.trim()}`;
    }
    
    return prompt;
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId) 
        : [...prev, imageId]
    );
  };

  const generateImages = async () => {
    if (selectedImages.length === 0) return;
    
    setIsGenerating(true);
    const startTime = Date.now();
    
    // 确保 analytics 初始化完成
    if (!isInitialized) {
      console.log('[Analytics] Waiting for initialization...');
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

    const allPrompts = selectedImages.map(imageId => {
      const imageConfig = sixImageStructure.find(img => img.id === imageId);
      if (!imageConfig) return '';
      return generatePromptForImage(imageId, imageConfig.defaultPrompt);
    }).filter(Boolean);

    const newImages: string[] = [];
    
    for (let i = 0; i < allPrompts.length; i++) {
      const prompt = allPrompts[i];
      if (!prompt) continue;
      
      console.log('[Analytics] AmazonCreativeDirector: Calling trackGeneration...');
      const generationId = await trackGeneration({
        prompt,
        size: '1024x1024',
        quality: 'high',
        model: 'gpt-image-2-all',
        count: 1,
      });
      generationIdRef.current = generationId;
      console.log('[Analytics] AmazonCreativeDirector: Tracked generation:', generationId);
      
      // 这里调用实际的图片生成 API
      // 为了演示，我们先跳过实际生成
      // 实际使用时，这里应该调用 /api/generate
      
      // 模拟图片生成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 临时用占位图
      newImages.push('');
      
      if (generationId) {
        await updateGeneration(generationId, {
          status: 'success',
          duration: Date.now() - startTime,
        });
      }
    }
    
    setGeneratedImages(newImages);
    setIsGenerating(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
  };

  const copyPrompt = (imageId: string) => {
    const imageConfig = sixImageStructure.find(img => img.id === imageId);
    if (imageConfig) {
      const prompt = generatePromptForImage(imageId, imageConfig.defaultPrompt);
      navigator.clipboard.writeText(prompt);
    }
  };

  const product = productTypes.find(p => p.value === selectedProduct);
  const holiday = selectedHoliday ? holidays.find(h => h.value === selectedHoliday) : null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎬 亚马逊创意总监</h1>
        <p className="text-gray-600">
          从"提升商品点击率（CTR）与转化率（CVR）"的角度，为定制类产品设计高商业价值的亚马逊Listing商品图
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="generator">
            <Sparkles className="w-4 h-4 mr-2" />
            创意生成
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            历史记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧配置区 */}
            <div className="space-y-6">
              {/* 产品选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    产品类型
                  </CardTitle>
                  <CardDescription>选择您的产品类型</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择产品类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {product && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <p>📋 推荐场景：{product.scene}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 节日/情绪选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    节日/情绪
                  </CardTitle>
                  <CardDescription>选择节日或情绪氛围</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedHoliday || ''} onValueChange={setSelectedHoliday}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择节日/情绪（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {holidays.map(h => (
                        <SelectItem key={h.value} value={h.value}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {holiday && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                      <p>💭 情绪方向：{holiday.emotion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 风格选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    视觉风格
                  </CardTitle>
                  <CardDescription>选择图片风格</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择风格" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* 自定义描述 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    自定义描述
                  </CardTitle>
                  <CardDescription>添加额外的描述信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="例如：展示产品细节、强调礼品包装、家庭场景..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* 参考图片上传 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    参考图片
                  </CardTitle>
                  <CardDescription>上传产品原图进行参考（可选）</CardDescription>
                </CardHeader>
                <CardContent>
                  {!referenceImage ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">点击或拖拽上传参考图片</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-full h-48 object-contain rounded-lg"
                      />
                      <button
                        onClick={removeReferenceImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 生成按钮 */}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={generateImages}
                disabled={isGenerating || selectedImages.length === 0}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    生成 {selectedImages.length} 张图片
                  </>
                )}
              </Button>
            </div>

            {/* 右侧6图规划区 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    亚马逊6图规划
                  </CardTitle>
                  <CardDescription>选择要生成的图片，最多6张</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {sixImageStructure.map((image) => (
                      <Card
                        key={image.id}
                        className={`cursor-pointer transition-all ${
                          selectedImages.includes(image.id) 
                            ? 'border-2 border-blue-500 bg-blue-50' 
                            : 'border border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleImageSelection(image.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <Checkbox
                                checked={selectedImages.includes(image.id)}
                                onCheckedChange={() => toggleImageSelection(image.id)}
                                className="mr-2"
                              />
                              <h3 className="font-semibold text-sm">{image.name}</h3>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPrompt(image.id);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{image.purpose}</p>
                          <p className="text-xs text-gray-400">{image.requirements}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 生成的图片预览 */}
              {generatedImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      生成的图片
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {generatedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                              <p>图片 {idx + 1}</p>
                              <p className="text-xs text-gray-300">（演示模式）</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 策略卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    视觉营销策略
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Gift className="w-4 h-4 mr-2 text-green-600" />
                        <span className="font-medium text-green-800">礼品属性</span>
                      </div>
                      <p className="text-green-700 text-xs">
                        定制类产品的核心：用户自己的名字、照片、纪念日所带来的情绪价值
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-blue-800">节日情绪</span>
                      </div>
                      <p className="text-blue-700 text-xs">
                        用户购买的不是产品，而是情绪。不同节日对应不同情绪
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Camera className="w-4 h-4 mr-2 text-yellow-600" />
                        <span className="font-medium text-yellow-800">商业摄影</span>
                      </div>
                      <p className="text-yellow-700 text-xs">
                        偏向商业摄影、高端电商视觉、情绪化营销、电影感构图
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>历史记录</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  clearImgGenHistory();
                  setImageHistory([]);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清空历史
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {imageHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无历史记录</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageHistory.map((item) => (
                      <div key={item.id} className="relative group">
                        <img
                          src={item.url}
                          alt="Generated"
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                            onClick={() => deleteImgGenImage(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                            onClick={() => downloadImageByUrl(item.url)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{item.prompt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}