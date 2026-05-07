import { ProductAnalysis } from './product-analyzer';
import { SceneType } from './visual-strategy';

export interface ListingPrompt {
  index: number;
  type: 'main' | 'customization' | 'emotional' | 'detail' | 'gift' | 'closing' | 'variant';
  purpose: string;
  prompt: string;
  size: string;
  preview?: string;
}

export interface PromptGenerationResult {
  productAnalysis: ProductAnalysis;
  scene: SceneType;
  sceneName: string;
  prompts: ListingPrompt[];
  summary: string;
  previewData: PromptPreview[];
}

export interface PromptPreview {
  index: number;
  type: string;
  purpose: string;
  promptPreview: string;
  size: string;
}

export interface VariantOption {
  color: string;
  name: string;
}

const BRAND_GUIDELINES = {
  lighting: 'cinematic lighting, high contrast, soft glow, dramatic shadows, professional studio lighting, directional lighting',
  quality: 'premium quality, high-end commercial photography, magazine quality, ultra realistic, photorealistic',
  composition: 'centered composition, rule of thirds, professional framing',
  customizationMark: 'customizable icon, personalization badge, editable area highlight, dotted line border around editable region',
  giftElements: 'elegant presentation, thoughtful gift, gift-ready appearance, premium gift feel',
};

const SCENE_CONFIG: Record<SceneType, {
  name: string;
  colors: string[];
  emotion: string[];
  elements: string[];
}> = {
  father: {
    name: '父亲节',
    colors: ['navy blue', 'charcoal gray', 'gold', 'warm brown'],
    emotion: ['grateful', 'respect', 'love', 'pride', 'thoughtful'],
    elements: ['tie', 'watch', 'coffee mug', 'outdoor activities', 'family', 'gentleman style'],
  },
  mother: {
    name: '母亲节',
    colors: ['soft pink', 'cream', 'lavender', 'pastel blue'],
    emotion: ['love', 'warmth', 'care', 'appreciation', 'tender'],
    elements: ['flowers', 'jewelry', 'heart', 'family', 'nature', 'elegant'],
  },
  christmas: {
    name: '圣诞节',
    colors: ['red', 'green', 'gold', 'silver', 'white'],
    emotion: ['joy', 'festive', 'warmth', 'celebration', 'cheerful'],
    elements: ['christmas tree', 'gift boxes', 'snow', 'holly', 'lights', 'festive decoration'],
  },
  birthday: {
    name: '生日',
    colors: ['gold', 'white', 'pastel colors', 'confetti'],
    emotion: ['celebration', 'joy', 'excitement', 'happiness', 'festive'],
    elements: ['cake', 'balloons', 'party hats', 'gift boxes', 'celebration'],
  },
  wedding: {
    name: '婚礼',
    colors: ['white', 'ivory', 'gold', 'soft pink', 'dusty rose'],
    emotion: ['romantic', 'elegant', 'love', 'commitment', 'beautiful'],
    elements: ['rings', 'flowers', 'champagne', 'heart', 'couple', 'elegant'],
  },
  anniversary: {
    name: '纪念日',
    colors: ['gold', 'silver', 'white', 'red', 'rose gold'],
    emotion: ['romantic', 'nostalgic', 'love', 'commitment', 'memorable'],
    elements: ['hearts', 'flowers', 'wine', 'candles', 'couple', 'elegant'],
  },
  graduation: {
    name: '毕业季',
    colors: ['black', 'gold', 'navy blue', 'white'],
    emotion: ['proud', 'achievement', 'hopeful', 'excitement', 'accomplished'],
    elements: ['graduation cap', 'diploma', 'books', 'celebration', 'academic'],
  },
  valentines: {
    name: '情人节',
    colors: ['red', 'pink', 'white', 'rose gold'],
    emotion: ['romantic', 'love', 'passionate', 'sweet', 'affectionate'],
    elements: ['hearts', 'flowers', 'chocolate', 'couple', 'candles', 'romantic'],
  },
  everyday: {
    name: '日常',
    colors: ['neutral', 'white', 'gray', 'soft colors'],
    emotion: ['practical', 'versatile', 'comfortable', 'everyday', 'lifestyle'],
    elements: ['lifestyle', 'home', 'office', 'daily use', 'functional'],
  },
};

export class PromptGenerator {
  generateListingPrompts(
    analysis: ProductAnalysis, 
    scene: SceneType, 
    variants?: VariantOption[]
  ): PromptGenerationResult {
    const sceneConfig = SCENE_CONFIG[scene];
    
    const basePrompts: ListingPrompt[] = [
      {
        index: 1,
        type: 'main',
        purpose: '主图 - 纯白背景，产品居中，高占比展示，突出定制区域',
        prompt: this.buildMainPrompt(analysis),
        size: '1000x1000',
      },
      {
        index: 2,
        type: 'customization',
        purpose: '定制说明 - 定制区域突出展示，包含可定制视觉标识',
        prompt: this.buildCustomizationPrompt(analysis, sceneConfig),
        size: '1000x1000',
      },
      {
        index: 3,
        type: 'emotional',
        purpose: '情绪场景 - 人物互动，温暖氛围，情感共鸣',
        prompt: this.buildEmotionalPrompt(analysis, sceneConfig),
        size: '1000x1000',
      },
      {
        index: 4,
        type: 'detail',
        purpose: '产品细节 + Made in USA标识，展示品质',
        prompt: this.buildDetailPrompt(analysis),
        size: '1000x1000',
      },
      {
        index: 5,
        type: 'gift',
        purpose: '送礼场景 - 展示送礼瞬间，无包装',
        prompt: this.buildGiftPrompt(analysis, sceneConfig),
        size: '1000x1000',
      },
      {
        index: 6,
        type: 'closing',
        purpose: '情绪收尾 - 产品使用场景，引发购买冲动',
        prompt: this.buildClosingPrompt(analysis, sceneConfig),
        size: '1000x1000',
      },
    ];

    const allPrompts = this.addVariantPrompts(basePrompts, analysis, variants);
    const previewData = this.generatePreviewData(allPrompts);
    const summary = this.generateSummary(analysis, sceneConfig, allPrompts);

    return {
      productAnalysis: analysis,
      scene,
      sceneName: sceneConfig.name,
      prompts: allPrompts,
      summary,
      previewData,
    };
  }

  private buildMainPrompt(analysis: ProductAnalysis): string {
    return `Professional product photography of ${analysis.productName}, 
${analysis.style} luxury style, ${analysis.color} color, 
${analysis.material} material, clean pure white background,
${BRAND_GUIDELINES.lighting}, ${BRAND_GUIDELINES.quality},
${BRAND_GUIDELINES.composition}, product occupies 85% of image,
micro-perspective angle, strong visual contrast, premium feel,
high-end e-commerce quality, sharp focus, professional retouching,
${analysis.customizationOptions.length > 0 ? `${BRAND_GUIDELINES.customizationMark}, subtle personalization indicator` : ''}`.replace(/\n/g, ' ').trim();
  }

  private buildCustomizationPrompt(analysis: ProductAnalysis, sceneConfig: typeof SCENE_CONFIG[SceneType]): string {
    const customOptions = analysis.customizationOptions.length > 0 
      ? analysis.customizationOptions.join(', ') 
      : 'personalized text, photo engraving';
    
    return `${analysis.productName} with prominent customization area as focal point,
${analysis.style} premium style, large clear placeholder for ${customOptions},
${analysis.color} elegant color scheme, soft subtle background with texture,
${BRAND_GUIDELINES.lighting}, ${BRAND_GUIDELINES.quality},
${BRAND_GUIDELINES.customizationMark}, dotted line border around editable region,
customizable icon overlay, "Customize Me" visual indicator,
professional product photography, customization area is the clear visual center,
${sceneConfig.colors[0]} accent color for customization highlights`.replace(/\n/g, ' ').trim();
  }

  private buildEmotionalPrompt(analysis: ProductAnalysis, sceneConfig: typeof SCENE_CONFIG[SceneType]): string {
    return `Authentic emotional lifestyle scene with ${analysis.productName},
genuine human interaction, person looking happy and grateful,
natural candid moment, warm cinematic lighting,
${sceneConfig.colors.join(', ')} sophisticated color palette,
${sceneConfig.emotion.join(', ')} atmosphere,
${BRAND_GUIDELINES.quality}, heartfelt emotional connection,
realistic expressions, professional lifestyle photography,
magazine quality, ${analysis.usageScenarios[0] || 'daily life'} setting,
${BRAND_GUIDELINES.giftElements}, no packaging visible`.replace(/\n/g, ' ').trim();
  }

  private buildDetailPrompt(analysis: ProductAnalysis): string {
    return `Close-up detail shot of ${analysis.productName},
showing ${analysis.keyFeatures.slice(0, 2).join(', ')},
${analysis.material} material texture, high quality craftsmanship,
small subtle "Made in USA" badge in corner, elegant placement,
${BRAND_GUIDELINES.lighting}, ${BRAND_GUIDELINES.quality},
professional product photography, attention to detail,
macro photography style, sharp focus on texture,
premium quality feel, sophisticated presentation`.replace(/\n/g, ' ').trim();
  }

  private buildGiftPrompt(analysis: ProductAnalysis, sceneConfig: typeof SCENE_CONFIG[SceneType]): string {
    return `Gift giving moment with ${analysis.productName},
person giving gift to ${analysis.targetAudience},
${sceneConfig.emotion.join(', ')} expression,
${sceneConfig.elements.slice(0, 2).join(', ')} elements,
${sceneConfig.colors.join(', ')} color scheme,
warm lighting, heartfelt emotion, no packaging visible,
${BRAND_GUIDELINES.giftElements}, ${BRAND_GUIDELINES.quality},
professional lifestyle photography, emotional connection,
natural candid moment, magazine quality`.replace(/\n/g, ' ').trim();
  }

  private buildClosingPrompt(analysis: ProductAnalysis, sceneConfig: typeof SCENE_CONFIG[SceneType]): string {
    return `Beautiful lifestyle shot of ${analysis.productName} in use,
${analysis.usageScenarios[0] || 'home'} setting,
${sceneConfig.emotion.join(', ')} atmosphere,
${sceneConfig.colors.join(', ')} color palette,
soft ambient lighting, ${BRAND_GUIDELINES.lighting},
${BRAND_GUIDELINES.quality}, inspiring and uplifting mood,
call to action feel, premium quality feel,
professional lifestyle photography, emotional appeal,
magazine quality composition`.replace(/\n/g, ' ').trim();
  }

  private buildVariantPrompt(analysis: ProductAnalysis, variant: VariantOption, index: number): string {
    return `Professional product photography of ${analysis.productName} in ${variant.name} ${variant.color},
${analysis.style} luxury style, ${variant.color} color,
${analysis.material} material, clean pure white background,
${BRAND_GUIDELINES.lighting}, ${BRAND_GUIDELINES.quality},
${BRAND_GUIDELINES.composition}, product occupies 85% of image,
micro-perspective angle, strong visual contrast, premium feel,
high-end e-commerce quality, sharp focus, professional retouching,
variant option ${index}`.replace(/\n/g, ' ').trim();
  }

  private addVariantPrompts(
    prompts: ListingPrompt[],
    analysis: ProductAnalysis,
    variants?: VariantOption[]
  ): ListingPrompt[] {
    if (!variants || variants.length === 0) {
      return prompts;
    }

    const variantPrompts: ListingPrompt[] = variants.map((variant, idx) => ({
      index: prompts.length + idx + 1,
      type: 'variant',
      purpose: `变体图 ${idx + 1} - ${variant.name} (${variant.color})`,
      prompt: this.buildVariantPrompt(analysis, variant, idx + 1),
      size: '1000x1000',
    }));

    return [...prompts, ...variantPrompts];
  }

  private generatePreviewData(prompts: ListingPrompt[]): PromptPreview[] {
    return prompts.map(p => ({
      index: p.index,
      type: p.type,
      purpose: p.purpose,
      promptPreview: p.prompt.substring(0, 100) + (p.prompt.length > 100 ? '...' : ''),
      size: p.size,
    }));
  }

  private generateSummary(
    analysis: ProductAnalysis, 
    sceneConfig: typeof SCENE_CONFIG[SceneType], 
    prompts: ListingPrompt[]
  ): string {
    const promptList = prompts.map((p, i) => {
      const emoji = this.getPromptEmoji(p.type);
      return `${i + 1}. ${emoji} **${this.getPromptTypeName(p.type)}** - ${p.purpose}`;
    }).join('\n');

    return `## 产品分析结果

**产品类型**: ${analysis.productType}
**产品名称**: ${analysis.productName}
**材质**: ${analysis.material}
**颜色**: ${analysis.color}
**风格**: ${analysis.style}

## 场景设定

**场景**: ${sceneConfig.name}
**配色方案**: ${sceneConfig.colors.join(', ')}
**情绪关键词**: ${sceneConfig.emotion.join(', ')}

## 图片计划

${promptList}

---

## 品牌风格应用
- 光影: cinematic lighting, high contrast, soft glow
- 品质: premium quality, high-end commercial photography
- 定制标识: customizable icon, editable area highlight

是否按照以上计划生成亚马逊 Listing 图片？请回答"是"或"否"。`.trim();
  }

  private getPromptEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      main: '🖼️',
      customization: '✏️',
      emotional: '❤️',
      detail: '🔍',
      gift: '🎁',
      closing: '✨',
      variant: '🎨',
    };
    return emojiMap[type] || '📷';
  }

  private getPromptTypeName(type: string): string {
    const nameMap: Record<string, string> = {
      main: '主图',
      customization: '定制说明',
      emotional: '情绪场景',
      detail: '产品细节',
      gift: '送礼场景',
      closing: '情绪收尾',
      variant: '变体展示',
    };
    return nameMap[type] || '图片';
  }

  getSceneTypes(): { type: SceneType; name: string }[] {
    return Object.entries(SCENE_CONFIG).map(([key, config]) => ({
      type: key as SceneType,
      name: config.name,
    }));
  }

  getBrandGuidelines() {
    return BRAND_GUIDELINES;
  }
}
