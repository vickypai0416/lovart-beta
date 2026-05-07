import { NextRequest, NextResponse } from 'next/server';
import { validateImageUrl, AMAZON_IMAGE_SPECS, ImageSpecType, ValidationResult } from '@/lib/image-specs';

export async function POST(request: NextRequest) {
  try {
    const { url, specType = 'main' } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: '缺少必要参数：url' },
        { status: 400 }
      );
    }

    const result = validateImageUrl(url, specType as ImageSpecType);

    return NextResponse.json({
      success: true,
      validation: result,
      spec: AMAZON_IMAGE_SPECS[specType],
    });
  } catch (error) {
    console.error('Image validation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
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
    }));

    return NextResponse.json({
      success: true,
      specs,
    });
  } catch (error) {
    console.error('Get image specs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}