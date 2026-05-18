# 修复选择性生图 HTTP 500 错误

## 问题描述

用户输入"生成第5张图"时，`/api/generate` 返回 HTTP 500 错误。

## 问题根因

### 根因1：`getLastAmazonPlan` 倒序遍历导致 `userImage` 丢失

`getLastAmazonPlan` 使用倒序遍历消息，当找到带 `planImages` 的助手消息时，用户消息（带产品图）还没被遍历到，导致 `userImage` 为空字符串。

消息顺序：
1. 用户消息（带产品图）→ `userImages: [...]`
2. 助手消息（带方案）→ `planImages: [...]`

倒序遍历：先遇到助手消息 → `lastUserImage` 为 `undefined` → `userImage` 返回空字符串。

### 根因2：空 `referenceImage` 导致走错 API 分支

当 `userImage` 为空字符串时，`isValidImageUrl` 为 `false`，不传递 `referenceImage` 和 `model`。API 走 Coze SDK 分支而非 GPT Image 2 分支，导致 500 错误。

### 根因3：即使 `userImage` 正确，base64 data URL 可能过大

用户上传的产品图是 base64 data URL，可能非常大（几 MB），通过 JSON 传递可能导致请求超时或被截断。

## 修复方案

### 修改文件
- `src/app/page.tsx`

### 修复步骤

#### 步骤1：修复 `getLastAmazonPlan` 的遍历顺序

改为先遍历找到用户图片，再找到方案：

```typescript
const getLastAmazonPlan = (): { planImages: GeneratedImagePlan[], userImage: string } | undefined => {
  const reversedMessages = [...messagesRef.current].reverse();
  let lastUserImage: string | undefined;
  
  // 先找到最近的用户图片
  for (const msg of reversedMessages) {
    if (msg.role === 'user' && msg.userImages && msg.userImages.length > 0) {
      lastUserImage = msg.userImages[0];
      break;
    }
  }
  
  // 再找到最近的方案
  for (const msg of reversedMessages) {
    if (msg.planImages && msg.planImages.length > 0) {
      return { planImages: msg.planImages, userImage: lastUserImage || '' };
    }
    if (msg.role === 'assistant' && isAmazonVisualPlan(msg.content)) {
      const planImages = parseAmazonVisualPlan(msg.content);
      if (planImages.length > 0) {
        return { planImages, userImage: lastUserImage || '' };
      }
    }
  }
  return undefined;
};
```

#### 步骤2：当没有 `referenceImage` 时，使用 `gpt-image-2-all` 模型

如果用户图片丢失，不应该走 Coze SDK 分支，而应该使用 GPT Image 2 的文生图模式：

```typescript
if (isValidImageUrl) {
  requestBody.referenceImage = lastPlan.userImage;
  requestBody.model = 'gpt-image-2-edit';
} else {
  requestBody.model = 'gpt-image-2-all';
}
```

#### 步骤3：添加更详细的请求日志

```typescript
console.log(`[SendMessage] Generating image ${idx}:`, {
  title: plan.title,
  prompt: plan.prompt.substring(0, 100),
  hasReferenceImage: isValidImageUrl,
  model: requestBody.model,
  size: selectedSize,
  quality: selectedQuality,
});
```

## 风险评估
- 低风险：修复遍历逻辑和添加模型回退
- `gpt-image-2-all` 模型是文生图模式，不依赖参考图，但生成效果可能不如编辑模式
