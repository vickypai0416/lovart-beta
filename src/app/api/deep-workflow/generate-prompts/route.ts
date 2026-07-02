import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';
import type { ProductAnalysis, DesignBible, GeneratedPrompt, ListingBlueprint, ImageBlueprint } from '@/lib/deep-workflow/types';

// ============================================================
// GLOBAL CONSTANTS - Technical Standards for ALL Images
// ============================================================

// ===== Global Photography Standards =====
const GLOBAL_PHOTOGRAPHY_STANDARDS = `
PHOTOGRAPHY STANDARDS (Apply to ALL images):
- Professional Amazon listing photography quality
- Soft studio lighting with warm golden tones when appropriate
- Natural ambient lighting for lifestyle/gifting scenes
- Strategic spotlight on customization areas when needed
- High-resolution 4K quality with sharp focus on details
`;

// ===== Global Customization Preservation Rules =====
const GLOBAL_CUSTOMIZATION_PRESERVATION = `
CRITICAL - PRESERVE EXISTING CUSTOMIZATION:
- The product shows EXACT same custom design/print as in reference image
- Preserve ALL existing personalization: names, photos, text, artwork
- Do NOT change, alter, replace, or reinterpret the custom content
- Keep customization locked and identical to reference
`;

// ===== Global Size Constraints =====
const GLOBAL_SIZE_CONSTRAINTS = `
SIZE & PROPORTION RULES:
- MAINTAIN exact product proportions, size, and scale from reference
- Show product at accurate true-to-life dimensions
- Use hands/person/environment to demonstrate true scale when needed
- Never distort or resize the product disproportionately
`;

// ===== Global Packaging Prohibitions =====
const GLOBAL_PACKAGING_PROHIBITIONS = `
STRICT PROHIBITIONS:
- NO gift boxes, NO packaging, NO wrapping paper
- NO ribbons, NO bows, NO decorative overlays
- NO festive decorations covering the product
- Product shown BARE / UNBOXED / as standalone item
`;

// ===== Global E-Commerce Typography Standards =====
const GLOBAL_ECOMMERCE_TYPOGRAPHY = `
E-COMMERCE TYPOGRAPHY (for images with text):
- Amazon A+ premium listing standards
- Clear visual hierarchy: headline > subheadline > body
- Generous whitespace around product and text
- Typography colors consistent with design bible
- Professional layout with balanced composition
`;

// ===== Global Quality Standards =====
const GLOBAL_QUALITY_STANDARDS = `
QUALITY STANDARDS:
- Premium bespoke presentation
- Professional Amazon listing quality
- Consistent with all other images in the set
- Product is ALWAYS the hero
`;

interface GeneratePromptsRequest {
  analysis: ProductAnalysis;
  designBible: DesignBible;
  preferences: {
    platform: string;
    selectedHolidays: string[];
    selectedAudiences: string[];
    customHoliday?: string;
    customAudience?: string;
    visualStyle: string;
    colorScheme: string;
    emotion: string;
  };
}

/**
 * Get product-specific usage scene based on product type
 * Used for lifestyle image scene setting
 * 
 * @param productType - Product type (e.g. "T-shirt", "blanket", "mug")
 * @param productName - Product name (e.g. "Custom Blanket", "Personalized Mug")
 * @returns English scene description
 */
function getProductUsageScene(productType: string, productName: string): string {
  const type = productType.toLowerCase();
  const name = productName.toLowerCase();
  
  // ===== Clothing items =====
  if (type.includes('shirt') || type.includes('t-shirt') || type.includes('clothing') || 
      name.includes('shirt') || name.includes('t-shirt') || name.includes('衣服') || name.includes('T恤')) {
    return 'Person wearing the clothing item, showing fit and style in everyday setting';
  }
  
  // ===== Bags and toiletry kits =====
  if (type.includes('bag') || type.includes('toiletry') || type.includes('pouch') || 
      name.includes('bag') || name.includes('洗漱包') || name.includes('化妆包') || name.includes('收纳包')) {
    return 'Product filled with items showing capacity and organization, in bathroom or travel setting';
  }
  
  // ===== Blankets and bedding =====
  if (type.includes('blanket') || type.includes('throw') || type.includes('bedding') || 
      name.includes('blanket') || name.includes('毛毯') || name.includes('毯子') || name.includes('被子')) {
    return 'Product draped on bed or sofa, showing cozy usage in bedroom or living room';
  }
  
  // ===== Wall art and decorations =====
  if (type.includes('art') || type.includes('painting') || type.includes('poster') || type.includes('decor') || 
      name.includes('画') || name.includes('装饰画') || name.includes('海报') || name.includes('wall art')) {
    return 'Person hanging or adjusting the artwork on wall, showing it displayed in home setting';
  }
  
  // ===== Mugs and drinkware =====
  if (type.includes('mug') || type.includes('cup') || type.includes('glass') || 
      name.includes('mug') || name.includes('杯子') || name.includes('马克杯')) {
    return 'Person holding or using the mug with beverage, cozy kitchen or office setting';
  }
  
  // ===== Jewelry and accessories =====
  if (type.includes('jewelry') || type.includes('necklace') || type.includes('bracelet') || 
      name.includes('jewelry') || name.includes('项链') || name.includes('手链') || name.includes('首饰')) {
    return 'Person wearing the jewelry piece, showing how it looks when worn';
  }
  
  // ===== Cutting boards and kitchen items =====
  if (type.includes('cutting board') || type.includes('kitchen') || type.includes('board') || 
      name.includes('cutting board') || name.includes('砧板') || name.includes('菜板')) {
    return 'Product in use on kitchen counter with food preparation, showing functionality';
  }
  
  // ===== Pillows and cushions =====
  if (type.includes('pillow') || type.includes('cushion') || 
      name.includes('pillow') || name.includes('枕头') || name.includes('抱枕')) {
    return 'Product arranged on sofa or bed, showing comfort and decorative appeal';
  }
  
  // ===== Candles and home fragrance =====
  if (type.includes('candle') || type.includes('diffuser') || 
      name.includes('candle') || name.includes('蜡烛') || name.includes('香薰')) {
    return 'Product lit or in use on table or shelf, creating cozy ambiance';
  }
  
  // ===== Phone cases and tech accessories =====
  if (type.includes('phone case') || type.includes('tech') || 
      name.includes('phone case') || name.includes('手机壳') || name.includes('保护壳')) {
    return 'Phone with case being held or used in hand, showing protection and style';
  }
  
  // ===== Books and notebooks =====
  if (type.includes('book') || type.includes('notebook') || type.includes('journal') || 
      name.includes('book') || name.includes('笔记本') || name.includes('日记本')) {
    return 'Product being written in or read at desk or cozy reading spot';
  }
  
  // ===== Coasters and small home items =====
  if (type.includes('coaster') || name.includes('coaster') || name.includes('杯垫')) {
    return 'Product in use on table with drink, showing practical everyday use';
  }
  
  // ===== Ornaments and decorative items =====
  if (type.includes('ornament') || name.includes('ornament') || name.includes('装饰品') || name.includes('摆件')) {
    return 'Product displayed on shelf or table as decorative accent in home';
  }
  
  // ===== Default fallback =====
  return 'Product in real lifestyle context showing actual usage, product remains hero';
}

/**
 * Get holiday-specific text content
 * Used for gifting image text elements
 * 
 * @param holiday - Holiday type (e.g. "fathers_day", "mothers_day", "christmas")
 * @returns { headline: main title, subheadline: subtitle, cta: call to action }
 */
function getHolidayText(holiday: string): { headline: string; subheadline: string; cta: string } {
  const holidayMap: Record<string, { headline: string; subheadline: string; cta: string }> = {
    // ===== Father's Day =====
    'fathers_day': { headline: "Happy Father's Day", subheadline: 'A Gift He\'ll Treasure', cta: 'For Dad' },
    // ===== Mother's Day =====
    'mothers_day': { headline: "Happy Mother's Day", subheadline: 'A Gift She\'ll Treasure', cta: 'For Mom' },
    // ===== Christmas =====
    'christmas': { headline: 'Merry Christmas', subheadline: 'The Perfect Holiday Gift', cta: 'Season of Joy' },
    // ===== Valentine's Day =====
    'valentines_day': { headline: 'Be My Valentine', subheadline: 'A Gift from the Heart', cta: 'For Your Love' },
    // ===== Birthday =====
    'birthday': { headline: 'Happy Birthday', subheadline: 'Make Their Day Special', cta: 'Celebrate' },
    // ===== Wedding =====
    'wedding': { headline: 'Congratulations', subheadline: 'A Gift for the Newlyweds', cta: 'Happily Ever After' },
    // ===== Housewarming =====
    'housewarming': { headline: 'Welcome Home', subheadline: 'Perfect for New Beginnings', cta: 'Home Sweet Home' },
    // ===== Memorial =====
    'memorial': { headline: 'In Memory', subheadline: 'Forever in Our Hearts', cta: 'Cherished Memories' },
  };
  
  // Default fallback text
  return holidayMap[holiday] || { headline: 'Thoughtfully Made', subheadline: 'A Beautiful Gift', cta: 'Shop Now' };
}

/**
 * Generate emotional story scene based on target audiences
 * Used for Image 3 (Emotional Story) scene setting
 * 
 * @param selectedAudiences - Target audience list (e.g. ["mom", "dad", "partner"])
 * @returns English scene description
 */
function generateStoryScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || 'someone special';
  
  // Emotional story scenes for each audience
  const scenes: Record<string, string> = {
    // ===== Mom =====
    'mom': 'Mother lovingly holding personalized gift, her eyes lighting up with joy as she sees her name elegantly engraved, surrounded by soft warm lighting',
    // ===== Dad =====
    'dad': 'Father proudly displaying personalized item, genuine smile of appreciation, showing the thoughtful customization made just for him',
    // ===== Partner =====
    'partner': 'Couple sharing intimate moment with personalized gift, romantic atmosphere, emphasizing the unique bond between them',
    // ===== Friend =====
    'friend': 'Best friend excitedly unwrapping personalized gift, genuine surprise and delight, celebrating their special friendship',
    // ===== Child =====
    'child': 'Child\'s face lighting up with wonder seeing their name on the personalized item, pure joy and excitement',
    // ===== Grandparent =====
    'grandparent': 'Grandparent cherishing personalized keepsake, emotional connection to family, treasured memory embodied in the gift',
  };
  
  // Default fallback scene
  return scenes[audience.toLowerCase()] 
    || `Person emotionally connecting with their personalized ${audience} gift, showing deep appreciation for the thoughtful customization`;
}

/**
 * Generate gifting scene based on holiday and audiences
 * Used for Image 4 (Real Gift-Giving Moment) scene setting
 * 
 * Priority logic:
 * - Has holiday: use holiday scene
 * - No holiday but has audience: use audience theme
 * - Custom holiday/audience: use user-provided content directly
 * - None: generic fallback
 * 
 * @param holidayHeadline - Holiday headline
 * @param selectedHolidays - Selected holiday list
 * @param selectedAudiences - Selected audience list
 * @param customHoliday - Custom holiday input
 * @param customAudience - Custom audience input
 * @returns English scene description
 */
function audienceLabelForCustom(selectedAudiences: string[], customAudience: string): string {
  if (selectedAudiences[0] === 'custom' && customAudience.trim()) {
    return customAudience.trim();
  }
  return selectedAudiences[0] || 'loved one';
}

function generateGiftingScene(
  holidayHeadline: string,
  selectedHolidays: string[],
  selectedAudiences: string[],
  customHoliday: string = '',
  customAudience: string = ''
): string {
  const hasCustomHoliday = selectedHolidays[0] === 'custom';
  const hasCustomAudience = selectedAudiences[0] === 'custom';

  // ===== Custom holiday / audience: use user-provided content directly =====
  if (hasCustomHoliday && customHoliday.trim()) {
    const audienceText = hasCustomAudience && customAudience.trim()
      ? customAudience.trim()
      : audienceLabelForCustom(selectedAudiences, customAudience);
    return `A real gift-giving moment celebrating ${customHoliday.trim()}, the recipient is ${audienceText}, authentic warm reaction, personalized product visibly being handed over or opened, environment and props appropriate to ${customHoliday.trim()}`;
  }
  if (hasCustomAudience && customAudience.trim()) {
    const holidayText = (selectedHolidays[0] && selectedHolidays[0] !== 'custom' && holidayHeadline)
      ? holidayHeadline.toLowerCase()
      : '';
    const leadIn = holidayText
      ? `A real gift-giving moment during ${holidayText}, the recipient is ${customAudience.trim()}`
      : `A real gift-giving moment, the recipient is ${customAudience.trim()}`;
    return `${leadIn}, genuine warm reaction, personalized product visibly being handed over or opened, real environment, two real people in a candid moment`;
  }

  const holiday = (selectedHolidays[0] || '').toLowerCase();
  const audience = (selectedAudiences[0] || '').toLowerCase();
  const audienceLabel = selectedAudiences[0] || 'loved one';

  // ===== Holiday scenes =====
  const holidayScenes: Record<string, string> = {
    'christmas': 'Beautiful Christmas morning scene with recipient unwrapping personalized gift under twinkling lights and festive decorations',
    'valentines_day': 'Romantic Valentine\'s setting with roses and candles, recipient receiving heartfelt personalized gift',
    'fathers_day': 'Father\'s Day celebration with family, dad opening his personalized gift with pride and appreciation',
    'mothers_day': 'Mother\'s Day brunch scene, mom touched by thoughtful personalized gift from her children',
    'birthday': 'Birthday celebration with balloons and cake, birthday person delighted by personalized surprise gift',
    'wedding': 'Wedding gift table scene or newlyweds exchanging personalized keepsakes, celebrating their union',
  };

  // ===== Audience scenes =====
  const audienceScenes: Record<string, string> = {
    'mom': 'Mother lovingly holding the personalized gift, warm heartfelt expression, cozy home setting, soft natural lighting',
    'dad': 'Father proudly receiving the personalized gift, genuine appreciative smile, thoughtful moment with family',
    'partner': 'Couple sharing intimate gifting moment with the personalized present, romantic warm atmosphere',
    'friend': 'Best friend excitedly receiving the personalized gift, genuine surprise and delight, joyful friendship moment',
    'child': 'Child holding the personalized gift, eyes lighting up with wonder, pure joy and excitement',
    'grandparent': 'Grandparent cherishing the personalized keepsake, emotional family connection, treasured memory',
    'men': 'A real man receiving the personalized gift from a real person, genuine warm reaction, masculine modern living room or workshop setting, natural confident expression, the gift moment feels authentic between two real people',
    'women': 'A real woman receiving the personalized gift from a real person, genuine warm reaction, elegant home or cafe setting, natural joyful expression, the gift moment feels authentic between two real people',
    'couple': 'A real couple exchanging the personalized gift, intimate candid moment, warm home setting, both showing genuine emotion',
    'kids': 'A real child receiving the personalized gift, eyes wide with wonder, colorful playful setting, pure innocent joy',
    'teens': 'A real teenager receiving the personalized gift, casual trendy bedroom or hangout setting, natural excited reaction',
    'elderly': 'A real elderly person receiving the personalized gift, gentle warm expression, comfortable home setting, sentimental moment',
  };

  // ===== Priority: holiday > audience > generic fallback =====
  if (holiday && holidayScenes[holiday]) {
    return holidayScenes[holiday];
  }
  if (audience && audienceScenes[audience]) {
    return audienceScenes[audience];
  }
  if (holidayHeadline) {
    return `${holidayHeadline} celebration, ${audienceLabel} receiving personalized gift with genuine surprise and joy`;
  }
  return `${audienceLabel} receiving personalized gift with genuine surprise and joy, warm celebratory atmosphere`;
}

/**
 * Generate lifestyle scene based on target audiences
 * Used for Image 6 (Lifestyle Display) scene setting
 * 
 * @param selectedAudiences - Target audience list (e.g. ["mom", "dad", "partner"])
 * @returns English scene description
 */
function generateLifestyleScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || 'user';
  
  // Lifestyle scenes for each audience
  const scenes: Record<string, string> = {
    // ===== Mom =====
    'mom': 'Busy mom enjoying quiet moment with her personalized item in cozy kitchen or living room, daily routine enhanced by personal touch',
    // ===== Dad =====
    'dad': 'Dad using his personalized item during weekend relaxation or hobby time, appreciating the thoughtful customization',
    // ===== Partner =====
    'partner': 'Couple\'s home with personalized items integrated into their shared space, romantic and cozy atmosphere',
    // ===== Friend =====
    'friend': 'Friends gathering with personalized gifts displayed proudly, celebrating their bond in casual setting',
    // ===== Child =====
    'child': 'Child\'s bedroom or play area with personalized items adding special touch to their personal space',
    // ===== Grandparent =====
    'grandparent': 'Grandparent\'s comfortable home with personalized keepsakes on display, surrounded by family photos',
  };
  
  // Default fallback scene
  return scenes[audience.toLowerCase()] || `Person enjoying their personalized item in everyday life, showing how customization adds meaning to daily moments`;
}

/**
 * Generate image blueprint based on user's 6-image framework
 * Defines all parameters for each image (type, goal, scene, camera angle, etc.)
 * 
 * @param index - Image number (1-6)
 * @param type - Image type (hero/customization/story/gifting/features/lifestyle)
 * @param analysis - Product analysis result
 * @param designBible - Design bible (colors, style, etc.)
 * @param holidayText - Holiday text content
 * @param preferences - User preferences
 * @returns Image blueprint object
 */
function generateImageBlueprint(
  index: number,
  type: string,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  holidayText: { headline: string; subheadline: string; cta: string },
  preferences: GeneratePromptsRequest['preferences']
): ImageBlueprint {
  const blueprints: Record<string, ImageBlueprint> = {
    
    // ============================================================
    // Image 1: Hero - White background product shot
    // ============================================================
    hero: {
      index: 1,
      type: '主图 - 白底展示',
      goal: '纯白背景展示产品全貌，突出定制区域细节，强调个性化特征',
      headline: analysis.product_name,
      subheadline: analysis.selling_points[0] || 'Premium Quality',
      scene: 'Pure white background RGB 255,255,255, product fills 85% of frame, centered with custom design clearly visible',
      camera: 'Front-facing 3/4 angle with extreme close-up on customization area showing intricate details',
      lighting: 'Soft diffused studio lighting with strategic spotlight on customization area',
      emotion: 'Luxurious exclusivity, premium craftsmanship, emphasizing bespoke personalization',
      composition: 'Product centered, visual hierarchy directing eye to personalized details',
      elements: ['Sharp focus on custom design details', 'Custom design as visual anchor'],
      text_content: { headline: '', subheadline: '' }
    },
    
    // ============================================================
    // Image 2: Customization process - Person holding product showing details
    // ============================================================
    customization: {
      index: 2,
      type: '定制流程展示',
      goal: '展示人物手持产品，展示定制流程和工艺',
      headline: 'Personalized Just for You',
      subheadline: 'Easy Customization Process',
      scene: `Person holding product with clear view of customizable area, showing how to add personalization like engraving or design. ${analysis.dimensions ? `Product dimensions: ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}. Person should hold it showing true size.` : ''}`,
      camera: 'Medium shot showing hands holding product with customization area highlighted',
      lighting: 'Clean studio lighting with focus on product details',
      emotion: 'Professional and informative, showcasing customization options clearly',
      composition: 'Product centered with accurate size representation, hands showing scale',
      elements: ['Person holding product at accurate scale', 'Customization area highlighted', 'Hand scale reference'],
      text_content: { headline: 'Easy to Customize', subheadline: 'Make It Yours' }
    },
    
    // ============================================================
    // Image 3: Emotional Story - Emphasizing "who it's for"
    // ============================================================
    story: {
      index: 3,
      type: '情感故事',
      goal: '讲述专属定制故事，强调"这是为谁定制的"以及背后的情感意义，突出独一无二的专属感',
      headline: 'Made for Someone Special',
      subheadline: 'One of a Kind',
      scene: generateStoryScene(preferences.selectedAudiences),
      camera: 'Professional product photography with artistic composition',
      lighting: 'Soft studio lighting with warm golden tones',
      emotion: 'Deeply personal connection, overwhelming joy, feeling of being uniquely seen and cherished',
      composition: 'Modern e-commerce layout with product as hero, elegant text elements arranged artfully',
      elements: ['Beautifully styled product', 'Elegant typography elements', 'Soft decorative flourishes', 'Emotional visual storytelling'],
      text_content: { headline: 'EXCLUSIVELY YOURS', subheadline: 'A Gift Made Just for You' }
    },
    
    // ============================================================
    // Image 4: Real gift-giving moment between two people
    // ============================================================
    gifting: {
      index: 4,
      type: '真实送礼瞬间',
      goal: '展示真实人物之间互相送礼的瞬间，突出收礼人看到定制内容的真实情感反应',
      headline: holidayText.headline,
      subheadline: holidayText.subheadline,
      scene: `A REAL gift-giving moment: ${generateGiftingScene(holidayText.headline, preferences.selectedHolidays, preferences.selectedAudiences, preferences.customHoliday, preferences.customAudience)}. The recipient showing authentic reaction (surprise, smile, laughter). Both people match the target audience (age, gender, role). DO NOT default to women; match gender/age explicitly. Product shown BARE / unwrapped, being handed from one person to another.`,
      camera: 'Natural candid photography, eye-level, both faces visible showing genuine emotion',
      lighting: 'Natural ambient lighting appropriate to scene setting',
      emotion: holidayText.headline
        ? `Genuine authentic gifting moment, ${holidayText.headline.toLowerCase()} warmth`
        : 'Genuine authentic gifting moment, warm celebratory feeling',
      composition: 'Candid two-person composition, product in center between them, real environment background',
      elements: [
        'Two real human subjects in candid moment',
        'Real environment (home, cafe, workshop)',
        'Personalized product handed or being opened',
        'Both subjects showing authentic emotional reaction'
      ],
      text_content: holidayText.headline
        ? { headline: `Celebrate with ${holidayText.headline}`, subheadline: 'An Exclusive Gift Made Just for You' }
        : { headline: 'A Gift Made Just for You', subheadline: 'Celebrate Every Moment' }
    },
    
    // ============================================================
    // Image 5: Product Features - Combined with customization elements
    // ============================================================
    features: {
      index: 5,
      type: '产品特点展示',
      goal: '展示4个核心产品特点，同时突出定制选项和个性化可能性',
      headline: 'Why You\'ll Love It',
      subheadline: 'Personalized Perfection',
      scene: 'Elegant styled composition featuring product with visible personalization, surrounded by 4 feature highlights: premium materials, artisanal craftsmanship, customization options, exceptional quality',
      camera: 'Artistic arrangement with product as centerpiece, each feature highlighted with visual cues',
      lighting: 'Studio lighting with dramatic shadows creating depth',
      emotion: 'Premium craftsmanship, endless personalization possibilities, desirable bespoke luxury',
      composition: 'Product as centerpiece, 4 feature highlights arranged artistically around it',
      elements: ['Product as centerpiece', 'Artistic feature presentation', 'Premium materials showcased'],
      text_content: { 
        headline: 'Personalized Quality', 
        subheadline: 'Unique • Custom • Yours' 
      }
    },
    
    // ============================================================
    // Image 6: Lifestyle Display - Emphasizing daily life meaning
    // ============================================================
    lifestyle: {
      index: 6,
      type: '生活方式展示',
      goal: '展示个性化产品在真实生活中的意义和使用场景，强调定制内容如何融入日常生活',
      headline: 'Part of Your Story',
      subheadline: 'Uniquely Yours',
      scene: `${generateLifestyleScene(preferences.selectedAudiences)}. ${analysis.dimensions ? `Product dimensions: ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}. Show product at TRUE SIZE.` : ''}`,
      camera: 'Professional lifestyle photography with artistic composition, product in use',
      lighting: 'Soft natural lighting with warm golden tones',
      emotion: 'Comforting familiarity with exclusive luxury touch, cherished daily ritual',
      composition: 'Modern e-commerce layout with personalized product in use, person interacting naturally',
      elements: ['Product in authentic use', 'Person naturally interacting with product', 'Elegant typography elements', 'Real lifestyle atmosphere'],
      text_content: { headline: 'YOURS ONLY', subheadline: 'A Piece That Tells Your Story' }
    },
  };

  return blueprints[type] || blueprints.hero;
}

/**
 * Generate the final image prompt
 * Integrates blueprint, product analysis, design bible into complete prompt
 * 
 * @param blueprint - Image blueprint object
 * @param analysis - Product analysis result
 * @param designBible - Design bible (colors, style, etc.)
 * @param preferences - User preferences
 * @returns Complete English prompt
 */
function generateImagePrompt(
  blueprint: ImageBlueprint,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  preferences: GeneratePromptsRequest['preferences']
): string {
  const palette = designBible.color_palette;
  
  // ===== Build dimensions info if available =====
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
  
  // ===== Build complete prompt =====
  const basePrompt = `Amazon listing product photography. ${analysis.product_name}. 

${GLOBAL_PHOTOGRAPHY_STANDARDS}

${GLOBAL_CUSTOMIZATION_PRESERVATION}

${GLOBAL_SIZE_CONSTRAINTS}

${GLOBAL_PACKAGING_PROHIBITIONS}

${GLOBAL_QUALITY_STANDARDS}

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

${GLOBAL_ECOMMERCE_TYPOGRAPHY}

ADDITIONAL REQUIREMENTS:
- Use EXACT colors from Design Bible palette
- Use EXACT font style specified`;

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
    // 注意：用户没选节日时，不要 fallback 到 recommended_holidays（可能含用户不想要的节日如 Christmas）
    const primaryHoliday = preferences.selectedHolidays[0] || 'default';
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
