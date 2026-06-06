// Deep Workflow Types

export interface ProductAnalysis {
  product_name: string;
  product_type: string;
  material: string;
  customization_method: string;
  main_features: string[];
  selling_points: string[];
  target_audience: string[];
  recommended_occasions: string[];
  recommended_holidays: string[];
  estimated_price_range: string;
  gift_suitable: boolean;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
    diameter?: string;
    weight?: string;
    custom_size?: string;
  };
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontStyle {
  family: string;
  headline_weight: string;
  body_weight: string;
  style_description: string;
}

export interface DesignBible {
  visual_style: string;
  color_palette: ColorPalette;
  lighting_style: string;
  camera_style: string;
  headline_style: string;
  font_style: FontStyle;
  composition_style: string;
  emotion_style: string;
  product_presentation: string;
}

export interface CharacterBible {
  age_range: string;
  style: string;
  appearance: string;
  clothing: string;
  expression: string;
}

export interface SceneBible {
  setting: string;
  lighting: string;
  atmosphere: string;
  props: string[];
}

export interface CharacterSceneBible {
  characters: Record<string, CharacterBible>;
  scenes: Record<string, SceneBible>;
}

export interface StorylineImage {
  index: number;
  type: string;
  title: string;
  description: string;
  goal: string;
}

export interface Storyline {
  images: StorylineImage[];
  narrative_flow: string;
}

export interface ImageBlueprint {
  index: number;
  type: string;
  goal: string;
  headline: string;
  subheadline: string;
  scene: string;
  camera: string;
  lighting: string;
  emotion: string;
  composition: string;
  elements: string[];
  text_content: {
    headline: string;
    subheadline: string;
    body?: string;
  };
}

export interface ListingBlueprint {
  images: ImageBlueprint[];
}

export interface GeneratedPrompt {
  index: number;
  type: string;
  displayPrompt: string;
  prompt: string;
  purpose: string;
}

export interface DetailPageSection {
  section: string;
  prompt: string;
  description: string;
}

export interface DetailPageBlueprint {
  sections: DetailPageSection[];
}

export interface DeepWorkflowState {
  step: number;
  productImage: string | null;
  analysis: ProductAnalysis | null;
  userPreferences: {
    platform: string;
    selectedHolidays: string[];
    selectedAudiences: string[];
    visualStyle: string;
    colorScheme: string;
    customColors?: CustomColorPalette;
    emotion: string;
  };
  designBible: DesignBible | null;
  characterSceneBible: CharacterSceneBible | null;
  storyline: Storyline | null;
  listingBlueprint: ListingBlueprint | null;
  generatedPrompts: GeneratedPrompt[];
  detailPageBlueprint: DetailPageBlueprint | null;
}

// Platform options
export const PLATFORMS = [
  { value: 'amazon_us', label: 'Amazon US', description: '亚马逊美国站' },
  { value: 'amazon_uk', label: 'Amazon UK', description: '亚马逊英国站' },
  { value: 'amazon_de', label: 'Amazon DE', description: '亚马逊德国站' },
  { value: 'etsy', label: 'Etsy', description: 'Etsy手工艺品平台' },
  { value: 'shopify', label: 'Shopify', description: 'Shopify独立站' },
  { value: 'tiktok_shop', label: 'TikTok Shop', description: 'TikTok电商' },
];

// Holiday options
export const HOLIDAYS = [
  { value: 'fathers_day', label: "Father's Day", description: '父亲节' },
  { value: 'mothers_day', label: "Mother's Day", description: '母亲节' },
  { value: 'christmas', label: 'Christmas', description: '圣诞节' },
  { value: 'valentines_day', label: "Valentine's Day", description: '情人节' },
  { value: 'birthday', label: 'Birthday', description: '生日' },
  { value: 'wedding', label: 'Wedding', description: '婚礼' },
  { value: 'housewarming', label: 'Housewarming', description: '乔迁' },
  { value: 'memorial', label: 'Memorial', description: '纪念日' },
];

// Audience options
export const AUDIENCES = [
  { value: 'dad', label: 'Dad', description: '父亲' },
  { value: 'mom', label: 'Mom', description: '母亲' },
  { value: 'grandma', label: 'Grandma', description: '祖母' },
  { value: 'grandpa', label: 'Grandpa', description: '祖父' },
  { value: 'couple', label: 'Couple', description: '情侣' },
  { value: 'pet_owner', label: 'Pet Owner', description: '宠物主人' },
  { value: 'family', label: 'Family', description: '家庭' },
  { value: 'friend', label: 'Friend', description: '朋友' },
];

// Visual Style options with detailed explanations
export const VISUAL_STYLES = [
  { 
    value: 'modern_premium', 
    label: 'Modern Premium', 
    description: '现代高端',
    impact: '简洁线条、高品质感、专业灯光、中性色调、精致细节',
    bestFor: '电子产品、现代家居、商务礼品'
  },
  { 
    value: 'luxury_gift', 
    label: 'Luxury Gift', 
    description: '奢华礼品',
    impact: '金色点缀、丝绒质感、礼盒元素、高端氛围、精致包装',
    bestFor: '高端定制礼品、珠宝首饰、奢侈品'
  },
  { 
    value: 'minimalist', 
    label: 'Minimalist', 
    description: '极简主义',
    impact: '大量留白、单一焦点、纯净背景、简单构图、克制色彩',
    bestFor: '设计感强的产品、艺术品、现代装饰品'
  },
  { 
    value: 'rustic', 
    label: 'Rustic', 
    description: '乡村风格',
    impact: '木质纹理、自然光线、复古质感、手工感、温暖色调',
    bestFor: '木质产品、手工制品、复古风格商品'
  },
  { 
    value: 'farmhouse', 
    label: 'Farmhouse', 
    description: '农舍风格',
    impact: '舒适温馨、家庭感、柔和色彩、实用美学、亲切氛围',
    bestFor: '家居用品、厨房用品、家庭装饰品'
  },
  { 
    value: 'lifestyle_commercial', 
    label: 'Lifestyle Commercial', 
    description: '生活方式商业',
    impact: '真实场景、人物互动、自然光线、生活化、情感连接',
    bestFor: '日常用品、服装配饰、生活用品'
  },
  { 
    value: 'magazine_editorial', 
    label: 'Magazine Editorial', 
    description: '杂志编辑',
    impact: '时尚前卫、艺术构图、大胆配色、高级感、视觉冲击力',
    bestFor: '时尚产品、创意商品、艺术类产品'
  },
  { 
    value: 'etsy_handmade', 
    label: 'Etsy Handmade', 
    description: 'Etsy手工',
    impact: '手工质感、温暖光线、个性化、匠心细节、故事感',
    bestFor: '手工定制产品、个性化礼品、创意手作'
  },
];

// Color Scheme options
export const COLOR_SCHEMES = [
  { value: 'warm_beige', label: 'Warm Beige', description: '暖米色', colors: ['#F5F1E8', '#D4C4A8', '#8B7355'] },
  { value: 'natural_wood', label: 'Natural Wood', description: '原木色', colors: ['#DEB887', '#CD853F', '#8B4513'] },
  { value: 'luxury_black', label: 'Luxury Black', description: '奢华黑', colors: ['#1A1A1A', '#333333', '#C9A961'] },
  { value: 'christmas_red', label: 'Christmas Red', description: '圣诞红', colors: ['#B22222', '#228B22', '#FFFFFF'] },
  { value: 'dark_green', label: 'Dark Green', description: '深绿色', colors: ['#2F4F4F', '#3CB371', '#F0FFF0'] },
  { value: 'pastel_pink', label: 'Pastel Pink', description: '淡粉色', colors: ['#FFB6C1', '#FFC0CB', '#FFF0F5'] },
  { value: 'ocean_blue', label: 'Ocean Blue', description: '海洋蓝', colors: ['#4682B4', '#87CEEB', '#F0F8FF'] },
  { value: 'monochrome', label: 'Monochrome', description: '黑白灰', colors: ['#000000', '#808080', '#FFFFFF'] },
  { value: 'custom', label: 'Custom Colors', description: '自定义颜色', colors: [], isCustom: true },
];

// Custom color palette interface
export interface CustomColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// Emotion options with detailed explanations
export const EMOTIONS = [
  { 
    value: 'heartwarming', 
    label: 'Heartwarming', 
    description: '温馨感人',
    impact: '温暖光线、柔和色调、亲密互动、情感表达、幸福氛围',
    bestFor: '家庭礼品、亲情礼物、纪念日礼物'
  },
  { 
    value: 'elegant', 
    label: 'Elegant', 
    description: '优雅高贵',
    impact: '精致构图、高级质感、克制色彩、品味展现、典雅氛围',
    bestFor: '高端礼品、商务礼品、成熟受众'
  },
  { 
    value: 'romantic', 
    label: 'Romantic', 
    description: '浪漫',
    impact: '柔和光线、梦幻色调、亲密姿态、浪漫场景、甜蜜氛围',
    bestFor: '情人节礼物、情侣礼品、爱情主题'
  },
  { 
    value: 'family_bond', 
    label: 'Family Bond', 
    description: '家庭纽带',
    impact: '家庭场景、代际互动、温暖色调、亲情表达、团聚氛围',
    bestFor: '父母礼物、家庭礼品、亲情主题'
  },
  { 
    value: 'sentimental', 
    label: 'Sentimental', 
    description: ' sentimental',
    impact: '怀旧色调、情感深度、回忆元素、感动瞬间、珍藏感',
    bestFor: '纪念礼物、怀旧礼品、情感价值高的产品'
  },
  { 
    value: 'funny', 
    label: 'Funny', 
    description: '有趣',
    impact: '活泼色彩、轻松姿态、趣味元素、幽默氛围、愉悦感',
    bestFor: '趣味礼品、朋友礼物、轻松场合'
  },
  { 
    value: 'celebratory', 
    label: 'Celebratory', 
    description: '庆祝',
    impact: '明亮色彩、欢快氛围、庆祝元素、喜悦表达、节日感',
    bestFor: '生日礼物、节日礼品、庆祝场合'
  },
  { 
    value: 'cozy', 
    label: 'Cozy', 
    description: '舒适',
    impact: '温暖色调、舒适场景、放松姿态、居家感、惬意氛围',
    bestFor: '家居用品、放松类产品、日常礼品'
  },
];

// Storyline templates by product type
export const STORYLINE_TEMPLATES: Record<string, StorylineImage[]> = {
  default: [
    { index: 1, type: 'hero', title: 'Hero Shot', description: 'Main product image on clean background', goal: 'Grab attention, show product clearly' },
    { index: 2, type: 'feature', title: 'Key Feature', description: 'Highlight main selling point with text', goal: 'Communicate primary benefit' },
    { index: 3, type: 'detail', title: 'Detail Shot', description: 'Close-up of craftsmanship/material', goal: 'Show quality and craftsmanship' },
    { index: 4, type: 'lifestyle', title: 'Lifestyle', description: 'Product in real usage context', goal: 'Help customer envision using it' },
    { index: 5, type: 'gift', title: 'Gift Moment', description: 'Product as a perfect gift', goal: 'Emotional connection, gift appeal' },
    { index: 6, type: 'brand', title: 'Brand Closing', description: 'Brand message with product', goal: 'Seal the deal, brand recall' },
  ],
  personalized: [
    { index: 1, type: 'hero', title: 'Hero Product', description: 'Clean product shot showing base item', goal: 'Show the quality foundation' },
    { index: 2, type: 'customization', title: 'Customization Area', description: 'Highlight where personalization appears', goal: 'Show customization potential' },
    { index: 3, type: 'example', title: 'Personalized Example', description: 'Show an example of customized product', goal: 'Inspire customization ideas' },
    { index: 4, type: 'lifestyle', title: 'In Use', description: 'Personalized product in real context', goal: 'Emotional connection' },
    { index: 5, type: 'gift', title: 'Perfect Gift', description: 'Product as meaningful personalized gift', goal: 'Gift appeal, sentiment' },
    { index: 6, type: 'brand', title: 'Made for Them', description: 'Closing image with brand message', goal: 'Unique, personal, memorable' },
  ],
};
