import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, productName } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图片URL' }, { status: 400 });
    }

    const model = getTextModelFallback();

    const productNamePrompt = productName 
      ? `已知产品名称：${productName}\n` 
      : '';
    
    const response = await fetch(model.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${productNamePrompt}请分析这张产品图片，提取以下信息：
                1. 商品名称：产品的具体名称
                2. 产品卖点：3-5个核心卖点（结合产品名称分析）
                3. 产品简介：简短的产品描述

                请用JSON格式输出，包含productName、keyFeatures、description字段。
                keyFeatures是字符串数组。
              `
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }]
      }),
    });

    const result = await response.json();
    
    if (!result.choices || !result.choices[0]?.message?.content) {
      return NextResponse.json({ success: false, error: '分析失败' }, { status: 500 });
    }

    let analysis;
    try {
      let content = result.choices[0].message.content;
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim();
      analysis = JSON.parse(content);
    } catch {
      analysis = {
        productName: '未识别产品',
        keyFeatures: [],
        description: result.choices[0].message.content
      };
    }

    return NextResponse.json({
      success: true,
      productName: analysis.productName || '未识别产品',
      keyFeatures: analysis.keyFeatures || [],
      description: analysis.description || ''
    });

  } catch (error) {
    console.error('分析产品失败:', error);
    return NextResponse.json({ success: false, error: '分析失败，请重试' }, { status: 500 });
  }
}