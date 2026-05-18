# 修复上传图片时被误判为选择性生图的问题

## 问题描述

用户上传新图片后，系统仍然进入选择性生图流程，没有分析新上传的图片。

## 问题根因

选择性生图的自动检测过于敏感，即使上传了图片也可能被误判。主要原因包括：

1. **异步加载问题**：`FileReader.onload` 是异步的，即使图片显示了，`userImages` 状态可能还是旧值
2. **检测条件不严格**：只检查了 `currentImages.length === 0`，但没有检查用户是否真的想要生图
3. **正则表达式太宽泛**：`/第(\d+)张图/` 可能匹配到对话历史中的内容

## 修复方案

### 修改文件
- `src/app/page.tsx`

### 修复步骤

1. **完全移除选择性生图的自动检测**，改为让用户显式触发：
   - 在亚马逊专家方案消息后添加"生成第X张图"的按钮
   - 移除自动检测逻辑

2. **修改选择性生图检测逻辑**：
   - 要求用户输入必须包含明确的"生成"关键词
   - 移除 `/第(\d+)张图/` 这种过于宽泛的模式

### 修改后的代码

```typescript
// 修改 isSelectiveGenerationRequest，只保留明确的生图指令
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
  
  // ... 其余逻辑不变
};

// 修改选择性生图检测条件，增加更严格的检查
const selectiveRequest = (selectedPersona === 'amazon-expert' && currentImages.length === 0 && input.trim().includes('生成')) 
  ? isSelectiveGenerationRequest(effectiveContent) 
  : { match: false, indices: [] };
```

## 风险评估
- 低风险：只是修改了检测条件，不影响其他功能
- 用户需要输入更明确的指令才能触发生图功能

## 替代方案（推荐）

如果问题仍然存在，可以考虑：
1. 完全移除选择性生图的自动检测
2. 在亚马逊专家方案消息后添加"生成第X张图"的按钮
3. 用户点击按钮后才触发生图功能

这样可以完全避免误判问题。
