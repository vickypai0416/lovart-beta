import { describe, test, expect } from '@jest/globals';

// 测试选择性生图检测函数
const isSelectiveGenerationRequest = (content: string): { match: boolean; indices: number[] } => {
  const patterns = [
    /生成第(\d+)张图/,
    /生成第(\d+)张/,
    /生成图(\d+)/,
    /只生成第(\d+)张/,
    /只要第(\d+)张/,
    /请生成第(\d+)张/,
    /生成第(\d+)张图片/,
  ];
  
  const indices: number[] = [];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const idx = parseInt(match[1]);
      if (idx >= 1 && idx <= 6) {
        indices.push(idx);
      }
    }
  }
  
  return {
    match: indices.length > 0,
    indices: [...new Set(indices)],
  };
};

// 测试亚马逊方案检测函数
const isAmazonVisualPlan = (content: string): boolean => {
  const normalized = content.replace(/[-–—]/g, '-');
  return normalized.includes('6图亚马逊视觉方案') || 
         normalized.includes('Image 1 -') ||
         normalized.includes('亚马逊定制商品视觉方案');
};

describe('选择性生图功能测试', () => {
  describe('isSelectiveGenerationRequest', () => {
    test('应该匹配"生成第5张图"', () => {
      const result = isSelectiveGenerationRequest('生成第5张图');
      expect(result.match).toBe(true);
      expect(result.indices).toContain(5);
    });

    test('应该匹配"生成第3张"', () => {
      const result = isSelectiveGenerationRequest('生成第3张');
      expect(result.match).toBe(true);
      expect(result.indices).toContain(3);
    });

    test('应该匹配"只生成第2张"', () => {
      const result = isSelectiveGenerationRequest('只生成第2张');
      expect(result.match).toBe(true);
      expect(result.indices).toContain(2);
    });

    test('不应该匹配"第5张图"（缺少"生成"关键词）', () => {
      const result = isSelectiveGenerationRequest('第5张图');
      expect(result.match).toBe(false);
    });

    test('不应该匹配普通对话', () => {
      const result = isSelectiveGenerationRequest('你好，这是我的产品');
      expect(result.match).toBe(false);
    });

    test('应该匹配单张图片', () => {
      const result = isSelectiveGenerationRequest('生成第1张');
      expect(result.match).toBe(true);
      expect(result.indices).toContain(1);
    });

    test('应该忽略无效的图片索引', () => {
      const result = isSelectiveGenerationRequest('生成第10张图');
      expect(result.match).toBe(false);
    });
  });

  describe('isAmazonVisualPlan', () => {
    test('应该匹配包含"6图亚马逊视觉方案"的内容', () => {
      expect(isAmazonVisualPlan('6图亚马逊视觉方案')).toBe(true);
    });

    test('应该匹配包含"Image 1 -"的内容', () => {
      expect(isAmazonVisualPlan('Image 1 - 主图')).toBe(true);
    });

    test('应该匹配包含"亚马逊定制商品视觉方案"的内容', () => {
      expect(isAmazonVisualPlan('亚马逊定制商品视觉方案')).toBe(true);
    });

    test('应该处理不同的破折号字符', () => {
      expect(isAmazonVisualPlan('Image 1 – 主图')).toBe(true); // EN DASH
      expect(isAmazonVisualPlan('Image 1 — 主图')).toBe(true); // EM DASH
      expect(isAmazonVisualPlan('Image 1 - 主图')).toBe(true); // HYPHEN
    });

    test('不应该匹配普通内容', () => {
      expect(isAmazonVisualPlan('你好，这是普通消息')).toBe(false);
    });
  });

  describe('选择性生图检测条件', () => {
    test('上传图片时不应触发生图', () => {
      const hasImages = true;
      const input = '生成第5张图';
      const shouldTrigger = !hasImages && input.includes('生成');
      expect(shouldTrigger).toBe(false);
    });

    test('只输入文字时应该触发生图', () => {
      const hasImages = false;
      const input = '生成第5张图';
      const shouldTrigger = !hasImages && input.includes('生成');
      expect(shouldTrigger).toBe(true);
    });
  });
});
