# 修复 GPT Image 2 Edit 多图生成只返回1张的问题

## Why
用户选择 GPT Image 2 Edit 模型并设置 n=4 生成4张图片时，API 消耗了4张图片的额度，但聊天助手只返回1张图片。需要全面排查数据流中所有环节，找出图片丢失的原因。

## What Changes
- 在 API 层添加详细日志，追踪 `n` 参数传递和响应解析
- 修复 `generateWithGPTImage2Edit` 函数中可能存在的响应解析问题
- 修复前端 SSE 事件处理中可能存在的竞态条件
- 修复 `/api/generate/route.ts` 中缺失的 `n` 参数传递

## Impact
- Affected code:
  - `src/app/api/chat/route.ts`（n 参数传递、响应解析、日志）
  - `src/app/api/generate/route.ts`（n 参数缺失）
  - `src/app/page.tsx`（SSE 事件处理、状态更新竞态条件）

## ADDED Requirements

### Requirement: 完整的 n 参数传递链
系统 SHALL 确保 `n` 参数从请求体解析到 API 调用完整传递，并在每个关键节点记录日志。

#### Scenario: n=4 时的完整传递
- **WHEN** 前端发送 `n: 4`
- **THEN** API 路由解析 `n=4`，传递给 `generateImageDirectly`，再传递给 `generateWithGPTImage2Edit`，最终在 FormData 中 `n='4'`

### Requirement: 多图响应正确解析
系统 SHALL 正确解析 API 返回的多张图片数据，遍历 `data.data` 数组提取所有图片 URL 或 base64 数据。

#### Scenario: API 返回4张 b64_json 图片
- **WHEN** API 返回 `data.data` 数组包含4个元素，每个元素有 `b64_json` 字段
- **THEN** 解析出4个 data URL 并返回

### Requirement: 前端正确处理多图 SSE 事件
系统 SHALL 正确处理多个 `type: 'image'` SSE 事件，将所有图片 URL 追加到消息的 `imageUrls` 数组中。

#### Scenario: 收到4个图片事件
- **WHEN** SSE 流中依次收到4个 `type: 'image'` 事件
- **THEN** 消息的 `imageUrls` 数组包含4个 URL

### Requirement: /api/generate 也支持 n 参数
系统 SHALL 在 `/api/generate/route.ts` 中正确传递 `n` 参数到 API 请求。

## MODIFIED Requirements

### Requirement: generateWithGPTImage2Edit 添加 n 参数日志
在 `generateWithGPTImage2Edit` 函数中添加 `n` 参数值的日志输出。

### Requirement: 前端 handleSaveChatImage 竞态条件修复
`handleSaveChatImage` 的异步操作可能导致状态更新竞态，需要确保多图场景下状态正确更新。
