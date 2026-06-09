import { NextResponse } from 'next/server';

// 场景文案映射
const sceneTextMap: Record<string, { headline: string; subheadline: string; tagline: string; recipient: string }> = {
  'father': { headline: 'Happy Father\'s Day', subheadline: 'A Gift He\'ll Treasure', tagline: 'For the Best Dad', recipient: 'Dad' },
  'mother': { headline: 'Happy Mother\'s Day', subheadline: 'A Gift She\'ll Treasure', tagline: 'For the Best Mom', recipient: 'Mom' },
  'christmas': { headline: 'Merry Christmas', subheadline: 'The Perfect Holiday Gift', tagline: 'Season of Giving', recipient: 'Loved Ones' },
  'birthday': { headline: 'Happy Birthday', subheadline: 'Make Their Day Special', tagline: 'Celebrate in Style', recipient: 'Birthday Star' },
  'valentine': { headline: 'Be My Valentine', subheadline: 'A Gift from the Heart', tagline: 'Love & Appreciation', recipient: 'Valentine' },
  'wedding': { headline: 'Congratulations', subheadline: 'A Gift for the Newlyweds', tagline: 'Happily Ever After', recipient: 'Newlyweds' },
  'graduation': { headline: 'Congrats Graduate', subheadline: 'Celebrate Achievement', tagline: 'The Future is Yours', recipient: 'Graduate' },
  'everyday': { headline: 'Thoughtfully Made', subheadline: 'A Beautiful Gift', tagline: 'For Someone Special', recipient: 'Someone Special' },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysis, platform, scene, variants, colorScheme, visualStyle } = body;

    if (!analysis || !platform || !scene) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const productName = analysis.productName || '产品';
    const keyFeatures = analysis.keyFeatures?.slice(0, 3) || ['高品质', '精美设计'];
    const featureStr = keyFeatures.join(', ');

    // 获取场景文案
    const sceneText = sceneTextMap[scene] || sceneTextMap['everyday'];

    // 配色方案映射 - 用于背景和装饰元素
    const colorSchemeMap: Record<string, { name: string; bg: string; accent: string; text: string; desc: string }> = {
      'blue': { 
        name: 'blue palette', 
        bg: 'soft blue gradient background', 
        accent: 'navy blue and sky blue accents',
        text: 'dark blue or white text',
        desc: 'calm professional blue tones #1B3A5C #4A90D9 #E8F1FA'
      },
      'warm': { 
        name: 'warm palette', 
        bg: 'warm beige gradient background', 
        accent: 'golden tan and cream accents',
        text: 'dark brown or cream text',
        desc: 'warm inviting tones #C8963E #D4A574 #FFF8F0'
      },
      'green': { 
        name: 'green palette', 
        bg: 'soft sage green background', 
        accent: 'forest green and mint accents',
        text: 'dark green or white text',
        desc: 'natural fresh tones #2D5A27 #9DC183 #F0F7EC'
      },
      'red': { 
        name: 'red palette', 
        bg: 'soft burgundy gradient background', 
        accent: 'crimson and soft pink accents',
        text: 'dark red or white text',
        desc: 'passionate energetic tones #8B1A1A #C41E3A #FFF0F0'
      },
      'purple': { 
        name: 'purple palette', 
        bg: 'soft lavender background', 
        accent: 'deep purple and light lilac accents',
        text: 'dark purple or white text',
        desc: 'elegant mysterious tones #4A1A6B #9B59B6 #F5E6FF'
      },
      'monochrome': { 
        name: 'monochrome palette', 
        bg: 'clean light gray gradient background', 
        accent: 'black, white and gray accents',
        text: 'black or dark gray text on light background',
        desc: 'minimalist sophisticated monochrome #1A1A1A #808080 #F5F5F5'
      },
      'pink': { 
        name: 'pink palette', 
        bg: 'soft blush pink background', 
        accent: 'rose and soft pink accents',
        text: 'dark rose or white text',
        desc: 'soft romantic tones #C41E5A #FFB6C1 #FFF0F5'
      },
    };

    // 获取配色描述
    const colorInfo = colorScheme && colorScheme !== 'auto' ? colorSchemeMap[colorScheme] : colorSchemeMap['warm'];

    // 统一字体指令
    const unifiedFont = 'Use CONSISTENT typography across ALL images: modern sans-serif font family (like Helvetica, Arial, or similar clean sans-serif), bold weight for headlines, regular weight for body text. NEVER use decorative, script, or cursive fonts. NEVER use different font styles in different images.';

    // 统一风格锚定
    const styleAnchor = `CONSISTENT BRAND STYLE across all 10 images: ${colorInfo.desc}. ${unifiedFont}. Professional Amazon listing photography style. Clean, minimal, product-focused composition.`;

    // 禁止元素指令
    const noElements = 'NO gift boxes, NO gift packaging, NO ribbons, NO bows, NO wrapping paper, NO decorative gift elements. Product should be shown alone or in real usage context only.';

    const prompts = [
      {
        index: 1,
        type: 'main',
        purpose: '主图 - Amazon listing 主图，纯白背景，产品主体清晰居中',
        displayPrompt: `亚马逊主图风格，${productName}，纯白背景，产品居中占画面约85%`,
        prompt: `${styleAnchor}. Amazon US marketplace professional product photography MAIN IMAGE. ${productName}, ${featureStr}. CRITICAL: Pure white background RGB 255,255,255 ONLY. Product centered, occupies 85% of frame. Soft commercial studio lighting. NO text, NO badges, NO props, NO decorative elements. Clean e-commerce product shot. High-end retail catalog quality.`,
      },
      {
        index: 2,
        type: 'feature',
        purpose: '核心卖点图 - 突出最重要卖点，带大标题',
        displayPrompt: `${productName}核心卖点展示，大标题"${sceneText.headline}"`,
        prompt: `${styleAnchor}. Amazon listing FEATURE HIGHLIGHT image for ${productName}. ${colorInfo.bg}. ${colorInfo.text}. Large bold headline at top: "${sceneText.headline}". Smaller subheadline: "${sceneText.subheadline}". Product is hero, clearly visible and prominent. Simple minimal composition. ${noElements}. ${unifiedFont}. Clean professional Amazon infographic style.`,
      },
      {
        index: 3,
        type: 'detail',
        purpose: '细节特写图 - 展示工艺材质',
        displayPrompt: `${productName}工艺细节特写，展示品质`,
        prompt: `${styleAnchor}. Amazon listing DETAIL CLOSE-UP image for ${productName}. Macro photography showing craftsmanship, texture, material quality. Product detail fills frame. ${colorInfo.bg}. Simple headline: "Premium Quality". ${noElements}. ${unifiedFont}. Professional product photography.`,
      },
      {
        index: 4,
        type: 'lifestyle',
        purpose: '使用场景图 - 真实生活场景',
        displayPrompt: `真实生活场景，${productName}作为主体`,
        prompt: `${styleAnchor}. Amazon listing LIFESTYLE image for ${productName}. Real authentic home setting. Product is visual center, larger than surroundings. Natural everyday usage context. ${colorInfo.accent} in scene. ${noElements}. NO text overlay on this image. Clean composition, product-focused.`,
      },
      {
        index: 5,
        type: 'gift',
        purpose: '送礼场景图 - 产品作为礼物展示',
        displayPrompt: `送礼场景，${productName}作为礼物`,
        prompt: `${styleAnchor}. Amazon listing GIFT SCENE image for ${productName}. Product elegantly placed as a gift presentation. ${colorInfo.bg}. Headline: "${sceneText.tagline}". Simple elegant composition showing product ready to gift. ${noElements}. NO actual gift boxes or wrapping. ${unifiedFont}. Product remains hero.`,
      },
      {
        index: 6,
        type: 'info',
        purpose: '信息图表 - 尺寸标注',
        displayPrompt: `${productName}尺寸信息图`,
        prompt: `${styleAnchor}. Amazon listing DIMENSIONS infographic for ${productName}. Clean layout showing product with measurement lines and numbers. ${colorInfo.bg}. ${colorInfo.text}. Simple headline: "Perfect Size". Clean icon-style graphics. NO feature list, NO bullet points about product benefits. ${noElements}. ${unifiedFont}.`,
      },
      {
        index: 7,
        type: 'craftsmanship',
        purpose: '工艺细节图 - 材质特写',
        displayPrompt: `${productName}材质工艺展示`,
        prompt: `${styleAnchor}. Amazon listing CRAFTSMANSHIP image for ${productName}. Close-up showing material quality, texture, finish details. ${colorInfo.bg}. Simple headline: "Expert Craftsmanship". Detail-focused composition. ${noElements}. ${unifiedFont}. Professional macro photography.`,
      },
      {
        index: 8,
        type: 'emotional',
        purpose: '情感场景图 - 人物互动',
        displayPrompt: `温馨情感场景，${sceneText.recipient}收到礼物`,
        prompt: `${styleAnchor}. Amazon listing EMOTIONAL lifestyle image for ${productName}. Warm authentic scene with person naturally interacting with product. ${colorInfo.accent} in setting. Headline: "Made for ${sceneText.recipient}". Genuine emotion, authentic moment. Product clearly visible. ${noElements}. ${unifiedFont}. Natural lighting.`,
      },
      {
        index: 9,
        type: 'versatility',
        purpose: '多功能展示 - 展示产品用途',
        displayPrompt: `${productName}多功能用途展示`,
        prompt: `${styleAnchor}. Amazon listing VERSATILITY image for ${productName}. 2-3 panel layout showing different uses/contexts. ${colorInfo.bg}. Headline: "Endless Possibilities". Each panel shows product in different real usage scenario. ${noElements}. ${unifiedFont}. Clean layout with subtle panel borders.`,
      },
      {
        index: 10,
        type: 'brand',
        purpose: '品牌收尾图 - 产品+品牌信息',
        displayPrompt: `品牌展示收尾图，${sceneText.headline}`,
        prompt: `${styleAnchor}. Amazon listing BRAND CLOSING image for ${productName}. Elegant product composition. ${colorInfo.bg}. Large headline: "${sceneText.headline}". Tagline: "${sceneText.subheadline}". Refined, gift-worthy presentation. ${noElements}. ${unifiedFont}. Product remains hero. Clean minimal composition.`,
      },
    ];

    console.log(`[Generate Prompts] 生成了 ${prompts.length} 个Amazon风格提示词`, { productName, scene, colorScheme });

    return NextResponse.json({ 
      success: true, 
      prompts,
      styleAnchor: {
        colorPalette: colorInfo.desc,
        fontStyle: 'Modern sans-serif, consistent across all images',
        scene: scene,
      }
    });

  } catch (error: any) {
    console.error('生成提示词失败:', error.message);
    
    const body = await request.json().catch(() => ({ analysis: {} }));
    const productName = body.analysis?.productName || '产品';
    const keyFeatures = body.analysis?.keyFeatures?.slice(0, 3) || ['高品质', '精美设计'];
    const featureStr = keyFeatures.join(', ');
    
    // 降级提示词
    const prompts = [
      {
        index: 1,
        type: 'main',
        purpose: '主图',
        displayPrompt: `亚马逊主图风格，${productName}，纯白背景`,
        prompt: `Amazon main image, ${productName}, ${featureStr}, pure white background #FFFFFF, no text, no decorative elements, professional product photography`,
      },
      {
        index: 2,
        type: 'feature',
        purpose: '卖点图',
        displayPrompt: `${productName}卖点展示`,
        prompt: `Amazon feature image, ${productName}, ${featureStr}, clean background, bold headline text, professional typography, product is hero`,
      },
      {
        index: 3,
        type: 'detail',
        purpose: '细节图',
        displayPrompt: `${productName}细节特写`,
        prompt: `Amazon detail image, ${productName}, ${featureStr}, close-up craftsmanship, clean background, professional photography`,
      },
      {
        index: 4,
        type: 'lifestyle',
        purpose: '场景图',
        displayPrompt: `生活场景，${productName}`,
        prompt: `Amazon lifestyle image, ${productName}, ${featureStr}, real home setting, product is hero, natural lighting`,
      },
      {
        index: 5,
        type: 'gift',
        purpose: '送礼图',
        displayPrompt: `送礼场景`,
        prompt: `Amazon gift scene image, ${productName}, ${featureStr}, elegant presentation, no gift boxes, product-focused`,
      },
      {
        index: 6,
        type: 'info',
        purpose: '信息图',
        displayPrompt: `尺寸信息图`,
        prompt: `Amazon infographic, ${productName}, ${featureStr}, dimensions and measurements, clean layout, professional design`,
      },
      {
        index: 7,
        type: 'craftsmanship',
        purpose: '工艺图',
        displayPrompt: `材质工艺展示`,
        prompt: `Amazon craftsmanship image, ${productName}, ${featureStr}, close-up detail, material quality, professional photography`,
      },
      {
        index: 8,
        type: 'emotional',
        purpose: '情感图',
        displayPrompt: `情感场景`,
        prompt: `Amazon emotional image, ${productName}, ${featureStr}, natural human interaction, authentic moment, product visible`,
      },
      {
        index: 9,
        type: 'versatility',
        purpose: '多功能图',
        displayPrompt: `多功能展示`,
        prompt: `Amazon versatility image, ${productName}, ${featureStr}, multi-panel showing uses, clean layout`,
      },
      {
        index: 10,
        type: 'brand',
        purpose: '品牌图',
        displayPrompt: `品牌展示收尾图`,
        prompt: `Amazon brand image, ${productName}, ${featureStr}, elegant composition, headline text, refined presentation`,
      },
    ];

    return NextResponse.json({ success: true, prompts });
  }
}
