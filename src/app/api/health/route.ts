import { NextResponse } from 'next/server';
import { ftpService } from '@/lib/ftp-service';

export async function GET() {
  try {
    const isConnected = await ftpService.isConnected();
    return NextResponse.json({
      status: 'ok',
      ftpConnection: isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ok',
      ftpConnection: 'disconnected'
    });
  }
}
