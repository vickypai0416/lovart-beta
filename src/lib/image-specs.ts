export interface ImageSize {
  width: number;
  height: number;
  label: string;
  description: string;
}

export interface ImageSpec {
  name: string;
  description: string;
  sizes: ImageSize[];
  minWidth?: number;
  minHeight?: number;
  maxSizeMB: number;
  allowedFormats: string[];
}

export const AMAZON_IMAGE_SPECS: Record<string, ImageSpec> = {
  main: {
    name: '主图',
    description: '亚马逊主图规格：纯白背景，产品占比85%以上',
    sizes: [
      { width: 1000, height: 1000, label: '1000x1000', description: '最小要求' },
      { width: 1500, height: 1500, label: '1500x1500', description: '推荐尺寸' },
      { width: 2000, height: 2000, label: '2000x2000', description: '高清展示' },
      { width: 2048, height: 2048, label: '2048x2048', description: '最高清' },
    ],
    minWidth: 1000,
    minHeight: 1000,
    maxSizeMB: 10,
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
  },
  secondary: {
    name: '辅图',
    description: '亚马逊辅图规格：多角度展示产品',
    sizes: [
      { width: 1000, height: 1000, label: '1000x1000', description: '方形' },
      { width: 1000, height: 1200, label: '1000x1200', description: '竖版' },
      { width: 1200, height: 1000, label: '1200x1000', description: '横版' },
    ],
    minWidth: 500,
    minHeight: 500,
    maxSizeMB: 10,
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
  },
  aplus: {
    name: 'A+内容图',
    description: '亚马逊A+内容图片规格',
    sizes: [
      { width: 1000, height: 1000, label: '1000x1000', description: '标准' },
      { width: 1500, height: 1500, label: '1500x1500', description: '高清' },
      { width: 2000, height: 1000, label: '2000x1000', description: '宽横幅' },
      { width: 3000, height: 1500, label: '3000x1500', description: '超宽横幅' },
    ],
    minWidth: 1000,
    minHeight: 500,
    maxSizeMB: 10,
    allowedFormats: ['image/jpeg', 'image/png'],
  },
  thumbnail: {
    name: '缩略图',
    description: '产品缩略图规格',
    sizes: [
      { width: 500, height: 500, label: '500x500', description: '标准缩略图' },
    ],
    minWidth: 100,
    minHeight: 100,
    maxSizeMB: 5,
    allowedFormats: ['image/jpeg', 'image/png'],
  },
};

export type ImageSpecType = keyof typeof AMAZON_IMAGE_SPECS;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateImage(file: File, specType: ImageSpecType = 'main'): ValidationResult {
  const spec = AMAZON_IMAGE_SPECS[specType];
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!file) {
    result.isValid = false;
    result.errors.push('文件不存在');
    return result;
  }

  const fileSizeMB = file.size / (1024 * 1024);

  if (!spec.allowedFormats.includes(file.type)) {
    result.isValid = false;
    result.errors.push(`不支持的文件格式: ${file.type}。支持的格式: ${spec.allowedFormats.join(', ')}`);
  }

  if (fileSizeMB > spec.maxSizeMB) {
    result.isValid = false;
    result.errors.push(`文件大小超过限制: ${fileSizeMB.toFixed(2)}MB > ${spec.maxSizeMB}MB`);
  }

  return result;
}

export function validateImageUrl(url: string, specType: ImageSpecType = 'main'): ValidationResult {
  const spec = AMAZON_IMAGE_SPECS[specType];
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!url) {
    result.isValid = false;
    result.errors.push('URL为空');
    return result;
  }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (!allowedExtensions.includes(extension || '')) {
    result.warnings.push(`图片扩展名不常见: ${extension}`);
  }

  return result;
}

export function getRecommendedSize(specType: ImageSpecType = 'main'): ImageSize {
  const spec = AMAZON_IMAGE_SPECS[specType];
  return spec.sizes[1] || spec.sizes[0];
}

export function getSpecByName(name: string): ImageSpec | undefined {
  return AMAZON_IMAGE_SPECS[name];
}

export function getAllSpecTypes(): ImageSpecType[] {
  return Object.keys(AMAZON_IMAGE_SPECS) as ImageSpecType[];
}