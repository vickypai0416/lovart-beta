import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToHost } from '@/lib/image-host';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** gpt-image-2-vip 支持的 30 档尺寸 */
const SUPPORTED_SIZES = new Set([
  'auto',
  '1280x1280',
  '848x1280',
  '1280x848',
  '960x1280',
  '1280x960',
  '1024x1280',
  '1280x1024',
  '720x1280',
  '1280x720',
  '1280x544',
  '2048x2048',
  '1360x2048',
  '2048x1360',
  '1536x2048',
  '2048x1536',
  '1632x2048',
  '2048x1632',
  '1152x2048',
  '2048x1152',
  '2048x864',
  '2880x2880',
  '2336x3520',
  '3520x2336',
  '2480x3312',
  '3312x2480',
  '2560x3216',
  '3216x2560',
  '2160x3840',
  '3840x2160',
  '3840x1632',
]);

function normalizeSize(size?: string): string | undefined {
  if (!size || size === 'auto') return undefined;
  if (SUPPORTED_SIZES.has(size)) return size;

  // 尝试把常见的 1024x1024 / 1536x1024 等映射到 vip 支持的档位
  const [w, h] = size.split('x').map(Number);
  if (!w || !h) return undefined;

  const ratio = w / h;
  if (Math.abs(ratio - 1) < 0.05) return w >= 2880 ? '2880x2880' : w >= 2048 ? '2048x2048' : '1280x1280';
  if (Math.abs(ratio - 16 / 9) < 0.05) return w >= 3840 ? '3840x2160' : w >= 2048 ? '2048x1152' : '1280x720';
  if (Math.abs(ratio - 9 / 16) < 0.05) return h >= 3840 ? '2160x3840' : h >= 2048 ? '1152x2048' : '720x1280';
  if (Math.abs(ratio - 4 / 3) < 0.05) return w >= 2048 ? '2048x1536' : '1280x960';
  if (Math.abs(ratio - 3 / 4) < 0.05) return h >= 2048 ? '1536x2048' : '960x1280';
  if (Math.abs(ratio - 3 / 2) < 0.05) return w >= 2048 ? '2048x1360' : '1280x848';
  if (Math.abs(ratio - 2 / 3) < 0.05) return h >= 2048 ? '1360x2048' : '848x1280';

  return undefined;
}

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

interface VipResponse {
  // 图片 API 风格（部分通道）：{ data: [{ url | b64_json }] }
  data?: Array<{ url?: string; b64_json?: string }>;
  // 实测 vip 对话式端点返回的是标准 Chat Completions 格式：
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
      size,
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

    const finalSize = normalizeSize(size);
    const messages = buildMessages(prompt.trim(), history, referenceImages);

    const requestBody: Record<string, unknown> = {
      model: 'gpt-image-2-vip',
      messages,
    };
    if (finalSize) {
      requestBody.size = finalSize;
    }

    console.log('[gpt-image-2-vip] Request:', {
      size: finalSize,
      historyLength: history.length,
      referenceImages: referenceImages.length,
      prompt: prompt.trim().substring(0, 100),
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
    console.log('[gpt-image-2-vip] Response status:', response.status, 'preview:', responseText.substring(0, 300));

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

    let data: VipResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ success: false, error: '无法解析 API 响应格式' }, { status: 500 });
    }

    let imageUrl: string | undefined;

    // 1) 标准 Chat Completions 格式（实测 vip 对话式端点返回这个）：
    //    choices[0].message.content 是 Markdown，含 ![image](url)
    const content = data.choices?.[0]?.message?.content;
    const fromContent = extractImageFromContent(content);
    if (fromContent) {
      if (fromContent.startsWith('data:')) {
        // 极少数返回 base64 data URL：转存图床，失败则原样返回
        const b64 = fromContent.split(',')[1] || '';
        try {
          imageUrl = await uploadImageToHost(Buffer.from(b64, 'base64'), `vip-${Date.now()}.png`);
        } catch (hostError) {
          console.error('[gpt-image-2-vip] 上传 base64 到图床失败:', hostError);
          imageUrl = fromContent;
        }
      } else {
        imageUrl = fromContent;
      }
    }

    // 2) 兜底：图片 API 风格 { data: [{ url | b64_json }] }
    if (!imageUrl) {
      const item = data.data?.[0];
      if (item?.url) {
        imageUrl = item.url;
      } else if (item?.b64_json) {
        const hasPrefix = item.b64_json.startsWith('data:');
        const b64 = hasPrefix ? item.b64_json.split(',')[1] : item.b64_json;
        const buffer = Buffer.from(b64, 'base64');
        try {
          imageUrl = await uploadImageToHost(buffer, `vip-${Date.now()}.png`);
        } catch (hostError) {
          console.error('[gpt-image-2-vip] 上传 base64 到图床失败:', hostError);
          imageUrl = hasPrefix ? item.b64_json : `data:image/png;base64,${item.b64_json}`;
        }
      }
    }

    if (!imageUrl) {
      console.error('[gpt-image-2-vip] 无法从响应提取图片，content:', content?.substring(0, 200));
      return NextResponse.json({ success: false, error: 'API 未返回图片' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      urls: [imageUrl],
      model: 'gpt-image-2-vip',
      size: finalSize || 'auto',
      usage: data.usage,
    });
  } catch (error) {
    console.error('[gpt-image-2-vip] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
