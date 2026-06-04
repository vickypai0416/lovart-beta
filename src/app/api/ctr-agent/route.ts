import { NextRequest, NextResponse } from 'next/server';
import { CtrAgent } from '@/lib/amazon/ctr-agent';
import { SceneType } from '@/lib/amazon/visual-strategy';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, scene = 'everyday' } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少必要参数：imageUrl' },
        { status: 400 }
      );
    }

    if (!process.env.YUNWU_API_KEY) {
      return NextResponse.json(
        { error: '未配置 API Key' },
        { status: 500 }
      );
    }

    const agent = CtrAgent.create();
    
    const result = await agent.runFullPipeline(imageUrl, scene as SceneType);

    if (result.success) {
      return NextResponse.json({
        success: true,
        productAnalysis: result.productAnalysis,
        visualStrategy: result.visualStrategy,
        generatedImages: result.generatedImages,
        complianceResults: result.complianceResults,
      });
    } else {
      return NextResponse.json(
        { error: result.error || '生成失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('CTR Agent API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const agent = new CtrAgent({ apiKey: process.env.YUNWU_API_KEY || '' });
    const sceneTypes = agent['strategyGenerator'].getSceneTypes();

    return NextResponse.json({
      success: true,
      sceneTypes,
      available: !!process.env.YUNWU_API_KEY,
    });
  } catch (error) {
    console.error('CTR Agent config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}