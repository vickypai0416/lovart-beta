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

// Generate story scene based on selected audiences
function generateStoryScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || 'someone special';
  const scenes: Record<string, string> = {
    'mom': 'Mother lovingly holding personalized gift, her eyes lighting up with joy as she sees her name elegantly engraved, surrounded by soft warm lighting',
    'dad': 'Father proudly displaying personalized item, genuine smile of appreciation, showing the thoughtful customization made just for him',
    'partner': 'Couple sharing intimate moment with personalized gift, romantic atmosphere, emphasizing the unique bond between them',
    'friend': 'Best friend excitedly unwrapping personalized gift, genuine surprise and delight, celebrating their special friendship',
    'child': 'Child\'s face lighting up with wonder seeing their name on the personalized item, pure joy and excitement',
    'grandparent': 'Grandparent cherishing personalized keepsake, emotional connection to family, treasured memory embodied in the gift',
  };
  return scenes[audience.toLowerCase()] || `Person emotionally connecting with their personalized ${audience} gift, showing deep appreciation for the thoughtful customization`;
}

// Generate gifting scene based on holiday and audiences
function generateGiftingScene(holidayHeadline: string, selectedHolidays: string[], selectedAudiences: string[]): string {
  const holiday = selectedHolidays[0] || 'special occasion';
  const audience = selectedAudiences[0] || 'loved one';
  
  const holidayScenes: Record<string, string> = {
    'christmas': 'Beautiful Christmas morning scene with recipient unwrapping personalized gift under twinkling lights and festive decorations',
    'valentines_day': 'Romantic Valentine\'s setting with roses and candles, recipient receiving heartfelt personalized gift',
    'fathers_day': 'Father\'s Day celebration with family, dad opening his personalized gift with pride and appreciation',
    'mothers_day': 'Mother\'s Day brunch scene, mom touched by thoughtful personalized gift from her children',
    'birthday': 'Birthday celebration with balloons and cake, birthday person delighted by personalized surprise gift',
    'wedding': 'Wedding gift table scene or newlyweds exchanging personalized keepsakes, celebrating their union',
  };
  
  return holidayScenes[holiday.toLowerCase()] || `${holidayHeadline} celebration, ${audience} receiving personalized gift with genuine surprise and joy`;
}

// Generate lifestyle scene based on audiences
function generateLifestyleScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || 'user';
  const scenes: Record<string, string> = {
    'mom': 'Busy mom enjoying quiet moment with her personalized item in cozy kitchen or living room, daily routine enhanced by personal touch',
    'dad': 'Dad using his personalized item during weekend relaxation or hobby time, appreciating the thoughtful customization',
    'partner': 'Couple\'s home with personalized items integrated into their shared space, romantic and cozy atmosphere',
    'friend': 'Friends gathering with personalized gifts displayed proudly, celebrating their bond in casual setting',
    'child': 'Child\'s bedroom or play area with personalized items adding special touch to their personal space',
    'grandparent': 'Grandparent\'s comfortable home with personalized keepsakes on display, surrounded by family photos',
  };
  return scenes[audience.toLowerCase()] || `Person enjoying their personalized item in everyday life, showing how customization adds meaning to daily moments`;
}

// Generate image blueprint based on user's 6-image framework
function generateImageBlueprint(
  index: number,
  type: string,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  holidayText: { headline: string; subheadline: string; cta: string },
  preferences: GeneratePromptsRequest['preferences']
): ImageBlueprint {
  const blueprints: Record<string, ImageBlueprint> = {
    // Image 1: 主图 - 白底展示
    hero: {
      index: 1,
      type: '主图 - 白底展示',
      goal: '纯白背景展示产品全貌，突出定制区域细节，强调个性化特征，保留参考图中现有的定制内容',
      headline: analysis.product_name,
      subheadline: analysis.selling_points[0] || 'Premium Quality',
      scene: 'Pure white background RGB 255,255,255, professional studio lighting, product with EXACT same custom design/print as shown in reference image - preserve existing personalization perfectly without any changes',
      camera: 'Front-facing 3/4 angle with extreme close-up on customization area showing intricate details, product fills 85% of frame with dramatic lighting that makes personalized elements the undeniable focal point',
      lighting: 'Soft diffused studio lighting with strategic spotlight on customization area, enhancing texture and making custom designs stand out sharply against the product surface',
      emotion: 'Luxurious exclusivity, premium craftsmanship, emphasizing that this is a bespoke item made specifically for the customer',
      composition: 'Product centered with visual hierarchy directing eye to personalized details - subtle shadowing creates depth while keeping focus on the unique customization, existing custom content preserved exactly as in reference',
      elements: ['Existing personalization preserved exactly', 'Sharp focus on custom design details', 'Professional studio quality', 'Custom design as visual anchor', 'Premium bespoke presentation', 'Reference image customization maintained'],
      text_content: { headline: '', subheadline: '' }
    },
    // Image 2: 定制流程展示 - 人物手持产品展示定制细节
    customization: {
      index: 2,
      type: '定制流程展示',
      goal: '展示人物手持产品，展示定制流程和工艺，保持产品原有尺寸和比例',
      headline: 'Personalized Just for You',
      subheadline: 'Easy Customization Process',
      scene: `Person holding product with clear view of customizable area, showing how to add personalization like engraving or design. ${analysis.dimensions ? `CRITICAL SIZE INFO: Product is ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}. Person should hold it in a way that clearly shows this true size - hands positioned to demonstrate scale, product should not appear larger or smaller than actual dimensions.` : 'MAINTAIN exact product proportions, size, and scale as shown in reference image'}`,
      camera: 'Medium shot showing hands holding product with customization area highlighted, camera angle chosen to emphasize true product scale and size relative to hands, accurate scale representation',
      lighting: 'Clean studio lighting with focus on product details',
      emotion: 'Professional and informative, showcasing customization options clearly',
      composition: 'Product centered with accurate size representation, hands positioned to show true scale, customization area prominently displayed, maintain true-to-life proportions',
      elements: ['Person holding product at accurate scale with hands showing size reference', 'Customization area highlighted', 'Clear view of personalization options', 'Professional presentation', 'True-to-life product size', 'Hand scale reference'],
      text_content: { headline: 'Easy to Customize', subheadline: 'Make It Yours' }
    },
    // Image 3: 情感故事 - 强调"为谁定制"的专属感
    story: {
      index: 3,
      type: '情感故事',
      goal: '讲述专属定制故事，强调"这是为谁定制的"以及背后的情感意义，突出独一无二的专属感，采用精美电商排版设计，保留产品上的现有定制内容',
      headline: 'Made for Someone Special',
      subheadline: 'One of a Kind',
      scene: `${generateStoryScene(preferences.selectedAudiences)}. CRITICAL: The product shows the EXACT same custom design/print as the reference image - names, photos, artwork, or text must be preserved perfectly without any modification`,
      camera: 'Professional product photography with artistic composition, product positioned strategically with existing custom design clearly visible and unchanged, beautiful text overlay elements',
      lighting: 'Soft studio lighting with warm golden tones, creating luxurious atmosphere with gentle highlights on personalized details',
      emotion: 'Deeply personal connection, overwhelming joy, feeling of being uniquely seen and cherished',
      composition: 'Modern e-commerce layout with product as hero showing preserved custom design, elegant text elements arranged artfully around it, decorative flourishes and subtle background patterns that enhance visual appeal without distraction',
      elements: ['Beautifully styled product with preserved customization', 'Elegant typography elements', 'Soft decorative flourishes', 'Premium background texture', 'Artistic composition', 'Professional e-commerce styling', 'Emotional visual storytelling', 'Existing custom design maintained exactly'],
      text_content: { headline: 'EXCLUSIVELY YOURS', subheadline: 'A Gift Made Just for You' }
    },
    // Image 4: 节日送礼场景 - 强调收礼人情感反应和独特性
    gifting: {
      index: 4,
      type: '节日送礼场景',
      goal: '展示真实的节日送礼场景，突出收礼人看到定制内容时的情感反应和礼物的独特性，强调这是独一无二的专属礼物，采用精美电商排版设计，保持产品原有尺寸和比例',
      headline: holidayText.headline,
      subheadline: holidayText.subheadline,
      scene: `Elegant e-commerce layout featuring ${generateGiftingScene(holidayText.headline, preferences.selectedHolidays, preferences.selectedAudiences)}, surrounded by festive decorative elements, elegant typography overlays, and premium background styling. MAINTAIN exact product proportions, size, and scale as shown in reference image`,
      camera: 'Professional product photography with artistic composition, product positioned strategically with accurate scale representation alongside recipient',
      lighting: 'Soft studio lighting with warm festive tones, creating luxurious celebratory atmosphere with gentle highlights on personalized details and text elements',
      emotion: `Joyful ${holidayText.headline.toLowerCase()} celebration, genuine surprise and delight, premium luxury feel`,
      composition: 'Modern e-commerce layout with gift box and personalized product as centerpiece at accurate scale, elegant headline text at top, decorative elements framing the scene, maintain true-to-life product proportions',
      elements: ['Beautifully wrapped gift box', 'Product at accurate true-to-life size', 'Elegant typography elements', 'Festive decorative flourishes', 'Premium background texture', 'Professional e-commerce styling', 'Luxury gift presentation'],
      text_content: { headline: `Celebrate with ${holidayText.headline}`, subheadline: 'An Exclusive Gift Made Just for You' }
    },
    // Image 5: 产品特点展示 - 结合定制元素
    features: {
      index: 5,
      type: '产品特点展示',
      goal: '展示4个核心产品特点，同时突出定制选项和个性化可能性，创造视觉层次，保持产品原有尺寸和比例',
      headline: 'Why You\'ll Love It',
      subheadline: 'Personalized Perfection',
      scene: 'Elegant styled composition featuring product with beautiful visible personalization - showing existing custom design on product - surrounded by 4 beautifully presented feature highlights showcasing premium materials, artisanal craftsmanship, unlimited customization options, and exceptional quality. MAINTAIN exact product proportions, size, and scale as shown in reference image',
      camera: 'Artistic arrangement with product as centerpiece at accurate scale, each feature highlighted with visual cues pointing to customization possibilities',
      lighting: 'Studio lighting with dramatic shadows creating depth, highlighting both product features and personalized details',
      emotion: 'Premium craftsmanship, endless personalization possibilities, desirable bespoke luxury, confidence in custom quality',
      composition: 'Product with visible customization as centerpiece at accurate true-to-life size, 4 feature highlights arranged artistically around it, maintain correct product proportions throughout',
      elements: ['Product at accurate true-to-life size', 'Artistic feature presentation', 'Premium materials showcased', 'Existing customization preserved', 'Professional styling with visual hierarchy', 'Correct product scale maintained'],
      text_content: { 
        headline: 'Personalized Quality', 
        subheadline: 'Unique • Custom • Yours' 
      }
    },
    // Image 6: 生活方式展示 - 强调定制内容的生活意义
    lifestyle: {
      index: 6,
      type: '生活方式展示',
      goal: '展示个性化产品在真实生活中的意义和使用场景，强调定制内容如何融入日常生活，突出专属定制带来的独特生活体验，采用精美电商排版设计，保持产品原有尺寸和比例，保留产品上的现有定制内容',
      headline: 'Part of Your Story',
      subheadline: 'Uniquely Yours',
      scene: `${generateLifestyleScene(preferences.selectedAudiences)}. ${analysis.dimensions ? `IMPORTANT: The product dimensions are ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}. Show the product at its TRUE SIZE - it should appear appropriately large/small relative to the person and surroundings.` : ''} CRITICAL: The product displays the EXACT same custom design/print as shown in the reference image - preserve all existing personalization (names, photos, text, artwork) perfectly without any changes`,
      camera: 'Professional lifestyle photography with artistic composition, product in use at accurate scale with existing custom design clearly visible and unchanged, camera positioned to clearly show size relationship between product and person/environment, beautiful text elements arranged artfully around the scene',
      lighting: 'Soft natural lighting with warm golden tones, creating inviting atmosphere with gentle highlights on personalized details and text elements',
      emotion: 'Comforting familiarity with exclusive luxury touch, cherished daily ritual, seeing the product in real use brings emotional connection',
      composition: 'Modern e-commerce layout with personalized product in use at accurate true-to-life size showing preserved custom design, person interacting with product naturally showing proper scale, elegant headline text at top or side, lifestyle elements framing the scene, clean visual hierarchy with decorative flourishes',
      elements: ['Product in authentic use at accurate scale with preserved customization', 'Person naturally interacting with product showing true size', 'Elegant typography elements', 'Soft decorative flourishes', 'Premium background texture', 'Artistic composition', 'Professional e-commerce styling', 'Real lifestyle atmosphere', 'Clear size reference', 'Existing custom design maintained exactly'],
      text_content: { headline: 'YOURS ONLY', subheadline: 'A Piece That Tells Your Story' }
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
  const dimensionLines = analysis.dimensions
    ? [
        'PRODUCT DIMENSIONS (CRITICAL - MUST SHOW ACCURATE SIZE):',
        analysis.dimensions.length ? `- Length: ${analysis.dimensions.length}` : '',
        analysis.dimensions.width ? `- Width: ${analysis.dimensions.width}` : '',
        analysis.dimensions.height ? `- Height: ${analysis.dimensions.height}` : '',
        analysis.dimensions.diameter ? `- Diameter: ${analysis.dimensions.diameter}` : '',
        analysis.dimensions.weight ? `- Weight: ${analysis.dimensions.weight}` : '',
        analysis.dimensions.custom_size ? `- Size Context: ${analysis.dimensions.custom_size}` : '',
        '',
        'SIZE VISUALIZATION GUIDE:',
        '- 60x80 inch blanket = Large throw blanket that covers most of a couch or bed',
        '- Person holding it should show the blanket draping significantly, not held like a small towel',
        '- The blanket should appear substantial and oversized when held',
        '- Camera should be positioned to show the full scale of the blanket relative to the person',
        '- If shown on furniture, it should drape over edges to show true dimensions',
      ].filter(Boolean)
    : [];

  const dimensionsInfo = dimensionLines.join('\n');
  
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
${analysis.dimensions ? '- Show product at accurate scale and proportion' : ''}
- CRITICAL: PRESERVE EXISTING CUSTOMIZATION - The reference image shows the product with existing custom design/print. You MUST maintain this exact customization in the generated image. Do NOT change, alter, or replace the existing personalized content (names, photos, text, artwork) shown on the product. Only change the background, lighting, composition, and presentation style while keeping the product's custom design identical to the reference.`;

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
      const imageBlueprint = generateImageBlueprint(index + 1, type, analysis, designBible, holidayText, preferences);
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
