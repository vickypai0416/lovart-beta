import { NextRequest, NextResponse } from 'next/server';
import { getSummary, getGenerations, getFeedbacks, getEventStats } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    switch (endpoint) {
      case 'summary': {
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;
        
        const summary = await getSummary(startDate, endDate);
        return NextResponse.json({ success: true, data: summary });
      }

      case 'generations': {
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const status = searchParams.get('status') || undefined;
        
        const result = await getGenerations(page, pageSize, status);
        return NextResponse.json({ success: true, data: result });
      }

      case 'feedbacks': {
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        
        const result = await getFeedbacks(page, pageSize);
        return NextResponse.json({ success: true, data: result });
      }

      case 'events': {
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;
        
        const stats = await getEventStats(startDate, endDate);
        return NextResponse.json({ success: true, data: stats });
      }

      default:
        return NextResponse.json({ success: false, error: '未知端点' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Analytics API Error]', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
