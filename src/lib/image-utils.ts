// 图片裁剪工具函数

/**
 * 从九宫格图片中裁剪出指定位置的单张图片
 * @param imageUrl - 九宫格图片URL
 * @param position - 位置索引（0-8，从左到右，从上到下）
 * @returns 裁剪后的图片base64数据
 */
export async function cropGridImage(imageUrl: string, position: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // 计算每个格子的尺寸（假设是3x3网格）
        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;
        
        // 计算位置
        const row = Math.floor(position / 3);
        const col = position % 3;
        
        // 设置canvas尺寸
        canvas.width = cellWidth;
        canvas.height = cellHeight;
        
        // 裁剪指定区域
        ctx.drawImage(
          img,
          col * cellWidth,
          row * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        );
        
        // 返回base64
        const croppedDataUrl = canvas.toDataURL('image/png');
        resolve(croppedDataUrl);
      } catch (error) {
        console.error('图片裁剪失败:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('图片加载失败:', imageUrl);
      resolve(null);
    };
    
    img.src = imageUrl;
  });
}

/**
 * 批量裁剪九宫格图片
 * @param imageUrl - 九宫格图片URL
 * @returns 9张裁剪后的图片base64数组
 */
export async function cropAllGridImages(imageUrl: string): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  
  for (let i = 0; i < 9; i++) {
    const cropped = await cropGridImage(imageUrl, i);
    results.push(cropped);
  }
  
  return results;
}

/**
 * 下载图片到本地
 * @param dataUrl - 图片base64数据
 * @param filename - 文件名
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
