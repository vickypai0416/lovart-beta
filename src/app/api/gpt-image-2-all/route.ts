import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToHost, transferImageToHost } from '@/lib/image-host';
import { createGeneration } from '@/lib/analytics';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * gpt-image-2-all（官逆·ChatGPT 线）
 * - 不支持 size 参数，尺寸通过 prompt 描述控制
 * - 最快，flat $0.03/张
 * - 调用 /v1/chat/completions 对话式端点
 */

function buildMessages(
  prompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  referenceImages: string[] = []
): Array<{ role: string; content: unknown }> {
  const messages: Array<{ role: string; content: unknown }> = [];

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  if (referenceImages.length > 0) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...referenceImages.map((url) => ({
          type: 'image_url' as const,
          image_url: { url },
        })),
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  return messages;
}

interface AllResponse {
  // 图片 API 风格（部分通道）：{ data: [{ url | b64_json }] }
  data?: Array<{ url?: string; b64_json?: string }>;
  // Chat Completions 格式：
  // { choices: [{ message: { content: "![image](url)\n\n说明文字" } }] }
  choices?: Array<{ message?: { content?: string } }>;
  created?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/** 从 Chat Completions 的 content（Markdown）里提取图片地址：![alt](url) 或 data URL */
function extractImageFromContent(content?: string): string | undefined {
  if (!content) return undefined;
  // Markdown 图片语法 ![...](url)
  const md = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (md?.[1]) return md[1].trim();
  // 裸 http(s) 链接兜底
  const httpMatch = content.match(/https?:\/\/[^\s"'<>)]+/);
  if (httpMatch?.[0]) return httpMatch[0].trim();
  // base64 data URL 兜底
  const dataMatch = content.match(/data:image\/[^\s"'<>)]+/);
  if (dataMatch?.[0]) return dataMatch[0].trim();
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      history = [],
      referenceImages = [],
      size, // gpt-image-2-all 不支持 size，仅用于记录
    } = body as {
      prompt?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      referenceImages?: string[];
      size?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: '请输入提示词' }, { status: 400 });
    }

    const apiKey = process.env.NEW_APIYI_KEY || process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key 未配置' }, { status: 400 });
    }

    // gpt-image-2-all 不支持 size 参数，尺寸由 prompt 描述控制
    const messages = buildMessages(prompt.trim(), history, referenceImages);

    const requestBody: Record<string, unknown> = {
      model: 'gpt-image-2-all',
      messages,
      // 注意：不传 size，尺寸由 prompt 描述决定
    };

    console.log('[gpt-image-2-all] Request:', {
      historyLength: history.length,
      referenceImages: referenceImages.length,
      prompt: prompt.trim().substring(0, 100),
      sizeNote: 'size 由 prompt 描述控制',
    });

    const response = await fetch('https://api.apiyi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[gpt-image-2-all] Response status:', response.status, 'preview:', responseText.substring(0, 300));

    if (!response.ok) {
      let errorMessage = `API 请求失败: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${responseText.slice(0, 200)}`;
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: response.status === 429 ? 429 : 500 });
    }

    let data: AllResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ success: false, error: '无法解析 API 响应格式' }, { status: 500 });
    }

    let imageUrl: string | undefined;

    // 1) 标准 Chat Completions 格式：
    //    choices[0].message.content 是 Markdown，含 ![image](url)
    const content = data.choices?.[0]?.message?.content;
    const fromContent = extractImageFromContent(content);
    if (fromContent) {
      if (fromContent.startsWith('data:')) {
        // 极少数返回 base64 data URL：转存图床，失败则原样返回
        const b64 = fromContent.split(',')[1] || '';
        try {
          imageUrl = await uploadImageToHost(Buffer.from(b64, 'base64'), `all-${Date.now()}.png`);
        } catch (hostError) {
          console.error('[gpt-image-2-all] 上传 base64 到图床失败:', hostError);
          imageUrl = fromContent;
        }
      } else if (fromContent.includes('imageproxy.zhongzhuan.chat')) {
        // 已是自建图床 url，无需转存
        imageUrl = fromContent;
      } else {
        // 上游临时 url：转存到自建图床，存稳定 url
        try {
          imageUrl = await transferImageToHost(fromContent, `all-${Date.now()}.png`);
        } catch (transferError) {
          console.error('[gpt-image-2-all] 转存上游 url 到图床失败，回退原始 url:', transferError);
          imageUrl = fromContent;
        }
      }
    }

    // 2) 兜底：图片 API 风格 { data: [{ url | b64_json }] }
    if (!imageUrl) {
      const item = data.data?.[0];
      if (item?.url) {
        if (item.url.includes('imageproxy.zhongzhuan.chat')) {
          imageUrl = item.url;
        } else {
          try {
            imageUrl = await transferImageToHost(item.url, `all-${Date.now()}.png`);
          } catch (transferError) {
            console.error('[gpt-image-2-all] 转存上游 url 到图床失败，回退原始 url:', transferError);
            imageUrl = item.url;
          }
        }
      } else if (item?.b64_json) {
        const hasPrefix = item.b64_json.startsWith('data:');
        const b64 = hasPrefix ? item.b64_json.split(',')[1] : item.b64_json;
        const buffer = Buffer.from(b64, 'base64');
        try {
          imageUrl = await uploadImageToHost(buffer, `all-${Date.now()}.png`);
        } catch (hostError) {
          console.error('[gpt-image-2-all] 上传 base64 到图床失败:', hostError);
          imageUrl = hasPrefix ? item.b64_json : `data:image/png;base64,${item.b64_json}`;
        }
      }
    }

    if (!imageUrl) {
      console.error('[gpt-image-2-all] 无法从响应提取图片，content:', content?.substring(0, 200));
      return NextResponse.json({ success: false, error: 'API 未返回图片' }, { status: 500 });
    }

    // 写入 generation 记录
    try {
      const sessionId =
        request.headers.get('X-Session-ID') ||
        `all-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await createGeneration({
        sessionId,
        prompt: prompt.trim(),
        size: size || 'auto',
        quality: 'auto',
        model: 'gpt-image-2-all',
        count: 1,
        status: 'success',
        imageUrl,
      });
    } catch (kvError) {
      console.error('[gpt-image-2-all] 写入 generation 到 upstash 失败:', kvError);
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      urls: [imageUrl],
      model: 'gpt-image-2-all',
      size: size || 'auto',
      usage: data.usage,
    });
  } catch (error) {
    console.error('[gpt-image-2-all] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}