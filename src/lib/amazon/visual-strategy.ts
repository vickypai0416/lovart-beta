import { ProductAnalysis } from './product-analyzer';

export type SceneType = 'father' | 'mother' | 'christmas' | 'birthday' | 'wedding' | 'anniversary' | 'graduation' | 'valentines' | 'everyday';

export interface VisualStrategy {
  scene: SceneType;
  sceneName: string;
  colorPalette: string[];
  lightingStyle: string;
  composition: string;
  emotionFocus: string[];
  giftElements: string[];
  customizationHighlight: string[];
  imageSize: string;
  backgroundStyle: string;
}

export interface ListingImagePlan {
  image1: ImageStrategy;
  image2: ImageStrategy;
  image3: ImageStrategy;
  image4: ImageStrategy;
  image5: ImageStrategy;
  image6: ImageStrategy;
}

export interface ImageStrategy {
  type: 'main' | 'customization' | 'emotional' | 'detail' | 'gift' | 'closing';
  purpose: string;
  promptTemplate: string;
  size: string;
}

const SCENE_CONFIG: Record<SceneType, {
  name: string;
  colors: string[];
  emotion: string[];
  elements: string[];
}> = {
  father: {
    name: '父亲节',
    colors: ['navy blue', 'charcoal gray', 'gold', 'warm brown'],
    emotion: ['grateful', 'respect', 'love', 'pride'],
    elements: ['tie', 'watch', 'coffee mug', 'outdoor activities', 'family'],
  },
  mother: {
    name: '母亲节',
    colors: ['soft pink', 'cream', 'lavender', 'pastel blue'],
    emotion: ['love', 'warmth', 'care', 'appreciation'],
    elements: ['flowers', 'jewelry', 'heart', 'family', 'nature'],
  },
  christmas: {
    name: '圣诞节',
    colors: ['red', 'green', 'gold', 'silver', 'white'],
    emotion: ['joy', 'festive', 'warmth', 'celebration'],
    elements: ['christmas tree', 'gift boxes', 'snow', 'holly', 'lights'],
  },
  birthday: {
    name: '生日',
    colors: ['gold', 'white', 'pastel colors', 'confetti'],
    emotion: ['celebration', 'joy', 'excitement', 'happiness'],
    elements: ['cake', 'balloons', 'party hats', 'gift boxes'],
  },
  wedding: {
    name: '婚礼',
    colors: ['white', 'ivory', 'gold', 'soft pink', 'dusty rose'],
    emotion: ['romantic', 'elegant', 'love', 'commitment'],
    elements: ['rings', 'flowers', 'champagne', 'heart', 'couple'],
  },
  anniversary: {
    name: '纪念日',
    colors: ['gold', 'silver', 'white', 'red', 'rose gold'],
    emotion: ['romantic', 'nostalgic', 'love', 'commitment'],
    elements: ['hearts', 'flowers', 'wine', 'candles', 'couple'],
  },
  graduation: {
    name: '毕业季',
    colors: ['black', 'gold', 'navy blue', 'white'],
    emotion: ['proud', 'achievement', 'hopeful', 'excitement'],
    elements: ['graduation cap', 'diploma', 'books', 'celebration'],
  },
  valentines: {
    name: '情人节',
    colors: ['red', 'pink', 'white', 'rose gold'],
    emotion: ['romantic', 'love', 'passionate', 'sweet'],
    elements: ['hearts', 'flowers', 'chocolate', 'couple', 'candles'],
  },
  everyday: {
    name: '日常',
    colors: ['neutral', 'white', 'gray', 'soft colors'],
    emotion: ['practical', 'versatile', 'comfortable', 'everyday'],
    elements: ['lifestyle', 'home', 'office', 'daily use'],
  },
};

export class VisualStrategyGenerator {
  analyzeProduct(product: ProductAnalysis): VisualStrategy {
    const defaultScene: SceneType = 'everyday';
    
    return {
      scene: defaultScene,
      sceneName: SCENE_CONFIG[defaultScene].name,
      colorPalette: SCENE_CONFIG[defaultScene].colors,
      lightingStyle: 'cinematic lighting, high contrast, soft glow',
      composition: 'professional product photography, centered composition, high-end advertising style',
      emotionFocus: SCENE_CONFIG[defaultScene].emotion,
      giftElements: SCENE_CONFIG[defaultScene].elements,
      customizationHighlight: product.customizationOptions,
      imageSize: '1000x1000',
      backgroundStyle: 'clean white background',
    };
  }

  generateSceneStrategy(scene: SceneType, product: ProductAnalysis): VisualStrategy {
    const sceneConfig = SCENE_CONFIG[scene];
    
    return {
      scene,
      sceneName: sceneConfig.name,
      colorPalette: sceneConfig.colors,
      lightingStyle: 'cinematic lighting, high contrast, soft glow',
      composition: 'professional product photography, centered composition, high-end advertising style',
      emotionFocus: sceneConfig.emotion,
      giftElements: sceneConfig.elements,
      customizationHighlight: product.customizationOptions,
      imageSize: '1000x1000',
      backgroundStyle: scene === 'everyday' ? 'clean white background' : 'soft gradient background matching color palette',
    };
  }

  generateListingPlan(strategy: VisualStrategy, product: ProductAnalysis): ListingImagePlan {
    const sceneConfig = SCENE_CONFIG[strategy.scene];
    
    return {
      image1: {
        type: 'main',
        purpose: '主图 - 纯白背景，产品居中，高占比展示',
        promptTemplate: `Professional product photography of ${product.productName}, ${product.style} style, ${product.color} color, ${product.material} material, clean white background, soft studio lighting, high-end commercial quality, centered composition, product occupies 85% of image`,
        size: '1000x1000',
      },
      image2: {
        type: 'customization',
        purpose: '定制说明 - 展示可定制内容（名字/照片/文案）',
        promptTemplate: `${product.productName} with custom design space, ${product.style} style, placeholder for personalized text and photo, ${product.color} color scheme, soft background, professional product photography, showing customization area clearly`,
        size: '1000x1000',
      },
      image3: {
        type: 'emotional',
        purpose: '情绪场景 - 人物互动，温暖氛围',
        promptTemplate: `Emotional lifestyle scene with ${product.productName}, ${sceneConfig.emotion.join(', ')} atmosphere, person using or receiving the product, ${sceneConfig.colors.join(', ')} color palette, cinematic lighting, heartwarming moment, ${product.usageScenarios[0] || 'daily life'} setting`,
        size: '1000x1000',
      },
      image4: {
        type: 'detail',
        purpose: '产品细节 + Made in USA标识',
        promptTemplate: `Close-up detail shot of ${product.productName}, showing ${product.keyFeatures.slice(0, 2).join(', ')}, ${product.material} material texture, high quality craftsmanship, small "Made in USA" badge in corner, soft lighting, professional product photography`,
        size: '1000x1000',
      },
      image5: {
        type: 'gift',
        purpose: '送礼场景 - 展示送礼瞬间',
        promptTemplate: `Gift giving moment with ${product.productName}, person giving gift to ${product.targetAudience}, ${sceneConfig.emotion.join(', ')} expression, ${sceneConfig.elements.slice(0, 2).join(', ')} elements, ${sceneConfig.colors.join(', ')} color scheme, warm lighting, heartfelt emotion`,
        size: '1000x1000',
      },
      image6: {
        type: 'closing',
        purpose: '情绪收尾 - 产品使用场景，引发购买冲动',
        promptTemplate: `Beautiful lifestyle shot of ${product.productName} in use, ${product.usageScenarios[0] || 'home'} setting, ${sceneConfig.emotion.join(', ')} atmosphere, ${sceneConfig.colors.join(', ')} color palette, soft ambient lighting, inspiring and uplifting mood, call to action`,
        size: '1000x1000',
      },
    };
  }

  getSceneTypes(): { type: SceneType; name: string }[] {
    return Object.entries(SCENE_CONFIG).map(([key, config]) => ({
      type: key as SceneType,
      name: config.name,
    }));
  }
}