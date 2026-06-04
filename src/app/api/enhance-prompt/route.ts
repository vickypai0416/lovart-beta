import { NextRequest, NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, userDescription } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图片URL' }, { status: 400 });
    }

    const model = getTextModelFallback();

    if (!model.apiKey || !model.endpoint) {
      return NextResponse.json({ success: false, error: '文本模型未配置' }, { status: 500 });
    }

    const userDescPart = userDescription
      ? `\n\n用户补充描述：${userDescription}`
      : '';

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
            content: `你是一个专业的亚马逊电商商品图提示词专家。你的任务是：
1. 分析用户上传的产品图片，识别产品的类型、材质、颜色、设计亮点
2. 生成专业的商品图提示词

你必须同时输出两种格式的提示词：
- 中文提示词：让用户理解将要生成什么样的图片
- 英文提示词：发送给图片生成API使用的专业英文提示词

请严格按照以下JSON格式输出，不要输出任何其他内容：
{
  "displayPrompt": "中文提示词，描述将要生成的图片效果",
  "prompt": "English prompt for image generation API, professional product photography style"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这张产品图片，生成专业的亚马逊商品图提示词。${userDescPart}`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        success: false, 
        error: errorData.error?.message || `API错误: ${response.status}` 
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = null;
    }

    if (parsed && parsed.displayPrompt && parsed.prompt) {
      return NextResponse.json({ 
        success: true, 
        displayPrompt: parsed.displayPrompt,
        prompt: parsed.prompt 
      });
    }

    return NextResponse.json({ 
      success: true, 
      displayPrompt: content,
      prompt: content 
    });

  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '优化提示词失败' 
    }, { status: 500 });
  }
}
