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
        purpose: '主图 - 纯白背景，产品居中展示',
        displayPrompt: `专业产品摄影，${productName}，${featureStr}，纯白色背景，电影级光线，高对比度，产品居中占画面85%，微距视角，杂志品质，电商风格`,
        prompt: appendStyleAnchor(`Professional product photography of ${productName}, ${featureStr}, premium quality commercial photography, clean pure white background, cinematic lighting, high contrast, soft glow, centered composition, product occupies 85% of image, micro-perspective angle, magazine quality, detailed product shot, e-commerce style, ${productName} is the sole focus, no other objects`, styleAnchor, stylePrefix),
      },
      {
        index: 2,
        type: 'customization',
        purpose: '定制说明 - 定制区域作为视觉中心',
        displayPrompt: `${productName}定制展示，${featureStr}，定制区域作为视觉焦点，带虚线边框的可编辑区域，浅灰色纹理背景，专业产品摄影`,
        prompt: appendStyleAnchor(`${productName} customization showcase, ${featureStr}, customization area as focal point, clear editable region with dotted line border, "Customize Me" visual indicator, subtle light gray texture background, professional product photography, cinematic lighting, premium quality, ${productName} must be clearly visible`, styleAnchor, stylePrefix),
      },
      {
        index: 3,
        type: 'emotional',
        purpose: '情绪场景 - 人物互动，温暖氛围',
        displayPrompt: `情感生活场景，${productName}作为中心焦点，${featureStr}，${scene === 'father' ? '父亲从孩子手中收到' + productName + '作为礼物' : scene === 'mother' ? '母亲从孩子手中收到' + productName + '作为礼物' : '人物收到' + productName + '作为贴心礼物'}，产品拿在手中，真实的快乐情绪，温馨家居环境，柔和自然光线`,
        prompt: appendStyleAnchor(`Emotional lifestyle scene featuring ${productName} as the central focus, ${featureStr}, ${scene === 'father' ? 'father receiving ' + productName + ' as gift from child' : scene === 'mother' ? 'mother receiving ' + productName + ' as gift from child' : 'person receiving ' + productName + ' as thoughtful gift'}, product held in hands, genuine happy emotions, grateful expressions, cozy home setting, soft natural lighting, cinematic quality, magazine-style lifestyle photography, ${productName} must be clearly visible and be the main subject`, styleAnchor, stylePrefix),
      },
      {
        index: 4,
        type: 'detail',
        purpose: '细节特写 - 材质纹理 + Made in USA',
        displayPrompt: `${productName}极致特写，${featureStr}，展示精细材质纹理和工艺细节，右下角Made in USA小标识，专业微距摄影风格，戏剧性光影`,
        prompt: appendStyleAnchor(`Extreme close-up detail shot of ${productName}, ${featureStr}, showing fine material texture and craftsmanship details, Made in USA small logo in bottom right corner, professional macro photography style, cinematic lighting, dramatic shadows, premium quality, ${productName} fills most of the frame, sharp focus on texture`, styleAnchor, stylePrefix),
      },
      {
        index: 5,
        type: 'gift',
        purpose: '送礼场景 - 送礼瞬间',
        displayPrompt: `送礼瞬间，${productName}，${featureStr}，人物将${productName}作为礼物送给爱人，产品清晰可见，自然的人物情感，温馨室内环境，柔和氛围光线`,
        prompt: appendStyleAnchor(`Gift giving moment featuring ${productName}, ${featureStr}, person giving ${productName} as gift to loved one, product clearly visible and held by giver, natural human emotions, warm and grateful expressions, cozy indoor setting, soft ambient lighting, no gift wrapping visible, cinematic quality photography, heartfelt emotional connection, ${productName} is the center of attention`, styleAnchor, stylePrefix),
      },
      {
        index: 6,
        type: 'lifestyle',
        purpose: '情绪收尾 - 使用场景',
        displayPrompt: `${productName}使用场景生活照，${featureStr}，${scene === 'father' ? '父亲舒适地使用' + productName : scene === 'mother' ? '母亲享受' + productName : '人物享受' + productName}，激发购买欲望，高端质感，情感吸引力，电影级光线`,
        prompt: appendStyleAnchor(`Beautiful lifestyle shot of ${productName} in use, ${featureStr}, person using or wearing ${productName} in everyday life setting, ${scene === 'father' ? 'father comfortably using ' + productName : scene === 'mother' ? 'mother enjoying ' + productName : 'person enjoying ' + productName}, inspiring purchase desire, premium feel, emotional appeal, cinematic lighting, high contrast, magazine quality, ${productName} must be clearly visible`, styleAnchor, stylePrefix),
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
      displayPrompt: `专业产品摄影，${productName}，${featureStr}，纯白色背景，电影级光线，产品居中`,
      prompt: appendStyleAnchor(`Professional product photography of ${productName}, ${featureStr}, premium quality, clean white background, cinematic lighting, centered composition, product as sole focus`, styleAnchor),
    },
    {
      index: 2,
      type: 'customization',
      purpose: '定制说明',
      displayPrompt: `${productName}定制展示，定制区域作为视觉焦点，专业摄影`,
      prompt: appendStyleAnchor(`${productName} customization showcase, customization area as focal point, professional photography`, styleAnchor),
    },
    {
      index: 3,
      type: 'emotional',
      purpose: '情绪场景',
      displayPrompt: `情感生活场景，${productName}作为中心焦点，${scene === 'father' ? '父子温馨时刻' : '家庭温馨时刻'}，产品清晰可见`,
      prompt: appendStyleAnchor(`Emotional lifestyle scene with ${productName} as central focus, ${scene === 'father' ? 'father-child bonding' : 'family moment'}, product clearly visible`, styleAnchor),
    },
    {
      index: 4,
      type: 'detail',
      purpose: '细节特写',
      displayPrompt: `${productName}特写，展示材质纹理和工艺细节，右下角Made in USA标识`,
      prompt: appendStyleAnchor(`Close-up detail shot of ${productName}, material texture and craftsmanship, Made in USA small logo`, styleAnchor),
    },
    {
      index: 5,
      type: 'gift',
      purpose: '送礼场景',
      displayPrompt: `送礼瞬间，${productName}，自然的人物情感，产品拿在手中`,
      prompt: appendStyleAnchor(`Gift giving moment with ${productName}, natural emotions, product held by giver`, styleAnchor),
    },
    {
      index: 6,
      type: 'lifestyle',
      purpose: '使用场景',
      displayPrompt: `${productName}使用场景生活照，日常生活场景，产品清晰可见`,
      prompt: appendStyleAnchor(`Lifestyle shot of ${productName} in use, everyday life setting, product clearly visible`, styleAnchor),
    },
  ];

  return NextResponse.json({ success: true, prompts, styleAnchor });
}
