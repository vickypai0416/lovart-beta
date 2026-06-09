# 生成图片持久化 Spec

## Why

当前生成的图片 URL 来自外部 API（yunwu.ai 等），这些临时链接会在几小时到几天后过期失效。虽然项目已有 IndexedDB 持久化机制（`idb-storage.ts`），但存在两个关键问题：
1. `getImageUrl()` 使用 `URL.createObjectURL(blob)` 创建内存临时 URL，页面刷新后失效
2. 对话助手和电商套图的实时渲染没有通过持久化层获取图片，直接使用外部 URL

## 现有架构分析

已有的持久化链路：
```
生成图片 → 外部URL → saveImageBlobFromUrl() → IndexedDB (image_blobs store)
读取时 → idbGetImageBlob() → URL.createObjectURL(blob) → 临时内存URL
```

问题：`URL.createObjectURL()` 创建的 blob URL 生命周期绑定到文档，刷新后失效。

## 解决方案：Base64 Data URL 持久化

将 `getImageUrl()` 改为返回 `data:` URL 而非 `blob:` URL。Data URL 是纯字符串，可以安全地存储在 localStorage 和组件状态中，刷新后依然有效。

### 方案架构

```
生成图片 → 外部URL → saveImageBlobFromUrl() → IndexedDB (image_blobs store)
读取时 → idbGetImageBlob() → blob转dataURL → data:image/png;base64,... → 永久有效
```

## What Changes

- **`idb-storage.ts`**：`getImageUrl()` 改为返回 Base64 Data URL 而非 Object URL
- **`page.tsx`（对话助手）**：消息中的 `imageUrl` 通过 `getImageUrl()` 转换后再渲染
- **`EcommerceWorkflow.tsx`**：`generatedImages` 中的 URL 通过 `getImageUrl()` 转换后再渲染
- **`ImageGeneratorWorkflow.tsx`**：生成图片的 URL 通过 `getImageUrl()` 转换后再渲染

## Impact

- Affected code:
  - `src/lib/idb-storage.ts` — `getImageUrl()` 返回值从 blob URL 改为 data URL
  - `src/app/page.tsx` — 对话助手图片渲染
  - `src/components/workflows/EcommerceWorkflow.tsx` — 电商套图图片渲染
  - `src/components/workflows/ImageGeneratorWorkflow.tsx` — 图片生成器图片渲染

## ADDED Requirements

### Requirement: 图片 Data URL 持久化

`getImageUrl()` SHALL 将 IndexedDB 中的 Blob 转换为 Base64 Data URL 返回，而非 Object URL。

#### Scenario: 从 IndexedDB 获取图片

- **WHEN** 调用 `getImageUrl(imageId, fallbackUrl)`
- **AND** IndexedDB 中存在该 imageId 的 Blob
- **THEN** 返回 `data:image/png;base64,...` 格式的 Data URL
- **AND** 该 URL 可安全存储在组件状态和 localStorage 中
- **AND** 页面刷新后依然有效

#### Scenario: IndexedDB 中无图片时降级

- **WHEN** 调用 `getImageUrl(imageId, fallbackUrl)`
- **AND** IndexedDB 中不存在该 imageId 的 Blob
- **THEN** 返回原始 fallbackUrl（外部 URL）

### Requirement: 对话助手图片持久化渲染

对话助手中所有生成的图片 SHALL 通过持久化层渲染。

#### Scenario: 新生成的图片

- **WHEN** API 返回图片 URL
- **THEN** 先通过 `saveChatImageToHistory()` 保存到 IndexedDB
- **AND** 从 `getChatHistoryWithUrls()` 获取 Data URL 进行渲染

#### Scenario: 页面刷新后加载历史图片

- **WHEN** 页面刷新后加载聊天图片历史
- **THEN** 通过 `getChatHistoryWithUrls()` 从 IndexedDB 获取 Data URL
- **AND** 图片正常显示，不会因外部 URL 过期而失效

### Requirement: 电商套图图片持久化渲染

电商套图中所有生成的图片 SHALL 通过持久化层渲染。

#### Scenario: 生成图片后渲染

- **WHEN** `generateImages` 成功生成图片
- **THEN** 图片 URL 通过 `saveImageToHistory()` 保存到 IndexedDB
- **AND** 渲染时使用 `getRecentImages()` 返回的 Data URL

### Requirement: 图片生成器图片持久化渲染

图片生成器中生成的图片 SHALL 通过持久化层渲染。

#### Scenario: 生成图片后渲染

- **WHEN** `generateImage` 成功生成图片
- **THEN** 图片 URL 保存到 IndexedDB
- **AND** 渲染时使用 Data URL

## MODIFIED Requirements

### Requirement: getImageUrl 返回值

原有 `getImageUrl()` 返回 `URL.createObjectURL(blob)`（内存临时 URL），现改为返回 Base64 Data URL：

```typescript
// 之前：返回 blob: 开头的临时 URL（刷新失效）
return URL.createObjectURL(blob);

// 之后：返回 data: 开头的持久 URL（刷新有效）
return await blobToDataURL(blob);
```
