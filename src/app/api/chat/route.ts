import { NextRequest } from 'next/server';
import { 
  ImageModel, 
  getModelConfig
} from '@/lib/image-models';
import { getPersonaById } from '@/lib/persona';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model: selectedModel, autoGenerate, n = 1, persona = 'default', size = '1024x1024', quality = 'high' } = body as {
      messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
      model?: ImageModel;
      autoGenerate?: boolean;
      n?: number;
      persona?: string;
      size?: string;
      quality?: string;
    };

    const personaConfig = getPersonaById(persona);

    // 从消息中提取参考图片（优先使用最新消息中的图片）
    let referenceImages: string[] = [];
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (Array.isArray(lastMessage.content)) {
        const imageContents = lastMessage.content.filter((c) => c.type === 'image_url' && c.image_url?.url);
        referenceImages = imageContents.map((c) => c.image_url!.url);
      }
    }

    // 获取模型配置，默认使用 GPT-5 nano
    const modelId: ImageModel = selectedModel || 'gpt-5-nano';
    const modelConfig = getModelConfig(modelId);
    
    // 记录实际使用的模型
    console.log(`[API] 使用模型: ${modelId} (${modelConfig.name})`);
    console.log(`[API] 模型类型: ${modelConfig.type}, 模型名: ${modelConfig.modelName}`);
    console.log(`[API] available: ${modelConfig.available}, apiKey: ${modelConfig.apiKey ? modelConfig.apiKey.substring(0, 10) + '...' : '未配置'}`);
    console.log(`[API] 自动生成: ${autoGenerate ? '是' : '否'}`);
    if (referenceImages.length > 0) {
      console.log(`[API] 包含参考图片: ${referenceImages.length} 张`);
    } else {
      console.log(`[API] 不包含参考图片`);
    }

    // 验证模型是否可用
    if (!modelConfig.available) {
      return new Response(
        JSON.stringify({ 
          error: `模型 ${modelConfig.name} 未配置 API Key，请在配置文件中添加` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const lastMessage = messages[messages.length - 1];
          let userPrompt = '';
          
          if (lastMessage) {
            if (typeof lastMessage.content === 'string') {
              userPrompt = lastMessage.content;
            } else if (Array.isArray(lastMessage.content)) {
              const textContent = lastMessage.content.find((c: { type: string; text?: string }) => c.type === 'text');
              userPrompt = textContent?.text || '';
            }
          }
          
          console.log(`[API] 用户提示词: ${userPrompt.substring(0, 100)}`);
          
          // 判断模型类型
          if (modelConfig.type === 'text') {
            // 文本模型（GPT-5 nano）- 直接处理对话
            console.log(`[API] 使用 ${modelConfig.name} 处理用户消息`);
            console.log(`[API] 使用人设: ${personaConfig.name}`);
            await generateWithYunwuAPIStream(
              modelId, 
              messages, 
              controller, 
              encoder,
              autoGenerate, // 传递自动生成参数
              personaConfig.systemPrompt // 传递人设系统提示词
            );
          } else {
            // 图片生成模型 - 直接生成图片
            console.log(`[API] 使用 ${modelConfig.name} 生成图片`);
            await generateImageDirectly(modelId, userPrompt, referenceImages, controller, encoder, n, size, quality);
          }
        } catch (error) {
          console.error('Stream error:', error);
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: '服务器错误' })}\n\n`
              )
            );
          } catch {
            // 控制器已关闭
          }
        } finally {
          try {
            controller.close();
          } catch {
            // 控制器已关闭
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function checkImageUrlAccessibility(url: string, maxRetries: number = 3, delayMs: number = 3000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return true;
    } catch {
      // 忽略错误，继续重试
    }
    if (i < maxRetries - 1) {
      console.log(`[Image Check] 图片 URL 不可访问，等待 ${delayMs}ms 后重试 ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

async function generateWithRetry(
  generateFn: () => Promise<string[]>,
  maxRetries: number = 2,
  delayMs: number = 3000
): Promise<string[]> {
  let lastError: unknown = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await generateFn();
      if (result && result.length > 0) {
        return result;
      }
      lastError = new Error('生成结果为空');
    } catch (error) {
      lastError = error;
      console.warn(`[Retry] 生成失败，正在重试 ${i + 1}/${maxRetries}:`, error);
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  if (lastError) {
    throw lastError;
  }
  return [];
}

/**
 * 直接生成图片
 */
async function generateImageDirectly(
  modelId: ImageModel,
  prompt: string,
  referenceImages: string[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  n: number = 1,
  size: string = '1024x1024',
  quality: string = 'high'
): Promise<void> {
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: 'generating',
        model: modelId,
      })}\n\n`
    )
  );

  const hasReferenceImage = referenceImages.length > 0;
  const enhancedPrompt = enhanceProductPrompt(prompt, hasReferenceImage, modelId);
  
  console.log(`[GenerateImage] 模型: ${modelId}`);
  console.log(`[GenerateImage] 原始提示词: ${prompt.substring(0, 100)}`);
  console.log(`[GenerateImage] 增强提示词: ${enhancedPrompt.substring(0, 100)}`);
  console.log(`[GenerateImage] 参考图片: ${referenceImages.length} 张`);
  console.log(`[GenerateImage] 生成数量 n: ${n}`);
  console.log(`[GenerateImage] 尺寸: ${size}, 画质: ${quality}`);

  try {
    let imageUrls: string[] = [];

    const generationFn = async (): Promise<string[]> => {
      if (modelId === 'openai-dalle') {
        return await generateWithDALL3(enhancedPrompt, referenceImages, n, size, quality);
      } else if (modelId === 'gpt-4o-image') {
        const url = await generateWithGPT4oImage(enhancedPrompt, referenceImages, size);
        return url ? [url] : [];
      } else if (modelId === 'gpt-image-2') {
        const url = await generateWithGPTImage2(enhancedPrompt, referenceImages, size);
        return url ? [url] : [];
      } else if (modelId === 'gpt-image-2-gen') {
        return await generateWithGPTImage2Gen(enhancedPrompt, n, size, quality);
      } else if (modelId === 'gpt-image-2-edit') {
        console.log(`[GenerateImage] 调用 generateWithGPTImage2Edit, n=${n}, quality=${quality}`);
        return await generateWithGPTImage2Edit(enhancedPrompt, referenceImages, n, size, quality);
      }
      console.log(`[GenerateImage] 未知模型: ${modelId}`);
      return [];
    };

    imageUrls = await generateWithRetry(generationFn, 2, 3000) || [];
    console.log(`[GenerateImage] 生成完成，共 ${imageUrls.length} 张图片`);

    if (imageUrls.length > 0) {
      if (imageUrls[0]?.startsWith('TEXT_RESPONSE:')) {
        const textContent = imageUrls[0].substring('TEXT_RESPONSE:'.length);
        const chars = textContent.split('');
        for (let i = 0; i < chars.length; i++) {
          const chunk = chars.slice(0, i + 1).join('');
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'text',
                content: chunk,
                done: i === chars.length - 1,
              })}\n\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } else {
        for (let i = 0; i < imageUrls.length; i++) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'image',
                url: imageUrls[i],
                model: modelId,
                index: i,
                total: imageUrls.length,
              })}\n\n`
            )
          );
        }
      }
    } else {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'error',
            message: '图片生成失败，请重试',
          })}\n\n`
        )
      );
    }
  } catch (imageError: unknown) {
    console.error('Image generation error:', imageError);
    const errorMessage = imageError instanceof Error ? imageError.message : '图片生成服务暂时不可用，请稍后重试';
    try {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'error',
            message: errorMessage,
          })}\n\n`
        )
      );
    } catch {
      console.error('Controller already closed, cannot send error message');
    }
  }

  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
}

/**
 * 使用 DALL-E 3 生成图片
 */
async function generateWithDALL3(prompt: string, referenceImages: string[] = [], n: number = 1, size: string = '1024x1024', quality: string = 'high'): Promise<string[]> {
  const modelConfig = getModelConfig('openai-dalle');
  
  if (!modelConfig.apiKey) {
    throw new Error('DALL-E 3 API Key 未配置');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: referenceImages.length > 0
        ? `${prompt}\n\nReference: Create a professional product photo based on the uploaded product image.`
        : prompt,
      n: Math.min(n, 4),
      size: size,
      quality: quality,
      style: 'natural',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API 错误: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    return data.data.map((item: { url: string }) => item.url);
  }
  
  return [];
}

/**
 * 增强商品图提示词
 */
function enhanceProductPrompt(basePrompt: string, hasReferenceImage: boolean, modelId: ImageModel): string {
  if (!basePrompt || basePrompt.trim() === '') {
    if (hasReferenceImage) {
      return 'professional product photography, studio lighting, clean background, high quality';
    }
    return 'professional product photography, studio lighting setup, soft shadows, sharp focus, high resolution, commercial product photo, detailed product showcase';
  }

  if (modelId === 'gpt-image-2-edit') {
    return basePrompt;
  }

  if (modelId === 'gpt-image-2' || modelId === 'gpt-image-2-gen') {
    return `${basePrompt}, professional product photography, studio lighting, sharp focus, high resolution, commercial quality`;
  }

  if (modelId === 'openai-dalle') {
    return `${basePrompt}, professional product photography, studio lighting setup, soft shadows, sharp focus, high resolution, Amazon product listing standard, highly detailed, 8k uhd, photorealistic, product centered, clean professional background, commercial advertising quality`;
  }

  if (modelId === 'gpt-4o-image') {
    if (hasReferenceImage) {
      return `美化这张商品图片，使其更加专业。要求：${basePrompt}。保持产品主体清晰，背景干净专业。`;
    }
    return `生成一张专业的商品图片。要求：${basePrompt}。`;
  }

  return `${basePrompt}, professional product photography, studio lighting, sharp focus, high resolution, commercial product photo, detailed product showcase`;
}

/**
 * 使用 Yunwu API 生成图片（支持 GPT-4o Image）
 */
async function generateWithYunwuAPI(
  modelId: 'gpt-4o-image', 
  prompt: string, 
  referenceImages: string[] = [],
  size: string = '1024x1024'
): Promise<string | null> {
  const modelConfig = getModelConfig(modelId);

  if (!modelConfig.apiKey) {
    throw new Error(`${modelConfig.name} API Key 未配置`);
  }

  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/chat/completions';
  const modelName = modelConfig.modelName || 'gpt-4o-image-vip';

  let content: Array<{ type: string; text?: string; image_url?: { url: string } }>;
  
  if (referenceImages.length > 0) {
    content = [
      { type: 'text', text: prompt },
      ...referenceImages.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
    ];
  } else {
    content = [
      { type: 'text', text: prompt }
    ];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      size: size,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 错误: ${response.status}`);
  }

  const data = await response.json();
  
  // 检查响应中是否包含图片 URL
  if (data.choices && data.choices.length > 0) {
    const message = data.choices[0].message;
    
    // 方式1：图片 URL 在 content 中
    if (message?.content && typeof message.content === 'string') {
      const urlMatch = message.content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
      
      if (message.content.startsWith('http')) {
        return message.content;
      }
    }
    
    // 方式2：图片 URL 在特定字段中
    if (message?.image_url) {
      return message.image_url;
    }
    
    // 方式3：检查是否有 data 数组
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    }
  }
  
  // 如果没有图片，返回文本内容
  console.log(`${modelConfig.name} response:`, JSON.stringify(data, null, 2));
  
  if (data.choices && data.choices.length > 0) {
    const message = data.choices[0].message;
    if (message?.content && typeof message.content === 'string') {
      return `TEXT_RESPONSE:${message.content}`;
    }
  }
  
  throw new Error('未能从响应中获取有效内容');
}

/**
 * 流式生成文本（真正的流式效果）
 * 用于 GPT-5 nano 等文本模型
 * 支持 ChatGPT 识图 API 规范
 */
async function generateWithYunwuAPIStream(
  modelId: ImageModel,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  autoGenerate?: boolean, // 是否自动生成图片
  customSystemPrompt?: string // 自定义系统提示词（人设）
): Promise<void> {
  const modelConfig = getModelConfig(modelId);

  let referenceImages: string[] = [];
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c.type === 'image_url' && c.image_url?.url) {
          referenceImages.push(c.image_url.url);
        }
      }
    }
  }

  if (!modelConfig.apiKey) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          message: `${modelConfig.name} API Key 未配置`,
        })}\n\n`
      )
    );
    return;
  }

  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/chat/completions';
  const modelName = modelConfig.modelName || 'gpt-5.4-nano';

  // 检查消息中是否包含图片
  const hasImage = messages.some(m => 
    Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' && c.image_url?.url)
  );

  // 使用自定义人设提示词，否则使用默认逻辑
  let systemPrompt = customSystemPrompt || 'You are a helpful assistant. 请始终使用中文回复用户。';
  
  // 如果启用自动生成图片且有图片，覆盖为人设+亚马逊提示词专家模式
  if (autoGenerate && hasImage) {
    systemPrompt = `你是一个专业的亚马逊商品图提示词专家。

【重要规则】
- 你必须始终使用中文进行所有回复和分析
- 图片生成提示词也使用中文

当用户提供产品图片和需求时，请按以下步骤操作：

1. **产品分析**（用中文）：
   - 识别产品类型、材质、颜色、设计亮点
   - 分析适合的拍摄角度和光线
   - 理解用户的具体生成需求

2. **生成提示词**（用中文，放在标记内）：
   在回复末尾，必须用以下格式输出中文提示词：
   [GENERATE_IMAGE]
   专业产品摄影，白色背景，柔和光线...
   [/GENERATE_IMAGE]

【示例回复】
根据您的产品图片，我分析如下：

**产品特点**：
- 材质：黑色真皮，带棕色边缘细节
- 配件：银色方形金属扣
- 风格：专业、优雅、商务

**建议拍摄方案**：
- 角度：45度角展示金属扣细节
- 光线：柔和的影棚三点布光
- 背景：纯白背景，符合亚马逊主图标准

以下是为您生成的中文提示词：

[GENERATE_IMAGE]
专业亚马逊产品摄影，黑色真皮皮带配棕色边缘细节和方形银色金属扣，纯白色背景（#FFFFFF），影棚灯光，45度角度，清晰对焦，高分辨率4K，产品占画面85%，干净专业氛围。
[/GENERATE_IMAGE]

这个提示词将用于生成您的商品图。`;
  }
  
  // 构建请求体（符合 ChatGPT 识图 API 规范）
  const requestBody: Record<string, unknown> = {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ? m.content : [{ type: 'text', text: m.content }]
      }))
    ],
    stream: true,
  };

  // 发送流式请求
  console.log(`[API] 正在请求 Yunwu API: ${endpoint}`);
  console.log(`[API] 模型: ${modelName}, API Key: ${modelConfig.apiKey?.substring(0, 10)}...`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`[API] 收到响应: ${response.status} ${response.ok}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          message: errorData.error?.message || `API 错误: ${response.status}`,
        })}\n\n`
      )
    );
    return;
  }

  // 处理流式响应
  const reader = response.body?.getReader();
  if (!reader) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          message: '无法读取响应流',
        })}\n\n`
      )
    );
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let reasoningContent = '';

  console.log('[API] 开始读取流...');
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('[API] 流读取完成');
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'text',
                  content: fullContent,
                  reasoning: reasoningContent || undefined,
                  done: true,
                })}\n\n`
              )
            );
          } catch {
            // 控制器已关闭，忽略错误
          }
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          
          // 处理思考内容（reasoning_content）
          const reasoningDelta = delta?.reasoning_content;
          if (reasoningDelta) {
            reasoningContent += reasoningDelta;
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'reasoning',
                    content: reasoningContent,
                    delta: reasoningDelta,
                    done: false,
                  })}\n\n`
                )
              );
            } catch {
              // 控制器已关闭
            }
          }
          
          // 处理最终内容（content）
          const contentDelta = delta?.content;
          if (contentDelta) {
            fullContent += contentDelta;
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'text',
                    content: fullContent,
                    delta: contentDelta,
                    reasoning: reasoningContent || undefined,
                    done: false,
                  })}\n\n`
                )
              );
            } catch {
              // 控制器已关闭
            }
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  // 确保发送最终内容
  try {
    if (fullContent || reasoningContent) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'text',
            content: fullContent,
            reasoning: reasoningContent || undefined,
            done: true,
          })}\n\n`
        )
      );
    }

    // 检测是否需要自动生成图片
    console.log(`[API] 检查自动生成条件: autoGenerate=${autoGenerate}, referenceImages=${referenceImages.length}, fullContent长度=${fullContent.length}`);
    
    if (autoGenerate && referenceImages.length > 0 && fullContent) {
      // 检测提示词标记 [GENERATE_IMAGE]...[/GENERATE_IMAGE]
      const promptMatch = fullContent.match(/\[GENERATE_IMAGE\]([\s\S]*?)\[\/GENERATE_IMAGE\]/);
      
      console.log(`[API] 正则匹配结果: ${promptMatch ? '找到提示词标记' : '未找到提示词标记'}`);
      if (!promptMatch && fullContent.includes('GENERATE_IMAGE')) {
        console.log(`[API] 内容中包含 GENERATE_IMAGE 但正则未匹配，内容片段: ${fullContent.substring(0, 200)}`);
      }
      
      if (promptMatch) {
        const imagePrompt = promptMatch[1].trim();
        console.log(`[API] 检测到自动生成指令，提示词: ${imagePrompt.substring(0, 100)}...`);
        
        // 发送生成中状态
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'generating',
              message: '正在自动生成图片...',
            })}\n\n`
          )
        );
        
        try {
          const imageUrls = await generateWithGPTImage2Edit(imagePrompt, referenceImages, 1, '1024x1024', 'high');
          
          if (imageUrls && imageUrls.length > 0) {
            for (let i = 0; i < imageUrls.length; i++) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'image',
                    url: imageUrls[i],
                    product: '自动生成',
                    scene: 'listing',
                    index: i,
                    total: imageUrls.length,
                  })}\n\n`
                )
              );
            }
          } else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: '自动生成图片失败',
                })}\n\n`
              )
            );
          }
        } catch (genError) {
          console.error('[API] 自动生成图片失败:', genError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: `自动生成失败: ${genError instanceof Error ? genError.message : '未知错误'}`,
              })}\n\n`
            )
          );
        }
      }
    }

    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
  } catch {
    // 控制器已关闭，忽略
  }
}

/**
 * 使用 GPT-4o Image 生成图片
 */
async function generateWithGPT4oImage(prompt: string, referenceImages: string[] = [], size: string = '1024x1024'): Promise<string | null> {
  return generateWithYunwuAPI('gpt-4o-image', prompt, referenceImages, size);
}

/**
 * 使用 GPT Image 2 生成图片 (Chat Completions API 格式)
 * 支持：美化图片、添加文字、调整尺寸等
 */
async function generateWithGPTImage2(prompt: string, referenceImages: string[] = [], size: string = '1024x1024'): Promise<string | null> {
  const modelConfig = getModelConfig('gpt-image-2');
  
  if (!modelConfig.apiKey) {
    throw new Error('GPT Image 2 API Key 未配置');
  }

  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/chat/completions';
  const modelName = modelConfig.modelName || 'gpt-image-2';

  let content: Array<{ type: string; text?: string; image_url?: { url: string } }>;
  
  if (referenceImages.length > 0) {
    content = [
      { type: 'text', text: prompt },
      ...referenceImages.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
    ];
  } else {
    content = [
      { type: 'text', text: prompt }
    ];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      size: size,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 错误: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[GPT Image 2] response:`, JSON.stringify(data, null, 2));
  
  // 检查响应中是否包含图片 URL
  if (data.choices && data.choices.length > 0) {
    const message = data.choices[0].message;
    
    // 方式1：图片 URL 在 content 中
    if (message?.content && typeof message.content === 'string') {
      const urlMatch = message.content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
      
      // 如果 content 本身就是 URL
      if (message.content.startsWith('http')) {
        return message.content;
      }
    }
    
    // 方式2：图片 URL 在特定字段中
    if (message?.image_url) {
      return message.image_url;
    }
    
    // 方式3：检查是否有 data 数组
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    }
    
    // 如果没有图片，返回文本内容
    if (message?.content && typeof message.content === 'string') {
      return `TEXT_RESPONSE:${message.content}`;
    }
  }
  
  throw new Error('未能从响应中获取有效内容');
}

/**
 * 使用 GPT Image 2 生成图片 (Images Generations API 格式)
 * 支持：纯文本生图，多种尺寸和画质
 */
async function generateWithGPTImage2Gen(prompt: string, n: number = 1, size: string = '1024x1024', quality: string = 'high'): Promise<string[]> {
  const modelConfig = getModelConfig('gpt-image-2-gen');
  
  if (!modelConfig.apiKey) {
    throw new Error('GPT Image 2 (生成) API Key 未配置');
  }

  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/generations';
  const modelName = modelConfig.modelName || 'gpt-image-2';

  const requestBody = {
    model: modelName,
    prompt: prompt,
    n: n,
    size: size,
    quality: quality,
    format: 'png',
  };

  console.log(`[GPT Image 2 Gen] 请求: ${endpoint}, n: ${n}, size: ${size}, quality: ${quality}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[GPT Image 2 Gen] 错误:`, errorData);
    throw new Error(errorData.error?.message || `API 错误: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[GPT Image 2 Gen] data.data 长度: ${data.data?.length}, data.choices 长度: ${data.choices?.length}`);
  
  if (data.choices && data.choices.length > 0) {
    const urls: string[] = [];
    for (const choice of data.choices) {
      if (choice.message?.content) {
        const content = choice.message.content;
        const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
        if (urlMatch) { urls.push(urlMatch[0]); continue; }
        if (content.startsWith('http')) { urls.push(content); continue; }
      }
    }
    if (urls.length > 0) return urls;
  }
  
  if (data.data && data.data.length > 0) {
    return data.data.map((item: { url?: string; b64_json?: string }) => {
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      return item.url;
    }).filter(Boolean) as string[];
  }
  
  throw new Error('未能从响应中获取图片 URL');
}

/**
 * 使用 GPT Image 2 编辑图片 (Images Edits API 格式 - multipart/form-data)
 * 支持：图片编辑、美化、合并、修改
 */
async function generateSingleImageWithGPTImage2EditFormData(formData: FormData, modelConfig: ReturnType<typeof getModelConfig>): Promise<string> {
  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/edits';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${modelConfig.apiKey}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  console.log(`[GPT Image 2 Edit] HTTP状态码: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GPT Image 2 Edit] 错误: ${response.status}`, errorText.substring(0, 500));
    throw new Error(`API 错误: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const responseText = await response.text();
  console.log(`[GPT Image 2 Edit] 响应: ${responseText.substring(0, 500)}`);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error(`[GPT Image 2 Edit] 响应不是有效 JSON`);
    throw new Error('API 返回格式错误');
  }

  if (data.data && data.data.length > 0) {
    const item = data.data[0];
    if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item.url) return item.url;
  }

  if (data.choices && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice.message?.content) {
      const content = choice.message.content;
      const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) return urlMatch[0];
      if (content.startsWith('http')) return content;
      if (content.startsWith('data:image')) return content;
    }
  }

  if (data.url) {
    return data.url;
  }

  throw new Error('未能从响应中获取图片 URL');
}

async function generateSingleImageWithGPTImage2Edit(prompt: string, imageBlob: Blob, modelConfig: ReturnType<typeof getModelConfig>, size: string = '1024x1024'): Promise<string> {
  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/edits';
  const modelName = modelConfig.modelName || 'gpt-image-2-all';

  const formData = new FormData();
  formData.append('image', imageBlob, 'product.png');
  formData.append('prompt', prompt);
  formData.append('model', modelName);
  formData.append('n', '1');
  formData.append('size', size);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${modelConfig.apiKey}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  console.log(`[GPT Image 2 Edit] HTTP状态码: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GPT Image 2 Edit] 错误: ${response.status}`, errorText.substring(0, 500));
    throw new Error(`API 错误: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const responseText = await response.text();
  console.log(`[GPT Image 2 Edit] 响应: ${responseText.substring(0, 500)}`);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error(`[GPT Image 2 Edit] 响应不是有效 JSON`);
    throw new Error('API 返回格式错误');
  }

  if (data.data && data.data.length > 0) {
    const item = data.data[0];
    if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item.url) return item.url;
  }

  if (data.choices && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice.message?.content) {
      const content = choice.message.content;
      const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) return urlMatch[0];
      if (content.startsWith('http')) return content;
      if (content.startsWith('data:image')) return content;
    }
  }

  if (data.url) {
    return data.url;
  }

  throw new Error('未能从响应中获取图片 URL');
}

export async function generateWithGPTImage2Edit(prompt: string, referenceImages: string[] = [], n: number = 1, size: string = '1024x1024', quality: string = 'high'): Promise<string[]> {
  const modelConfig = getModelConfig('gpt-image-2-edit');
  
  if (!modelConfig.apiKey) {
    throw new Error('GPT Image 2 (编辑) API Key 未配置');
  }

  if (referenceImages.length === 0) {
    throw new Error('图片编辑需要提供参考图片');
  }

  const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/edits';
  const modelName = modelConfig.modelName || 'gpt-image-2-all';

  console.log(`[GPT Image 2 Edit] 请求: ${endpoint}`);
  console.log(`[GPT Image 2 Edit] prompt: ${prompt}`);
  console.log(`[GPT Image 2 Edit] model: ${modelName}`);
  console.log(`[GPT Image 2 Edit] n: ${n}, size: ${size}, quality: ${quality}`);
  console.log(`[GPT Image 2 Edit] 参考图片数量: ${referenceImages.length}`);

  const imageBlobs: Blob[] = [];
  for (const referenceImage of referenceImages) {
    let imageBlob: Blob;
    if (referenceImage.startsWith('data:')) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1] || 'image/png';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      imageBlob = new Blob([byteArray], { type: mimeType });
    } else if (referenceImage.startsWith('http')) {
      const imageResponse = await fetch(referenceImage);
      imageBlob = await imageResponse.blob();
    } else {
      const byteCharacters = atob(referenceImage);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      imageBlob = new Blob([byteArray], { type: 'image/png' });
    }
    imageBlobs.push(imageBlob);
    console.log(`[GPT Image 2 Edit] 图片 ${imageBlobs.length} 大小: ${imageBlob.size} bytes`);
  }

  const results: string[] = [];
  
  for (let i = 0; i < n; i++) {
    console.log(`[GPT Image 2 Edit] 正在生成第 ${i + 1}/${n} 张图片`);
    try {
      const formData = new FormData();
      imageBlobs.forEach((blob, idx) => {
        formData.append('image', blob, `product_${idx + 1}.png`);
      });
      formData.append('prompt', prompt);
      formData.append('model', modelName);
      formData.append('n', '1');
      formData.append('size', size);
      formData.append('quality', quality);

      const url = await generateSingleImageWithGPTImage2EditFormData(formData, modelConfig);
      results.push(url);
    } catch (error) {
      console.error(`[GPT Image 2 Edit] 生成第 ${i + 1} 张图片失败:`, error);
      if (i === n - 1) {
        throw error;
      }
    }
    if (i < n - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[GPT Image 2 Edit] 成功生成 ${results.length} 张图片`);
  return results;
}
