import { NextRequest, NextResponse } from 'next/server';
import { pollingService } from '@/lib/polling-service';

export async function GET() {
  return NextResponse.json({
    pollingIntervalMs: pollingService.getInterval()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollingIntervalMs } = body;

    if (typeof pollingIntervalMs !== 'number' || pollingIntervalMs < 1000) {
      return NextResponse.json({ error: 'Invalid polling interval. Minimum 1000ms.' }, { status: 400 });
    }

    pollingService.setInterval(pollingIntervalMs);
    
    return NextResponse.json({
      pollingIntervalMs: pollingService.getInterval()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
