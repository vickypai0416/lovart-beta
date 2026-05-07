import { ProductAnalyzer, ProductAnalysis } from './product-analyzer';
import { VisualStrategyGenerator, VisualStrategy, ListingImagePlan, SceneType } from './visual-strategy';
import { ComplianceChecker, ComplianceResult } from './compliance-checker';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export interface CtrAgentConfig {
  apiKey: string;
}

export interface CtrAgentResult {
  success: boolean;
  productAnalysis?: ProductAnalysis;
  visualStrategy?: VisualStrategy;
  imagePlan?: ListingImagePlan;
  generatedImages?: GeneratedImage[];
  complianceResults?: ComplianceResult[];
  error?: string;
}

export interface GeneratedImage {
  index: number;
  type: string;
  purpose: string;
  prompt: string;
  url: string;
  size: string;
}

export class CtrAgent {
  private productAnalyzer: ProductAnalyzer;
  private strategyGenerator: VisualStrategyGenerator;
  private complianceChecker: ComplianceChecker;
  private apiKey: string;

  constructor(config: CtrAgentConfig) {
    this.apiKey = config.apiKey;
    this.productAnalyzer = new ProductAnalyzer({ apiKey: config.apiKey });
    this.strategyGenerator = new VisualStrategyGenerator();
    this.complianceChecker = new ComplianceChecker();
  }

  async analyzeProduct(imageUrl: string): Promise<ProductAnalysis> {
    return this.productAnalyzer.analyze(imageUrl);
  }

  generateStrategy(product: ProductAnalysis, scene: SceneType): VisualStrategy {
    return this.strategyGenerator.generateSceneStrategy(scene, product);
  }

  generateListingPlan(strategy: VisualStrategy, product: ProductAnalysis): ListingImagePlan {
    return this.strategyGenerator.generateListingPlan(strategy, product);
  }

  private async checkImageUrl(url: string, maxRetries: number = 3, delayMs: number = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) return true;
      } catch {
        // 忽略错误，继续重试
      }
      if (i < maxRetries - 1) {
        console.log(`[CTR Agent] 图片 URL 不可访问，重试 ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    return false;
  }

  async generateImages(plan: ListingImagePlan): Promise<GeneratedImage[]> {
    const images: GeneratedImage[] = [];
    const config = new Config();
    const client = new ImageGenerationClient(config, {});

    const planEntries = Object.entries(plan) as [string, typeof plan['image1']][];

    for (let i = 0; i < planEntries.length; i++) {
      const [key, imagePlan] = planEntries[i];
      
      console.log(`[CTR Agent] 正在生成第 ${i + 1}/6 张图片: ${imagePlan.type}`);
      
      let success = false;
      let retryCount = 0;
      const maxRetries = 2;

      while (!success && retryCount < maxRetries) {
        try {
          const response = await client.generate({
            prompt: imagePlan.promptTemplate,
            size: imagePlan.size,
            watermark: false,
          });

          const helper = client.getResponseHelper(response);
          
          if (helper.success && helper.imageUrls.length > 0) {
            const imageUrl = helper.imageUrls[0];
            console.log(`[CTR Agent] 图片生成成功，检查 URL 可访问性...`);
            
            const isAccessible = await this.checkImageUrl(imageUrl);
            
            if (isAccessible) {
              images.push({
                index: i + 1,
                type: imagePlan.type,
                purpose: imagePlan.purpose,
                prompt: imagePlan.promptTemplate,
                url: imageUrl,
                size: imagePlan.size,
              });
              success = true;
              console.log(`[CTR Agent] 第 ${i + 1} 张图片添加成功`);
            } else {
              retryCount++;
              console.warn(`[CTR Agent] 图片 URL 不可访问 (502 Bad Gateway)，重试 ${retryCount}/${maxRetries}`);
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
            }
          } else {
            const errorMsg = helper.errorMessages.join(', ') || '未知错误';
            console.error(`[CTR Agent] 图片生成失败: ${errorMsg}`);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        } catch (error) {
          console.error(`[CTR Agent] 生成第 ${i + 1} 张图片时出错 (尝试 ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      if (!success) {
        console.error(`[CTR Agent] 第 ${i + 1} 张图片生成失败，已达到最大重试次数`);
      }
    }

    return images;
  }

  async checkCompliance(urls: string[]): Promise<ComplianceResult[]> {
    const specTypes: ('main' | 'secondary')[] = ['main', 'secondary', 'secondary', 'secondary', 'secondary', 'secondary'];
    return this.complianceChecker.batchCheck(urls, specTypes);
  }

  async runFullPipeline(imageUrl: string, scene: SceneType = 'everyday'): Promise<CtrAgentResult> {
    try {
      console.log('[CTR Agent] 开始执行完整流程...');

      console.log('[CTR Agent] 步骤1: 产品分析');
      const productAnalysis = await this.analyzeProduct(imageUrl);
      console.log('[CTR Agent] 产品分析完成:', productAnalysis.productName);

      console.log('[CTR Agent] 步骤2: 生成视觉策略');
      const visualStrategy = this.generateStrategy(productAnalysis, scene);

      console.log('[CTR Agent] 步骤3: 生成 Listing 图片计划');
      const imagePlan = this.generateListingPlan(visualStrategy, productAnalysis);

      console.log('[CTR Agent] 步骤4: 生成图片');
      const generatedImages = await this.generateImages(imagePlan);

      if (generatedImages.length === 0) {
        return {
          success: false,
          productAnalysis,
          visualStrategy,
          imagePlan,
          error: '所有图片生成失败',
        };
      }

      console.log('[CTR Agent] 步骤5: 合规检测');
      const urls = generatedImages.map(img => img.url);
      const complianceResults = await this.checkCompliance(urls);

      console.log('[CTR Agent] 流程完成');

      return {
        success: true,
        productAnalysis,
        visualStrategy,
        imagePlan,
        generatedImages,
        complianceResults,
      };
    } catch (error) {
      console.error('[CTR Agent] 流程执行失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  static create(): CtrAgent {
    const apiKey = process.env.YUNWU_API_KEY;
    if (!apiKey) {
      throw new Error('缺少 YUNWU_API_KEY 配置');
    }
    return new CtrAgent({ apiKey });
  }
}