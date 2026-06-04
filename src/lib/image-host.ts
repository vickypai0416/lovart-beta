/**
 * 自建图床上传工具
 * 图床地址: https://imageproxy.chongyuan.chat
 */

const IMAGE_HOST_API = 'https://imageproxy.chongyuan.chat/api/upload';

/**
 * 上传图片到自建图床
 * @param imageBuffer 图片二进制数据
 * @param filename 文件名
 * @returns 上传后的图片 URL
 */
export async function uploadImageToHost(
  imageBuffer: Buffer | Uint8Array,
  filename: string = 'image.png'
): Promise<string> {
  try {
    // 创建 FormData
    const formData = new FormData();
    
    // 将 Buffer 转换为 Blob
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    
    // 添加到 FormData
    formData.append('file', blob, filename);

    // 发送请求
    const response = await fetch(IMAGE_HOST_API, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // 根据文档，成功响应包含 url 字段
    if (data.url) {
      return data.url;
    }
    
    throw new Error('上传成功但未返回 URL');
  } catch (error) {
    console.error('上传到自建图床失败:', error);
    throw new Error(`上传到自建图床失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从 URL 下载图片并上传到自建图床
 * @param imageUrl 图片 URL
 * @param filename 文件名（可选）
 * @returns 图床上的图片 URL
 */
export async function transferImageToHost(
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

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = contentType.includes('jpeg') ? 'jpg' : 'png';
    const finalFilename = filename || `gen-${timestamp}-${randomStr}.${ext}`;

    // 上传到图床
    return await uploadImageToHost(buffer, finalFilename);
  } catch (error) {
    console.error('转移图片到自建图床失败:', error);
    throw error;
  }
}
