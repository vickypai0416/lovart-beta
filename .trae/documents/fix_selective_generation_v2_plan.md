# 修复"生成第5张图"选择性生图功能

## 问题根因分析

经过深入代码排查，发现以下多个问题导致选择性生图功能无法正常工作：

### 问题1：`isAmazonVisualPlan` 使用特殊字符匹配
- 第354-358行：`isAmazonVisualPlan` 检查 `content.includes('Image 1 –')`，其中 `–` 是 EN DASH（U+2013）
- AI 实际返回的内容可能使用普通减号 `-`（U+002D）或 EM DASH `—`（U+2014）
- 这导致 `isAmazonPlan` 属性始终为 `false`，`planImages` 始终为 `undefined`

### 问题2：`parseAmazonVisualPlan` 同样使用特殊字符
- 第364行：`new RegExp(\`Image ${i} – \`)` 使用 EN DASH
- 如果 AI 返回普通减号，正则不会匹配，`plans` 数组为空

### 问题3：消息持久化丢失关键属性
- `PersistedMessage` 接口（history-manager.ts 第227-237行）不包含 `isAmazonPlan` 和 `planImages`
- 消息恢复时（page.tsx 第66-77行）也不恢复这些属性
- 页面刷新后，方案信息完全丢失

### 问题4：`getLastAmazonPlan` 闭包问题
- 第455行：`getLastAmazonPlan` 直接引用 `messages` 状态变量
- 在 `sendMessage` 中调用时，`messages` 是当前渲染周期的快照
- 虽然 SSE 处理使用函数式更新 `setMessages(prev => ...)`，但 `getLastAmazonPlan` 看不到最新的 `messages`

### 问题5：选择性生图使用错误的 API 端点
- 第772行：选择性生图调用 `/api/generate` 端点
- 但项目实际使用的是 `/api/chat` 端点（支持 SSE 流式响应和 GPT Image 2 Edit）
- `/api/generate` 端点可能不存在或不支持所需功能

## 修复方案

### 修改文件
1. `src/app/page.tsx` - 主要修改
2. `src/lib/history-manager.ts` - 添加持久化字段

### 修复步骤

#### 步骤1：修复 `isAmazonVisualPlan` 函数
将 EN DASH `–` 改为同时匹配多种破折号：
```typescript
const isAmazonVisualPlan = (content: string): boolean => {
  const normalizedContent = content.replace(/[-–—]/g, '-');
  return normalizedContent.includes('6图亚马逊视觉方案') || 
         normalizedContent.includes('Image 1 -') ||
         normalizedContent.includes('亚马逊定制商品视觉方案');
};
```

#### 步骤2：修复 `parseAmazonVisualPlan` 函数
正则表达式中将 `–` 改为匹配多种破折号：
```typescript
const regex = new RegExp(`Image ${i} [-–—] ([\\s\\S]*?)(?=Image ${i + 1} [-–—]|$)`);
```

#### 步骤3：修复 `getLastAmazonPlan` 使用函数式更新
使用 `useRef` 存储最新的 `messages`，避免闭包问题：
```typescript
const messagesRef = useRef(messages);
messagesRef.current = messages;

const getLastAmazonPlan = (): { planImages: GeneratedImagePlan[], userImage: string } | undefined => {
  const reversedMessages = [...messagesRef.current].reverse();
  // ... 其余逻辑不变
};
```

#### 步骤4：修复选择性生图的 API 调用
将 `/api/generate` 改为 `/api/chat`，使用正确的 SSE 流式请求格式：
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: plan.prompt }],
    referenceImages: lastPlan.userImage ? [lastPlan.userImage] : [],
    model: 'gpt-image-2-edit',
    size: selectedSize,
    quality: selectedQuality,
    n: 1,
  }),
});
```

#### 步骤5：添加消息持久化支持
在 `PersistedMessage` 接口中添加 `isAmazonPlan` 和 `planImages` 字段，并在恢复消息时恢复这些属性。

#### 步骤6：优化 `getLastAmazonPlan` 的查找逻辑
增加基于内容分析的回退方案——即使 `isAmazonPlan` 属性丢失，也能通过分析消息内容重新识别亚马逊方案：
```typescript
const getLastAmazonPlan = (): { planImages: GeneratedImagePlan[], userImage: string } | undefined => {
  const reversedMessages = [...messagesRef.current].reverse();
  let lastUserImage: string | undefined;
  
  for (const msg of reversedMessages) {
    if (msg.role === 'user' && msg.userImages && msg.userImages.length > 0) {
      lastUserImage = msg.userImages[0];
    }
    // 优先查找带 planImages 的消息
    if (msg.planImages && msg.planImages.length > 0) {
      return { planImages: msg.planImages, userImage: lastUserImage || '' };
    }
    // 回退：通过内容分析重新识别方案
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

## 风险评估
- 低风险：修改的是条件判断和正则表达式逻辑
- 需要确保 `parseAmazonVisualPlan` 的正则修改不影响现有解析
- 消息持久化修改需要兼容旧数据格式
