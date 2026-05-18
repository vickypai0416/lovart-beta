# 修复上传图片时被误判为选择性生图的问题

## 问题描述

用户上传新图片后，系统仍然进入选择性生图流程，没有分析新上传的图片。

## 问题根因

图片上传使用异步的 `FileReader.onload`，虽然图片在界面上显示了，但由于 React 状态更新是异步的，在 `sendMessage` 被调用时，`userImages` 状态可能还是旧值（空数组）。

```typescript
const currentImages = [...userImages]; // 可能获取到的是空数组
const selectiveRequest = (selectedPersona === 'amazon-expert' && currentImages.length === 0) 
  ? isSelectiveGenerationRequest(effectiveContent) 
  : { match: false, indices: [] };
```

当 `currentImages.length === 0` 为 `true` 时，即使图片已经上传，也会被误判为选择性生图请求。

## 修复方案

### 修改文件
- `src/app/page.tsx`

### 修复步骤

1. 添加 `userImagesRef` 来存储 `userImages` 的最新值

```typescript
const userImagesRef = useRef<string[]>(userImages);
userImagesRef.current = userImages;
```

2. 在 `sendMessage` 中使用 `userImagesRef.current` 而不是 `userImages`

```typescript
const currentImages = [...userImagesRef.current];
const selectiveRequest = (selectedPersona === 'amazon-expert' && currentImages.length === 0) 
  ? isSelectiveGenerationRequest(effectiveContent) 
  : { match: false, indices: [] };
```

这样可以确保获取到最新的图片状态。

## 风险评估
- 低风险：只是添加了一个 ref 来追踪状态，不影响其他功能
