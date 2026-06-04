import { NextRequest } from 'next/server';
import sharp from 'sharp';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

interface CanvasElement {
  type: 'text' | 'rect' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  imageSrc?: string;
  text?: string;
  fontSize?: number;
  fill?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { elements, width = 1024, height = 1024 } = body as {
      elements: CanvasElement[];
      width?: number;
      height?: number;
    };

    let output = sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 248, g: 250, b: 252, alpha: 1 },
      },
    });

    const sortedElements = [...elements].sort((a, b) => {
      if (a.type === 'image' && b.type !== 'image') return -1;
      if (a.type !== 'image' && b.type === 'image') return 1;
      return 0;
    });

    for (const element of sortedElements) {
      if (element.type === 'image' && element.imageSrc) {
        try {
          const response = await fetch(element.imageSrc);
          if (!response.ok) {
            console.warn(`Failed to download image: ${element.imageSrc}`);
            continue;
          }
          
          const imageBuffer = await response.arrayBuffer();
          const imgBuffer = Buffer.from(imageBuffer);
          
          const metadata = await sharp(imgBuffer).metadata();
          const originalWidth = metadata.width || 100;
          const originalHeight = metadata.height || 100;
          
          const scaleX = element.scaleX || 1;
          const scaleY = element.scaleY || 1;
          const displayWidth = (element.width || originalWidth) * scaleX;
          const displayHeight = (element.height || originalHeight) * scaleY;
          
          let processedImage = sharp(imgBuffer)
            .resize(Math.round(displayWidth), Math.round(displayHeight))
            .rotate(element.rotation || 0);
          
          output = output.composite([{
            input: await processedImage.toBuffer(),
            top: Math.round(element.y * scaleY),
            left: Math.round(element.x * scaleX),
          }]);
        } catch (error) {
          console.error(`Error processing image ${element.imageSrc}:`, error);
        }
      } else if (element.type === 'rect' && element.width && element.height) {
        const rectBuffer = await sharp({
          create: {
            width: element.width,
            height: element.height,
            channels: 4,
            background: element.fill || '#4F46E5',
          },
        }).toBuffer();
        
        output = output.composite([{
          input: rectBuffer,
          top: Math.round(element.y),
          left: Math.round(element.x),
        }]);
      }
    }

    const sharpBuffer = await output.png().toBuffer();
    const resultBuffer = Buffer.from(sharpBuffer);
    
    return new Response(resultBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="canvas-${Date.now()}.png"`,
      },
    });
    
  } catch (error) {
    console.error('Export canvas failed:', error);
    return new Response(JSON.stringify({ error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
