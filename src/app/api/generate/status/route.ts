import { NextRequest, NextResponse } from 'next/server';
import { getAllGenerationRecords } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientRequestId = searchParams.get('clientRequestId');

  if (!clientRequestId) {
    return NextResponse.json({ success: false, error: '缺少 clientRequestId' }, { status: 400 });
  }

  const generations = await getAllGenerationRecords();
  generations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const matched = generations.find((generation) => generation.clientRequestId === clientRequestId);

  if (!matched) {
    return NextResponse.json({ success: true, status: 'pending' });
  }

  return NextResponse.json({
    success: true,
    status: matched.status,
    url: matched.imageUrl,
    error: matched.error,
    generation: {
      ...matched,
      createdAt: matched.createdAt.toISOString(),
    },
  });
}
