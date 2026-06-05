import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';

export interface ProductAnalysis {
  product_name: string;
  product_type: string;
  material: string;
  customization_method: string;
  main_features: string[];
  selling_points: string[];
  target_audience: string[];
  recommended_occasions: string[];
  recommended_holidays: string[];
  estimated_price_range: string;
  gift_suitable: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, productHint } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图片URL' }, { status: 400 });
    }

    const model = getTextModelFallback();

    const analysisPrompt = `Analyze this product image comprehensively for Amazon listing optimization.

${productHint ? `Additional context: ${productHint}` : ''}

Please analyze and output a JSON object with these exact fields:
{
  "product_name": "Specific product name (e.g., 'Personalized Wooden Cutting Board', 'Custom Engraved Necklace')",
  "product_type": "Product category (e.g., 'Home & Kitchen', 'Jewelry', 'Clothing')",
  "material": "Primary material (e.g., 'Bamboo Wood', 'Sterling Silver', 'Cotton')",
  "customization_method": "How it can be personalized (e.g., 'Laser Engraving', 'Embroidery', 'Print') or 'None'",
  "main_features": ["Feature 1", "Feature 2", "Feature 3"],
  "selling_points": ["Selling point 1", "Selling point 2", "Selling point 3", "Selling point 4"],
  "target_audience": ["Audience 1", "Audience 2", "Audience 3"],
  "recommended_occasions": ["Occasion 1", "Occasion 2"],
  "recommended_holidays": ["Holiday 1", "Holiday 2", "Holiday 3"],
  "estimated_price_range": "Price range like '$20-$40' or '$50-$100'",
  "gift_suitable": true/false
}

Requirements:
- product_name: Be specific and descriptive
- main_features: 3 key physical/functional features
- selling_points: 4 compelling marketing angles
- target_audience: Who would buy this (e.g., "New Parents", "Homeowners", "Pet Owners")
- recommended_occasions: When would this be used (e.g., "Housewarming", "Anniversary")
- recommended_holidays: Which holidays is this perfect for
- gift_suitable: Is this primarily a gift item?

Output ONLY the JSON object, no markdown, no explanations.`;

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
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }]
      }),
    });

    const result = await response.json();
    
    if (!result.choices || !result.choices[0]?.message?.content) {
      return NextResponse.json({ success: false, error: '分析失败' }, { status: 500 });
    }

    let analysis: ProductAnalysis;
    try {
      let content = result.choices[0].message.content;
      content = content.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim();
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback analysis
      analysis = {
        product_name: 'Custom Product',
        product_type: 'General',
        material: 'Unknown',
        customization_method: 'None',
        main_features: ['High Quality', 'Durable', 'Beautiful Design'],
        selling_points: ['Perfect Gift', 'Premium Quality', 'Unique Design', 'Great Value'],
        target_audience: ['Gift Buyers', 'Homeowners'],
        recommended_occasions: ['Birthday', 'Holiday'],
        recommended_holidays: ['Christmas', "Valentine's Day"],
        estimated_price_range: '$30-$60',
        gift_suitable: true
      };
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Product analysis failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: '分析失败，请重试' 
    }, { status: 500 });
  }
}
