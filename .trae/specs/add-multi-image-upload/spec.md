# 多图上传功能 Spec

## Why
当前所有生图组件（对话助手、图片生成器、电商套图）仅支持上传单张参考图片。根据 API 文档，`/v1/images/edits` 端点支持最多 16 张图片上传，用户需要同时上传多张图片让 AI 进行融合编辑或风格参考。

## What Changes
- 将三个组件的单图上传改为多图上传（最多 16 张，总大小 50MB 以内）
- 每张上传的图片自动显示序号标签（①②③...），方便用户识别
- 用户可单独删除某张图片
- API 层支持接收和传递多张图片
- 对话助手的消息格式支持多图

## Impact
- Affected code: `src/app/page.tsx`, `src/components/workflows/ImageGeneratorWorkflow.tsx`, `src/components/workflows/EcommerceWorkflow.tsx`, `src/app/api/chat/route.ts`, `src/app/api/generate/route.ts`
- 不影响其他组件功能

## ADDED Requirements

### Requirement: 多图上传 UI
系统 SHALL 在所有生图组件中支持多图上传：
- 最多 16 张图片，总大小不超过 50MB
- 每张图片显示可见的序号标签（①②③...）
- 用户可单独删除某张图片
- 支持拖拽和点击上传
- 图片预览区域横向排列，可滚动

#### Scenario: 上传多张图片
- **WHEN** 用户通过点击或拖拽上传多张图片
- **THEN** 系统将所有图片显示为带序号标签的缩略图列表

#### Scenario: 超出限制
- **WHEN** 用户上传的图片数量超过 16 张或总大小超过 50MB
- **THEN** 系统提示"最多上传16张图片，总大小不超过50MB"并拒绝多余的图片

#### Scenario: 删除单张图片
- **WHEN** 用户点击某张图片的删除按钮
- **THEN** 系统删除该图片，剩余图片序号自动重排

### Requirement: 多图 API 传递
系统 SHALL 将多张图片正确传递给 API：

#### Scenario: 对话助手多图传递
- **WHEN** 用户在对话助手中上传多张图片并发送消息
- **THEN** 系统将所有图片作为 `image_url` 数组传递给 `/api/chat`

#### Scenario: 图片生成器多图传递
- **WHEN** 用户在图片生成器中上传多张图片并生成
- **THEN** 系统将所有图片作为 `referenceImages` 数组传递给 `/api/generate`

#### Scenario: 电商套图多图传递
- **WHEN** 用户在电商套图中上传多张图片
- **THEN** 系统将所有图片作为 `referenceImages` 数组传递给 `/api/generate`

### Requirement: API 多图处理
API 层 SHALL 支持接收多张图片并正确转发给模型 API：

#### Scenario: Chat API 多图
- **WHEN** `/api/chat` 接收到包含多张图片的请求
- **THEN** 将所有图片作为 `image_url` 内容项传递给 GPT Image 2 的 chat 端点

#### Scenario: Generate API 多图
- **WHEN** `/api/generate` 接收到包含多张图片的请求
- **THEN** 将所有图片作为多个 `image` 字段附加到 FormData 传递给 edits 端点

## MODIFIED Requirements

### Requirement: 单图状态改为多图数组
所有组件中的 `userImage: string | null` / `referenceImage: string | null` SHALL 改为 `userImages: string[]` / `referenceImages: string[]`

## REMOVED Requirements
无
