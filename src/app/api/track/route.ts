import { NextRequest, NextResponse } from 'next/server';
import { createEvent, createGeneration, createFeedback, createMessage, Generation } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const { action } = await request.json();

  try {
    switch (action) {
      case 'track_event': {
        const { sessionId, type, payload } = await request.json();
        if (!sessionId || !type) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const event = await createEvent(sessionId, type, payload || {});
        return NextResponse.json({ success: true, event });
      }

      case 'track_generation': {
        const data = await request.json();
        const { sessionId, prompt, size, quality, model, count } = data;
        if (!sessionId || !prompt || !size || !quality || !model || count === undefined) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const generation = await createGeneration({
          sessionId,
          prompt,
          displayPrompt: data.displayPrompt,
          size,
          quality,
          model,
          count,
          status: 'pending',
        });
        return NextResponse.json({ success: true, generation });
      }

      case 'update_generation': {
        const { id, updates } = await request.json();
        if (!id) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        // 更新生成记录（在 analytics.ts 中处理）
        const { updateGeneration } = await import('@/lib/analytics');
        await updateGeneration(id, updates);
        return NextResponse.json({ success: true });
      }

      case 'track_feedback': {
        const { sessionId, generationId, rating, comment } = await request.json();
        if (!sessionId) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const feedback = await createFeedback({
          sessionId,
          generationId,
          rating: rating ? Number(rating) : undefined,
          comment,
        });
        return NextResponse.json({ success: true, feedback });
      }

      case 'track_message': {
        const { sessionId, content, model, hasImages, imageCount } = await request.json();
        if (!sessionId || !content || !model) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const message = await createMessage({
          sessionId,
          content,
          model,
          hasImages: hasImages || false,
          imageCount: imageCount || 0,
        });
        return NextResponse.json({ success: true, message });
      }

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Analytics API Error]', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}