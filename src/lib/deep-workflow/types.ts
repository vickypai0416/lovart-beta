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
  { 
    value: 'personalized_gift', 
    label: 'Personalized Gift', 
    description: '个性化礼品',
    impact: '刻字细节特写、定制元素展示、情感连接、专属感、纪念价值',
    bestFor: '刻字定制、照片定制、名字定制、纪念日礼品'
  },
  { 
    value: 'craftsman_workshop', 
    label: 'Craftsman Workshop', 
    description: '工匠工坊',
    impact: '制作过程展示、工具元素、原材料质感、匠心精神、专业技艺',
    bestFor: '手工皮具、木工定制、金属工艺、匠人产品'
  },
  { 
    value: 'vintage_personalized', 
    label: 'Vintage Personalized', 
    description: '复古个性化',
    impact: '复古色调、怀旧氛围、时光感、独特纹理、收藏感',
    bestFor: '复古风格定制、怀旧礼品、经典复刻、年代感产品'
  },
  { 
    value: 'modern_calligraphy', 
    label: 'Modern Calligraphy', 
    description: '现代书法',
    impact: '优雅字体、艺术排版、墨水质感、文化气息、精致细节',
    bestFor: '书法定制、文字艺术品、名片定制、婚礼纸品'
  },
  { 
    value: 'family_heirloom', 
    label: 'Family Heirloom', 
    description: '传家之宝',
    impact: '代际传承、情感价值、经典永恒、珍贵记忆、家族纽带',
    bestFor: '家族定制、传承礼品、纪念收藏、世代珍品'
  },
  { 
    value: 'corporate_custom', 
    label: 'Corporate Custom', 
    description: '企业定制',
    impact: '品牌元素、专业形象、商务质感、Logo展示、企业识别',
    bestFor: '企业礼品、品牌周边、商务定制、团队纪念品'
  },
  { 
    value: 'pet_personalized', 
    label: 'Pet Personalized', 
    description: '宠物个性化',
    impact: '可爱温馨、宠物元素、治愈氛围、趣味设计、情感陪伴',
    bestFor: '宠物定制、宠物肖像、宠物用品、爱宠纪念'
  },
  { 
    value: 'wedding_event', 
    label: 'Wedding & Event', 
    description: '婚礼活动',
    impact: '浪漫优雅、精致细节、仪式感、甜蜜氛围、难忘时刻',
    bestFor: '婚礼定制、派对用品、活动礼品、庆典装饰'
  },
  { 
    value: 'baby_kids_custom', 
    label: 'Baby & Kids Custom', 
    description: '婴童定制',
    impact: '柔软温馨、安全可爱、成长纪念、童趣设计、父母之爱',
    bestFor: '婴儿礼品、儿童定制、成长记录、亲子产品'
  },
  { 
    value: 'acrylic_glow', 
    label: 'Acrylic Glow', 
    description: '亚克力光影',
    impact: '通透质感、LED光效、现代科技感、边缘发光、精致雕刻',
    bestFor: '亚克力夜灯、桌牌、铭牌、亚克力砖、透明展示品'
  },
  { 
    value: 'wood_metal_fusion', 
    label: 'Wood & Metal Fusion', 
    description: '木金融合',
    impact: '材质对比、工业美学、温暖与冷峻、结构细节、现代工艺',
    bestFor: '铝合金框画、木质金属结合产品、双层木牌、雕刻木制品'
  },
  { 
    value: 'textile_pattern', 
    label: 'Textile Pattern', 
    description: '纺织品图案',
    impact: '面料纹理、全印图案、柔软质感、色彩鲜艳、舒适氛围',
    bestFor: '袜子、沙滩巾、毛毯、抱枕、旗帜、挂毯、服装'
  },
  { 
    value: 'ceramic_crystal', 
    label: 'Ceramic & Crystal', 
    description: '陶瓷水晶',
    impact: '光泽质感、精致细腻、易碎美感、纯净透明、高雅氛围',
    bestFor: '陶瓷挂饰、马克杯、水晶挂饰、岩板画、玻璃制品'
  },
  { 
    value: 'leather_craft', 
    label: 'Leather Craft', 
    description: '皮革工艺',
    impact: '皮革纹理、雕刻细节、复古质感、手工缝制、品质感',
    bestFor: '皮标产品、皮革钥匙托盘、洗漱包、皮带、宠物项圈'
  },
  { 
    value: 'home_decor_art', 
    label: 'Home Decor Art', 
    description: '家居艺术',
    impact: '装饰美感、空间搭配、艺术氛围、生活品味、温馨家居',
    bestFor: '帆布画、挂钟、地垫、挂毯、装饰画、家居摆件'
  },
  { 
    value: 'outdoor_adventure', 
    label: 'Outdoor Adventure', 
    description: '户外探险',
    impact: '自然光线、冒险精神、实用功能、耐用质感、自由氛围',
    bestFor: '野营刀、钓鱼装备、户外用品、运动装备、旅行用品'
  },
  { 
    value: 'fashion_accessory', 
    label: 'Fashion Accessory', 
    description: '时尚配饰',
    impact: '潮流元素、个性表达、搭配展示、细节特写、时尚氛围',
    bestFor: '帽子、眼镜、首饰、包袋、腰带、时尚配件'
  },
  { 
    value: 'drinkware_lifestyle', 
    label: 'Drinkware Lifestyle', 
    description: '饮品生活',
    impact: '生活场景、饮品搭配、质感光泽、日常使用、品质生活',
    bestFor: '保温杯、马克杯、竹盖杯、汽车杯、梅森杯、酒具'
  },
  { 
    value: 'sleepwear_comfort', 
    label: 'Sleepwear Comfort', 
    description: '睡衣舒适',
    impact: '柔软面料、舒适放松、居家氛围、温馨私密、放松感',
    bestFor: '睡衣套装、睡袍、睡裤、家居服、内衣'
  },
  { 
    value: 'holiday_festive', 
    label: 'Holiday Festive', 
    description: '节日喜庆',
    impact: '节日氛围、装饰元素、喜庆色彩、传统元素、庆祝感',
    bestFor: '圣诞袜、复活节篮子、节日装饰、礼品包装、季节性产品'
  },
  { 
    value: 'pet_lifestyle', 
    label: 'Pet Lifestyle', 
    description: '宠物生活',
    impact: '宠物互动、可爱温馨、实用功能、宠物视角、陪伴感',
    bestFor: '宠物用品、宠物服装、宠物配饰、宠物玩具、宠物纪念品'
  },
  { 
    value: 'automotive_style', 
    label: 'Automotive Style', 
    description: '汽车风格',
    impact: '金属质感、机械美学、速度感、硬朗线条、个性表达',
    bestFor: '车牌框、车牌、汽车用品、车载装饰、汽车配件'
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

// Custom color palette interface - simplified, only primary is required
export interface CustomColorPalette {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
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
