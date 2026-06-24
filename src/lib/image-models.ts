/**
 * AI 模型配置
 */

export type ModelType = 'image' | 'text';

export type ImageModel = 'openai-dalle' | 'gpt-4o-image' | 'gpt-image-2' | 'gpt-image-2-gen' | 'gpt-image-2-edit' | 'gpt-image-2-all' | 'gpt-5-nano' | 'gpt-5.4';

// 业务作用域：每个功能可以绑定独立的 API Key
export type ModelScope =
  | 'default'        // 默认 / 图片生成器
  | 'image-generator' // 图片生成器
  | 'detail-page'     // 详情页套图
  | 'amazon'          // Amazon Listing
  | 'amazon-grid'     // 快速九宫格
  | 'toolbox'         // 工具箱
  | 'deep-workflow';  // Deep Workflow

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

// 通用基础配置
const BASE_GPT_IMAGE_2_ENDPOINT = 'https://api.apiyi.com/v1/images/edits';
const BASE_GPT_IMAGE_2_GEN_ENDPOINT = 'https://api.apiyi.com/v1/images/generations';
const BASE_GPT_IMAGE_2_ALL_ENDPOINT = 'https://api.apiyi.com/v1/images/edits';
const BASE_CHAT_COMPLETIONS_ENDPOINT = 'https://api.apiyi.com/v1/chat/completions';
const DEFAULT_MODEL_NAME = 'gpt-image-2';
const DEFAULT_ALL_MODEL_NAME = 'gpt-image-2-all';
const DEFAULT_NANO_MODEL_NAME = 'gpt-5.4-nano';
const DEFAULT_GPT_5_4_MODEL_NAME = 'gpt-5.4';

// 文本模型（仅作为语言模型/对话模型用），各 scope 都使用默认 Key
const TEXT_MODELS_BASE: Record<'gpt-5-nano' | 'gpt-5.4', Pick<ImageModelConfig, 'id' | 'name' | 'description' | 'type' | 'endpoint' | 'modelName'>> = {
  'gpt-5-nano': {
    id: 'gpt-5-nano',
    name: 'GPT-5.4 nano',
    description: '轻量模型，支持对话和图片识别',
    type: 'text',
    endpoint: BASE_CHAT_COMPLETIONS_ENDPOINT,
    modelName: DEFAULT_NANO_MODEL_NAME,
  },
  'gpt-5.4': {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    description: '旗舰模型，更强的推理能力',
    type: 'text',
    endpoint: BASE_CHAT_COMPLETIONS_ENDPOINT,
    modelName: DEFAULT_GPT_5_4_MODEL_NAME,
  },
} as const;

/**
 * 根据 scope 解析 API Key：
 * 1. 优先取该 scope 的专用 Key
 * 2. 若未设置则回落到 GPT_IMAGE_2_API_KEY / YUNWU_API_KEY
 */
function resolveScopeApiKey(scope: ModelScope | undefined): string {
  const s = scope || 'default';
  const scopedKey = (() => {
    switch (s) {
      case 'image-generator':
        return process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      case 'detail-page':
        return process.env.KEY_DETAIL_PAGE || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      case 'amazon':
        return process.env.KEY_AMAZON || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      case 'amazon-grid':
        return process.env.KEY_AMAZON_GRID || process.env.KEY_AMAZON || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      case 'toolbox':
        return process.env.KEY_TOOLBOX || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      case 'deep-workflow':
        return process.env.KEY_DEEP_WORKFLOW || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
      default:
        return process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
    }
  })();
  return (scopedKey || '').trim();
}

/**
 * 构造图片生成模型配置（图片类）
 */
function buildImageModelConfig(
  id: ImageModel,
  apiKey: string,
  endpoint: string,
  modelName: string
): ImageModelConfig {
  return {
    id,
    name: id,
    description: '',
    type: 'image',
    available: !!apiKey,
    apiKey,
    endpoint,
    modelName,
  };
}

/**
 * 构造文本模型配置（语言类）
 */
function buildTextModelConfig(id: 'gpt-5-nano' | 'gpt-5.4'): ImageModelConfig {
  const base = TEXT_MODELS_BASE[id];
  return {
    ...base,
    available: !!process.env.YUNWU_API_KEY,
    apiKey: process.env.YUNWU_API_KEY,
  };
}

/**
 * 获取图片生成模型列表
 */
export function getImageModels(): ImageModelConfig[] {
  return [
    buildImageModelConfig('openai-dalle', process.env.OPENAI_API_KEY || '', '', ''),
    buildImageModelConfig('gpt-4o-image', resolveScopeApiKey('default'), BASE_CHAT_COMPLETIONS_ENDPOINT, DEFAULT_MODEL_NAME),
    buildImageModelConfig('gpt-image-2', resolveScopeApiKey('default'), BASE_GPT_IMAGE_2_ENDPOINT, DEFAULT_MODEL_NAME),
    buildImageModelConfig('gpt-image-2-gen', resolveScopeApiKey('default'), BASE_GPT_IMAGE_2_GEN_ENDPOINT, DEFAULT_MODEL_NAME),
    buildImageModelConfig('gpt-image-2-edit', resolveScopeApiKey('default'), BASE_GPT_IMAGE_2_ENDPOINT, DEFAULT_ALL_MODEL_NAME),
    buildImageModelConfig('gpt-image-2-all', resolveScopeApiKey('default'), BASE_GPT_IMAGE_2_ALL_ENDPOINT, DEFAULT_ALL_MODEL_NAME),
  ];
}

/**
 * 获取文本生成模型列表
 */
export function getTextModels(): ImageModelConfig[] {
  return [buildTextModelConfig('gpt-5-nano'), buildTextModelConfig('gpt-5.4')];
}

/** 图生图/编辑（含参考图）统一走 gpt-image-2 */
export function getImageEditModelConfig(scope?: ModelScope): ImageModelConfig {
  const apiKey = resolveScopeApiKey(scope);
  return {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    description: '统一图片生成/编辑模型',
    type: 'image',
    available: !!apiKey,
    apiKey,
    endpoint: BASE_GPT_IMAGE_2_ENDPOINT,
    modelName: DEFAULT_MODEL_NAME,
  };
}

/**
 * 根据 scope 获取模型配置
 */
export function getModelConfig(modelId: string, scope?: ModelScope): ImageModelConfig {
  const model = modelId as ImageModel;
  const apiKey = resolveScopeApiKey(scope);

  switch (model) {
    case 'openai-dalle':
      return {
        ...buildImageModelConfig('openai-dalle', process.env.OPENAI_API_KEY || '', '', ''),
      };
    case 'gpt-4o-image':
      return {
        ...buildImageModelConfig('gpt-4o-image', apiKey, BASE_CHAT_COMPLETIONS_ENDPOINT, DEFAULT_MODEL_NAME),
      };
    case 'gpt-image-2':
      return {
        ...buildImageModelConfig('gpt-image-2', apiKey, BASE_GPT_IMAGE_2_ENDPOINT, DEFAULT_MODEL_NAME),
      };
    case 'gpt-image-2-gen':
      return {
        ...buildImageModelConfig('gpt-image-2-gen', apiKey, BASE_GPT_IMAGE_2_GEN_ENDPOINT, DEFAULT_MODEL_NAME),
      };
    case 'gpt-image-2-edit':
      return {
        ...buildImageModelConfig('gpt-image-2-edit', apiKey, BASE_GPT_IMAGE_2_ENDPOINT, DEFAULT_ALL_MODEL_NAME),
      };
    case 'gpt-image-2-all':
      return {
        ...buildImageModelConfig('gpt-image-2-all', apiKey, BASE_GPT_IMAGE_2_ALL_ENDPOINT, DEFAULT_ALL_MODEL_NAME),
      };
    case 'gpt-5-nano':
    case 'gpt-5.4':
    default:
      return buildTextModelConfig('gpt-5-nano');
  }
}

/**
 * 检查模型是否可用
 */
export function isModelAvailable(modelId: string, scope?: ModelScope): boolean {
  const config = getModelConfig(modelId, scope);
  return config.available;
}

/**
 * 获取可用的模型列表
 */
export function getAvailableModels(scope?: ModelScope): ImageModelConfig[] {
  return getImageModels().concat(getTextModels()).filter(m => !!m.apiKey);
}

/**
 * 获取文本模型的备用模型（故障转移）
 */
export function getTextModelFallback(): ImageModelConfig {
  const textModels = getTextModels().filter(m => !!m.apiKey);

  if (textModels.length === 0) {
    return buildTextModelConfig('gpt-5-nano');
  }

  return textModels[0];
}

/**
 * 获取备用语言模型
 */
export function getFallbackModel(preferredModel: string, scope?: ModelScope): ImageModelConfig {
  const preferredConfig = getModelConfig(preferredModel, scope);

  if (preferredConfig.available) {
    return preferredConfig;
  }

  const textModels = getTextModels().filter(m => m.id !== preferredModel && !!m.apiKey);

  if (textModels.length > 0) {
    return textModels[0];
  }

  return buildTextModelConfig('gpt-5-nano');
}
