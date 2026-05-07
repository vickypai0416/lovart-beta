export interface ProductAnalysis {
  productType: string;
  productName: string;
  keyFeatures: string[];
  material: string;
  color: string;
  style: string;
  usageScenarios: string[];
  targetAudience: string;
  emotionalKeywords: string[];
  customizationOptions: string[];
}

export interface ProductAnalyzerConfig {
  apiKey: string;
  endpoint?: string;
}

export class ProductAnalyzer {
  private apiKey: string;
  private endpoint: string;

  constructor(config: ProductAnalyzerConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://yunwu.ai/v1/chat/completions';
  }

  private async analyzeWithModel(imageUrl: string, modelName: string): Promise<ProductAnalysis> {
    const prompt = `
      分析这张产品图片，提取以下信息：
      
      1. 产品类型（如：水杯、相框、钥匙扣、T恤、饰品等）
      2. 产品名称（简洁描述）
      3. 关键特征（材质、形状、颜色、特殊功能等）
      4. 材质（如：陶瓷、金属、木头、塑料、布料等）
      5. 颜色
      6. 风格（如：简约、复古、现代、可爱、高端等）
      7. 使用场景（如：家居装饰、办公、送礼、日常使用等）
      8. 目标受众（如：男性、女性、儿童、情侣、父母等）
      9. 情绪关键词（能引发的情感，如：温暖、浪漫、温馨、励志等）
      10. 定制化选项（可定制的内容，如：名字、照片、文字等）
      
      请用 JSON 格式输出，不要添加额外解释。
    `.trim();

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error(`模型 ${modelName} 返回空内容`);
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`模型 ${modelName} 返回格式错误: ${content.substring(0, 100)}`);
    }
  }

  async analyze(imageUrl: string): Promise<ProductAnalysis> {
    const models = ['gpt-5.4-nano', 'gpt-5.4'];
    
    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      console.log(`[Product Analyzer] 尝试使用模型: ${modelName}`);
      
      try {
        const result = await this.analyzeWithModel(imageUrl, modelName);
        console.log(`[Product Analyzer] 模型 ${modelName} 分析成功`);
        return result;
      } catch (error) {
        console.warn(`[Product Analyzer] 模型 ${modelName} 分析失败:`, error);
        
        if (i < models.length - 1) {
          console.log(`[Product Analyzer] 切换到备用模型: ${models[i + 1]}`);
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('所有模型都无法使用');
  }

  static create(): ProductAnalyzer {
    const apiKey = process.env.YUNWU_API_KEY;
    if (!apiKey) {
      throw new Error('缺少 YUNWU_API_KEY 配置');
    }
    return new ProductAnalyzer({ apiKey });
  }
}