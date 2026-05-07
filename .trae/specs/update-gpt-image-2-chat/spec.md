# 对话助手组件 - GPT Image 2 模型更新 Spec

## Why
用户提供了 GPT Image 2 聊天创作 API 的官方文档截图，当前代码实现需要根据文档进行更新，以支持完整的"对话生图+图片识别"功能。

## What Changes
- 更新 `image-models.ts` 中 `gpt-image-2` 模型的配置，添加图片识别相关描述
- 更新 `/api/chat/route.ts` 中的 `generateWithGPTImage2` 函数，按照文档格式构建请求
- 更新 `page.tsx` 对话助手组件，支持图片识别模式（仅分析图片不生成）
- 添加新的响应解析逻辑，支持文档中描述的多种响应格式

## Impact
- Affected code: `src/lib/image-models.ts`, `src/app/api/chat/route.ts`, `src/app/page.tsx`
- 不影响其他组件功能

## ADDED Requirements

### Requirement: GPT Image 2 图片识别功能
系统 SHALL 支持使用 GPT Image 2 模型进行图片识别分析，用户上传图片后可选择仅分析而不生成图片。

#### Scenario: 图片识别模式
- **WHEN** 用户上传图片并选择"仅识别"模式
- **THEN** 系统调用 GPT Image 2 进行图片分析，返回文本描述结果

#### Scenario: 图文混合生图
- **WHEN** 用户上传图片并输入生图提示词
- **THEN** 系统调用 GPT Image 2 的聊天创作 API，根据图片和提示词生成新图片

## MODIFIED Requirements

### Requirement: GPT Image 2 模型配置更新
`gpt-image-2` 模型的描述 SHALL 更新为"对话生图+图片识别，支持图文输入和文本/图片输出"

### Requirement: API 请求格式更新
`generateWithGPTImage2` 函数 SHALL 按照文档格式构建请求，包含完整的系统提示词和消息结构

### Requirement: 响应解析逻辑增强
系统 SHALL 支持解析文档中描述的多种响应格式，包括：
- 图片 URL 在 content 字段中
- 图片 URL 在 image_url 字段中
- 纯文本响应（图片识别结果）

## REMOVED Requirements
无

## 文档关键信息提取

根据用户提供的文档截图，关键信息包括：

### 1. API 端点
- POST `https://yunwu.ai/v1/chat/completions`

### 2. 请求格式
```json
{
  "model": "gpt-image-2",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "分析这张图片"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "base64或URL"
          }
        }
      ]
    }
  ]
}
```

### 3. 响应格式
- 图片生成：返回包含图片 URL 的响应
- 图片识别：返回纯文本描述

### 4. 支持的功能
- 对话生图：根据文本描述生成图片
- 图片识别：分析上传的图片内容
- 图文混合：结合图片和文本进行创作