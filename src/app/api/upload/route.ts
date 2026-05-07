import { NextRequest, NextResponse } from 'next/server';
import { S3Storage, HeaderUtils } from 'coze-coding-dev-sdk';
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

    const useS3 = process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME;
    
    if (useS3) {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });

      const key = await storage.uploadFile({
        fileContent: buffer,
        fileName: `uploads/${fileName}`,
        contentType: file.type || 'image/jpeg',
      });

      const url = await storage.generatePresignedUrl({
        key,
        expireTime: 3600,
      });

      return NextResponse.json({ 
        success: true,
        url,
        key,
      });
    } else {
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
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: '上传失败',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
