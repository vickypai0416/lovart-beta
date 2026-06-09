import { NextRequest, NextResponse } from 'next/server';
import { generateWithGPTImage2Edit } from '../chat/route';
import { ListingPrompt } from '@/lib/amazon/prompt-generator';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompts } = await request.json();

    if (!imageUrl || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { error: '缺少必要参数：imageUrl 或 prompts' },
        { status: 400 }
      );
    }

    if (!process.env.YUNWU_API_KEY) {
      return NextResponse.json(
        { error: '未配置 API Key' },
        { status: 500 }
      );
    }

    const results: {
      index: number;
      type: string;
      purpose: string;
      prompt: string;
      url?: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const promptItem = prompts[i] as ListingPrompt;
      
      console.log(`[Generate Listing] 正在生成第 ${i + 1}/${prompts.length} 张图片: ${promptItem.type}`);

      try {
        const imageUrlResults = await generateWithGPTImage2Edit(promptItem.prompt, [imageUrl]);
        const imageUrlResult = imageUrlResults[0];
        
        if (imageUrlResult) {
          const isAccessible = await checkUrlAccessibility(imageUrlResult);
          
          if (isAccessible) {
            results.push({
              index: promptItem.index,
              type: promptItem.type,
              purpose: promptItem.purpose,
              prompt: promptItem.prompt,
              url: imageUrlResult,
              success: true,
            });
          } else {
            console.warn(`[Generate Listing] 图片 ${i + 1} URL 不可访问，重试...`);
            const retryResults = await generateWithGPTImage2Edit(promptItem.prompt, [imageUrl]);
            const retryUrl = retryResults[0];
            
            if (retryUrl && await checkUrlAccessibility(retryUrl)) {
              results.push({
                index: promptItem.index,
                type: promptItem.type,
                purpose: promptItem.purpose,
                prompt: promptItem.prompt,
                url: retryUrl,
                success: true,
              });
            } else {
              results.push({
                index: promptItem.index,
                type: promptItem.type,
                purpose: promptItem.purpose,
                prompt: promptItem.prompt,
                success: false,
                error: '图片生成失败或URL不可访问',
              });
            }
          }
        } else {
          results.push({
            index: promptItem.index,
            type: promptItem.type,
            purpose: promptItem.purpose,
            prompt: promptItem.prompt,
            success: false,
            error: '图片生成失败',
          });
        }

        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`[Generate Listing] 生成第 ${i + 1} 张图片失败:`, error);
        results.push({
          index: promptItem.index,
          type: promptItem.type,
          purpose: promptItem.purpose,
          prompt: promptItem.prompt,
          success: false,
          error: error instanceof Error ? error.message : '生成失败',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: successCount > 0,
      results,
      successCount,
      totalCount: prompts.length,
    });

  } catch (error) {
    console.error('[Generate Listing] 批量生成失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量生成失败' },
      { status: 500 }
    );
  }
}

async function checkUrlAccessibility(url: string, maxRetries: number = 3, delayMs: number = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return true;
    } catch {
      // 忽略错误
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}