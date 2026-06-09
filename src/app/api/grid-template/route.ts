import { NextRequest, NextResponse } from 'next/server';
import { getGridTemplatePreset, getAllGridTemplatePresets, saveGridTemplatePreset, deleteGridTemplatePreset } from '@/lib/analytics';
import { AMAZON_9_GRID_PROMPT } from '@/lib/amazon/grid-prompt';

// GET /api/grid-template - 获取所有模板预设或特定模板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // 获取特定模板
      const preset = await getGridTemplatePreset(key);

      if (!preset) {
        // 如果请求的是默认模板且不存在，返回内置默认模板
        if (key === 'amazon-9-grid-default') {
          return NextResponse.json({
            success: true,
            preset: {
              key: 'amazon-9-grid-default',
              name: 'Amazon九宫格默认模板',
              content: AMAZON_9_GRID_PROMPT,
              description: 'Amazon Listing 九宫格套图通用导演级框架',
              isDefault: true,
              updatedAt: new Date().toISOString(),
            },
          });
        }

        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, preset });
    } else {
      // 获取所有模板
      const presets = await getAllGridTemplatePresets();

      // 如果没有默认模板，添加内置默认模板
      const hasDefault = presets.some(p => p.key === 'amazon-9-grid-default');
      if (!hasDefault) {
        presets.unshift({
          id: 'default',
          key: 'amazon-9-grid-default',
          name: 'Amazon九宫格默认模板',
          content: AMAZON_9_GRID_PROMPT,
          description: 'Amazon Listing 九宫格套图通用导演级框架',
          isDefault: true,
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({ success: true, presets });
    }
  } catch (error) {
    console.error('[Grid Template API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get template' },
      { status: 500 }
    );
  }
}

// POST /api/grid-template - 保存或更新模板预设
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, name, content, description, isDefault = false } = body;

    if (!key || !name || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, name, content' },
        { status: 400 }
      );
    }

    const preset = await saveGridTemplatePreset({
      key,
      name,
      content,
      description,
      isDefault,
    });

    return NextResponse.json({ success: true, preset });
  } catch (error) {
    console.error('[Grid Template API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

// DELETE /api/grid-template?key=xxx - 删除模板预设
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    await deleteGridTemplatePreset(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Grid Template API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
