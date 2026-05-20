import { NextRequest } from 'next/server';
import { 
  ImageModel, 
  getModelConfig
} from '@/lib/image-models';
import { getPersonaById } from '@/lib/persona';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received request');
    const body = await request.json();
    const { messages, model: selectedModel, autoGenerate, n = 1, persona = 'default', size = '1024x1024', quality = 'high', referenceImages = [] } = body as {
      messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
      model?: ImageModel;
      autoGenerate?: boolean;
      n?: number;
      persona?: string;
      size?: string;
      quality?: string;
      referenceImages?: string[];
    };

    console.log('[API] Request params:', { 
      model: selectedModel, 
      persona, 
      messageCount: messages.length,
      hasReferenceImages: referenceImages.length > 0 || messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'))
    });

    const personaConfig = getPersonaById(persona);

    let extractedReferenceImages: string[] = referenceImages.length > 0 ? referenceImages : [];
    if (extractedReferenceImages.length === 0 && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (Array.isArray(lastMessage.content)) {
        const imageContents = lastMessage.content.filter((c) => c.type === 'image_url' && c.image_url?.url);
        extractedReferenceImages = imageContents.map((c) => c.image_url!.url);
      }
    }

    const requestedModelId: ImageModel = selectedModel || 'gpt-5-nano';
    const imageModelIds: ImageModel[] = ['gpt-image-2', 'gpt-image-2-gen', 'gpt-image-2-edit', 'gpt-image-2-all', 'gpt-4o-image', 'openai-dalle'];
    const forceTextForAmazonExpert = persona === 'amazon-expert' && imageModelIds.includes(requestedModelId);
    const modelId: ImageModel = forceTextForAmazonExpert ? 'gpt-5.4' : requestedModelId;
    const modelConfig = getModelConfig(modelId);
    
    console.log(`[API] 使用模型: ${modelId} (${modelConfig.name})`);
    console.log(`[API] 模型类型: ${modelConfig.type}, 模型名: ${modelConfig.modelName}`);
    console.log(`[API] available: ${modelConfig.available}, apiKey: ${modelConfig.apiKey ? modelConfig.apiKey.substring(0, 10) + '...' : '未配置'}`);
    console.log(`[API] 自动生成: ${autoGenerate ? '是' : '否'}`);
    if (extractedReferenceImages.length > 0) {
      console.log(`[API] 包含参考图片: ${extractedReferenceImages.length} 张`);
    } else {
      console.log(`[API] 不包含参考图片`);
    }

    if (!modelConfig.available) {
      return new Response(
        JSON.stringify({ 
          error: `模型 ${modelConfig.name} 未配置 API Key，请在配置文件中添加` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
          
          if (modelConfig.type === 'text') {
            console.log(`[API] 使用 ${modelConfig.name} 处理用户消息`);
            console.log(`[API] 使用人设: ${personaConfig.name}`);
            await generateWithYunwuAPIStream(
              modelId, 
              messages, 
              controller, 
              encoder,
              autoGenerate,
              personaConfig.systemPrompt
            );
          } else {
            console.log(`[API] 使用 ${modelConfig.name} 生成图片`);
            await generateImageDirectly(modelId, userPrompt, extractedReferenceImages, controller, encoder, n, size, quality);
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
          }
        } finally {
          try {
            controller.close();
          } catch {
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
  
  if (data.choices && data.choices.length > 0) {
    const message = data.choices[0].message;
    
    if (message?.content && typeof message.content === 'string') {
      const urlMatch = message.content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
      
      if (message.content.startsWith('http')) {
        return message.content;
      }
    }
    
    if (message?.image_url) {
      return message.image_url;
    }
    
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    }
  }
  
  console.log(`${modelConfig.name} response:`, JSON.stringify(data, null, 2));
  
  if (data.choices && data.choices.length > 0) {
    const message = data.choices[0].message;
    if (message?.content && typeof message.content === 'string') {
      return `TEXT_RESPONSE:${message.content}`;
    }
  }
  
  throw new Error('未能从响应中获取有效内容');
}

async function generateWithYunwuAPIStream(
  modelId: ImageModel,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  autoGenerate?: boolean,
  customSystemPrompt?: string
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

  const hasImage = messages.some(m => 
    Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' && c.image_url?.url)
  );

  let systemPrompt = customSystemPrompt || 'You are a helpful assistant. 请始终使用中文回复用户。';
  
  if (autoGenerate && hasImage) {
    systemPrompt = `你是一个专业的亚马逊商品图提示词专家。

【重要规则】
- 你必须始终使用中文进行所有回复和分析
- 图片生成提示词也使用中文

当用户提供产品图片和需求时，请按以下步骤操作：
1. 仔细分析产品特征（材质、颜色、形状、用途等）
2. 理解用户的场景需求
3. 生成专业的亚马逊商品图提示词
4. 提示词要包含：构图、光线、背景、风格、质量要求
5. 确保提示词适合电商平台展示

请直接输出优化后的提示词，不需要额外解释。`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'text',
                  content: fullContent,
                  done: false,
                })}\n\n`
              )
            );
          }
        } catch (e) {
          console.error('解析 SSE 数据失败:', e);
        }
      }
    }

    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'text',
          content: fullContent,
          done: true,
        })}\n\n`
      )
    );
    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
  } catch (error) {
    console.error('流式生成失败:', error);
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : '生成失败',
        })}\n\n`
      )
    );
    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
  }
}

async function generateWithGPT4oImage(prompt: string, referenceImages: string[] = [], size: string = '1024x1024'): Promise<string | null> {
  return generateWithYunwuAPI('gpt-4o-image', prompt, referenceImages, size);
}

async function generateWithGPTImage2(prompt: string, referenceImages: string[] = [], size: string = '1024x1024'): Promise<string | null> {
  const results = await generateWithGPTImage2Edit(prompt, referenceImages, 1, size, 'high');
  return results[0] || null;
}

async function generateWithGPTImage2Gen(prompt: string, n: number = 1, size: string = '1024x1024', quality: string = 'high'): Promise<string[]> {
  const modelConfig = getModelConfig('gpt-image-2-gen');
  if (!modelConfig.apiKey) {
    throw new Error('GPT Image 2 Gen API Key 未配置');
  }

  const response = await fetch('https://yunwu.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.modelName || 'gpt-image-2-all',
      prompt,
      n: Math.min(n, 4),
      size,
      quality,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GPT Image 2 Gen API 错误: ${response.status} - ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const urls: string[] = [];
  if (Array.isArray(data?.data)) {
    for (const item of data.data) {
      if (item?.url) urls.push(item.url);
      if (item?.b64_json) urls.push(item.b64_json.startsWith('data:') ? item.b64_json : `data:image/png;base64,${item.b64_json}`);
    }
  }
  if (urls.length === 0 && data?.url) urls.push(data.url);
  return urls;
}

async function generateWithGPTImage2Edit(prompt: string, referenceImages: string[] = [], n: number = 1, size: string = '1024x1024', quality: string = 'high'): Promise<string[]> {
  const modelConfig = getModelConfig('gpt-image-2-edit');
  if (!modelConfig.apiKey) {
    throw new Error('GPT Image 2 Edit API Key 未配置');
  }

  if (referenceImages.length === 0) {
    return generateWithGPTImage2Gen(prompt, n, size, quality);
  }

  const formData = new FormData();
  for (let i = 0; i < referenceImages.length; i++) {
    const img = referenceImages[i];
    let blob: Blob;
    if (img.startsWith('data:')) {
      const base64Data = img.split(',')[1];
      const mimeType = img.split(';')[0].split(':')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    } else {
      const imageResponse = await fetch(img);
      blob = await imageResponse.blob();
    }
    formData.append('image', blob, `product_${i + 1}.png`);
  }

  formData.append('prompt', prompt);
  formData.append('model', modelConfig.modelName || 'gpt-image-2-all');
  formData.append('n', String(Math.min(n, 4)));
  formData.append('size', size);
  formData.append('quality', quality);

  const response = await fetch(modelConfig.endpoint || 'https://yunwu.ai/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${modelConfig.apiKey}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GPT Image 2 Edit API 错误: ${response.status} - ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const urls: string[] = [];

  if (Array.isArray(data?.data)) {
    for (const item of data.data) {
      if (item?.url) urls.push(item.url);
      if (item?.b64_json) urls.push(item.b64_json.startsWith('data:') ? item.b64_json : `data:image/png;base64,${item.b64_json}`);
    }
  }
  if (urls.length === 0 && data?.url) urls.push(data.url);
  if (urls.length === 0 && typeof data === 'string') {
    const match = data.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
    if (match) urls.push(match[0]);
  }

  return urls;
}

export { 
  generateWithGPTImage2Edit, 
  generateWithGPTImage2Gen, 
  generateWithGPTImage2, 
  generateWithGPT4oImage,
  generateWithYunwuAPIStream,
  generateImageDirectly,
  enhanceProductPrompt
};
