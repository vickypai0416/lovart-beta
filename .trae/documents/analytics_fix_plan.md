# 数据分析仪表盘图片收集问题修复计划

## 问题分析

经过代码分析，发现以下问题导致仪表盘无法收集图片生成记录：

1. **`/api/generate` 路由没有调用 analytics**：图片生成 API 本身没有记录生成记录，完全依赖前端的 `trackGeneration` 调用

2. **前端 `trackGeneration` 依赖 sessionId**：如果 sessionId 不可用（如页面加载顺序问题），生成记录不会被创建

3. **缺少后端保障**：即使前端调用失败，后端 API 也应该记录生成请求

## 修复方案

### 方案一：在 API 路由中添加 analytics 调用（推荐）

在 `/api/generate` 和 `/api/chat` 路由中直接调用 analytics 的 `createGeneration` 和 `updateGeneration` 函数，确保无论前端如何调用，都能记录生成记录。

### 修改文件列表

| 文件 | 修改内容 |
|------|----------|
| `src/app/api/generate/route.ts` | 添加 analytics 调用，记录图片生成请求和结果 |
| `src/app/api/chat/route.ts` | 添加 analytics 调用，记录图片生成请求和结果 |
| `src/lib/analytics.ts` | 添加用于后端调用的辅助函数 |

### 实施步骤

#### 步骤 1：修改 `/api/generate/route.ts`

- 在请求开始时调用 `createGeneration` 创建生成记录
- 在生成成功时调用 `updateGeneration` 更新状态和图片 URL
- 在生成失败时调用 `updateGeneration` 更新错误状态

#### 步骤 2：修改 `/api/chat/route.ts`

- 对于图片生成请求，添加相同的 analytics 调用逻辑

#### 步骤 3：确保 sessionId 可以从请求中获取

- 支持从请求头 `X-Session-ID` 获取 sessionId
- 如果没有 sessionId，生成一个临时 ID 用于记录

## 预期结果

修复后，数据分析仪表盘将能够：
- ✅ 收集所有通过 `/api/generate` 生成的图片记录
- ✅ 收集所有通过 `/api/chat` 生成的图片记录
- ✅ 记录图片 URL、生成状态、耗时等信息
- ✅ 即使前端调用失败，后端也能记录生成请求

## 风险评估

- **低风险**：修改集中在 API 路由层，不影响前端逻辑
- **向后兼容**：现有代码不受影响，新增功能作为补充

## 代码修改预览

```typescript
// 在 api/generate/route.ts 中添加
import { createGeneration, updateGeneration } from '@/lib/analytics';

// 在图片生成前后添加
const generation = await createGeneration({
  sessionId: sessionId || 'temp-' + Date.now(),
  prompt: finalPrompt,
  size,
  quality,
  model: modelName,
  count: imageCount,
  status: 'pending',
});

// 生成成功后
await updateGeneration(generation.id, {
  status: 'success',
  imageUrl: imageUrls[0],
  duration: Date.now() - startTime,
});
```
