import { NextRequest, NextResponse } from 'next/server';
import { getSummary, getGenerations, getFeedbacks, getEventStats, getAllMessages } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  console.log('[Analytics API] GET request received');
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  console.log('[Analytics API] Request params:', Object.fromEntries(searchParams));

  try {
    switch (endpoint) {
      case 'summary': {
        console.log('[Analytics API] summary endpoint called');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;
        
        console.log('[Analytics API] summary params:', { startDate, endDate });
        const summary = await getSummary(startDate, endDate);
        console.log('[Analytics API] summary returned:', summary);
        return NextResponse.json({ success: true, data: summary });
      }

      case 'generations': {
        console.log('[Analytics API] generations endpoint called');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const status = searchParams.get('status') || undefined;
        
        console.log('[Analytics API] generations params:', { page, pageSize, status });
        const result = await getGenerations(page, pageSize, status);
        console.log('[Analytics API] generations returned:', result);
        return NextResponse.json({ success: true, data: result });
      }

      case 'feedbacks': {
        console.log('[Analytics API] feedbacks endpoint called');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        
        console.log('[Analytics API] feedbacks params:', { page, pageSize });
        const result = await getFeedbacks(page, pageSize);
        console.log('[Analytics API] feedbacks returned:', result);
        return NextResponse.json({ success: true, data: result });
      }

      case 'events': {
        console.log('[Analytics API] events endpoint called');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;
        
        console.log('[Analytics API] events params:', { startDate, endDate });
        const stats = await getEventStats(startDate, endDate);
        console.log('[Analytics API] events returned:', stats);
        return NextResponse.json({ success: true, data: stats });
      }

      case 'messages': {
        console.log('[Analytics API] messages endpoint called');
        const messages = await getAllMessages();
        console.log('[Analytics API] messages returned:', messages);
        return NextResponse.json({ success: true, data: messages });
      }

      default:
        console.log('[Analytics API] Unknown endpoint:', endpoint);
        return NextResponse.json({ success: false, error: '未知端点' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
