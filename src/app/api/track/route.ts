import { NextRequest, NextResponse } from 'next/server';
import { createEvent, createGeneration, createFeedback, createMessage, updateGeneration } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '请求体 JSON 无效' }, { status: 400 });
  }

  const { action } = body || {};

  try {
    switch (action) {
      case 'track_event': {
        const { sessionId, type, payload } = body;
        if (!sessionId || !type) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const event = await createEvent(sessionId, type, payload || {});
        return NextResponse.json({ success: true, event });
      }

      case 'track_generation': {
        const { sessionId, prompt, size, quality, model, count, displayPrompt, clientRequestId } = body;
        if (!sessionId || !prompt || !size || !quality || !model || count === undefined) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const generation = await createGeneration({
          sessionId,
          clientRequestId,
          prompt,
          displayPrompt,
          size,
          quality,
          model,
          count,
          status: 'pending',
        });
        return NextResponse.json({ success: true, generation });
      }

      case 'update_generation': {
        const { id, updates } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        await updateGeneration(id, updates);
        return NextResponse.json({ success: true });
      }

      case 'track_feedback': {
        const { sessionId, generationId, rating, comment } = body;
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
        const { sessionId, content, model, hasImages, imageCount } = body;
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
    console.error('[Track API] Error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
