import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API Key 未配置，请在 .env.local 中添加 GEMINI_API_KEY' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      model = 'gemini-3-pro-image-preview',
      referenceImages = [],
      aspectRatio = '1:1',
      imageSize = '1K',
    } = body as {
      prompt?: string;
      model?: string;
      referenceImages?: string[];
      aspectRatio?: string;
      imageSize?: string;
    };

    if (!prompt?.trim() && referenceImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入提示词或上传参考图' },
        { status: 400 }
      );
    }

    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [];

    if (prompt?.trim()) {
      parts.push({ text: prompt.trim() });
    }

    for (const image of referenceImages.slice(0, 14)) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inline_data: {
            mime_type: match[1],
            data: match[2],
          },
        });
      }
    }

    const endpoint = `https://yunwu.ai/v1beta/models/${model}:generateContent?key=`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio, imageSize },
        },
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { success: false, error: errorData.error?.message || `API 请求失败 (${response.status})` },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { success: false, error: `API 请求失败 (${response.status}): ${responseText.slice(0, 200)}` },
          { status: response.status }
        );
      }
    }

    let data: { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
    try {
      data = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            { success: false, error: '无法解析 API 响应格式' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: '无法解析 API 响应格式' },
          { status: 500 }
        );
      }
    }

    const urls: string[] = [];
    const texts: string[] = [];

    for (const candidate of data?.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) texts.push(part.text);
        if (part.inlineData?.data) {
          urls.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
        }
      }
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: texts[0] || 'Gemini 未返回图片，请调整提示词后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urls[0],
      urls,
      text: texts.join('\n').trim(),
      model,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gemini 生图失败' },
      { status: 500 }
    );
  }
}