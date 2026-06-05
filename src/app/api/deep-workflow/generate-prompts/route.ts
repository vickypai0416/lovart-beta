import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';
import type { ProductAnalysis, DesignBible, GeneratedPrompt, ListingBlueprint, ImageBlueprint } from '@/lib/deep-workflow/types';

interface GeneratePromptsRequest {
  analysis: ProductAnalysis;
  designBible: DesignBible;
  preferences: {
    platform: string;
    selectedHolidays: string[];
    selectedAudiences: string[];
    visualStyle: string;
    colorScheme: string;
    emotion: string;
  };
}

// Get product-specific usage scene based on product type
function getProductUsageScene(productType: string, productName: string): string {
  const type = productType.toLowerCase();
  const name = productName.toLowerCase();
  
  // Clothing items
  if (type.includes('shirt') || type.includes('t-shirt') || type.includes('clothing') || 
      name.includes('shirt') || name.includes('t-shirt') || name.includes('衣服') || name.includes('T恤')) {
    return 'Person wearing the clothing item, showing fit and style in everyday setting';
  }
  
  // Bags and toiletry kits
  if (type.includes('bag') || type.includes('toiletry') || type.includes('pouch') || 
      name.includes('bag') || name.includes('洗漱包') || name.includes('化妆包') || name.includes('收纳包')) {
    return 'Product filled with items showing capacity and organization, in bathroom or travel setting';
  }
  
  // Blankets and bedding
  if (type.includes('blanket') || type.includes('throw') || type.includes('bedding') || 
      name.includes('blanket') || name.includes('毛毯') || name.includes('毯子') || name.includes('被子')) {
    return 'Product draped on bed or sofa, showing cozy usage in bedroom or living room';
  }
  
  // Wall art and decorations
  if (type.includes('art') || type.includes('painting') || type.includes('poster') || type.includes('decor') || 
      name.includes('画') || name.includes('装饰画') || name.includes('海报') || name.includes('wall art')) {
    return 'Person hanging or adjusting the artwork on wall, showing it displayed in home setting';
  }
  
  // Mugs and drinkware
  if (type.includes('mug') || type.includes('cup') || type.includes('glass') || 
      name.includes('mug') || name.includes('杯子') || name.includes('马克杯')) {
    return 'Person holding or using the mug with beverage, cozy kitchen or office setting';
  }
  
  // Jewelry and accessories
  if (type.includes('jewelry') || type.includes('necklace') || type.includes('bracelet') || 
      name.includes('jewelry') || name.includes('项链') || name.includes('手链') || name.includes('首饰')) {
    return 'Person wearing the jewelry piece, showing how it looks when worn';
  }
  
  // Cutting boards and kitchen items
  if (type.includes('cutting board') || type.includes('kitchen') || type.includes('board') || 
      name.includes('cutting board') || name.includes('砧板') || name.includes('菜板')) {
    return 'Product in use on kitchen counter with food preparation, showing functionality';
  }
  
  // Pillows and cushions
  if (type.includes('pillow') || type.includes('cushion') || 
      name.includes('pillow') || name.includes('枕头') || name.includes('抱枕')) {
    return 'Product arranged on sofa or bed, showing comfort and decorative appeal';
  }
  
  // Candles and home fragrance
  if (type.includes('candle') || type.includes('diffuser') || 
      name.includes('candle') || name.includes('蜡烛') || name.includes('香薰')) {
    return 'Product lit or in use on table or shelf, creating cozy ambiance';
  }
  
  // Phone cases and tech accessories
  if (type.includes('phone case') || type.includes('tech') || 
      name.includes('phone case') || name.includes('手机壳') || name.includes('保护壳')) {
    return 'Phone with case being held or used in hand, showing protection and style';
  }
  
  // Books and notebooks
  if (type.includes('book') || type.includes('notebook') || type.includes('journal') || 
      name.includes('book') || name.includes('笔记本') || name.includes('日记本')) {
    return 'Product being written in or read at desk or cozy reading spot';
  }
  
  // Coasters and small home items
  if (type.includes('coaster') || name.includes('coaster') || name.includes('杯垫')) {
    return 'Product in use on table with drink, showing practical everyday use';
  }
  
  // Ornaments and decorative items
  if (type.includes('ornament') || name.includes('ornament') || name.includes('装饰品') || name.includes('摆件')) {
    return 'Product displayed on shelf or table as decorative accent in home';
  }
  
  // Default fallback
  return 'Product in real lifestyle context showing actual usage, product remains hero';
}

// Get holiday-specific text
function getHolidayText(holiday: string): { headline: string; subheadline: string; cta: string } {
  const holidayMap: Record<string, { headline: string; subheadline: string; cta: string }> = {
    'fathers_day': { headline: "Happy Father's Day", subheadline: 'A Gift He\'ll Treasure', cta: 'For Dad' },
    'mothers_day': { headline: "Happy Mother's Day", subheadline: 'A Gift She\'ll Treasure', cta: 'For Mom' },
    'christmas': { headline: 'Merry Christmas', subheadline: 'The Perfect Holiday Gift', cta: 'Season of Joy' },
    'valentines_day': { headline: 'Be My Valentine', subheadline: 'A Gift from the Heart', cta: 'For Your Love' },
    'birthday': { headline: 'Happy Birthday', subheadline: 'Make Their Day Special', cta: 'Celebrate' },
    'wedding': { headline: 'Congratulations', subheadline: 'A Gift for the Newlyweds', cta: 'Happily Ever After' },
    'housewarming': { headline: 'Welcome Home', subheadline: 'Perfect for New Beginnings', cta: 'Home Sweet Home' },
    'memorial': { headline: 'In Memory', subheadline: 'Forever in Our Hearts', cta: 'Cherished Memories' },
  };
  return holidayMap[holiday] || { headline: 'Thoughtfully Made', subheadline: 'A Beautiful Gift', cta: 'Shop Now' };
}

// Generate image blueprint based on user's 6-image framework
function generateImageBlueprint(
  index: number,
  type: string,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  holidayText: { headline: string; subheadline: string; cta: string }
): ImageBlueprint {
  const blueprints: Record<string, ImageBlueprint> = {
    // Image 1: 商品白底主图
    hero: {
      index: 1,
      type: '主图 - 白底展示',
      goal: '纯白背景展示产品全貌，符合Amazon主图规范',
      headline: analysis.product_name,
      subheadline: analysis.selling_points[0] || 'Premium Quality',
      scene: 'Pure white background RGB 255,255,255, professional studio',
      camera: 'Front-facing, eye-level angle, product fills 85% of frame',
      lighting: 'Soft even studio lighting, minimal shadows',
      emotion: 'Clean, professional, high-end retail quality',
      composition: 'Product centered, pure white background only',
      elements: ['Product only', 'Pure white background', 'No props', 'No text overlay'],
      text_content: { headline: '', subheadline: '' }
    },
    // Image 2: 人物手执产品展示、介绍定制流程
    customization: {
      index: 2,
      type: '定制流程展示',
      goal: '展示人物手持产品，介绍定制流程和工艺',
      headline: 'Personalized Just for You',
      subheadline: 'Easy Customization Process',
      scene: 'Person holding the product, showing customization details',
      camera: 'Medium shot showing hands and product clearly',
      lighting: designBible.lighting_style,
      emotion: 'Personal, thoughtful, handcrafted care',
      composition: 'Hands holding product, customization visible',
      elements: ['Person hands', 'Product', 'Customization detail', 'Process visualization'],
      text_content: { headline: 'Easy to Customize', subheadline: 'Make It Yours' }
    },
    // Image 3: 情感价值、以人物使用产品为主的故事讲述
    story: {
      index: 3,
      type: '情感故事',
      goal: '讲述人物使用产品的温馨故事，传递情感价值',
      headline: 'Made with Love',
      subheadline: 'A Story Worth Sharing',
      scene: 'Person actively using the product in meaningful moment',
      camera: 'Environmental portrait showing emotional connection',
      lighting: 'Warm, natural lighting for emotional impact',
      emotion: 'Heartwarming, meaningful, cherished moments',
      composition: 'Person using product, emotional storytelling focus',
      elements: ['Person using product', 'Emotional moment', 'Story context', 'Warm atmosphere'],
      text_content: { headline: 'Create Memories', subheadline: 'Cherish Every Moment' }
    },
    // Image 4: 真实的人物送礼场景
    gifting: {
      index: 4,
      type: '节日送礼场景',
      goal: '展示真实的节日送礼场景（父亲节/母亲节/情人节/圣诞节等）',
      headline: holidayText.headline,
      subheadline: holidayText.subheadline,
      scene: `${holidayText.headline} celebration scene with people exchanging the product`,
      camera: 'Candid moment capture, natural interaction',
      lighting: 'Warm, festive lighting matching holiday mood',
      emotion: `Joyful ${holidayText.headline.toLowerCase()} celebration, love and appreciation`,
      composition: 'People exchanging product, emotional connection visible',
      elements: ['People giving/receiving', 'Product as centerpiece', 'Holiday atmosphere', 'Emotional exchange'],
      text_content: { headline: holidayText.headline, subheadline: holidayText.subheadline }
    },
    // Image 5: 产品特点、4个和产品有关的特点配上图片
    features: {
      index: 5,
      type: '产品特点展示',
      goal: '展示4个核心产品特点，图文结合',
      headline: 'Why You\'ll Love It',
      subheadline: 'Quality You Can See',
      scene: 'Product with 4 feature highlights arranged visually',
      camera: 'Styled shot with space for feature callouts',
      lighting: designBible.lighting_style,
      emotion: 'Informative, trustworthy, quality-focused',
      composition: 'Product centered with 4 feature icons/badges around it',
      elements: ['Product', '4 feature highlights', 'Visual icons', 'Clean layout'],
      text_content: { 
        headline: 'Key Features', 
        subheadline: analysis.selling_points.slice(0, 4).join(' • ') || 'Premium Quality' 
      }
    },
    // Image 6: 产品的生活方式使用图、以产品为主体，展示具体使用方式
    lifestyle: {
      index: 6,
      type: '生活方式展示',
      goal: '展示产品在真实生活场景中的具体使用方式，产品为主体',
      headline: 'Perfect for Your Life',
      subheadline: 'Everyday Elegance',
      scene: getProductUsageScene(analysis.product_type, analysis.product_name),
      camera: 'Lifestyle shot with product as clear focal point, showing actual usage',
      lighting: 'Natural, authentic lifestyle lighting',
      emotion: 'Aspirational yet achievable, everyday luxury',
      composition: 'Product prominently featured in active usage setting',
      elements: ['Product in use', 'Active usage demonstration', 'Natural setting', 'Functional display'],
      text_content: { headline: 'Made for Life', subheadline: 'Your Perfect Companion' }
    },
  };

  return blueprints[type] || blueprints.hero;
}

// Generate the actual image prompt
function generateImagePrompt(
  blueprint: ImageBlueprint,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  preferences: GeneratePromptsRequest['preferences']
): string {
  const palette = designBible.color_palette;
  
  const basePrompt = `Amazon listing product photography. ${analysis.product_name}. 

DESIGN BIBLE (apply to ALL images):
- Visual Style: ${designBible.visual_style}
- Color Palette: Primary ${palette.primary}, Secondary ${palette.secondary}, Accent ${palette.accent}, Background ${palette.background}, Text ${palette.text}
- Lighting: ${designBible.lighting_style}
- Camera: ${designBible.camera_style}
- Font: ${designBible.font_style.family}, Headlines ${designBible.font_style.headline_weight}, Body ${designBible.font_style.body_weight}
- Composition: ${designBible.composition_style}
- Emotion: ${designBible.emotion_style}

IMAGE ${blueprint.index} - ${blueprint.type.toUpperCase()}:
Goal: ${blueprint.goal}
Scene: ${blueprint.scene}
Camera: ${blueprint.camera}
Lighting: ${blueprint.lighting}
Emotion: ${blueprint.emotion}
Composition: ${blueprint.composition}

TEXT CONTENT (if applicable):
Headline: "${blueprint.text_content.headline}"
Subheadline: "${blueprint.text_content.subheadline}"

REQUIREMENTS:
- Use EXACT colors from Design Bible palette
- Use EXACT font style specified
- Product is ALWAYS the hero
- NO packaging elements, NO decorative ribbons, NO wrapping materials
- Clean, professional Amazon listing quality
- Consistent with all other images in the set`;

  return basePrompt;
}

export async function POST(request: Request) {
  try {
    const body: GeneratePromptsRequest = await request.json();
    const { analysis, designBible, preferences } = body;

    if (!analysis || !designBible) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // Get primary holiday for text content
    const primaryHoliday = preferences.selectedHolidays[0] || analysis.recommended_holidays[0]?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const holidayText = getHolidayText(primaryHoliday);

    // Define the 6 image types based on user's framework
    const imageTypes = ['hero', 'customization', 'story', 'gifting', 'features', 'lifestyle'];
    
    const prompts: GeneratedPrompt[] = [];
    const blueprint: ListingBlueprint = { images: [] };

    // Generate blueprint and prompts for each image
    imageTypes.forEach((type, index) => {
      const imageBlueprint = generateImageBlueprint(index + 1, type, analysis, designBible, holidayText);
      const prompt = generateImagePrompt(imageBlueprint, analysis, designBible, preferences);
      
      blueprint.images.push(imageBlueprint);
      
      prompts.push({
        index: index + 1,
        type: imageBlueprint.type,
        displayPrompt: `${imageBlueprint.type}: ${imageBlueprint.headline} - ${imageBlueprint.subheadline}`,
        prompt,
        purpose: imageBlueprint.goal
      });
    });

    return NextResponse.json({
      success: true,
      prompts,
      blueprint
    });

  } catch (error) {
    console.error('Prompt generation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: '生成失败，请重试' 
    }, { status: 500 });
  }
}
