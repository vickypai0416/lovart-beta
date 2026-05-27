const fs = require('fs');
const path = String.raw`d:\BaiduNetdiskDownload\仿lovart系统\projects\src\app\page.tsx`;
let content = fs.readFileSync(path, 'utf8');
const start = content.indexOf('const generateAmazonGridImage = async');
const end = content.indexOf('// 裁剪九宫格图片', start);
if (start === -1 || end === -1) {
  throw new Error('target function not found');
}
const replacement = `const generateAmazonGridImage = async (messageId: string, referenceImage: string | undefined, userContent: string = '') => {
  abortControllerRef.current = new AbortController();
  
  try {
    const isValidReferenceImage = !!referenceImage && (referenceImage.startsWith('data:') || referenceImage.startsWith('http://') || referenceImage.startsWith('https://'));
    if (!isValidReferenceImage) {
      throw new Error('gpt-image-2 编辑接口需要上传至少一张产品图，请先上传产品图后再生成亚马逊套图');
    }

    const basePrompt = \`生成亚马逊listing商品套图，9张图以九宫格形式输出，统一风格，专业电商摄影，白色背景主图，生活场景图，细节特写，尺寸展示，功能特性\`;
    const gridPrompt = userContent ? \`\${basePrompt}，\${userContent}\` : basePrompt;
    
    const requestBody: Record<string, unknown> = {
      prompt: gridPrompt,
      size: '3840x3840',
      n: 1,
      model: 'gpt-image-2',
      referenceImage,
    };
    
    console.log('[Amazon Grid Generation] Requesting /api/generate', {
      model: requestBody.model,
      size: requestBody.size,
      n: requestBody.n,
      hasReferenceImage: true,
      promptLength: gridPrompt.length,
    });

    const gridResponse = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortControllerRef.current?.signal,
    });
    
    const gridData = await gridResponse.json().catch(() => null);
    if (!gridResponse.ok) {
      const errorMessage = gridData?.error || gridData?.message || \`/api/generate 请求失败：\${gridResponse.status}\`;
      throw new Error(errorMessage);
    }

    const gridUrl = gridData?.url || gridData?.urls?.[0] || (gridData?.images && gridData.images[0]);
    
    if (!gridUrl) throw new Error('生成接口未返回图片 URL');
    
    const croppedImages = await cropGridImages(gridUrl);
    const validImages = croppedImages.filter(Boolean) as string[];

    if (validImages.length === 0) {
      throw new Error('九宫格图片裁剪失败，请检查生成图片是否允许跨域访问');
    }
    
    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          isGenerating: false,
          content: '',
          imageUrls: validImages,
        };
      }));
    }
    
    for (let i = 0; i < validImages.length; i++) {
      await handleSaveChatImage(validImages[i], \`亚马逊listing套图 - 图\${i + 1}\`, messageId);
    }
    
    const updatedHistory = await getChatHistoryWithUrls();
    setChatImageHistory(updatedHistory);
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Amazon Grid Generation] Aborted');
      return;
    }
    console.error('[Amazon Grid Generation] Failed:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    if (isMounted.current) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          isGenerating: false,
          content: \`❌ 图片生成失败：\${errorMessage}\`,
        };
      }));
    }
  }
  
  abortControllerRef.current = null;
};

`;
content = content.slice(0, start) + replacement + content.slice(end);
fs.writeFileSync(path, content, 'utf8');
