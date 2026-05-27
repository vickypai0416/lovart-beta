export * from './product-type-templates';
export * from './template-selector';
export * from './scene-mappings';
export * from './accurate-info';

import type { ProductCategory } from './product-type-templates';
import { getProductScenes, getScenePrompt, SceneConfig } from './scene-mappings';
import { getProductAccurateInfo, generateAccuratePrompt, ProductAccurateInfo } from './accurate-info';

export interface EnhancedProductInfo {
  productName: string;
  category: ProductCategory;
  scenes: {
    primary: SceneConfig[];
    secondary: SceneConfig[];
    seasonal: Record<string, SceneConfig[]>;
  };
  accurateInfo: ProductAccurateInfo | null;
  sizeGuide: string;
  materialGuide: string;
  featureGuide: string;
  careGuide: string;
}

export function getEnhancedProductInfo(productName: string): EnhancedProductInfo | null {
  const sceneMapping = getProductScenes(productName);
  const accurateInfo = getProductAccurateInfo(productName);
  
  if (!sceneMapping) {
    return null;
  }
  
  return {
    productName,
    category: sceneMapping.category,
    scenes: {
      primary: sceneMapping.primaryScenes,
      secondary: sceneMapping.secondaryScenes,
      seasonal: sceneMapping.seasonalScenes,
    },
    accurateInfo,
    sizeGuide: accurateInfo ? generateAccuratePrompt(accurateInfo, 'size') : '',
    materialGuide: accurateInfo ? generateAccuratePrompt(accurateInfo, 'material') : '',
    featureGuide: accurateInfo ? generateAccuratePrompt(accurateInfo, 'feature') : '',
    careGuide: accurateInfo ? generateAccuratePrompt(accurateInfo, 'care') : '',
  };
}

export function buildSceneContext(productName: string): string {
  const productInfo = getEnhancedProductInfo(productName);
  
  if (!productInfo) {
    return '';
  }
  
  let context = `【精准场景匹配 - ${productName}】\n\n`;
  
  context += '【主要使用场景】\n';
  productInfo.scenes.primary.forEach((scene, index) => {
    context += `${index + 1}. ${scene.scene}\n   - ${scene.description}\n   - 目标人群: ${scene.targetAudience}\n   - 情感诉求: ${scene.emotionalHook}\n   - 视觉元素: ${scene.visualElements.join(', ')}\n\n`;
  });
  
  context += '【次要使用场景】\n';
  productInfo.scenes.secondary.forEach((scene, index) => {
    context += `${index + 1}. ${scene.scene} - ${scene.description}\n`;
  });
  
  if (productInfo.accurateInfo) {
    context += '\n【准确产品信息】\n';
    context += `产品描述: ${productInfo.accurateInfo.accurateDescriptions.product}\n`;
    context += `\n【规格尺寸】\n${productInfo.sizeGuide}\n`;
    context += `\n【材质面料】\n${productInfo.materialGuide}\n`;
    context += `\n【产品特性】\n${productInfo.featureGuide}\n`;
    context += `\n【保养说明】\n${productInfo.careGuide}\n`;
    context += `\n【使用场景】\n${productInfo.accurateInfo.accurateDescriptions.usage}\n`;
    context += `\n【目标人群】\n${productInfo.accurateInfo.accurateDescriptions.targetAudience}\n`;
    context += `\n【适用场合】\n${productInfo.accurateInfo.accurateDescriptions.occasions.join(', ')}\n`;
  }
  
  return context;
}

export function generateScenePrompts(productName: string, count: number = 3): string[] {
  const productInfo = getEnhancedProductInfo(productName);
  
  if (!productInfo) {
    return [];
  }
  
  const scenes = [...productInfo.scenes.primary, ...productInfo.scenes.secondary].slice(0, count);
  
  return scenes.map(scene => getScenePrompt(scene, productName));
}

export function generateImagePrompt(
  productName: string,
  sceneType: 'primary' | 'secondary' | 'seasonal',
  season?: string
): string {
  const productInfo = getEnhancedProductInfo(productName);
  
  if (!productInfo) {
    return '';
  }
  
  let scenes: SceneConfig[] = [];
  
  if (sceneType === 'seasonal' && season && productInfo.scenes.seasonal[season]) {
    scenes = productInfo.scenes.seasonal[season];
  } else if (sceneType === 'primary') {
    scenes = productInfo.scenes.primary;
  } else {
    scenes = productInfo.scenes.secondary;
  }
  
  if (scenes.length === 0) {
    return '';
  }
  
  const scene = scenes[0];
  return getScenePrompt(scene, productName);
}

export type { 
  SceneConfig, 
  ProductAccurateInfo,
  ProductCategory 
};
