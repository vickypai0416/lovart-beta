import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { AMAZON_IMAGE_SPECS, ImageSpecType, getRecommendedSize } from '@/lib/image-specs';
import { getModelConfig } from '@/lib/image-models';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      product, 
      scene, 
      size = '1024x1024', 
      specType = 'main',
      prompt,
      referenceImage,
      styleReferenceImage,
      model,
      quality = 'high',
      n: requestN,
    } = body;

    const imageCount = Math.min(Math.max(Number(requestN) || 1, 1), 4);

    let finalPrompt = prompt;

    if (finalPrompt && containsChinese(finalPrompt)) {
      console.log('[Generate API] 检测到中文提示词，自动翻译为英文...');
      const translated = await translateToEnglish(finalPrompt);
      if (translated !== finalPrompt) {
        console.log('[Generate API] 翻译结果:', translated.substring(0, 100));
        finalPrompt = translated;
      }
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

    if (model === 'gpt-image-2-all' && !referenceImage) {
      console.log('[Generate API] 使用 GPT Image 2 All 文生图模式（无参考图）');
      console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100) + '...');
      
      const modelConfig = getModelConfig('gpt-image-2-all');
      
      if (!modelConfig.apiKey) {
        console.error('[Generate API] GPT Image 2 All API Key 未配置');
        return NextResponse.json(
          { success: false, error: '图片生成失败：GPT Image 2 All API Key 未配置' },
          { status: 400 }
        );
      }

      const genEndpoint = 'https://yunwu.ai/v1/images/generations';
      const modelName = modelConfig.modelName || 'gpt-image-2-all';

      try {
        const requestBody: Record<string, unknown> = {
          model: modelName,
          prompt: finalPrompt,
          n: imageCount,
          size: `${width}x${height}`,
          quality: quality,
        };

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
          console.error('[Generate API] 生图失败 - 状态码:', response.status);
          console.error('[Generate API] 响应内容:', text.substring(0, 500));
          return NextResponse.json(
            { success: false, error: `图片生成失败：API 返回错误 ${response.status}` },
            { status: 500 }
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
        
        let imageUrls: string[] = [];
        
        if (data.data && data.data.length > 0) {
          for (const item of data.data) {
            if (item.b64_json) {
              const b64 = item.b64_json;
              imageUrls.push(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);
            } else if (item.url) {
              imageUrls.push(item.url);
            }
          }
        }
        
        if (imageUrls.length === 0 && data.url) {
          imageUrls.push(data.url);
        }
        
        if (imageUrls.length > 0) {
          console.log(`[Generate API] 图片生成成功: ${imageUrls.length} 张`);
          return NextResponse.json({
            success: true,
            url: imageUrls[0],
            urls: imageUrls,
            size,
            specType,
            model: 'gpt-image-2-all',
          });
        } else {
          console.error('[Generate API] 无法从响应中提取图片 URL');
          return NextResponse.json(
            { success: false, error: '图片生成失败：无法获取图片 URL' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('[Generate API] 调用失败:', error);
        return NextResponse.json(
          { success: false, error: `图片生成失败：${error instanceof Error ? error.message : '未知错误'}` },
          { status: 500 }
        );
      }
    }

    if (referenceImage) {
      console.log('[Generate API] 使用 GPT Image 2 编辑模型（有参考图）');
      console.log('[Generate API] 提示词:', finalPrompt.substring(0, 100) + '...');
      
      const modelConfig = getModelConfig(model === 'gpt-image-2-all' ? 'gpt-image-2-all' : 'gpt-image-2-edit');
      
      if (!modelConfig.apiKey) {
        console.error('[Generate API] GPT Image 2 编辑模型 API Key 未配置');
        return NextResponse.json(
          { success: false, error: '图片生成失败：GPT Image 2 编辑模型 API Key 未配置' },
          { status: 400 }
        );
      }

      const endpoint = modelConfig.endpoint || 'https://yunwu.ai/v1/images/edits';
      const modelName = modelConfig.modelName || 'gpt-image-2-all';

      try {
        let imageBlob: Blob;
        if (referenceImage.startsWith('data:')) {
          const base64Data = referenceImage.split(',')[1];
          const mimeType = referenceImage.split(';')[0].split(':')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          imageBlob = new Blob([byteArray], { type: mimeType });
        } else {
          const imageResponse = await fetch(referenceImage);
          imageBlob = await imageResponse.blob();
        }

        let styleRefBlob: Blob | null = null;
        if (styleReferenceImage) {
          if (styleReferenceImage.startsWith('data:')) {
            const base64Data = styleReferenceImage.split(',')[1];
            const mimeType = styleReferenceImage.split(';')[0].split(':')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            styleRefBlob = new Blob([byteArray], { type: mimeType });
          } else {
            const imageResponse = await fetch(styleReferenceImage);
            styleRefBlob = await imageResponse.blob();
          }
        }

        let promptForEdit = finalPrompt;
        if (styleReferenceImage) {
          promptForEdit = `${finalPrompt}, Maintain visual style consistency with the reference image: same color palette, lighting, and overall aesthetic`;
        }

        const formData = new FormData();
        formData.append('image', imageBlob, 'product.png');
        if (styleRefBlob) {
          formData.append('image', styleRefBlob, 'style_reference.png');
        }
        formData.append('prompt', promptForEdit);
        formData.append('model', modelName);
        formData.append('n', String(imageCount));
        formData.append('size', `${width}x${height}`);
        formData.append('quality', quality);

        console.log('[Generate API] 发送请求到:', endpoint);
        console.log('[Generate API] 参考图片大小:', imageBlob.size, 'bytes');
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
          console.error('[Generate API] 生图失败 - 状态码:', response.status);
          console.error('[Generate API] 响应内容:', text.substring(0, 500));
          return NextResponse.json(
            { success: false, error: `图片生成失败：API 返回错误 ${response.status}` },
            { status: 500 }
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
        
        let imageUrls: string[] = [];
        
        if (data.data && data.data.length > 0) {
          for (const item of data.data) {
            if (item.b64_json) {
              const b64 = item.b64_json;
              imageUrls.push(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);
            } else if (item.url) {
              imageUrls.push(item.url);
            }
          }
        }
        
        if (imageUrls.length === 0 && data.url) {
          imageUrls.push(data.url);
        }
        
        if (imageUrls.length === 0 && typeof data === 'string') {
          const urlMatch = data.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/gi);
          if (urlMatch) {
            imageUrls.push(urlMatch[0]);
          }
        }
        
        if (imageUrls.length > 0) {
          console.log(`[Generate API] 图片生成成功: ${imageUrls.length} 张`);
          return NextResponse.json({
            success: true,
            url: imageUrls[0],
            urls: imageUrls,
            size,
            specType,
            model: model || 'gpt-image-2-edit',
          });
        } else {
          console.error('[Generate API] 无法从响应中提取图片 URL');
          return NextResponse.json(
            { success: false, error: '图片生成失败：无法获取图片 URL' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('[Generate API] 调用失败:', error);
        return NextResponse.json(
          { success: false, error: `图片生成失败：${error instanceof Error ? error.message : '未知错误'}` },
          { status: 500 }
        );
      }
    }

    console.log('[Generate API] 使用 Coze SDK 生成图片（无参考图片）');
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const response = await client.generate({
      prompt: finalPrompt,
      size: `${width}x${height}`,
      watermark: false,
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        url: helper.imageUrls[0],
        size: `${width}x${height}`,
        specType,
        model: 'coze',
      });
    } else {
      return NextResponse.json(
        { success: false, error: helper.errorMessages.join(', ') || '图片生成失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
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
