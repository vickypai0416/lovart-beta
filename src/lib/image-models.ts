/**
 * AI 模型配置
 */

export type ModelType = 'image' | 'text';

export type ImageModel = 'openai-dalle' | 'gpt-4o-image' | 'gpt-image-2' | 'gpt-image-2-gen' | 'gpt-image-2-edit' | 'gpt-image-2-all' | 'gpt-5-nano' | 'gpt-5.4';

export interface ImageModelConfig {
  id: ImageModel;
  name: string;
  description: string;
  type: ModelType; // 图片生成 or 文本生成
  available: boolean;
  apiKey?: string;
  endpoint?: string;
  modelName?: string;
}

export const IMAGE_MODELS: Record<ImageModel, ImageModelConfig> = {
  // 图片生成模型
  'openai-dalle': {
    id: 'openai-dalle',
    name: 'DALL-E 3',
    description: 'OpenAI 图片生成模型，细节丰富',
    type: 'image',
    available: false,
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  'gpt-4o-image': {
    id: 'gpt-4o-image',
    name: 'GPT-4o Image',
    description: '支持图文生图，可美化、添加文字、调整尺寸',
    type: 'image',
    available: false,
    apiKey: process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/chat/completions',
    modelName: 'gpt-image-2',
  },
  'gpt-image-2': {
    id: 'gpt-image-2',
    name: 'GPT Image 2 (对话生图+图片识别)',
    description: '对话生图+图片识别，支持图文输入和文本/图片输出',
    type: 'image',
    available: false,
    apiKey: process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/chat/completions',
    modelName: 'gpt-image-2-all',
  },
  'gpt-image-2-gen': {
    id: 'gpt-image-2-gen',
    name: 'GPT Image 2 (生成)',
    description: '纯文本生图，支持多种尺寸和画质',
    type: 'image',
    available: false,
    apiKey: process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/images/generations',
    modelName: 'gpt-image-2',
  },
  'gpt-image-2-edit': {
    id: 'gpt-image-2-edit',
    name: 'GPT Image 2 (编辑)',
    description: '图片编辑，支持美化、合并多张图片，使用 multipart/form-data',
    type: 'image',
    available: false,
    apiKey: process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/images/edits',
    modelName: 'gpt-image-2-all',
  },
  'gpt-image-2-all': {
    id: 'gpt-image-2-all',
    name: 'GPT Image 2 All',
    description: 'GPT Image 2 全功能版，支持生成+编辑',
    type: 'image',
    available: false,
    apiKey: process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/images/edits',
    modelName: 'gpt-image-2-all',
  },
  // 文本生成模型
  'gpt-5-nano': {
    id: 'gpt-5-nano',
    name: 'GPT-5.4 nano',
    description: '轻量模型，支持对话和图片识别',
    type: 'text',
    available: false,
    apiKey: process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/chat/completions',
    modelName: 'gpt-5.4-nano',
  },
  'gpt-5.4': {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    description: '旗舰模型，更强的推理能力',
    type: 'text',
    available: false,
    apiKey: process.env.YUNWU_API_KEY || '',
    endpoint: 'https://yunwu.ai/v1/chat/completions',
    modelName: 'gpt-5.4',
  },
};

/**
 * 获取图片生成模型列表
 */
export function getImageModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter(m => m.type === 'image');
}

/**
 * 获取文本生成模型列表
 */
export function getTextModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter(m => m.type === 'text');
}

/**
 * 获取模型配置
 */
export function getModelConfig(modelId: string): ImageModelConfig {
  const model = modelId as ImageModel;
  const config = IMAGE_MODELS[model];
  if (!config) {
    return IMAGE_MODELS['gpt-5-nano'];
  }
  return {
    ...config,
    available: !!config.apiKey,
  };
}

/**
 * 检查模型是否可用
 */
export function isModelAvailable(modelId: string): boolean {
  const config = getModelConfig(modelId);
  return config.available;
}

/**
 * 获取可用的模型列表
 */
export function getAvailableModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter(m => !!m.apiKey);
}

/**
 * 获取文本模型的备用模型（故障转移）
 */
export function getTextModelFallback(): ImageModelConfig {
  const textModels = getTextModels().filter(m => !!m.apiKey);
  
  if (textModels.length === 0) {
    return IMAGE_MODELS['gpt-5-nano'];
  }
  
  return textModels[0];
}

/**
 * 获取备用语言模型
 */
export function getFallbackModel(preferredModel: string): ImageModelConfig {
  const preferredConfig = getModelConfig(preferredModel);
  
  if (preferredConfig.available) {
    return preferredConfig;
  }
  
  const textModels = getTextModels().filter(m => m.id !== preferredModel && !!m.apiKey);
  
  if (textModels.length > 0) {
    return textModels[0];
  }
  
  return IMAGE_MODELS['gpt-5-nano'];
}
