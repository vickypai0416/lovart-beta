import type { ProductCategory, ProductCategoryTemplate } from './product-type-templates';
import { productTemplates, getProductCategory, productCategoryMap } from './product-type-templates';

export { ProductCategory, ProductCategoryTemplate };

export interface ProductRecognitionResult {
  category: ProductCategory;
  template: ProductCategoryTemplate;
  matchedBy: 'productName' | 'imageAnalysis' | 'default';
  confidence: number;
}

export const categoryDescriptions: Record<ProductCategory, string> = {
  'home-decor': '家居装饰',
  'apparel': '服装服饰',
  'bags-accessories': '箱包配饰',
  'kitchen-dining': '餐饮器具',
  'outdoor-tools': '户外工具',
};

export const allProductNames: string[] = Object.keys(productCategoryMap);

export function recognizeProductByName(productName: string): ProductRecognitionResult {
  const normalizedName = productName.trim().toLowerCase();
  
  for (const [name, category] of Object.entries(productCategoryMap)) {
    if (normalizedName.includes(name.toLowerCase()) || name.toLowerCase().includes(normalizedName)) {
      return {
        category,
        template: productTemplates[category],
        matchedBy: 'productName',
        confidence: 1.0,
      };
    }
  }
  
  return {
    category: 'home-decor',
    template: productTemplates['home-decor'],
    matchedBy: 'default',
    confidence: 0.3,
  };
}

export function selectTemplateForProduct(productName: string): ProductCategoryTemplate {
  const result = recognizeProductByName(productName);
  return result.template;
}

export function getCategoryDisplayName(category: ProductCategory): string {
  return categoryDescriptions[category] || '通用';
}

export function buildTemplateContext(template: ProductCategoryTemplate): string {
  return `
【产品类别】${template.name}
【类别描述】${template.description}
【核心卖点】${template.keyFeatures.join('、')}
【配色方案】${template.colorScheme}
【字体风格】${template.fontStyle}

【9图方案模板】：
${template.imageTemplates.map(img => 
  `Image ${img.index} - ${img.title}
  副标题：${img.subtitle}
  用途：${img.purpose}
  提示词模板：${img.promptTemplate}`
).join('\n\n')}
`;
}

export function enhanceSystemPromptWithTemplate(
  basePrompt: string,
  productName: string
): string {
  const template = selectTemplateForProduct(productName);
  const templateContext = buildTemplateContext(template);
  
  const insertionPoint = basePrompt.indexOf('【参考成功套图模式】');
  
  if (insertionPoint === -1) {
    return basePrompt + '\n\n' + templateContext;
  }
  
  return basePrompt.slice(0, insertionPoint) + 
    '【产品类型适配模板】\n' + templateContext + '\n\n' + 
    basePrompt.slice(insertionPoint);
}

export function getPromptPlaceholders(): string[] {
  return [
    '{PRODUCT_NAME}',
    '{PRODUCT_KEYWORD}',
    '{MATERIAL}',
    '{USE_SCENE}',
    '{TARGET_USER}',
    '{HOLIDAY}',
    '{COLOR_SCHEME}',
    '{SIZE_OPTION1}',
    '{SIZE_OPTION2}',
    '{SIZE_OPTION3}',
    '{FEATURE_1}',
    '{FEATURE_2}',
    '{FEATURE_3}',
    '{FEATURE_4}',
    '{CAPACITY}',
    '{CATEGORY}',
  ];
}

export function validatePlaceholders(prompt: string): { valid: boolean; missing: string[] } {
  const placeholders = getPromptPlaceholders();
  const missing = placeholders.filter(p => prompt.includes(p));
  return {
    valid: missing.length === 0,
    missing,
  };
}
