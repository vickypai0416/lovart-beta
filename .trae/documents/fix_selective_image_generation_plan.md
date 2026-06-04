# 选择性生图功能修复方案

## 问题分析

用户报告当对亚马逊专家说"生成第5张图时"没有得到请求。经过代码分析，发现以下问题：

### 1. 正则表达式匹配问题
当前 `isSelectiveGenerationRequest` 函数的正则表达式 `/生成第(\d+)张图/` 无法匹配：
- "生成第5张图时"（结尾带"时"字）
- 其他变体输入

### 2. 亚马逊方案识别不一致
`isAmazonVisualPlan` 和 `isAmazonPlanResponse` 函数逻辑不一致：
- `isAmazonVisualPlan`: 检查 `content.includes('6图亚马逊视觉方案') && content.includes('Image 1')`
- `isAmazonPlanResponse`: 检查更多条件

### 3. isAmazonPlan 属性设置问题
在 SSE 消息处理中只使用了 `isAmazonVisualPlan` 来设置 `isAmazonPlan` 属性，但该函数条件过于严格。

## 修复方案

### 修改文件
- `src/app/page.tsx`

### 修复步骤

#### 1. 优化正则表达式（行 390-416）
扩展 `isSelectiveGenerationRequest` 函数的正则表达式，支持更多用户输入模式：
- "生成第5张图"
- "生成第5张图时"
- "生成第5张"
- "生成图5"
- "第5张"
- 等等

#### 2. 统一亚马逊方案识别逻辑（行 353-356）
修改 `isAmazonVisualPlan` 函数，使其与 `isAmazonPlanResponse` 保持一致，或者直接使用 `isAmazonPlanResponse`。

#### 3. 优化 getLastAmazonPlan 函数（行 450-472）
增加对历史消息中 planImages 的检测，不仅仅依赖 `isAmazonPlan` 属性。

## 具体修改

### 修改 isSelectiveGenerationRequest 函数
```typescript
const isSelectiveGenerationRequest = (content: string): { match: boolean; indices: number[] } => {
  const patterns = [
    /生成第(\d+)张图/?时?/,
    /生成第(\d+)张/,
    /生成图(\d+)/,
    /只生成第(\d+)张/,
    /只要第(\d+)张/,
    /请生成第(\d+)张/,
    /第(\d+)张图/,
    /图(\d+)/,
    /^(\d+)$/,
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
```

### 修改 isAmazonVisualPlan 函数
```typescript
const isAmazonVisualPlan = (content: string): boolean => {
  return content.includes('6图亚马逊视觉方案') || 
         content.includes('Image 1 –') ||
         content.includes('亚马逊定制商品视觉方案');
};
```

### 优化 getLastAmazonPlan 函数
增加对 planImages 存在性的检测，不严格依赖 isAmazonPlan 属性。

## 测试验证

修复后需要验证：
1. 用户输入"生成第5张图时"能正确匹配
2. 能正确找到之前的亚马逊方案
3. 能正确调用生图 API

## 风险评估

- 低风险：修改的是正则表达式和条件判断逻辑，不影响核心功能
- 需要确保原有功能不受影响