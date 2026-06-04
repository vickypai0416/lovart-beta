# 修复上传新图片时被误判为选择性生图的问题

## 问题描述

用户上传一张新的产品图时，亚马逊专家没有分析图片中的产品，而是直接返回第5张图的提示词（英文）。

## 问题根因

在 `sendMessage` 函数中，选择性生图的检测逻辑没有考虑用户是否上传了新图片：

```typescript
const selectiveRequest = selectedPersona === 'amazon-expert' ? isSelectiveGenerationRequest(effectiveContent) : { match: false, indices: [] };
if (selectiveRequest.match) {
  // 直接进入选择性生图流程
}
```

当用户：
1. 上传新图片
2. 输入内容中包含类似"第5张"的文字（或之前的对话中有相关内容）

就会被误判为选择性生图请求，跳过了正常的图片分析流程。

## 修复方案

### 修改文件
- `src/app/page.tsx`

### 修复步骤

在第722行添加条件判断：**当用户上传了新图片时，跳过选择性生图逻辑**

```typescript
// 检测是否是选择性生图请求（仅在亚马逊专家模式下，且没有上传新图片时）
const selectiveRequest = (selectedPersona === 'amazon-expert' && currentImages.length === 0) 
  ? isSelectiveGenerationRequest(effectiveContent) 
  : { match: false, indices: [] };
```

这样：
- 用户上传新图片 → 走正常的图片分析流程
- 用户只输入文字（如"生成第5张图"）→ 走选择性生图流程

## 风险评估
- 低风险：只是添加了一个条件判断，不影响其他功能
