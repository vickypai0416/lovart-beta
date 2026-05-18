import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const ext = extname(file.name) || '.jpg';
    const fileName = `${timestamp}${ext}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `${request.nextUrl.origin}/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true,
      url,
      key: `uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: '上传失败',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
