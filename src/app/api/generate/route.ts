import { NextRequest, NextResponse } from 'next/server';
import { AMAZON_IMAGE_SPECS, ImageSpecType, getRecommendedSize } from '@/lib/image-specs';
import { getImageEditModelConfig, getModelConfig } from '@/lib/image-models';
import { createGeneration, getAllGenerationRecords, updateGeneration } from '@/lib/analytics';
import { parseUpstreamApiError } from '@/lib/upstream-api-error';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** 云雾 gpt-image-2-all 编辑接口支持的常见尺寸（见 Apifox /v1/images/edits） */
const SUPPORTED_EDIT_SIZES = new Set([
  '1024x1024', '1024x1536', '1536x1024',
  '2048x2048', '2048x1536', '1536x2048', '2048x1152', '1152x2048',
  // 新增尺寸
  '2880x2880', '2416x1008', '1664x1008', '1472x3040', '1088x3264',
]);

function normalizeEditSize(width: number, height: number): string {
  const size = `${width}x${height}`;
  if (SUPPORTED_EDIT_SIZES.has(size)) return size;
  // 亚马逊九宫格：优先用文档支持的最大正方形
  if (width >= 2880 && height >= 2880) return '2880x2880';
  if (width >= 2048 && height >= 2048) return '2048x2048';
  if (width >= 1536 && height >= 1536) return '1536x1536';
  return '1024x1024';
}

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

async function translateToEnglish(text: string): Promise<string> {
  const { getTextModelFallback } = await import('@/lib/image-models');
  const model = getTextModelFallback();

  if (!model.apiKey || !model.endpoint) {
    return text;
  }

  try {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in e-commerce product photography prompts. Translate the following Chinese prompt to English. Output ONLY the English translation, nothing else. Maintain all technical photography terms, product details, and artistic directions.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return text;
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    return translated || text;
  } catch {
    return text;
  }
}


function shouldKeepPendingForRecovery(error: unknown, clientRequestId?: string): boolean {
  if (!clientRequestId) return false;
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message === 'fetch failed';
}

function extractImageUrls(data: unknown): string[] {
  const imageUrls: string[] = [];
  const payload = data as { data?: Array<{ b64_json?: string; url?: string }>; url?: string };

  if (payload.data && payload.data.length > 0) {
    for (const item of payload.data) {
      if (item.b64_json) {
        const b64 = item.b64_json;
        imageUrls.push(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);
      } else if (item.url) {
        imageUrls.push(item.url);
      }
    }
  }

  if (imageUrls.length === 0 && payload.url) {
    imageUrls.push(payload.url);
  }

  if (imageUrls.length === 0 && typeof data === 'string') {
    const urlMatch = data.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/gi);
    if (urlMatch) {
      imageUrls.push(urlMatch[0]);
    }
  }

  return imageUrls;
}

async function imageToBlob(referenceImage: string): Promise<Blob> {
  if (referenceImage.startsWith('data:')) {
    const base64Data = referenceImage.split(',')[1];
    const mimeType = referenceImage.split(';')[0].split(':')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  const imageResponse = await fetch(referenceImage);
  if (!imageResponse.ok) {
    throw new Error(`参考图读取失败：${imageResponse.status}`);
  }
  return imageResponse.blob();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let generationId: string | null = null;
  const sessionId = request.headers.get('X-Session-ID') || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  try {
    console.log('[Generate API] POST received, before request.json');
    const body = await request.json();
    console.log('[Generate API] request.json completed');
    const { 
      clientRequestId,
      product,
      scene, 
      size = '1024x1024', 
      specType = 'main',
      prompt,
      referenceImage,
      referenceImages,
      styleReferenceImage,
      model,
      quality = 'high',
      n: requestN,
      // Deep workflow specific fields
      workflow,
      listingIndex,
      listingType,
      designBibleId,
    } = body;

    const imageCount = Math.min(Math.max(Number(requestN) || 1, 1), 4);
    const finalReferenceImages = referenceImages || (referenceImage ? [referenceImage] : []);
    let finalPrompt = prompt;
    const skipTranslation = body.skipTranslation === true;

    // 只有不跳过翻译且不是亚马逊九宫格模板时才翻译
    if (finalPrompt && containsChinese(finalPrompt) && !skipTranslation) {
      console.log('[Generate API] 检测到中文提示词，自动翻译为英文...');
      const translated = await translateToEnglish(finalPrompt);
      if (translated !== finalPrompt) {
        console.log('[Generate API] 翻译结果:', translated.substring(0, 100));
        finalPrompt = translated;
      }
    } else if (skipTranslation && containsChinese(finalPrompt)) {
      console.log('[Generate API] 跳过中文翻译（skipTranslation=true）');
    }
    
    if (!finalPrompt && product && scene) {
      finalPrompt = `Professional product photography of ${product}, ${scene} theme, high-end advertising style, soft studio lighting, clean background, commercial quality, suitable for e-commerce platform`;
    }
    
    if (!finalPrompt) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：prompt 或 product + scene' },
        { status: 400 }
      );
    }

    const spec = AMAZON_IMAGE_SPECS[specType as ImageSpecType];
    const [width, height] = size.split('x').map(Number);
    
    const requestClientId = typeof clientRequestId === 'string' ? clientRequestId.trim() : '';
    if (requestClientId) {
      const generations = await getAllGenerationRecords();
      generations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const existingSuccess = generations.find(
        (generation) => generation.clientRequestId === requestClientId && generation.status === 'success' && generation.imageUrl
      );
      if (existingSuccess?.imageUrl) {
        return NextResponse.json({
          success: true,
          url: existingSuccess.imageUrl,
          urls: [existingSuccess.imageUrl],
          size,
          specType,
          model: existingSuccess.model,
          recovered: true,
        });
      }

      const existingPending = generations.find(
        (generation) => generation.clientRequestId === requestClientId && generation.status === 'pending'
      );
      if (existingPending) {
        return NextResponse.json(
          { success: true, status: 'pending', generationId: existingPending.id },
          { status: 202 }
        );
      }
    }

    const generationModel = finalReferenceImages.length > 0 ? model : 'gpt-image-2-gen';
    const generationPayload: Omit<Parameters<typeof createGeneration>[0], 'clientRequestId'> & { clientRequestId?: string; workflow?: string; listingIndex?: number; listingType?: string; designBibleId?: string } = {
      sessionId,
      prompt: finalPrompt,
      size,
      quality,
      model: generationModel || 'gpt-image-2',
      count: imageCount,
      status: 'pending',
    };

    if (requestClientId) {
      generationPayload.clientRequestId = requestClientId;
    }

    // Add deep workflow specific fields
    if (workflow === 'deep-ecommerce') {
      generationPayload.workflow = workflow;
      generationPayload.listingIndex = listingIndex;
      generationPayload.listingType = listingType;
      generationPayload.designBibleId = designBibleId;
    }

    generationId = (await createGeneration(generationPayload)).id;
    
    if (spec) {
      if (spec.minWidth && width < spec.minWidth) {
        return NextResponse.json(
          { success: false, error: `图片宽度不足：${width}px < ${spec.minWidth}px` },
          { status: 400 }
        );
      }

      if (spec.minHeight && height < spec.minHeight) {
        return NextResponse.json(
          { success: false, error: `图片高度不足：${height}px < ${spec.minHeight}px` },
          { status: 400 }
        );
      }
    }

    if (finalReferenceImages.length > 0) {
      console.log('[Generate API] 使用 GPT Image 2 编辑模型（有参考图）');
      console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100) + '...');
      console.log('[Generate API] 参考图数量:', finalReferenceImages.length);
      
      const modelConfig = getImageEditModelConfig();
      
      if (!modelConfig.apiKey) {
        console.error('[Generate API] GPT Image 2 编辑 API Key 未配置');
        return NextResponse.json(
          { success: false, error: '图片生成失败：GPT Image 2 编辑 API Key 未配置（GPT_IMAGE_2_API_KEY 或 YUNWU_API_KEY）' },
          { status: 400 }
        );
      }

      const endpoint = modelConfig.endpoint!;
      const modelName = modelConfig.modelName!;
      const editSize = normalizeEditSize(width, height);
      if (editSize !== `${width}x${height}`) {
        console.warn(
          `[Generate API] 尺寸 ${width}x${height} 不在编辑接口支持列表，已调整为 ${editSize}`
        );
      }

      try {
        const imageBlobs: Blob[] = [];
        
        for (const referenceImage of finalReferenceImages) {
          console.log('[Generate API] imageToBlob start');
          imageBlobs.push(await imageToBlob(referenceImage));
          console.log('[Generate API] imageToBlob completed');
        }

        let styleRefBlob: Blob | null = null;
        if (styleReferenceImage) {
          styleRefBlob = await imageToBlob(styleReferenceImage);
        }

        let promptForEdit = finalPrompt;
        if (styleReferenceImage) {
          promptForEdit = `${finalPrompt}, Maintain visual style consistency with the reference image: same color palette, lighting, and overall aesthetic`;
        }

        const formData = new FormData();
        imageBlobs.forEach((blob, index) => {
          formData.append('image', blob, `product_${index + 1}.png`);
        });
        if (styleRefBlob) {
          formData.append('image', styleRefBlob, 'style_reference.png');
        }
        formData.append('prompt', promptForEdit);
        formData.append('model', modelName);
        formData.append('n', String(imageCount));
        formData.append('size', editSize);

        console.log('[Generate API] 发送请求到:', endpoint, '(images/edits)');
        console.log('[Generate API] 参考图片数量:', imageBlobs.length);
        imageBlobs.forEach((blob, i) => {
          console.log(`[Generate API] 图片 ${i + 1} 大小:`, blob.size, 'bytes');
        });
        console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100));
        console.log('[Generate API] 模型:', modelName);
        console.log('[Generate API] 尺寸:', `${width}x${height}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${modelConfig.apiKey}`,
            'Accept': 'application/json',
          },
          body: formData,
        });

        console.log('[Generate API] HTTP状态码:', response.status);
        
        if (!response.ok) {
          const text = await response.text();
          const upstream = parseUpstreamApiError(response.status, text);
          console.error('[Generate API] 生图失败 - 状态码:', response.status, 'requestId:', upstream.requestId);
          console.error('[Generate API] 响应内容:', text.substring(0, 500));
          return NextResponse.json(
            {
              success: false,
              error: `图片生成失败：API 返回错误 ${response.status}，${upstream.message.substring(0, 200)}`,
              requestId: upstream.requestId,
              upstreamStatus: response.status,
            },
            { status: response.status === 429 ? 429 : 500 }
          );
        }

        const responseText = await response.text();
        console.log('[Generate API] 响应内容:', responseText.substring(0, 500));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error('[Generate API] 响应不是有效 JSON');
          return NextResponse.json(
            { success: false, error: '图片生成失败：API 返回格式错误' },
            { status: 500 }
          );
        }
        
        const imageUrls = extractImageUrls(data);
        
        if (imageUrls.length > 0) {
          console.log(`[Generate API] 图片生成成功: ${imageUrls.length} 张`);
          if (generationId) {
            await updateGeneration(generationId, {
              status: 'success',
              imageUrl: imageUrls[0],
              duration: Date.now() - startTime,
            });
          }
          return NextResponse.json({
            success: true,
            url: imageUrls[0],
            urls: imageUrls,
            size,
            specType,
            model: modelName,
          });
        }

        console.error('[Generate API] 无法从响应中提取图片 URL');
        if (generationId) {
          await updateGeneration(generationId, {
            status: 'failed',
            error: '无法获取图片 URL',
            duration: Date.now() - startTime,
          });
        }
        return NextResponse.json(
          { success: false, error: '图片生成失败：无法获取图片 URL' },
          { status: 500 }
        );
      } catch (error) {
        const cause = error instanceof Error && 'cause' in error ? error.cause : undefined;
        console.error('[Generate API] 调用失败:', error, 'cause:', cause);
        if (generationId) {
          await updateGeneration(generationId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '未知错误',
            duration: Date.now() - startTime,
          });
        }
        return NextResponse.json(
          { success: false, error: `图片生成失败：${error instanceof Error ? error.message : '未知错误'}` },
          { status: 500 }
        );
      }
    }

    console.log('[Generate API] 使用 GPT Image 2 生成模型（无参考图）');
    console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100) + '...');
    
    const modelConfig = getModelConfig('gpt-image-2-gen');
    
    if (!modelConfig.apiKey) {
      console.error('[Generate API] 图片生成 API Key 未配置');
      return NextResponse.json(
        { success: false, error: '图片生成失败：API Key 未配置' },
        { status: 400 }
      );
    }

    const genEndpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/generations';
    const modelName = modelConfig.modelName || 'gpt-image-2';

    try {
      const requestBody: Record<string, unknown> = {
        model: modelName,
        prompt: finalPrompt,
        n: imageCount,
        size: `${width}x${height}`,
      };

      if (quality) {
        requestBody.quality = quality;
      }

      console.log('[Generate API] 发送请求到:', genEndpoint);
      console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100));
      console.log('[Generate API] 模型:', modelName);
      console.log('[Generate API] 尺寸:', `${width}x${height}`);
      
      const response = await fetch(genEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Generate API] HTTP状态码:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        const upstream = parseUpstreamApiError(response.status, text);
        console.error('[Generate API] 生图失败 - 状态码:', response.status, 'requestId:', upstream.requestId);
        console.error('[Generate API] 响应内容:', text.substring(0, 500));
        return NextResponse.json(
          {
            success: false,
            error: `图片生成失败：API 返回错误 ${response.status}，${upstream.message.substring(0, 200)}`,
            requestId: upstream.requestId,
            upstreamStatus: response.status,
          },
          { status: response.status === 429 ? 429 : 500 }
        );
      }

      const responseText = await response.text();
      console.log('[Generate API] 响应内容:', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('[Generate API] 响应不是有效 JSON');
        return NextResponse.json(
          { success: false, error: '图片生成失败：API 返回格式错误' },
          { status: 500 }
        );
      }
      
      const imageUrls = extractImageUrls(data);
      
      if (imageUrls.length > 0) {
        console.log(`[Generate API] 图片生成成功: ${imageUrls.length} 张`);
        if (generationId) {
          await updateGeneration(generationId, {
            status: 'success',
            imageUrl: imageUrls[0],
            duration: Date.now() - startTime,
          });
        }
        return NextResponse.json({
          success: true,
          url: imageUrls[0],
          urls: imageUrls,
          size,
          specType,
          model: modelName,
        });
      }

      console.error('[Generate API] 无法从响应中提取图片 URL');
      if (generationId) {
        await updateGeneration(generationId, {
          status: 'failed',
          error: '无法获取图片 URL',
          duration: Date.now() - startTime,
        });
      }
      return NextResponse.json(
        { success: false, error: '图片生成失败：无法获取图片 URL' },
        { status: 500 }
      );
    } catch (error) {
      console.error('[Generate API] 调用失败:', error);
      if (generationId) {
        if (shouldKeepPendingForRecovery(error, requestClientId)) {
          await updateGeneration(generationId, {
            status: 'pending',
            duration: Date.now() - startTime,
          });
        } else {
          await updateGeneration(generationId, {
            status: 'failed',
            error: error instanceof Error ? error.message : '未知错误',
            duration: Date.now() - startTime,
          });
        }
      }
      return NextResponse.json(
        { success: false, error: `图片生成失败：${error instanceof Error ? error.message : '未知错误'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
    if (generationId) {
      await updateGeneration(generationId, {
        status: 'failed',
        error: error instanceof Error ? error.message : '服务器内部错误',
        duration: Date.now() - startTime,
      });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const specs = Object.entries(AMAZON_IMAGE_SPECS).map(([key, spec]) => ({
      type: key,
      name: spec.name,
      description: spec.description,
      minWidth: spec.minWidth,
      minHeight: spec.minHeight,
      maxSizeMB: spec.maxSizeMB,
      allowedFormats: spec.allowedFormats,
      sizes: spec.sizes,
      recommendedSize: getRecommendedSize(key as ImageSpecType),
    }));

    return NextResponse.json({
      success: true,
      specs,
      defaultSpec: 'main',
    });
  } catch (error) {
    console.error('Get image specs error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
