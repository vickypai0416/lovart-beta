'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
  Image as ImageIcon,
  Download,
  RefreshCw,
  X,
  Sparkles,
  Loader2,
  Grid3X3,
  CheckCircle2,
  Heart,
  Gift,
  Star,
  Wand2,
  Eye,
  Copy,
  Upload,
  Trash2,
  ChevronRight,
  Lightbulb,
  Package,
  Tag,
  Users
} from 'lucide-react';
import { downloadImageByUrl, downloadMultipleImages } from '@/lib/download';
import type { ProductAnalysis } from '@/lib/deep-workflow/types';

// A+ 模块类型
 type APlusModuleType = 'hero' | 'personalization' | 'emotional' | 'features' | 'lifestyle';

// 情感场景类型 - 添加自定义选项
 type EmotionalScene = 'father' | 'mother' | 'couple' | 'family' | 'pet' | 'general' | 'custom';

// 设备类型
 type DeviceType = 'desktop' | 'mobile';

// A+ 卡片数据结构
interface APlusCard {
  id: string;
  moduleType: APlusModuleType;
  deviceType: DeviceType;
  title: string;
  moduleName: string;
  size: string;
  prompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  order: number;
}

// 色调风格配置
const COLOR_STYLES: Record<string, { label: string; colorPalette: string; lightingStyle: string; moodAtmosphere: string; visualStyle: string }> = {
  warm: {
    label: '暖色调',
    colorPalette: 'warm neutral tones with soft beige, cream, terracotta and muted gold accents',
    lightingStyle: 'soft warm natural window light with golden hour glow',
    moodAtmosphere: 'warm, heartfelt, cozy, inviting, nostalgic',
    visualStyle: 'warm minimalist composition with elegant soft focus'
  },
  cool: {
    label: '冷色调',
    colorPalette: 'cool tones with soft blue, teal, silver and white accents',
    lightingStyle: 'soft cool diffused light with subtle blue undertones',
    moodAtmosphere: 'calm, serene, modern, professional, trustworthy',
    visualStyle: 'clean crisp composition with cool color harmony'
  },
  bright: {
    label: '明亮活泼',
    colorPalette: 'bright vibrant colors with white, yellow, orange and fresh green accents',
    lightingStyle: 'bright natural daylight with high key lighting',
    moodAtmosphere: 'energetic, cheerful, youthful, optimistic, dynamic',
    visualStyle: 'bright airy composition with lively color pops'
  },
  premium: {
    label: '高级简约',
    colorPalette: 'premium neutral palette with charcoal, ivory, champagne and rose gold accents',
    lightingStyle: 'soft studio lighting with subtle rim light and gentle shadows',
    moodAtmosphere: 'luxurious, sophisticated, exclusive, refined, elegant',
    visualStyle: 'minimalist luxury composition with generous negative space'
  },
  nature: {
    label: '自然户外',
    colorPalette: 'earthy natural tones with sage green, warm brown, sand and sky blue accents',
    lightingStyle: 'natural outdoor sunlight with soft dappled shadows',
    moodAtmosphere: 'organic, authentic, grounded, fresh, wholesome',
    visualStyle: 'natural lifestyle composition with organic textures'
  },
  romantic: {
    label: '浪漫温馨',
    colorPalette: 'romantic soft palette with blush pink, lavender, pearl white and soft rose accents',
    lightingStyle: 'soft dreamy backlighting with gentle lens flare',
    moodAtmosphere: 'romantic, tender, dreamy, intimate, delicate',
    visualStyle: 'soft ethereal composition with gentle bokeh effects'
  }
};

// 默认色调风格
const DEFAULT_COLOR_STYLE = 'warm';

// 情感场景配置
const EMOTIONAL_SCENES: Record<EmotionalScene, { label: string; prompt: string }> = {
  father: {
    label: '父亲节',
    prompt: "Father's Day emotional scene, father receiving thoughtful gift, warm family moment, appreciative expression, cozy home setting, soft warm lighting"
  },
  mother: {
    label: '母亲节',
    prompt: "Mother's Day emotional scene, mother receiving heartfelt gift, tender family moment, loving expression, elegant home setting, soft glowing lighting"
  },
  couple: {
    label: '情侣',
    prompt: 'Romantic couple scene, partners exchanging meaningful gift, intimate moment, loving gaze, elegant setting, warm romantic lighting'
  },
  family: {
    label: '家庭',
    prompt: 'Family gathering scene, multi-generational family sharing gift moment, joyful expressions, cozy living room, natural warm lighting'
  },
  pet: {
    label: '宠物',
    prompt: 'Pet lover scene, owner with beloved pet, pet-friendly product showcase, joyful interaction, home setting, bright cheerful lighting'
  },
  general: {
    label: '通用',
    prompt: 'Universal gift-giving scene, recipient opening thoughtful present, genuine happiness, modern lifestyle setting, soft natural lighting'
  },
  custom: {
    label: '自定义',
    prompt: '' // 使用用户自定义内容
  }
};

// 模块配置
const MODULE_CONFIG: Record<APlusModuleType, { icon: typeof Star; name: string; shortName: string }> = {
  hero: { icon: Star, name: 'Hero Banner', shortName: 'Hero' },
  personalization: { icon: Gift, name: 'Personalization', shortName: 'Perso' },
  emotional: { icon: Heart, name: 'Emotional Story', shortName: 'Emoti' },
  features: { icon: CheckCircle2, name: '产品功能', shortName: 'Func' },
  lifestyle: { icon: Heart, name: 'Lifestyle', shortName: 'Life' }
};

// 尺寸配置
const SIZE_CONFIG: Record<DeviceType, { width: number; height: number; label: string }> = {
  desktop: { width: 2416, height: 1008, label: '2416x1008' },
  mobile: { width: 1664, height: 1008, label: '1664x1008' }
};

export default function ProductDetailWorkflow() {
  // 基础状态
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [coreSellingPoint, setCoreSellingPoint] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('low');
  const [emotionalScene, setEmotionalScene] = useState<EmotionalScene>('general');
  const [customEmotionalText, setCustomEmotionalText] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [cards, setCards] = useState<APlusCard[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedColorStyle, setSelectedColorStyle] = useState<string>(DEFAULT_COLOR_STYLE);
  const [promptsGenerated, setPromptsGenerated] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 产品图上传和分析状态（模仿Amazon Listing）
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化10张卡片（5模块 x 2设备）
  const initCards = () => {
    const newCards: APlusCard[] = [];
    let order = 1;
    
    (['desktop', 'mobile'] as DeviceType[]).forEach((deviceType) => {
      (['hero', 'personalization', 'emotional', 'features', 'lifestyle'] as APlusModuleType[]).forEach((moduleType) => {
        const config = MODULE_CONFIG[moduleType];
        const sizeConfig = SIZE_CONFIG[deviceType];
        
        newCards.push({
          id: `aplus-${deviceType}-${moduleType}-${Date.now()}`,
          moduleType,
          deviceType,
          title: `${deviceType === 'desktop' ? 'Desktop' : 'Mobile'} ${config.name}`,
          moduleName: config.name,
          size: sizeConfig.label,
          prompt: '',
          status: 'pending',
          order: order++
        });
      });
    });
    
    setCards(newCards);
    setPromptsGenerated(false);
  };

  // 处理文件上传
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setAnalysisError('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError('图片大小不能超过 10MB');
      return;
    }

    setAnalysisError(null);
    
    // 转换为 base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      setUploadedImage(base64Image);
      
      // 自动开始分析
      await analyzeProduct(base64Image);
    };
    reader.readAsDataURL(file);
  }, []);

  // 分析产品（模仿Amazon Listing）
  const analyzeProduct = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/deep-workflow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          productHint: productDescription || undefined
        }),
      });

      const result = await response.json();

      if (result.success && result.analysis) {
        setProductAnalysis(result.analysis);
        
        // 自动填充产品信息
        setProductName(result.analysis.product_name || '');
        setProductDescription(
          `材质: ${result.analysis.material || '未知'}\n` +
          `主要特点: ${result.analysis.main_features?.join(', ') || ''}\n` +
          `目标受众: ${result.analysis.target_audience?.join(', ') || ''}`
        );
        setCoreSellingPoint(result.analysis.selling_points?.[0] || '');
        
        // 自动检测情感场景
        const holidays = result.analysis.recommended_holidays || [];
        if (holidays.some((h: string) => h.includes("Father") || h.includes('父亲节'))) {
          setEmotionalScene('father');
        } else if (holidays.some((h: string) => h.includes("Mother") || h.includes('母亲节'))) {
          setEmotionalScene('mother');
        } else if (result.analysis.gift_suitable) {
          setEmotionalScene('general');
        }
        
        // 自动生成提示词
        setTimeout(() => {
          generateAllPrompts();
        }, 100);
      } else {
        setAnalysisError(result.error || '分析失败');
      }
    } catch (error) {
      setAnalysisError('分析请求失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 删除上传的图片
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setProductAnalysis(null);
    setAnalysisError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 获取当前色调风格配置
  const getCurrentColorStyle = () => COLOR_STYLES[selectedColorStyle] || COLOR_STYLES[DEFAULT_COLOR_STYLE];

  // 生成Hero Banner提示词 - Hero Banner主题，强调真实布料物理特性
  const generateHeroPrompt = (product: string, sellingPoint: string, device: DeviceType): string => {
    const valueProposition = sellingPoint || 'Wrap Up Your Achievements';
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const heroPlacement = "ABSOLUTE PHYSICS PRIORITY: the blanket is naturally draped over furniture or held by a person, the printed design is PARTIALLY VISIBLE ONLY (40-60% shown) with significant portions OBSCURED by natural folds and draping, the design is INTERRUPTED and DEFORMED by fabric physics, the blanket is NEVER laid flat or posed to display the full design, natural fabric behavior takes priority over design visibility, showcasing the complete printed artwork is FORBIDDEN";
    return `Professional Amazon A+ Hero Banner ${size.label}, ${product} as main subject, the blanket must behave like a real soft flannel blanket with natural fabric draping, visible folds and wrinkles, design follows fabric deformation, printed artwork slightly conforms to folds, soft plush texture visible across the printed area, natural thickness along blanket edges (10-15mm visual thickness), realistic contact shadows where blanket touches surfaces, edge绒毛 and卷边 visible, the blanket appears physically soft flexible and naturally integrated, NOT a flat poster banner canvas or rigid board, ${heroPlacement}, elegant emotional figure in background 30%, premium composition, MUST INCLUDE large hero headline "${valueProposition}" at top, secondary headline "Custom Graduation Blanket" or similar product category, subheadline "Personalized with Your Name & School", feature icons with labels: "CUSTOMIZABLE Name & School", "PREMIUM QUALITY Soft & Durable", "MADE TO CELEBRATE Your Special Moment", rich typography design with graduation cap icons, ${style.colorPalette}, ${style.lightingStyle}, ${style.moodAtmosphere}, ${style.visualStyle}, high-end advertising photography, 4K quality`;
  };

  // 生成Personalization提示词 - 展示定制效果并包含简单定制说明
  const generatePersonalizationPrompt = (product: string, device: DeviceType): string => {
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const personalizationPlacement = "ABSOLUTE PHYSICS PRIORITY: the blanket is naturally draped or displayed, the printed design is PARTIALLY VISIBLE ONLY (40-60% shown) with significant portions OBSCURED by natural folds and draping, the design is INTERRUPTED and DEFORMED by fabric physics, the blanket is NEVER laid flat or posed to display the full design, natural fabric behavior takes priority over design visibility, showcasing the complete printed artwork is FORBIDDEN";
    return `Amazon A+ Personalization module ${size.label}, ${product} showing the personalized custom design result with simple customization steps, ${personalizationPlacement}, the blanket displays the custom photo/name/message printed on it in a beautiful lifestyle setting, MUST INCLUDE clear step-by-step customization guide: "Step 1: Upload Your Photo", "Step 2: Add Name & School", "Step 3: We Create Your Gift" with elegant icons, romantic/emotional headline like "Personalized Just for You" or "A Gift Made for [Name]", elegant script typography, the blanket naturally draped showing the custom print as a keepsake, warm sentimental atmosphere, ${style.colorPalette}, ${style.lightingStyle}, emotional gift photography emphasizing the personal connection`;
  };

  // 生成Emotional Story提示词 - 支持自定义场景，强调真实布料物理特性
  const generateEmotionalPrompt = (product: string, scene: EmotionalScene, device: DeviceType, customText: string): string => {
    const sceneConfig = EMOTIONAL_SCENES[scene];
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const fabricPhysics = "the blanket must behave like a real soft flannel blanket with natural fabric draping, visible folds and wrinkles where the body creates pressure points, design follows fabric deformation with 5-10% artwork softening, printed photo area shows fabric texture and绒毛遮挡, natural thickness along edges, realistic contact shadows where blanket touches body or surfaces, the blanket appears physically soft and flexible, NOT a flat poster or rigid board";
    const naturalPlacement = "MANDATORY PHYSICS COMPLIANCE: the blanket is wrapped around the person's shoulders and body, the printed design is MOSTLY HIDDEN (only 20-30% visible) with the MAJORITY OBSCURED by body contact, shoulder draping, arm positions, and natural fabric folds, the design is SEVERELY INTERRUPTED by the 3D form of the human body, the blanket CONFORMS to body contours with realistic sagging and bunching, the printed pattern is BROKEN and DISCONTINUOUS across folds and overlaps, it is PHYSICALLY IMPOSSIBLE to see the full design when wrapped around a person, the focus is purely on the emotional moment and human subjects, the blanket is a prop not the main display subject";

    // 如果是自定义场景，使用用户输入的文本
    if (scene === 'custom' && customText) {
      // 检测是否是毕业季相关场景
      const isGraduation = customText.toLowerCase().includes('graduation') ||
                           customText.toLowerCase().includes('毕业') ||
                           customText.toLowerCase().includes('graduate');

      // 根据场景类型构建特定的场景描述
      let sceneSpecifics = '';
      if (isGraduation) {
        sceneSpecifics = 'graduation ceremony setting with graduates wearing caps and gowns, diploma in hand, graduation stage or campus background, celebratory atmosphere with confetti, proud family members in background, "Class of 2024/2025" signage, academic celebration theme';
      } else {
        sceneSpecifics = `${customText} themed setting with appropriate decorations, atmosphere and visual elements that clearly represent ${customText}`;
      }

      return `Amazon A+ Emotional Story module ${size.label}, ${customText} celebration scene, ${product} as the perfect ${customText} gift, ${sceneSpecifics}, ${product} naturally integrated in ${customText} scene, ${fabricPhysics}, ${naturalPlacement}, emotional ${customText} moment with person wrapped in the blanket showing natural fabric behavior, authentic ${customText} joy and celebration, the blanket wrapped around shoulders and body with MOST OF THE DESIGN HIDDEN by the human form, realistic sagging and bunching conforming to body contours, the printed pattern BROKEN and DISCONTINUOUS across natural folds, MUST INCLUDE visible ${customText} themed emotional headline "Celebrate Your ${customText}" or "The Perfect ${customText} Gift" prominently displayed, ${customText} decorative elements and themed props, heartfelt descriptive copy about ${customText} memories and celebration, warm emotional narrative text overlay, ${style.colorPalette}, ${style.lightingStyle}, ${style.moodAtmosphere}, ${customText} lifestyle photography with storytelling text elements, focus purely on emotional storytelling and human connection, NO product features or technical specifications`;
    }

    const emotionalHeadlines: Record<EmotionalScene, string> = {
      father: "A Gift He'll Treasure Forever",
      mother: "Made with Love for Mom",
      couple: "Celebrate Your Love Story",
      family: "Creating Family Memories",
      pet: "For Your Furry Best Friend",
      general: "The Perfect Personalized Gift",
      custom: "Your Special Moment"
    };
    const headline = emotionalHeadlines[scene];
    return `Amazon A+ Emotional Story module ${size.label}, ${sceneConfig.prompt}, ${product} naturally integrated in scene, ${fabricPhysics}, ${naturalPlacement}, emotional human subjects wrapped in the blanket showing natural fabric behavior, authentic moment of joy and connection, the blanket wrapped around shoulders and body with MOST OF THE DESIGN HIDDEN by the human form, realistic sagging and bunching conforming to body contours, the printed pattern BROKEN and DISCONTINUOUS across natural folds, MUST INCLUDE visible emotional headline "${headline}" with supporting subtext, heartfelt descriptive copy, warm emotional narrative text overlay, ${style.colorPalette}, ${style.lightingStyle}, ${style.moodAtmosphere}, lifestyle photography with storytelling text elements, focus purely on emotional storytelling and human connection, NO product features or technical specifications`;
  };

  // 生成Features提示词（产品各种功能图片）
  const generateFeaturesPrompt = (product: string, device: DeviceType): string => {
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const featuresPlacement = "MANDATORY PHYSICS COMPLIANCE: the blanket is displayed leaning against pillows, folded, or casually draped, the printed design is MOSTLY OBSCURED (only 30-40% visible) with significant portions hidden by folds, overlaps, and the 3D form of the draped fabric, the pattern is INTERRUPTED and BROKEN at fold lines, NEVER display the full design when the blanket is not laid completely flat, the design must realistically conform to the fabric's physical shape";
    return `Amazon A+ Product Features module ${size.label}, ${product} showcasing multiple product features and functions, ${featuresPlacement}, the blanket positioned against pillows or furniture with natural draping and visible folds obscuring the design, MUST INCLUDE visible feature text labels: "Premium Quality", "Custom Design", "Perfect Gift", "Made to Last" with clear readable typography, feature descriptions and bullet points, benefit callouts with text annotations, clean feature showcase layout with informative copywriting, ${style.colorPalette}, ${style.lightingStyle}, professional product photography with detailed text annotations`;
  };

  // 生成Lifestyle提示词
  const generateLifestylePrompt = (product: string, device: DeviceType): string => {
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const lifestylePlacement = "ABSOLUTE PHYSICS PRIORITY: the blanket is naturally used in the scene - draped over furniture, wrapped around a person, or casually placed, the printed design is PARTIALLY VISIBLE ONLY (30-50% shown) with significant portions OBSCURED by natural folds, usage patterns, and draping, the design is INTERRUPTED and DEFORMED by fabric physics, the blanket is NEVER posed flat to display the full design, authentic usage takes priority over design visibility, showcasing the complete printed artwork is FORBIDDEN";
    return `Amazon A+ Lifestyle module ${size.label}, ${product} in authentic everyday use scenario, aspirational lifestyle moment, product naturally integrated into daily routine, ${lifestylePlacement}, warm and relatable atmosphere, MUST INCLUDE visible lifestyle headline and descriptive text, brand messaging, lifestyle copywriting, inspirational quote or tagline, ${style.colorPalette}, ${style.lightingStyle}, ${style.moodAtmosphere}, lifestyle photography with editorial text overlays`;
  };

  // 生成多场景应用展示提示词（第5张图）- 人物使用产品的真实场景
  const generateMultiScenePrompt = (product: string, device: DeviceType): string => {
    const size = SIZE_CONFIG[device];
    const style = getCurrentColorStyle();
    const fabricPhysics = "the blanket must behave like a real soft flannel blanket in every scene, natural fabric draping with visible folds and wrinkles, design follows fabric deformation, printed artwork conforms to folds with 5-10% softening, soft plush texture visible, natural thickness along edges (10-15mm), realistic contact shadows where blanket touches surfaces or body, edge绒毛 and卷边 visible, the blanket appears physically soft flexible and naturally integrated, NOT a flat poster banner canvas or rigid board";
    const multiScenePlacement = "ABSOLUTE PHYSICS PRIORITY: in each scene the blanket is naturally used and draped, the printed design is PARTIALLY VISIBLE ONLY (20-40% shown) with MOST PORTIONS OBSCURED by natural folds, body contact, and usage patterns, the design is INTERRUPTED and DEFORMED by fabric physics in every scene, the blanket is NEVER laid out flat to display the full design, natural physical behavior and authentic usage always take priority over design visibility, showcasing the complete printed artwork is FORBIDDEN";
    return `Amazon A+ Multi-Scene Applications module ${size.label}, ${product} showcased in 4 different AI-analyzed usage scenarios side by side with real people using the product, ${fabricPhysics}, ${multiScenePlacement}, Scene 1 "COZY THROW" shows a real person relaxing on couch wrapped in the blanket with natural body-contouring folds, blanket draping naturally over their legs and shoulders with design partially obscured, Scene 2 "PICNIC BLANKET" shows real people having a picnic in park sitting on the blanket spread on grass with natural unevenness and grass blades visible around edges, design partially visible from folds and people sitting on it, Scene 3 "DORM DECOR" shows a real person in bedroom with blanket hanging on wall as tapestry or draped over bed with natural下垂 and folds obscuring parts of design, Scene 4 "TRAVEL & NAPS" shows a real person sleeping on airplane or traveling with blanket wrapped around them showing realistic wrapping and contact with body with design mostly obscured, each scene features authentic human subjects interacting naturally with the blanket, MUST INCLUDE large headline "MADE FOR EVERY MOMENT" at top, subtitle "Cozy, Stylish & Versatile", each scene with icon and descriptive text label, ${style.colorPalette}, ${style.lightingStyle}, ${style.moodAtmosphere}, professional lifestyle photography showing real people using the product in authentic everyday situations`;
  };

  // 生成单个卡片提示词
  const generateCardPrompt = (card: APlusCard, product: string, sellingPoint: string, scene: EmotionalScene, customText: string): string => {
    switch (card.moduleType) {
      case 'hero':
        // 第1张图改成Lifestyle的内容
        return generateLifestylePrompt(product, card.deviceType);
      case 'personalization':
        return generatePersonalizationPrompt(product, card.deviceType);
      case 'emotional':
        return generateEmotionalPrompt(product, scene, card.deviceType, customText);
      case 'features':
        // 第4张图保留产品特点
        return generateFeaturesPrompt(product, card.deviceType);
      case 'lifestyle':
        // 第5张图：多场景应用展示
        return generateMultiScenePrompt(product, card.deviceType);
      default:
        return '';
    }
  };

  // 生成所有提示词
  const generateAllPrompts = () => {
    if (!productName) return;

    setCards(prev => prev.map(card => ({
      ...card,
      prompt: generateCardPrompt(card, productName, coreSellingPoint, emotionalScene, customEmotionalText)
    })));
    setPromptsGenerated(true);
  };

  // 单张图片生成
  const generateSingleImage = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || !card.prompt) {
      // 如果没有提示词，先生成提示词
      if (!promptsGenerated && productName) {
        generateAllPrompts();
      }
      return;
    }

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, status: 'generating', error: undefined } : c
    ));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: card.prompt,
          size: card.size,
          quality: selectedQuality,
          n: 1,
          model: 'gpt-image-2',
          // 如果有上传的产品图，作为参考图传递
          ...(uploadedImage ? { referenceImage: uploadedImage } : {}),
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`生成失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        setCards(prev => prev.map(c => 
          c.id === cardId ? { ...c, status: 'completed', imageUrl: data.url } : c
        ));
      } else {
        throw new Error(data.error || '生成失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成失败';
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, status: 'failed', error: errorMessage } : c
      ));
    }
  };

  // 生成全部图片
  const generateAllImages = async () => {
    if (!productName) return;
    
    // 先确保提示词已生成
    if (!promptsGenerated) {
      generateAllPrompts();
    }
    
    setIsGeneratingAll(true);
    abortControllerRef.current = new AbortController();

    // 依次生成所有卡片
    for (const card of cards) {
      if (abortControllerRef.current.signal.aborted) break;
      if (card.status === 'completed') continue; // 跳过已完成的
      await generateSingleImage(card.id);
    }

    setIsGeneratingAll(false);
  };

  // 下载单张图片
  const downloadSingleImage = (card: APlusCard) => {
    if (card.imageUrl) {
      downloadImageByUrl(card.imageUrl, `aplus-${card.deviceType}-${card.moduleType}-${Date.now()}.png`);
    }
  };

  // 下载全部图片
  const downloadAllImages = () => {
    const completedCards = cards.filter(c => c.status === 'completed' && c.imageUrl);
    if (completedCards.length === 0) return;

    downloadMultipleImages(
      completedCards.map((card) => ({
        url: card.imageUrl!,
        filename: `aplus-${card.deviceType}-${card.moduleType}-${Date.now()}.png`,
      }))
    );
  };

  // 复制提示词
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  // 获取进度统计
  const getProgressStats = () => {
    const completed = cards.filter(c => c.status === 'completed').length;
    const total = cards.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgressStats();

  // 获取设备标签
  const getDeviceLabel = (device: DeviceType) => device === 'desktop' ? '电脑端' : '移动端';

  // 获取模块编号
  const getModuleNumber = (moduleType: APlusModuleType) => {
    const order = ['hero', 'personalization', 'emotional', 'features', 'lifestyle'];
    return order.indexOf(moduleType) + 1;
  };

  // 初始化
  useEffect(() => {
    initCards();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 渲染卡片
  const renderCard = (card: APlusCard) => {
    const ModuleIcon = MODULE_CONFIG[card.moduleType].icon;
    const isDesktop = card.deviceType === 'desktop';
    
    return (
      <div 
        key={card.id}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => {
          if (card.status === 'pending' || card.status === 'failed') {
            generateSingleImage(card.id);
          } else if (card.status === 'completed' && card.imageUrl) {
            setPreviewImage(card.imageUrl);
          }
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-bold">
              {card.order}
            </span>
            <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
              A+0{getModuleNumber(card.moduleType)} {MODULE_CONFIG[card.moduleType].shortName}...
            </span>
          </div>
          <span className="text-xs text-gray-400">{card.size}</span>
        </div>

        {/* 图片区域 */}
        <div className="aspect-[2.4/1] bg-gray-50 relative overflow-hidden">
          {card.status === 'completed' && card.imageUrl ? (
            <>
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-8 h-8 text-white" />
              </div>
            </>
          ) : card.status === 'generating' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
              <Loader2 className="w-10 h-10 mb-2 animate-spin text-purple-500" />
              <span className="text-sm text-gray-500">生成中...</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <Wand2 className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm">点击生成</span>
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div className="p-3 space-y-1">
          <p className="text-xs text-gray-800 font-medium truncate">
            {card.title} {card.size}
          </p>
          <p className="text-xs text-gray-500">
            {card.moduleName}
          </p>
          
          {card.error && (
            <p className="text-xs text-red-500 truncate">{card.error}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyPrompt(card.prompt);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            disabled={!card.prompt}
          >
            <Copy className="w-3 h-3" />
            复制
          </button>
          
          {card.status === 'completed' && card.imageUrl && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (card.imageUrl) {
                    setPreviewImage(card.imageUrl);
                  }
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Eye className="w-3 h-3" />
                查看
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateSingleImage(card.id);
                }}
                className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors ml-auto"
              >
                <RefreshCw className="w-3 h-3" />
                重绘
              </button>
            </>
          )}
          
          {card.status === 'failed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                generateSingleImage(card.id);
              }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              重试
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染卡片组
  const renderCardGroup = (deviceType: DeviceType) => {
    const deviceCards = cards.filter(c => c.deviceType === deviceType);
    
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 px-1">
          {getDeviceLabel(deviceType)}详情页（5模块，{SIZE_CONFIG[deviceType].label}）
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {deviceCards.map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between gap-4 p-4 text-gray-400 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              <Grid3X3 className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-700">A+ 详情页套图</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* 产品信息输入区 - 模仿Amazon Listing */}
      <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          {/* 产品图上传区域 */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-2 block">产品图片（上传后自动分析）</label>
              
              {!uploadedImage ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">点击上传产品图片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最大 10MB</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={uploadedImage}
                    alt="Uploaded product"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={clearUploadedImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {analysisError && (
                <p className="text-xs text-red-500 mt-2">{analysisError}</p>
              )}
            </div>

            {/* AI分析结果展示 */}
            {productAnalysis && (
              <div className="mb-4 bg-white rounded-lg border border-purple-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-800">AI 分析结果</span>
                  <span className="text-xs text-gray-400">（已自动填充到下方）</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">类型: {productAnalysis.product_type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">材质: {productAnalysis.material}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">受众: {productAnalysis.target_audience?.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">产品名称 *</label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="如：定制刻字打火机"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">核心卖点</label>
                <Input
                  value={coreSellingPoint}
                  onChange={(e) => setCoreSellingPoint(e.target.value)}
                  placeholder="如：Made From Memories"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">情感场景</label>
                <Select value={emotionalScene} onValueChange={(v) => setEmotionalScene(v as EmotionalScene)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMOTIONAL_SCENES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">色调风格</label>
                <Select value={selectedColorStyle} onValueChange={setSelectedColorStyle}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COLOR_STYLES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 自定义情感场景输入 */}
            {emotionalScene === 'custom' && (
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">自定义情感场景描述</label>
                <Textarea
                  value={customEmotionalText}
                  onChange={(e) => setCustomEmotionalText(e.target.value)}
                  placeholder="描述你想要的情感场景，如：Graduation celebration scene, graduate receiving personalized gift, proud family moment, bright future ahead..."
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>
            )}
            
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">产品描述（可选）</label>
              <Textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="补充产品特点、材质、定制方式等详细信息..."
                className="text-sm min-h-[50px] resize-none"
              />
            </div>
            
            {/* 生成按钮 */}
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={generateAllPrompts}
                disabled={!productName}
                variant={promptsGenerated ? "outline" : "default"}
                className={promptsGenerated ? "" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {promptsGenerated ? '重新生成Prompt' : '生成Prompt'}
              </Button>
              
              {progress.completed > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadAllImages}
                  className="text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载全部 ({progress.completed}张)
                </Button>
              )}
            </div>
          </div>

          {/* 卡片区域 */}
          <div className="p-4">
            {renderCardGroup('desktop')}
            {renderCardGroup('mobile')}
          </div>
      </div>

      {/* 图片预览 */}
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
