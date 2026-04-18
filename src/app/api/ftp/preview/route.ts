import { NextRequest, NextResponse } from 'next/server';
import { ftpService } from '@/lib/ftp-service';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const buffer = await ftpService.getFilePreview(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';

    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.md': 'text/markdown'
    };

    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error: any) {
    console.error('API preview error:', error);
    if (error.code === 550) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to preview file' }, { status: 500 });
  }
}
