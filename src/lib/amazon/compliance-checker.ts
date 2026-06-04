import { AMAZON_IMAGE_SPECS, ImageSpecType } from '../image-specs';

export interface ComplianceIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  recommendation: string;
}

export interface ComplianceResult {
  isValid: boolean;
  issues: ComplianceIssue[];
  specType: ImageSpecType;
  spec: typeof AMAZON_IMAGE_SPECS[string];
}

export interface ImageMetadata {
  width: number;
  height: number;
  fileSizeMB: number;
  format: string;
  hasText: boolean;
  hasWatermark: boolean;
  hasBorder: boolean;
  backgroundColor: string;
}

export class ComplianceChecker {
  private spec: typeof AMAZON_IMAGE_SPECS[string];

  constructor(specType: ImageSpecType = 'main') {
    this.spec = AMAZON_IMAGE_SPECS[specType];
  }

  async check(url: string, specType?: ImageSpecType): Promise<ComplianceResult> {
    const spec = specType ? AMAZON_IMAGE_SPECS[specType] : this.spec;
    const issues: ComplianceIssue[] = [];

    try {
      const metadata = await this.extractMetadata(url);

      if (metadata.width < (spec.minWidth || 1000)) {
        issues.push({
          type: 'error',
          code: 'MIN_WIDTH',
          message: `图片宽度不足：${metadata.width}px < ${spec.minWidth}px`,
          recommendation: `请确保图片宽度至少为 ${spec.minWidth}px`,
        });
      }

      if (metadata.height < (spec.minHeight || 1000)) {
        issues.push({
          type: 'error',
          code: 'MIN_HEIGHT',
          message: `图片高度不足：${metadata.height}px < ${spec.minHeight}px`,
          recommendation: `请确保图片高度至少为 ${spec.minHeight}px`,
        });
      }

      if (metadata.fileSizeMB > spec.maxSizeMB) {
        issues.push({
          type: 'error',
          code: 'MAX_SIZE',
          message: `文件大小超过限制：${metadata.fileSizeMB.toFixed(2)}MB > ${spec.maxSizeMB}MB`,
          recommendation: `请压缩图片至 ${spec.maxSizeMB}MB 以下`,
        });
      }

      if (!spec.allowedFormats.includes(metadata.format)) {
        issues.push({
          type: 'error',
          code: 'INVALID_FORMAT',
          message: `不支持的文件格式: ${metadata.format}`,
          recommendation: `请使用 ${spec.allowedFormats.join(', ')} 格式`,
        });
      }

      if (metadata.hasText && specType === 'main') {
        issues.push({
          type: 'warning',
          code: 'TEXT_IN_MAIN',
          message: '主图不应包含文字',
          recommendation: '主图应避免添加文字叠加',
        });
      }

      if (metadata.hasWatermark) {
        issues.push({
          type: 'error',
          code: 'WATERMARK',
          message: '图片包含水印',
          recommendation: '请移除图片水印',
        });
      }

      if (metadata.hasBorder) {
        issues.push({
          type: 'warning',
          code: 'BORDER',
          message: '图片包含边框',
          recommendation: '主图不应有边框',
        });
      }

      if (specType === 'main' && metadata.backgroundColor !== 'white') {
        issues.push({
          type: 'error',
          code: 'BACKGROUND_COLOR',
          message: `主图背景色不是纯白色: ${metadata.backgroundColor}`,
          recommendation: '主图必须使用纯白背景 (RGB: 255,255,255)',
        });
      }

      return {
        isValid: issues.every(i => i.type === 'warning'),
        issues,
        specType: specType || 'main',
        spec,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [{
          type: 'error',
          code: 'FETCH_ERROR',
          message: `无法获取图片信息: ${error instanceof Error ? error.message : '未知错误'}`,
          recommendation: '请检查图片URL是否有效',
        }],
        specType: specType || 'main',
        spec,
      };
    }
  }

  private async extractMetadata(url: string): Promise<ImageMetadata> {
    return new Promise((resolve) => {
      const img = new (typeof window !== 'undefined' ? window.Image : globalThis.Image)();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const size = this.estimateFileSize(url);
        
        resolve({
          width: img.width,
          height: img.height,
          fileSizeMB: size,
          format: this.getFormatFromUrl(url),
          hasText: false,
          hasWatermark: false,
          hasBorder: false,
          backgroundColor: 'white',
        });
      };
      
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          fileSizeMB: 0,
          format: 'unknown',
          hasText: false,
          hasWatermark: false,
          hasBorder: false,
          backgroundColor: 'unknown',
        });
      };
      
      img.src = url;
    });
  }

  private estimateFileSize(url: string): number {
    const extension = url.split('.').pop()?.toLowerCase();
    const baseSizeKB = {
      jpg: 1500,
      jpeg: 1500,
      png: 3000,
      gif: 2000,
    };
    return (baseSizeKB[extension as keyof typeof baseSizeKB] || 1000) / 1024;
  }

  private getFormatFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };
    return formatMap[extension || ''] || 'unknown';
  }

  batchCheck(urls: string[], specTypes?: ImageSpecType[]): Promise<ComplianceResult[]> {
    return Promise.all(
      urls.map((url, index) => 
        this.check(url, specTypes?.[index] || 'main')
      )
    );
  }
}