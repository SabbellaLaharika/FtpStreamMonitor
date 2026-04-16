import { NextRequest, NextResponse } from 'next/server';
import { ftpService } from '@/lib/ftp-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';

  try {
    const files = await ftpService.listRecursive(path);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('API listing error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
