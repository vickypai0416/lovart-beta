# 图片生成组件模型改为 GPT-Image-2-all

## 目标

将图片生成器组件（ImageGeneratorWorkflow）的模型从 `gpt-image-2` 改为 `gpt-image-2-all`。

## 分析

当前状态：
- 图片生成器组件的 `models` 列表只有一个选项：`{ value: 'gpt-image-2', label: 'GPT Image 2' }`
- `gpt-image-2` 在 `image-models.ts` 中的 `modelName` 是 `gpt-image-2`
- `gpt-image-2-edit` 的 `modelName` 是 `gpt-image-2-all`（已存在）
- 用户希望图片生成器使用 `gpt-image-2-all` 模型

`gpt-image-2-all` 是 yunwu.ai 提供的 GPT Image 2 全功能版本，支持生成+编辑，比单独的 `gpt-image-2` 功能更全。

## 实施步骤

### Step 1: 修改 `ImageGeneratorWorkflow.tsx` 的模型选项

将 `models` 数组从：
```typescript
const models = [
  { value: 'gpt-image-2', label: 'GPT Image 2' },
];
```
改为：
```typescript
const models = [
  { value: 'gpt-image-2-all', label: 'GPT Image 2 All' },
];
```

同时将 `selectedModel` 的默认值从 `'gpt-image-2'` 改为 `'gpt-image-2-all'`。

### Step 2: 修改 `image-models.ts` 添加 `gpt-image-2-all` 模型配置

在 `IMAGE_MODELS` 中新增 `gpt-image-2-all` 条目：
```typescript
'gpt-image-2-all': {
  id: 'gpt-image-2-all',
  name: 'GPT Image 2 All',
  description: 'GPT Image 2 全功能版，支持生成+编辑',
  type: 'image',
  available: false,
  apiKey: process.env.GPT_IMAGE_2_API_KEY || process.env.YUNWU_API_KEY || '',
  endpoint: 'https://yunwu.ai/v1/images/edits',
  modelName: 'gpt-image-2-all',
},
```

同时更新 `ImageModel` 类型联合，添加 `'gpt-image-2-all'`。

### Step 3: 修改 `/api/generate/route.ts` 支持 `gpt-image-2-all`

在 API 路由中，当 `model` 为 `gpt-image-2-all` 时，使用与 `gpt-image-2-edit` 相同的 FormData 请求方式（因为 `gpt-image-2-all` 走的是 `/v1/images/edits` 端点）。

检查 API 路由中模型判断逻辑，确保 `gpt-image-2-all` 被正确路由到 edits 端点。

### Step 4: 验证构建无错误

## 影响范围

- `src/components/workflows/ImageGeneratorWorkflow.tsx` — 模型选项和默认值
- `src/lib/image-models.ts` — 新增模型配置
- `src/app/api/generate/route.ts` — 可能需要调整模型路由逻辑
