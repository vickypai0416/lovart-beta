import { NextResponse } from 'next/server';

interface StyleAnchor {
  colorPalette: string;
  lightingStyle: string;
  visualStyle: string;
  moodKeyword: string;
}

const sceneNames: Record<string, string> = {
  'everyday': '日常使用',
  'father': '父亲节',
  'mother': '母亲节',
  'christmas': '圣诞节',
  'birthday': '生日',
  'wedding': '婚礼',
  'valentine': '情人节',
  'graduation': '毕业季',
};

const sceneStyleAnchors: Record<string, StyleAnchor> = {
  'everyday': {
    colorPalette: 'warm earth tones: cream white #FFF8F0, soft gold #D4A574, deep brown #5C3A21',
    lightingStyle: 'soft natural window lighting, golden hour warmth, gentle shadows',
    visualStyle: 'minimalist luxury, clean composition, premium commercial photography',
    moodKeyword: 'warm, elegant, heartfelt',
  },
  'father': {
    colorPalette: 'masculine warm tones: deep navy #1B2A4A, rich mahogany #6B3A2A, warm amber #C8963E',
    lightingStyle: 'strong directional lighting, warm amber glow, defined shadows',
    visualStyle: 'classic masculinity, bold composition, premium editorial photography',
    moodKeyword: 'strong, grateful, dignified',
  },
  'mother': {
    colorPalette: 'soft feminine tones: blush pink #F5D5CC, rose gold #B76E79, ivory white #FFFFF0',
    lightingStyle: 'soft diffused lighting, gentle morning glow, flattering warm light',
    visualStyle: 'elegant femininity, graceful composition, soft focus commercial photography',
    moodKeyword: 'tender, loving, graceful',
  },
  'christmas': {
    colorPalette: 'festive holiday tones: deep red #8B1A1A, forest green #2D5A27, gold #D4AF37',
    lightingStyle: 'warm candlelight glow, twinkling fairy light bokeh, cozy ambient lighting',
    visualStyle: 'festive luxury, rich layered composition, holiday editorial photography',
    moodKeyword: 'joyful, magical, cozy',
  },
  'birthday': {
    colorPalette: 'celebratory vibrant tones: confetti pink #FF69B4, sunshine yellow #FFD700, sky blue #87CEEB',
    lightingStyle: 'bright cheerful lighting, colorful ambient glow, playful sparkles',
    visualStyle: 'festive celebration, dynamic composition, vibrant commercial photography',
    moodKeyword: 'cheerful, exciting, celebratory',
  },
  'wedding': {
    colorPalette: 'romantic elegant tones: champagne gold #F7E7CE, pearl white #FDEEF4, sage green #9DC183',
    lightingStyle: 'soft romantic backlighting, dreamy golden hour, ethereal glow',
    visualStyle: 'timeless romance, symmetrical composition, luxury wedding photography',
    moodKeyword: 'romantic, elegant, eternal',
  },
  'valentine': {
    colorPalette: 'passionate romantic tones: rose red #C41E3A, soft pink #FFB6C1, blush cream #FFF0F5',
    lightingStyle: 'warm intimate lighting, soft candlelight glow, romantic haze',
    visualStyle: 'intimate romance, dreamy composition, luxury lifestyle photography',
    moodKeyword: 'passionate, tender, devoted',
  },
  'graduation': {
    colorPalette: 'hopeful bright tones: royal blue #4169E1, bright gold #FFD700, crisp white #FFFFFF',
    lightingStyle: 'bright optimistic lighting, natural sunlight, clear open sky feel',
    visualStyle: 'aspirational achievement, balanced composition, editorial portrait photography',
    moodKeyword: 'proud, hopeful, accomplished',
  },
};

const colorSchemeAnchors: Record<string, Partial<StyleAnchor>> = {
  'blue': {
    colorPalette: 'cool blue tones: deep navy #1B3A5C, sky blue #4A90D9, ice white #E8F1FA',
    lightingStyle: 'cool blue-tinted lighting, crisp and clean illumination, subtle blue reflections',
    moodKeyword: 'calm, professional, trustworthy',
  },
  'warm': {
    colorPalette: 'warm earth tones: rich amber #C8963E, soft gold #D4A574, cream white #FFF8F0',
    lightingStyle: 'warm golden hour lighting, soft amber glow, inviting warmth',
    moodKeyword: 'warm, inviting, cozy',
  },
  'green': {
    colorPalette: 'natural green tones: forest green #2D5A27, sage green #9DC183, mint white #F0F7EC',
    lightingStyle: 'natural daylight, fresh green-tinted ambient, organic illumination',
    moodKeyword: 'fresh, natural, organic',
  },
  'red': {
    colorPalette: 'bold red tones: deep crimson #8B1A1A, vibrant red #C41E3A, soft blush #FFF0F0',
    lightingStyle: 'dramatic warm lighting, rich red ambient glow, passionate illumination',
    moodKeyword: 'bold, passionate, energetic',
  },
  'purple': {
    colorPalette: 'elegant purple tones: deep violet #4A1A6B, soft lavender #9B59B6, lilac white #F5E6FF',
    lightingStyle: 'mysterious purple-tinted lighting, soft violet glow, ethereal illumination',
    moodKeyword: 'elegant, mysterious, sophisticated',
  },
  'monochrome': {
    colorPalette: 'monochrome tones: deep black #1A1A1A, medium gray #808080, pure white #F5F5F5',
    lightingStyle: 'dramatic high-contrast lighting, sharp shadows, studio spotlight',
    moodKeyword: 'minimalist, premium, sophisticated',
  },
  'pink': {
    colorPalette: 'soft pink tones: rose pink #C41E5A, blush pink #FFB6C1, petal white #FFF0F5',
    lightingStyle: 'soft rosy lighting, gentle pink ambient, flattering warm glow',
    moodKeyword: 'romantic, delicate, feminine',
  },
};

const visualStyleAnchors: Record<string, Partial<StyleAnchor>> = {
  'minimalist': {
    visualStyle: 'minimalist clean design, generous white space, simple composition, uncluttered',
    moodKeyword: 'clean, simple, refined',
  },
  'luxury': {
    visualStyle: 'luxury premium aesthetic, gold accents, rich textures, opulent details',
    moodKeyword: 'premium, exclusive, lavish',
  },
  'natural': {
    visualStyle: 'natural authentic style, organic elements, real-life setting, unposed',
    moodKeyword: 'authentic, genuine, organic',
  },
  'vibrant': {
    visualStyle: 'vibrant energetic style, bold colors, dynamic angles, eye-catching',
    moodKeyword: 'energetic, exciting, bold',
  },
  'retro': {
    visualStyle: 'retro vintage aesthetic, nostalgic tones, classic composition, timeless appeal',
    moodKeyword: 'nostalgic, classic, timeless',
  },
  'modern': {
    visualStyle: 'modern contemporary style, geometric elements, sleek lines, futuristic touches',
    moodKeyword: 'contemporary, sleek, innovative',
  },
  'dreamy': {
    visualStyle: 'dreamy ethereal style, soft focus, light flares, romantic haze, bokeh',
    moodKeyword: 'dreamy, ethereal, enchanting',
  },
};

function getStyleAnchor(scene: string): StyleAnchor {
  return sceneStyleAnchors[scene] || sceneStyleAnchors['everyday'];
}

function appendStyleAnchor(prompt: string, anchor: StyleAnchor, stylePrefix: string = ''): string {
  return `${stylePrefix}${prompt}, Style consistency: ${anchor.colorPalette}, ${anchor.lightingStyle}, ${anchor.visualStyle}, ${anchor.moodKeyword}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysis, platform, scene, variants, colorScheme = 'auto', visualStyle = 'auto' } = body;

    if (!analysis || !platform || !scene) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const productName = analysis.productName || '产品';
    const keyFeatures = analysis.keyFeatures?.slice(0, 3) || ['高品质', '精美设计'];
    const featureStr = keyFeatures.join(', ');
    const sceneLabel = sceneNames[scene] || scene;

    let styleAnchor = getStyleAnchor(scene);

    if (colorScheme !== 'auto' && colorSchemeAnchors[colorScheme]) {
      const colorOverride = colorSchemeAnchors[colorScheme];
      styleAnchor = {
        ...styleAnchor,
        colorPalette: colorOverride.colorPalette || styleAnchor.colorPalette,
        lightingStyle: colorOverride.lightingStyle || styleAnchor.lightingStyle,
        moodKeyword: colorOverride.moodKeyword
          ? `${styleAnchor.moodKeyword}, ${colorOverride.moodKeyword}`
          : styleAnchor.moodKeyword,
      };
    }

    if (visualStyle !== 'auto' && visualStyleAnchors[visualStyle]) {
      const styleOverride = visualStyleAnchors[visualStyle];
      styleAnchor = {
        ...styleAnchor,
        visualStyle: styleOverride.visualStyle || styleAnchor.visualStyle,
        moodKeyword: styleOverride.moodKeyword
          ? `${styleAnchor.moodKeyword}, ${styleOverride.moodKeyword}`
          : styleAnchor.moodKeyword,
      };
    }

    let stylePrefix = '';
    if (colorScheme !== 'auto' && colorSchemeAnchors[colorScheme]) {
      stylePrefix += `Color directive: Use ${colorSchemeAnchors[colorScheme].colorPalette}. `;
    }
    if (visualStyle !== 'auto' && visualStyleAnchors[visualStyle]) {
      stylePrefix += `Style directive: Apply ${visualStyleAnchors[visualStyle].visualStyle}. `;
    }

    const prompts = [
      {
        index: 1,
        type: 'main',
        purpose: '主图 - Amazon listing 主图，纯白背景，产品主体清晰居中',
        displayPrompt: `亚马逊主图风格，${productName}，${featureStr}，纯白背景，产品居中占画面约85%，边缘清晰，商业棚拍光线，禁止任何道具或文字叠加`,
        prompt: appendStyleAnchor(`Professional Amazon listing main image of ${productName}, ${featureStr}, pure white background RGB 255 255 255, centered composition, product occupies about 85 percent of the frame, sharp edges, realistic proportions, soft studio lighting, premium commercial ecommerce photography, product only, no text overlay, no badges, no props, no extra accessories, product remains the sole visual focus`, styleAnchor, stylePrefix),
      },
      {
        index: 2,
        type: 'customization',
        purpose: '定制展示 - 定制区域清晰可见，突出 personalized 属性',
        displayPrompt: `${productName}定制展示，${featureStr}，定制区域作为视觉焦点，可用简洁标注强调可定制位置，背景干净温暖，产品主体清晰`,
        prompt: appendStyleAnchor(`${productName} customization showcase, ${featureStr}, customization area as the clear focal point, personalized product presentation, subtle callout or zoom detail highlighting the editable area, clean warm background, premium Amazon listing photography, product remains the hero, customization text must look naturally printed or engraved on the product surface, no floating advertising text, no clutter around the product`, styleAnchor, stylePrefix),
      },
      {
        index: 3,
        type: 'emotional',
        purpose: '使用场景 - 真实生活环境，产品清楚可见，增强代入感',
        displayPrompt: `真实生活使用场景，${productName}作为主体清晰可见，${featureStr}，自然家居/办公环境，人物仅辅助叙事，温暖真实氛围`,
        prompt: appendStyleAnchor(`Realistic lifestyle scene featuring ${productName} as the visual center, ${featureStr}, authentic home or everyday environment, warm natural lighting, cinematic commercial photography, natural human presence only as a supporting element, product clearly visible and larger than surrounding scene elements, no pure scenery shot, no pure portrait shot, product must remain the hero`, styleAnchor, stylePrefix),
      },
      {
        index: 4,
        type: 'detail',
        purpose: '细节信任图 - 展示材质、工艺、纹理与品质感',
        displayPrompt: `${productName}细节与工艺展示，${featureStr}，突出材质纹理、边缘和做工，构图干净，强调品质信任感`,
        prompt: appendStyleAnchor(`Detailed feature and craftsmanship shot of ${productName}, ${featureStr}, focus on material texture, edge finish, surface detail and premium build quality, close-up commercial product photography, clean composition, soft directional lighting, realistic texture rendering, trust-building ecommerce image, no distortion, no fake materials, no distracting props`, styleAnchor, stylePrefix),
      },
      {
        index: 5,
        type: 'gift',
        purpose: '送礼图 - 真实送礼互动场景，无虚构包装元素',
        displayPrompt: `真实送礼瞬间，${productName}清晰可见且仍是主体，人物情绪自然，节日氛围轻柔，不出现礼盒礼袋卡片蝴蝶结等包装元素`,
        prompt: appendStyleAnchor(`Authentic gift giving moment featuring ${productName}, ${featureStr}, natural human interaction, warm grateful expressions, cozy indoor setting matching ${sceneLabel}, product clearly visible and still the main subject, emotional lifestyle commercial photography, no gift box, no gift bag, no wrapping paper, no ribbon, no bow, no greeting card, no packaging props unless actually included with the product, gift emotion must come from human interaction, lighting and environment, not from fake packaging`, styleAnchor, stylePrefix),
      },
      {
        index: 6,
        type: 'lifestyle',
        purpose: '情绪收尾图 - 强化礼品感与购买欲望',
        displayPrompt: `高端生活方式收尾图，${productName}主体清晰，${featureStr}，真实温暖场景，营造高级感、礼品感和购买冲动`,
        prompt: appendStyleAnchor(`Premium closing lifestyle image of ${productName}, ${featureStr}, emotionally resonant real-life setting, warm elegant atmosphere, product clearly visible as the hero, high-end Amazon listing photography, strong giftable appeal, refined composition, clean background hierarchy, natural lighting, premium brand feel, human presence may support the story but must never overpower the product`, styleAnchor, stylePrefix),
      },
    ];


    console.log(`[Generate Prompts] 生成了 ${prompts.length} 个提示词`, { productName, scene: sceneLabel });

    return NextResponse.json({ success: true, prompts, styleAnchor, colorScheme, visualStyle });

  } catch (error: any) {
    console.error('生成提示词失败:', error.message);
    
    const body = await request.json().catch(() => ({ analysis: {}, scene: 'everyday' }));
    const productName = body.analysis?.productName || '产品';
    const keyFeatures = body.analysis?.keyFeatures?.slice(0, 3) || ['高品质', '精美设计'];
    const scene = body.scene || 'everyday';
    
    return generateFallbackPrompts(productName, keyFeatures, scene);
  }
}

function generateFallbackPrompts(productName: string, keyFeatures: string[], scene: string) {
  const featureStr = keyFeatures.join(', ');
  const styleAnchor = getStyleAnchor(scene);
  
  const prompts = [
    {
      index: 1,
      type: 'main',
      purpose: '主图',
      displayPrompt: `亚马逊主图风格，${productName}，${featureStr}，纯白背景，产品主体清晰居中`,
      prompt: appendStyleAnchor(`Professional Amazon listing main image of ${productName}, ${featureStr}, pure white background, centered composition, soft studio lighting, realistic proportions, premium ecommerce photography, product only, no text overlay, no props, no extra accessories`, styleAnchor),
    },
    {
      index: 2,
      type: 'customization',
      purpose: '定制展示',
      displayPrompt: `${productName}定制展示，定制区域清晰可见，背景干净`,
      prompt: appendStyleAnchor(`${productName} customization showcase, customization area clearly visible, premium product presentation, clean warm background, no floating ad text, product remains the hero`, styleAnchor),
    },
    {
      index: 3,
      type: 'emotional',
      purpose: '使用场景',
      displayPrompt: `真实使用场景，${productName}主体清晰，生活氛围自然`,
      prompt: appendStyleAnchor(`Realistic lifestyle scene with ${productName} as the central focus, authentic everyday environment, natural human presence only as support, product clearly visible`, styleAnchor),
    },
    {
      index: 4,
      type: 'detail',
      purpose: '细节信任图',
      displayPrompt: `${productName}细节工艺展示，突出材质纹理和品质感`,
      prompt: appendStyleAnchor(`Detailed craftsmanship shot of ${productName}, focus on material texture, edge finish and build quality, clean composition, premium trust-building ecommerce image`, styleAnchor),
    },
    {
      index: 5,
      type: 'gift',
      purpose: '送礼场景',
      displayPrompt: `真实送礼瞬间，${productName}清晰可见，无虚构包装`,
      prompt: appendStyleAnchor(`Authentic gift giving moment with ${productName}, natural human interaction, product clearly visible and still the main subject, no gift box, no gift bag, no wrapping paper, no ribbon, no greeting card, no fake packaging props`, styleAnchor),
    },
    {
      index: 6,
      type: 'lifestyle',
      purpose: '情绪收尾图',
      displayPrompt: `${productName}高端生活方式收尾图，强化礼品感与购买欲望`,
      prompt: appendStyleAnchor(`Premium closing lifestyle image of ${productName}, emotionally resonant real-life setting, refined composition, strong giftable appeal, product clearly visible as the hero`, styleAnchor),
    },
  ];


  return NextResponse.json({ success: true, prompts, styleAnchor });
}
