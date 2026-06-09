import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// R2 客户端配置
const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 配置缺失：请检查环境变量 R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// 获取存储桶名称
const getBucketName = () => {
  return process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'image-generation';
};

// 获取公共访问 URL
const getPublicUrl = (key: string): string => {
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  }
  // 如果没有配置自定义域名，使用 R2 默认 URL
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  return `https://${accountId}.r2.cloudflarestorage.com/${getBucketName()}/${key}`;
};

/**
 * 上传图片到 R2 存储
 * @param imageBuffer 图片二进制数据
 * @param filename 文件名（可选，默认生成 UUID）
 * @param contentType MIME 类型
 * @returns 上传后的公共访问 URL
 */
export async function uploadImageToR2(
  imageBuffer: Buffer | Uint8Array,
  filename?: string,
  contentType: string = 'image/png'
): Promise<string> {
  const client = getR2Client();
  const bucketName = getBucketName();
  
  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const key = filename 
    ? `generated/${timestamp}-${filename}`
    : `generated/${timestamp}-${randomStr}.png`;

  try {
    const upload = new Upload({
      client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        // 如果需要公共访问，设置 ACL
        // ACL: 'public-read',
      },
    });

    await upload.done();
    
    return getPublicUrl(key);
  } catch (error) {
    console.error('上传图片到 R2 失败:', error);
    throw new Error(`上传图片到 R2 失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从 URL 下载图片并上传到 R2
 * @param imageUrl 图片 URL
 * @param filename 文件名（可选）
 * @returns R2 上的公共访问 URL
 */
export async function transferImageToR2(
  imageUrl: string,
  filename?: string
): Promise<string> {
  try {
    // 下载图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    return await uploadImageToR2(buffer, filename, contentType);
  } catch (error) {
    console.error('转移图片到 R2 失败:', error);
    throw error;
  }
}
