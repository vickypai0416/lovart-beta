import { NextRequest, NextResponse } from 'next/server';
import { createEvent, createGeneration, createFeedback, createMessage, Generation } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  console.log('[Track API] POST request received');
  // 只读取一次 request body
  const body = await request.json();
  const { action } = body;
  console.log('[Track API] Request body:', { action, ...body });

  try {
    switch (action) {
      case 'track_event': {
        console.log('[Track API] track_event called');
        const { sessionId, type, payload } = body;
        if (!sessionId || !type) {
          console.log('[Track API] track_event missing required params');
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const event = await createEvent(sessionId, type, payload || {});
        console.log('[Track API] track_event succeeded:', event.id);
        return NextResponse.json({ success: true, event });
      }

      case 'track_generation': {
        console.log('[Track API] track_generation called');
        const { sessionId, prompt, size, quality, model, count, displayPrompt } = body;
        if (!sessionId || !prompt || !size || !quality || !model || count === undefined) {
          console.log('[Track API] track_generation missing required params');
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const generation = await createGeneration({
          sessionId,
          prompt,
          displayPrompt,
          size,
          quality,
          model,
          count,
          status: 'pending',
        });
        console.log('[Track API] track_generation succeeded:', generation.id);
        return NextResponse.json({ success: true, generation });
      }

      case 'update_generation': {
        console.log('[Track API] update_generation called');
        const { id, updates } = body;
        if (!id) {
          console.log('[Track API] update_generation missing id');
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        console.log('[Track API] update_generation updating:', { id, updates });
        // 更新生成记录（在 analytics.ts 中处理）
        const { updateGeneration } = await import('@/lib/analytics');
        await updateGeneration(id, updates);
        console.log('[Track API] update_generation succeeded');
        return NextResponse.json({ success: true });
      }

      case 'track_feedback': {
        console.log('[Track API] track_feedback called');
        const { sessionId, generationId, rating, comment } = body;
        if (!sessionId) {
          console.log('[Track API] track_feedback missing sessionId');
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const feedback = await createFeedback({
          sessionId,
          generationId,
          rating: rating ? Number(rating) : undefined,
          comment,
        });
        console.log('[Track API] track_feedback succeeded:', feedback.id);
        return NextResponse.json({ success: true, feedback });
      }

      case 'track_message': {
        const { sessionId, content, model, hasImages, imageCount } = body;
        console.log('[Track API] track_message called with:', { sessionId, content, model, hasImages, imageCount });
        if (!sessionId || !content || !model) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        try {
          const message = await createMessage({
            sessionId,
            content,
            model,
            hasImages: hasImages || false,
            imageCount: imageCount || 0,
          });
          console.log('[Track API] track_message succeeded:', message.id);
          return NextResponse.json({ success: true, message });
        } catch (error) {
          console.error('[Track API] createMessage failed:', error);
          throw error;
        }
      }

      default:
        console.log('[Track API] Unknown action:', action);
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Track API] Error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
