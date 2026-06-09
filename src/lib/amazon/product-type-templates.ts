// 产品类型定义
export type ProductCategory = 
  | 'home-decor'        // 家居装饰
  | 'apparel'           // 服装服饰
  | 'bags-accessories'  // 箱包配饰
  | 'kitchen-dining'    // 餐饮器具
  | 'outdoor-tools';    // 户外工具

// 产品名称到类别的映射
export const productCategoryMap: Record<string, ProductCategory> = {
  // 家居装饰类
  '毛毯': 'home-decor',
  '无框帆布画': 'home-decor',
  '亚克力夜灯': 'home-decor',
  '有框帆布画': 'home-decor',
  '铁艺': 'home-decor',
  '毛绒方形抱枕套含芯': 'home-decor',
  '圆形水晶挂饰': 'home-decor',
  '圆形家庭树夜灯': 'home-decor',
  '花影盒': 'home-decor',
  '木质画': 'home-decor',
  
  // 服装服饰类
  '刺绣服装': 'apparel',
  '古巴领睡衣套装长款': 'apparel',
  '印花服装': 'apparel',
  '牛奶丝宽松睡裤': 'apparel',
  '古巴领衬衫': 'apparel',
  '古巴领睡衣套装短款': 'apparel',
  '涤纶全印棒球帽': 'apparel',
  
  // 箱包配饰类
  '带袋沙滩巾': 'bags-accessories',
  '烫画帆布书包': 'bags-accessories',
  '亚克力夜灯桌牌': 'bags-accessories',
  '男士皮革手拿洗漱包(单开)': 'bags-accessories',
  '男士皮革手拿洗漱包': 'bags-accessories',
  '透明书包': 'bags-accessories',
  '亚克力砖桌面铭牌': 'bags-accessories',
  
  // 餐饮器具类
  '陶瓷马克杯内彩': 'kitchen-dining',
  '40oz手提保温杯': 'kitchen-dining',
  '菜板': 'kitchen-dining',
  
  // 户外工具类
  '野营刀': 'outdoor-tools',
};

// 单张图片模板接口
export interface ImageTemplate {
  index: number;
  title: string;
  subtitle: string;
  purpose: string;
  promptTemplate: string;
}

// 产品类别模板接口
export interface ProductCategoryTemplate {
  category: ProductCategory;
  name: string;
  description: string;
  keyFeatures: string[];
  colorScheme: string;
  fontStyle: string;
  imageTemplates: ImageTemplate[];
}

// 家居装饰类模板
const homeDecorTemplate: ProductCategoryTemplate = {
  category: 'home-decor',
  name: '家居装饰',
  description: '适合装饰画、夜灯、毛毯、抱枕等家居装饰产品',
  keyFeatures: ['装饰性', '定制图案', '氛围营造', '材质质感'],
  colorScheme: 'warm beige, soft tones',
  fontStyle: 'elegant serif',
  imageTemplates: [
    {
      index: 1,
      title: '{PRODUCT_NAME}',
      subtitle: '{PRODUCT_KEYWORD}',
      purpose: '主图吸引点击',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME}, {MATERIAL}, clean white background (RGB 255,255,255), centered composition, soft studio lighting, high-end minimalist style, product-centric, NO TEXT OVERLAY, pure product image, Amazon main image style'
    },
    {
      index: 2,
      title: 'Customized Just for You',
      subtitle: 'Personalized Design',
      purpose: '展示定制能力',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} with custom text/photo design, hands gently holding product, warm natural lighting, soft beige background texture, product-centric composition, clear customization area, elegant serif font text overlay at top: title "Customized Just for You" 26pt bold black, subtitle "Personalized Design" 14pt regular black'
    },
    {
      index: 3,
      title: 'Perfect for Your Space',
      subtitle: 'Home Decor',
      purpose: '展示使用场景',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in cozy home setting, realistic lifestyle scene, warm natural lighting, living room background, product as focal point, inviting atmosphere, elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect for Your Space" 24pt bold white, subtitle "Home Decor" 14pt regular white'
    },
    {
      index: 4,
      title: 'Choose Your Size',
      subtitle: 'Multiple Options',
      purpose: '展示尺寸选择',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} size comparison, {SIZE_OPTION1} {SIZE_OPTION2} {SIZE_OPTION3}, dimension labels below product, clean background, even lighting, informative presentation, elegant serif font text overlay at top: title "Choose Your Size" 26pt bold black, subtitle "Multiple Options" 14pt regular black'
    },
    {
      index: 5,
      title: 'Beautiful Details',
      subtitle: 'Crafted with Care',
      purpose: '展示工艺细节',
      promptTemplate: 'Professional Amazon listing product photo, close-up detail of {PRODUCT_NAME}, {MATERIAL} texture, fine craftsmanship, soft lighting, clean background, intricate details visible, elegant serif font text overlay at top with semi-transparent dark background bar: title "Beautiful Details" 24pt bold white, subtitle "Crafted with Care" 14pt regular white'
    },
    {
      index: 6,
      title: 'Premium Features',
      subtitle: 'Quality You Can Trust',
      purpose: '展示产品特性',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} feature showcase, {FEATURE_1}, {FEATURE_2}, {FEATURE_3}, {FEATURE_4}, product on left with feature icons on right, clean layout, soft lighting, premium quality presentation, elegant serif font text overlay at top: title "Premium Features" 26pt bold black, subtitle "Quality You Can Trust" 14pt regular black'
    },
    {
      index: 7,
      title: 'Versatile Use',
      subtitle: 'Multi Occasion',
      purpose: '多场景展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} 4-grid multi-use collage, scenes include living room, bedroom, office, and special occasion, consistent warm lighting style, product visible in each scene, versatile functionality showcase, elegant serif font text overlay at top center with semi-transparent dark background bar: title "Versatile Use" 26pt bold white, subtitle "Multi Occasion" 14pt regular white'
    },
    {
      index: 8,
      title: 'Easy to Install',
      subtitle: 'Ready to Display',
      purpose: '展示安装方式',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} installation details, mounting hardware visible, easy setup demonstration, clean background, soft lighting, informative presentation, elegant serif font text overlay at top: title "Easy to Install" 26pt bold black, subtitle "Ready to Display" 14pt regular black'
    },
    {
      index: 9,
      title: 'Perfect {HOLIDAY} Gift',
      subtitle: 'Made in USA',
      purpose: '情感收尾',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} {HOLIDAY} gift presentation, warm festive atmosphere, holiday decorations, emotional heartfelt design, soft lighting, "Made in USA" badge in bottom right corner (not on product), American flag subtle texture background, elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect {HOLIDAY} Gift" 26pt bold white, subtitle "Made in USA" 14pt regular white'
    }
  ]
};

// 服装服饰类模板
const apparelTemplate: ProductCategoryTemplate = {
  category: 'apparel',
  name: '服装服饰',
  description: '适合衬衫、睡衣、T恤、帽子等服装产品',
  keyFeatures: ['穿着效果', '材质舒适', '个性化设计', '版型展示'],
  colorScheme: 'neutral tones, fashion colors',
  fontStyle: 'modern sans-serif',
  imageTemplates: [
    {
      index: 1,
      title: '{PRODUCT_NAME}',
      subtitle: '{PRODUCT_KEYWORD}',
      purpose: '主图吸引点击',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME}, flat lay or mannequin display, clean white background (RGB 255,255,255), soft studio lighting, high-end fashion photography style, product-centric, NO TEXT OVERLAY, pure product image, Amazon main image style'
    },
    {
      index: 2,
      title: 'Stylish & Comfortable',
      subtitle: 'Real Model Wearing',
      purpose: '模特上身效果',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} worn by model, natural pose, {USE_SCENE} setting, flattering lighting, fashion photography style, product-centric composition, elegant serif font text overlay at top with semi-transparent dark background bar: title "Stylish & Comfortable" 26pt bold white, subtitle "Real Model Wearing" 14pt regular white'
    },
    {
      index: 3,
      title: 'Beautiful Details',
      subtitle: 'Premium Craftsmanship',
      purpose: '细节特写',
      promptTemplate: 'Professional Amazon listing product photo, close-up detail of {PRODUCT_NAME}, {MATERIAL} texture, embroidery/print details, soft lighting, clean background, intricate details visible, elegant serif font text overlay at top with semi-transparent dark background bar: title "Beautiful Details" 24pt bold white, subtitle "Premium Craftsmanship" 14pt regular white'
    },
    {
      index: 4,
      title: 'Size Guide',
      subtitle: 'Perfect Fit',
      purpose: '尺寸对照',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} size chart, size labels {SIZE_OPTION1} {SIZE_OPTION2} {SIZE_OPTION3}, model wearing different sizes for comparison, clean layout, informative presentation, elegant serif font text overlay at top: title "Size Guide" 26pt bold black, subtitle "Perfect Fit" 14pt regular black'
    },
    {
      index: 5,
      title: 'Style It Your Way',
      subtitle: 'Mix & Match',
      purpose: '搭配展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} styled with complementary items, {USE_SCENE} outfit inspiration, fashion photography, warm lighting, product-centric composition, elegant serif font text overlay at top with semi-transparent dark background bar: title "Style It Your Way" 26pt bold white, subtitle "Mix & Match" 14pt regular white'
    },
    {
      index: 6,
      title: 'Premium Quality',
      subtitle: 'Soft & Durable',
      purpose: '材质特性',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} material showcase, {FEATURE_1}, {FEATURE_2}, {FEATURE_3}, {FEATURE_4}, fabric swatches and product together, clean background, soft lighting, elegant serif font text overlay at top: title "Premium Quality" 26pt bold black, subtitle "Soft & Durable" 14pt regular black'
    },
    {
      index: 7,
      title: 'Multiple Colors',
      subtitle: 'Choose Yours',
      purpose: '多色展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} color options, multiple color variations side by side, clean white background, even lighting, color labels below each, elegant serif font text overlay at top: title "Multiple Colors" 26pt bold black, subtitle "Choose Yours" 14pt regular black'
    },
    {
      index: 8,
      title: 'Gift Ready',
      subtitle: 'Beautifully Packaged',
      purpose: '包装展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in elegant gift packaging, premium presentation, gift box and ribbon, soft lighting, product-centric composition, elegant serif font text overlay at top with semi-transparent dark background bar: title "Gift Ready" 26pt bold white, subtitle "Beautifully Packaged" 14pt regular white'
    },
    {
      index: 9,
      title: 'Perfect {HOLIDAY} Outfit',
      subtitle: 'Stylish & Festive',
      purpose: '情感收尾',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} {HOLIDAY} styling, festive atmosphere, holiday decorations in background, model wearing product, soft warm lighting, elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect {HOLIDAY} Outfit" 26pt bold white, subtitle "Stylish & Festive" 14pt regular white'
    }
  ]
};

// 箱包配饰类模板
const bagsAccessoriesTemplate: ProductCategoryTemplate = {
  category: 'bags-accessories',
  name: '箱包配饰',
  description: '适合书包、洗漱包、沙滩巾等配饰产品',
  keyFeatures: ['实用性', '容量展示', '时尚设计', '便携性'],
  colorScheme: 'modern colors, versatile tones',
  fontStyle: 'clean sans-serif',
  imageTemplates: [
    {
      index: 1,
      title: '{PRODUCT_NAME}',
      subtitle: '{PRODUCT_KEYWORD}',
      purpose: '主图吸引点击',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME}, {MATERIAL}, clean white background (RGB 255,255,255), centered composition, soft studio lighting, high-end minimalist style, product-centric, NO TEXT OVERLAY, pure product image, Amazon main image style'
    },
    {
      index: 2,
      title: 'Spacious & Organized',
      subtitle: 'Ample Storage',
      purpose: '容量展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} open showing interior, compartments and pockets visible, items inside to demonstrate capacity, clean background, soft lighting, product-centric composition, elegant serif font text overlay at top: title "Spacious & Organized" 26pt bold black, subtitle "Ample Storage" 14pt regular black'
    },
    {
      index: 3,
      title: 'Perfect for {USE_SCENE}',
      subtitle: 'On the Go',
      purpose: '使用场景',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in {USE_SCENE} setting, person using or carrying product, realistic lifestyle scene, warm natural lighting, inviting atmosphere, elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect for {USE_SCENE}" 24pt bold white, subtitle "On the Go" 14pt regular white'
    },
    {
      index: 4,
      title: 'Premium Craftsmanship',
      subtitle: 'Built to Last',
      purpose: '细节特写',
      promptTemplate: 'Professional Amazon listing product photo, close-up detail of {PRODUCT_NAME}, {MATERIAL} texture, zippers and hardware details, soft lighting, clean background, intricate details visible, elegant serif font text overlay at top with semi-transparent dark background bar: title "Premium Craftsmanship" 24pt bold white, subtitle "Built to Last" 14pt regular white'
    },
    {
      index: 5,
      title: 'Perfect Size',
      subtitle: 'Dimensions',
      purpose: '尺寸对比',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} size comparison with common items, dimension labels, clean background, even lighting, informative presentation, elegant serif font text overlay at top: title "Perfect Size" 26pt bold black, subtitle "Dimensions" 14pt regular black'
    },
    {
      index: 6,
      title: 'Multiple Options',
      subtitle: 'Colors & Styles',
      purpose: '多色/款式',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} color/style options, multiple variations side by side, clean white background, even lighting, labels below each, elegant serif font text overlay at top: title "Multiple Options" 26pt bold black, subtitle "Colors & Styles" 14pt regular black'
    },
    {
      index: 7,
      title: 'Smart Features',
      subtitle: 'Functional Design',
      purpose: '功能展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} feature showcase, {FEATURE_1}, {FEATURE_2}, {FEATURE_3}, {FEATURE_4}, product with feature highlights, clean layout, soft lighting, elegant serif font text overlay at top: title "Smart Features" 26pt bold black, subtitle "Functional Design" 14pt regular black'
    },
    {
      index: 8,
      title: 'Easy to Carry',
      subtitle: 'Comfortable',
      purpose: '携带方式',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} being carried, comfortable straps/handles highlighted, person holding or wearing product, realistic lifestyle scene, warm lighting, elegant serif font text overlay at top with semi-transparent dark background bar: title "Easy to Carry" 26pt bold white, subtitle "Comfortable" 14pt regular white'
    },
    {
      index: 9,
      title: 'Perfect Travel Companion',
      subtitle: 'Made in USA',
      purpose: '情感收尾',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} travel scene, luggage and travel accessories around, adventure atmosphere, warm lighting, "Made in USA" badge in bottom right corner (not on product), elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect Travel Companion" 26pt bold white, subtitle "Made in USA" 14pt regular white'
    }
  ]
};

// 餐饮器具类模板
const kitchenDiningTemplate: ProductCategoryTemplate = {
  category: 'kitchen-dining',
  name: '餐饮器具',
  description: '适合马克杯、保温杯、菜板等厨房用品',
  keyFeatures: ['容量', '材质安全', '保温效果', '使用场景'],
  colorScheme: 'clean white, warm accents',
  fontStyle: 'clean sans-serif',
  imageTemplates: [
    {
      index: 1,
      title: '{PRODUCT_NAME}',
      subtitle: '{PRODUCT_KEYWORD}',
      purpose: '主图吸引点击',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME}, {MATERIAL}, clean white background (RGB 255,255,255), centered composition, soft studio lighting, high-end minimalist style, product-centric, NO TEXT OVERLAY, pure product image, Amazon main image style'
    },
    {
      index: 2,
      title: 'Generous Capacity',
      subtitle: '{CAPACITY}',
      purpose: '容量展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} with liquid inside, capacity measurement visible, clear liquid showing volume, clean background, soft lighting, product-centric composition, elegant serif font text overlay at top: title "Generous Capacity" 26pt bold black, subtitle "{CAPACITY}" 14pt regular black'
    },
    {
      index: 3,
      title: 'Perfect for {USE_SCENE}',
      subtitle: 'Daily Use',
      purpose: '使用场景',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in {USE_SCENE} setting, morning coffee/tea scene, realistic lifestyle, warm natural lighting, inviting atmosphere, elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect for {USE_SCENE}" 24pt bold white, subtitle "Daily Use" 14pt regular white'
    },
    {
      index: 4,
      title: 'Food Safe Materials',
      subtitle: 'BPA Free',
      purpose: '材质特性',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} material showcase, {FEATURE_1}, {FEATURE_2}, {FEATURE_3}, {FEATURE_4}, food-safe certification badges, clean background, soft lighting, elegant serif font text overlay at top: title "Food Safe Materials" 26pt bold black, subtitle "BPA Free" 14pt regular black'
    },
    {
      index: 5,
      title: 'Quality Craftsmanship',
      subtitle: 'Durable Design',
      purpose: '细节特写',
      promptTemplate: 'Professional Amazon listing product photo, close-up detail of {PRODUCT_NAME}, {MATERIAL} texture, inner coating details, soft lighting, clean background, intricate details visible, elegant serif font text overlay at top with semi-transparent dark background bar: title "Quality Craftsmanship" 24pt bold white, subtitle "Durable Design" 14pt regular black'
    },
    {
      index: 6,
      title: 'Multiple Colors',
      subtitle: 'Choose Yours',
      purpose: '多色展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} color options, multiple color variations side by side, clean white background, even lighting, color labels below each, elegant serif font text overlay at top: title "Multiple Colors" 26pt bold black, subtitle "Choose Yours" 14pt regular black'
    },
    {
      index: 7,
      title: 'Easy to Clean',
      subtitle: 'Dishwasher Safe',
      purpose: '清洁保养',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in dishwasher or being cleaned, easy maintenance demonstration, clean background, soft lighting, elegant serif font text overlay at top: title "Easy to Clean" 26pt bold black, subtitle "Dishwasher Safe" 14pt regular black'
    },
    {
      index: 8,
      title: 'Customizable',
      subtitle: 'Personalize It',
      purpose: '定制展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} with custom text/photo design, personalized message visible, hands holding product, warm natural lighting, soft background texture, elegant serif font text overlay at top: title "Customizable" 26pt bold black, subtitle "Personalize It" 14pt regular black'
    },
    {
      index: 9,
      title: 'Perfect {HOLIDAY} Gift',
      subtitle: 'Made in USA',
      purpose: '情感收尾',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} {HOLIDAY} gift presentation, warm festive atmosphere, holiday decorations, steaming beverage inside, "Made in USA" badge in bottom right corner (not on product), elegant serif font text overlay at top with semi-transparent dark background bar: title "Perfect {HOLIDAY} Gift" 26pt bold white, subtitle "Made in USA" 14pt regular white'
    }
  ]
};

// 户外工具类模板
const outdoorToolsTemplate: ProductCategoryTemplate = {
  category: 'outdoor-tools',
  name: '户外工具',
  description: '适合野营刀等户外工具产品',
  keyFeatures: ['功能性', '材质耐用', '安全特性', '便携设计'],
  colorScheme: 'earth tones, rugged colors',
  fontStyle: 'bold sans-serif',
  imageTemplates: [
    {
      index: 1,
      title: '{PRODUCT_NAME}',
      subtitle: '{PRODUCT_KEYWORD}',
      purpose: '主图吸引点击',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME}, {MATERIAL}, clean white background (RGB 255,255,255), centered composition, soft studio lighting, high-end tactical style, product-centric, NO TEXT OVERLAY, pure product image, Amazon main image style'
    },
    {
      index: 2,
      title: 'Premium Steel',
      subtitle: 'Sharp & Durable',
      purpose: '刀刃细节',
      promptTemplate: 'Professional Amazon listing product photo, close-up of {PRODUCT_NAME} blade, sharp edge visible, steel texture, soft lighting highlighting metal, clean background, product-centric composition, elegant serif font text overlay at top with semi-transparent dark background bar: title "Premium Steel" 26pt bold white, subtitle "Sharp & Durable" 14pt regular white'
    },
    {
      index: 3,
      title: 'Ready for Adventure',
      subtitle: 'Camping Essential',
      purpose: '使用场景',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in outdoor camping scene, tent and campfire in background, rugged environment, warm natural lighting, adventure atmosphere, elegant serif font text overlay at top with semi-transparent dark background bar: title "Ready for Adventure" 26pt bold white, subtitle "Camping Essential" 14pt regular white'
    },
    {
      index: 4,
      title: 'Premium Materials',
      subtitle: 'Built to Last',
      purpose: '材质工艺',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} material showcase, {FEATURE_1}, {FEATURE_2}, {FEATURE_3}, {FEATURE_4}, steel type and heat treatment info, clean background, soft lighting, elegant serif font text overlay at top: title "Premium Materials" 26pt bold black, subtitle "Built to Last" 14pt regular black'
    },
    {
      index: 5,
      title: 'Ergonomic Handle',
      subtitle: 'Comfort Grip',
      purpose: '手柄设计',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} handle detail, ergonomic design visible, grip texture, hand holding product demonstrating comfort, soft lighting, clean background, elegant serif font text overlay at top with semi-transparent dark background bar: title "Ergonomic Handle" 26pt bold white, subtitle "Comfort Grip" 14pt regular white'
    },
    {
      index: 6,
      title: 'Secure Carry',
      subtitle: 'Sheath Included',
      purpose: '收纳携带',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} with sheath, secure locking mechanism, belt clip visible, clean background, soft lighting, product-centric composition, elegant serif font text overlay at top: title "Secure Carry" 26pt bold black, subtitle "Sheath Included" 14pt regular black'
    },
    {
      index: 7,
      title: 'Multi-Functional',
      subtitle: 'Versatile Tool',
      purpose: '功能展示',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} in use, cutting wood or preparing food, outdoor activity, realistic action shot, warm lighting, elegant serif font text overlay at top with semi-transparent dark background bar: title "Multi-Functional" 26pt bold white, subtitle "Versatile Tool" 14pt regular white'
    },
    {
      index: 8,
      title: 'Safety First',
      subtitle: 'Locking Mechanism',
      purpose: '安全特性',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} safety features, locking mechanism highlighted, safe storage demonstration, clean background, soft lighting, elegant serif font text overlay at top: title "Safety First" 26pt bold black, subtitle "Locking Mechanism" 14pt regular black'
    },
    {
      index: 9,
      title: 'American Quality',
      subtitle: 'Lifetime Warranty',
      purpose: '品质保证',
      promptTemplate: 'Professional Amazon listing product photo, {PRODUCT_NAME} with American flag background, "Made in USA" badge prominently displayed, premium quality presentation, warm lighting, elegant serif font text overlay at top: title "American Quality" 26pt bold white, subtitle "Lifetime Warranty" 14pt regular white'
    }
  ]
};

// 产品模板映射
export const productTemplates: Record<ProductCategory, ProductCategoryTemplate> = {
  'home-decor': homeDecorTemplate,
  'apparel': apparelTemplate,
  'bags-accessories': bagsAccessoriesTemplate,
  'kitchen-dining': kitchenDiningTemplate,
  'outdoor-tools': outdoorToolsTemplate,
};

// 获取产品类别的函数
export function getProductCategory(productName: string): ProductCategory {
  return productCategoryMap[productName] || 'home-decor';
}

// 获取产品模板的函数
export function getProductTemplate(productName: string): ProductCategoryTemplate {
  const category = getProductCategory(productName);
  return productTemplates[category];
}

// 生成提示词的函数
export function generatePrompts(
  template: ProductCategoryTemplate,
  params: Record<string, string>
): string[] {
  return template.imageTemplates.map(img => {
    let prompt = img.promptTemplate;
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{${key.toUpperCase()}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });
    return prompt;
  });
}
