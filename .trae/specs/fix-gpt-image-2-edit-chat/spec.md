# GPT Image 2 Edit 对话助手生成失败修复 Spec

## Why
用户在对话助手组件中选择 GPT Image 2 编辑模型并上传图片后，生成图片时显示"❌ 图片生成失败，请重试"。这是代码级 bug，非 Vercel 部署问题。需要全面排查并修复。

## What Changes
- 修复 `generateWithGPTImage2Edit` 函数缺少 `quality` 参数的问题
- 修复 `generateWithRetry` 函数吞没错误信息的问题，使实际 API 错误能传递到前端
- 修复 `generateImageDirectly` 中错误消息不具体的问题
- 增强 `generateWithGPTImage2Edit` 和 `generateSingleImageWithGPTImage2EditFormData` 的日志记录
- 在 `generateImageDirectly` 中为 `gpt-image-2-edit` 传递 `quality` 参数

## Impact
- Affected code: `src/app/api/chat/route.ts`
- 不影响其他模型（gpt-image-2, gpt-image-2-gen, gpt-4o-image 等）的功能
- 不影响 `/api/generate` 路由
- 不影响前端组件

## 根因分析

经过全面排查，发现以下代码级问题导致 GPT Image 2 Edit 在对话助手中失败：

### 问题 1: `quality` 参数缺失（关键问题）
`generateWithGPTImage2Edit` 函数签名不接受 `quality` 参数：
```typescript
export async function generateWithGPTImage2Edit(
  prompt: string, referenceImages: string[] = [], n: number = 1, size: string = '1024x1024'
): Promise<string[]>
```
而 `/api/generate` 路由中发送 FormData 时包含了 `quality`：
```typescript
formData.append('quality', quality);
```
`generateImageDirectly` 调用 `generateWithGPTImage2Edit` 时也没有传递 `quality`：
```typescript
return await generateWithGPTImage2Edit(enhancedPrompt, referenceImages, n, size);
// quality 参数丢失！
```

### 问题 2: `generateWithRetry` 吞没错误信息（关键问题）
`generateWithRetry` 捕获所有异常后仅打印 warning，返回空数组：
```typescript
catch (error) {
  console.warn(`[Retry] 生成失败，正在重试 ${i + 1}/${maxRetries}:`, error);
}
// ...
return [];  // 实际错误信息丢失
```
导致 `generateImageDirectly` 只能显示通用错误"图片生成失败，请重试"，用户无法看到 API 返回的具体错误。

### 问题 3: `generateImageDirectly` 错误处理不传递具体信息
当 `imageUrls` 为空时，只发送通用错误：
```typescript
controller.enqueue(encoder.encode(
  `data: ${JSON.stringify({ type: 'error', message: '图片生成失败，请重试' })}\n\n`
));
```
无法告知用户具体失败原因（如 API Key 无效、图片格式不支持、API 端点错误等）。

### 问题 4: 日志不足
`generateWithGPTImage2Edit` 在 API 调用失败时没有记录完整的请求和响应信息，难以定位问题。

## ADDED Requirements

### Requirement: GPT Image 2 Edit 错误信息透传
系统 SHALL 在 GPT Image 2 Edit 生成失败时，将 API 返回的具体错误信息传递到前端显示，而非仅显示通用的"图片生成失败，请重试"。

#### Scenario: API 返回错误状态码
- **WHEN** yunwu.ai API 返回非 200 状态码
- **THEN** 前端显示具体错误信息，如"API 错误: 400 - Invalid image format"

#### Scenario: API 返回无法解析的响应
- **WHEN** API 响应格式不符合预期
- **THEN** 前端显示具体错误信息，如"API 返回格式错误"

#### Scenario: 缺少参考图片
- **WHEN** 用户选择 GPT Image 2 Edit 模型但未上传图片
- **THEN** 前端显示"图片编辑需要提供参考图片"

## MODIFIED Requirements

### Requirement: generateWithGPTImage2Edit 函数签名更新
`generateWithGPTImage2Edit` 函数 SHALL 接受 `quality` 参数，并将其传递到 FormData 中发送给 API。

### Requirement: generateWithRetry 错误处理增强
`generateWithRetry` 函数 SHALL 在所有重试失败后，抛出最后一次的错误而非返回空数组，使调用方能获取具体错误信息。

### Requirement: generateImageDirectly 错误消息增强
`generateImageDirectly` 函数 SHALL 在图片生成失败时，将具体的错误信息（来自 API 或内部异常）通过 SSE 事件传递到前端。

## REMOVED Requirements
无
