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
    // Image 1: 商品白底主图 - 突出定制区域
    hero: {
      index: 1,
      type: '主图 - 白底展示',
      goal: '纯白背景展示产品全貌，突出定制区域细节，强调个性化特征',
      headline: analysis.product_name,
      subheadline: analysis.selling_points[0] || 'Premium Quality',
      scene: 'Pure white background RGB 255,255,255, professional studio, product with visible personalization details prominently featured',
      camera: 'Front-facing with close-up detail shot of customization area, product fills 85% of frame',
      lighting: 'Soft even studio lighting highlighting personalization details, minimal shadows',
      emotion: 'Clean, professional, high-end retail quality with emphasis on unique personalization',
      composition: 'Product centered with clear view of customized elements (engraving, monogram, or personalized design)',
      elements: ['Product with visible personalization', 'Pure white background', 'Close-up of customization detail', 'Unique design elements highlighted'],
      text_content: { headline: '', subheadline: '' }
    },
    // Image 2: 定制流程展示 - 人物手持产品展示定制细节
    customization: {
      index: 2,
      type: '定制流程展示',
      goal: '展示人物手持产品，展示定制流程和工艺',
      headline: 'Personalized Just for You',
      subheadline: 'Easy Customization Process',
      scene: 'Person holding the product, showing customization details and craftsmanship, clear view of personalized elements like engraving or monogram',
      camera: 'Medium shot showing hands holding product with clear view of customization details',
      lighting: designBible.lighting_style,
      emotion: 'Personal, thoughtful, handcrafted care with emphasis on personalization',
      composition: 'Hands holding product prominently, customization details clearly visible, process of personalization demonstrated',
      elements: ['Person hands holding product', 'Visible customization details', 'Personalization craftsmanship', 'Clear view of engraving/monogram', 'Process visualization'],
      text_content: { headline: 'Easy to Customize', subheadline: 'Make It Yours' }
    },
    // Image 3: 情感故事 - 强调"为谁定制"的专属感
    story: {
      index: 3,
      type: '情感故事',
      goal: '讲述专属定制故事，强调"这是为谁定制的"以及背后的情感意义',
      headline: 'Made for Someone Special',
      subheadline: 'A Gift with Meaning',
      scene: 'Person emotionally connecting with personalized product, showing their name, date, or special message engraved/printed on it, intimate storytelling moment',
      camera: 'Environmental portrait with focus on personalized details and emotional reaction',
      lighting: 'Warm, intimate lighting highlighting both the person and the customization details',
      emotion: 'Deeply personal, emotionally meaningful, treasured keepsake, showing the bond between giver and receiver',
      composition: 'Person with product showing visible personalization (name, date, message), emotional storytelling with context of who it is for',
      elements: ['Person with emotional connection', 'Visible personalization (name/date/message)', 'Story context', 'Intimate atmosphere', 'Meaningful moment'],
      text_content: { headline: 'One of a Kind', subheadline: 'Made Just for You' }
    },
    // Image 4: 节日送礼场景 - 强调收礼人情感反应和独特性
    gifting: {
      index: 4,
      type: '节日送礼场景',
      goal: '展示真实的节日送礼场景，突出收礼人看到定制内容时的情感反应和礼物的独特性',
      headline: holidayText.headline,
      subheadline: holidayText.subheadline,
      scene: `${holidayText.headline} celebration moment, recipient's emotional reaction upon seeing the personalized product with their name or special message, genuine surprise and joy`,
      camera: 'Candid moment focusing on recipient\'s face and the personalized product, capturing genuine emotional reaction',
      lighting: 'Warm, festive lighting highlighting the emotional moment and personalization details',
      emotion: `Joyful ${holidayText.headline.toLowerCase()} celebration, genuine surprise and delight at seeing personalized gift, love and appreciation for the thoughtfulness`,
      composition: 'Recipient holding product with visible personalization, emotional reaction clearly shown, giver watching with love, emphasizing the uniqueness of the gift',
      elements: ['Recipient emotional reaction', 'Visible personalization on product', 'Genuine surprise and joy', 'Holiday atmosphere', 'Thoughtful gift exchange'],
      text_content: { headline: holidayText.headline, subheadline: `A Personalized ${holidayText.headline} Gift` }
    },
    // Image 5: 产品特点展示 - 结合定制元素
    features: {
      index: 5,
      type: '产品特点展示',
      goal: '展示4个核心产品特点，同时突出定制选项和个性化可能性',
      headline: 'Why You\'ll Love It',
      subheadline: 'Personalized Perfection',
      scene: 'Product with visible personalization alongside 4 key features, showing both quality and customization options, examples of different personalization styles',
      camera: 'Styled shot showcasing product features with clear view of customization examples',
      lighting: designBible.lighting_style,
      emotion: 'Informative, trustworthy, quality-focused with emphasis on personalization options',
      composition: 'Product centered with 4 feature highlights and customization examples arranged around it, showing variety of personalization possibilities',
      elements: ['Product with personalization', '4 feature highlights', 'Customization examples', 'Personalization options', 'Quality craftsmanship'],
      text_content: { 
        headline: 'Personalized Quality', 
        subheadline: analysis.selling_points.slice(0, 4).join(' • ') || 'Premium Personalized Quality' 
      }
    },
    // Image 6: 生活方式展示 - 强调定制内容的生活意义
    lifestyle: {
      index: 6,
      type: '生活方式展示',
      goal: '展示个性化产品在真实生活中的意义和使用场景，强调定制内容如何融入日常生活',
      headline: 'Part of Your Story',
      subheadline: 'Personalized for Everyday',
      scene: `${getProductUsageScene(analysis.product_type, analysis.product_name)}, with visible personalization (name, initials, or custom design) clearly integrated into daily life, showing how the customized element makes it special`,
      camera: 'Lifestyle shot emphasizing the personalized product in authentic daily use, close-up of customization detail within the scene',
      lighting: 'Natural, authentic lifestyle lighting highlighting the personalization',
      emotion: 'Aspirational yet personal, showing how customization adds meaning to everyday moments, treasured personal item',
      composition: 'Product with visible personalization prominently featured in active usage setting, showing the emotional connection to the customized element',
      elements: ['Product with visible personalization in use', 'Daily life context', 'Personal meaning demonstrated', 'Natural setting', 'Emotional connection to customized item'],
      text_content: { headline: 'Your Personal Touch', subheadline: 'Made for Your Life' }
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
  
  // Build dimensions info if available
  const dimensionsInfo = analysis.dimensions ? `
PRODUCT DIMENSIONS (for accurate scale representation):
${analysis.dimensions.length ? `- Length: ${analysis.dimensions.length}` : ''}
${analysis.dimensions.width ? `- Width: ${analysis.dimensions.width}` : ''}
${analysis.dimensions.height ? `- Height: ${analysis.dimensions.height}` : ''}
${analysis.dimensions.diameter ? `- Diameter: ${analysis.dimensions.diameter}` : ''}
${analysis.dimensions.weight ? `- Weight: ${analysis.dimensions.weight}` : ''}
${analysis.dimensions.custom_size ? `- Size Context: ${analysis.dimensions.custom_size}` : ''}
CRITICAL: Show product at accurate scale relative to hands, objects, or environment. Use appropriate camera distance and framing to convey true size.` : '';
  
  const basePrompt = `Amazon listing product photography. ${analysis.product_name}. 

DESIGN BIBLE (apply to ALL images):
- Visual Style: ${designBible.visual_style}
- Color Palette: Primary ${palette.primary}, Secondary ${palette.secondary}, Accent ${palette.accent}, Background ${palette.background}, Text ${palette.text}
- Lighting: ${designBible.lighting_style}
- Camera: ${designBible.camera_style}
- Font: ${designBible.font_style.family}, Headlines ${designBible.font_style.headline_weight}, Body ${designBible.font_style.body_weight}
- Composition: ${designBible.composition_style}
- Emotion: ${designBible.emotion_style}
${dimensionsInfo}

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
- Consistent with all other images in the set
${analysis.dimensions ? '- Show product at accurate scale and proportion' : ''}`;

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
