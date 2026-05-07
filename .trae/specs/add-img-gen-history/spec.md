# 图片生成组件历史记录 Spec

## Why
图片生成组件（ImageGeneratorWorkflow）当前只有一个内存中的简单历史数组，页面刷新后即丢失。而对话助手和电商套图组件都已配备持久化的图片历史记录功能，图片生成组件缺少这一功能，用户体验不一致。

## What Changes
- 在 `history-manager.ts` 中新增图片生成器专用的历史记录接口和 CRUD 函数（参照 `ChatImageHistoryItem` 模式）
- 修改 `ImageGeneratorWorkflow.tsx`，添加标签页切换 UI（生成器 / 图片历史）
- 生成图片后自动保存到持久化历史
- 页面加载时从持久化存储恢复历史记录
- 支持查看、删除单张、清空全部历史
- 移除旧的内存 `history` 状态，统一使用新的持久化历史系统

## Impact
- Affected code: `src/lib/history-manager.ts`, `src/components/workflows/ImageGeneratorWorkflow.tsx`
- 不影响其他组件功能

## ADDED Requirements

### Requirement: 图片生成器历史记录数据层
系统 SHALL 在 `history-manager.ts` 中提供 `ImgGenHistoryItem` 接口和以下函数：
- `saveImgGenHistory(url, prompt, size, model)` — 保存一条生成记录，自动持久化图片 Blob 到 IndexedDB
- `getImgGenHistory()` — 获取所有历史记录（元数据）
- `getImgGenHistoryWithUrls()` — 获取所有历史记录（含持久化 URL）
- `deleteImgGenImage(imageId)` — 删除单条记录及其 Blob
- `clearImgGenHistory()` — 清空所有记录及其 Blob

#### Scenario: 保存生成图片
- **WHEN** 用户通过图片生成器成功生成一张图片
- **THEN** 系统自动将该图片的 URL、提示词、尺寸、模型信息保存到 localStorage，并将图片 Blob 保存到 IndexedDB

#### Scenario: 页面刷新后恢复历史
- **WHEN** 用户刷新页面后打开图片生成组件的历史标签
- **THEN** 系统从 localStorage 和 IndexedDB 恢复所有历史记录，图片可正常显示

### Requirement: 图片生成器历史记录 UI
系统 SHALL 在 ImageGeneratorWorkflow 组件中提供标签页切换 UI：
- "图片生成" 标签页：当前的生成界面
- "图片历史" 标签页：显示所有历史生成记录

#### Scenario: 查看历史记录
- **WHEN** 用户点击"图片历史"标签
- **THEN** 系统显示所有历史生成图片的网格视图，每张图片显示缩略图，悬停显示提示词和删除按钮

#### Scenario: 删除单张历史图片
- **WHEN** 用户点击某张历史图片的删除按钮
- **THEN** 系统删除该条记录及其 Blob，刷新历史列表

#### Scenario: 清空全部历史
- **WHEN** 用户点击"清空全部"按钮
- **THEN** 系统删除所有历史记录及其 Blob，历史列表清空

#### Scenario: 点击历史图片查看大图
- **WHEN** 用户点击某张历史图片
- **THEN** 系统将该图片设为当前展示的生成图片，并自动切换到"图片生成"标签页

## MODIFIED Requirements

### Requirement: ImageGeneratorWorkflow 生成后保存历史
图片生成器成功生成图片后，SHALL 调用 `saveImgGenHistory` 保存记录，而非仅更新内存 `history` 状态。旧的内存 `history` 状态 SHALL 被移除。
