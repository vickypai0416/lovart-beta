# AI 商品图生成工作流程

## 概述

本文档描述了从用户上传产品图到自动生成商品图的完整工作流程。

---

## 工作流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户操作                                      │
├─────────────────────────────────────────────────────────────────────┤
│  1. 上传产品图片                                                      │
│  2. 勾选「分析后自动生成图片」                                         │
│  3. 输入需求（如「生成亚马逊listing套图」）                            │
│  4. 点击发送                                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    步骤1: 产品分析 (GPT-5 nano)                       │
├─────────────────────────────────────────────────────────────────────┤
│  模型: gpt-5.4-nano                                                  │
│  端点: https://yunwu.ai/v1/chat/completions                          │
│  能力: 图片识别 + 文本生成                                            │
│                                                                       │
│  输入:                                                                │
│    - 产品图片 URL                                                     │
│    - 用户需求描述                                                     │
│    - 系统提示（指导生成格式化提示词）                                  │
│                                                                       │
│  输出:                                                                │
│    - 产品分析结果                                                     │
│    - 格式化的图片生成提示词：                                         │
│      [GENERATE_IMAGE]                                                 │
│      专业产品摄影提示词...                                            │
│      [/GENERATE_IMAGE]                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                 步骤2: 图片生成 (GPT Image 2 编辑)                    │
├─────────────────────────────────────────────────────────────────────┤
│  模型: gpt-image-2-all                                               │
│  端点: https://yunwu.ai/v1/images/edits                              │
│  格式: multipart/form-data                                           │
│                                                                       │
│  输入:                                                                │
│    - 原始产品图片 (image)                                             │
│    - 步骤1生成的提示词 (prompt)                                       │
│    - 模型参数 (model, n, size 等)                                    │
│                                                                       │
│  输出:                                                                │
│    - 生成的图片 URL                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         结果展示                                      │
├─────────────────────────────────────────────────────────────────────┤
│  - 聊天区域显示分析结果和生成状态                                     │
│  - 生成的图片自动添加到画布                                           │
│  - 用户可继续对话调整                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 模型配置

### 文本模型 (GPT-5 nano)

| 属性 | 值 |
|------|------|
| ID | `gpt-5-nano` |
| modelName | `gpt-5.4-nano` |
| 端点 | `/v1/chat/completions` |
| 能力 | 文本对话 + 图片识别 |
| 流式 | 支持 |

### 图片模型

| 模型 ID | modelName | 端点 | 用途 |
|---------|-----------|------|------|
| `gpt-image-2` | `gpt-image-2` | `/v1/chat/completions` | 图文生图、美化 |
| `gpt-image-2-gen` | `gpt-image-2` | `/v1/images/generations` | 纯文本生图 |
| `gpt-image-2-edit` | `gpt-image-2-all` | `/v1/images/edits` | 图片编辑、美化 |
| `gpt-4o-image` | `gpt-image-2` | `/v1/chat/completions` | 图文生图 |

---

## API 请求示例

### 步骤1: 产品分析

```typescript
// 请求
POST https://yunwu.ai/v1/chat/completions
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "model": "gpt-5.4-nano",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的产品摄影提示词专家。当用户提供产品图片和需求时，分析产品特点并生成专业的图片生成提示词。请用以下格式输出提示词：\n\n[GENERATE_IMAGE]\n你的提示词内容...\n[/GENERATE_IMAGE]"
    },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "生成亚马逊listing套图" },
        { "type": "image_url", "image_url": { "url": "https://产品图片URL" } }
      ]
    }
  ],
  "stream": true
}

// 响应（流式）
[GENERATE_IMAGE]
Professional Amazon product photography, pure white background (#FFFFFF), 
leather belt centered in frame, product fills 85% of image, 
studio lighting, no shadows, high resolution, 4K quality
[/GENERATE_IMAGE]
```

### 步骤2: 图片生成

```typescript
// 请求
POST https://yunwu.ai/v1/images/edits
Content-Type: multipart/form-data
Authorization: Bearer {API_KEY}

FormData:
  - image: [产品图片文件]
  - prompt: "Professional Amazon product photography..."
  - model: "gpt-image-2-all"
  - n: "1"
  - size: "1024x1024"

// 响应
{
  "id": "img-xxx",
  "choices": [{
    "index": 0,
    "message": {
      "content": "https://生成的图片URL"
    }
  }]
}
```

---

## 系统提示模板

### 产品分析系统提示

```text
你是一个专业的产品摄影提示词专家。当用户提供产品图片和需求时：

1. 分析产品特点：
   - 产品类型和用途
   - 材质和质感
   - 颜色和设计特点
   - 目标受众

2. 根据用户需求生成专业的图片生成提示词

3. 输出格式要求：
   - 先简要描述产品分析结果
   - 然后用以下格式输出提示词：
   
[GENERATE_IMAGE]
专业的图片生成提示词...
[/GENERATE_IMAGE]

注意：
- 提示词要具体、专业
- 包含摄影风格、光线、角度等技术参数
- 符合 Amazon 商品图规范（如适用）
```

---

## 亚马逊商品图规范

一个完整的亚马逊 Listing 商品图套系应包含 **6 张图片**：

| 序号 | 类型 | 描述 |
|------|------|------|
| 1 | 白底主图 | 纯白背景，商品占比 85%，无边框无水印 |
| 2 | 场景图 | 商品使用场景展示 |
| 3 | 功能卖点图 | 核心功能展示 |
| 4 | 细节图 | 局部特写 |
| 5 | 尺寸/对比图 | 大小参照 |
| 6 | 生活/情感图 | 情感共鸣 |

### 白底主图要求

- **背景**：纯白色 (#FFFFFF)
- **商品占比**：85% 左右
- **禁止**：边框、水印、文字、Logo、阴影
- **格式**：JPEG/PNG，建议 2000x2000px 以上

---

## 前端状态管理

```typescript
// 状态定义
const [autoGenerate, setAutoGenerate] = useState(false);
const [uploadedImages, setUploadedImages] = useState<string[]>([]);

// 发送请求时
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: messages,
    modelId: selectedModel,
    images: uploadedImages,
    autoGenerate: autoGenerate  // 是否自动生成
  })
});
```

---

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 网络错误 | 提示用户重试 |
| API 限流 | 显示等待时间，自动重试 |
| 图片生成失败 | 显示错误信息，允许重新生成 |
| 用户取消 | 中断请求，显示"已取消" |

---

## 扩展方向

1. **多图片批量生成** - 一次生成多张不同风格的商品图 ✅ 已实现
2. **提示词模板库** - 预设多种商品类型的提示词模板
3. **生成历史记录** - 保存用户生成记录，方便对比
4. **图片编辑增强** - 支持局部修改、背景替换等
5. **多平台适配** - 支持 eBay、淘宝等其他电商平台的图片规范

---

## 场景关键词检测（已实现）

当用户输入包含特定场景关键词时，自动触发 6 张商品图批量生成。

### 支持的场景关键词

- 父亲节、母亲节、情人节、圣诞节
- 新年、春节、生日、婚礼
- 儿童节、教师节、国庆节、中秋节、端午节、元宵节、七夕

### 触发条件

用户输入需要同时满足：
1. 包含场景关键词（如"父亲节"）
2. 包含动作关键词（"生成"、"套图"、"商品图"之一）
3. 已上传产品图片

### API 端点

```
POST /api/generate-6-images
```

### 请求格式

```typescript
{
  imageUrl: string;      // 产品图片 URL
  productAnalysis: string; // 产品分析（可选）
  scene: string;         // 场景关键词，如 "父亲节"
}
```

### 生成的 6 张图片类型

| 序号 | 类型 | 英文标识 | 描述 |
|------|------|----------|------|
| 1 | 白底主图 | main | 纯白背景，符合亚马逊规范 |
| 2 | 场景图 | scene | 结合节日场景的产品展示 |
| 3 | 功能卖点图 | features | 展示产品核心卖点 |
| 4 | 细节图 | detail | 材质和工艺特写 |
| 5 | 尺寸对比图 | size | 产品尺寸参照 |
| 6 | 生活情感图 | lifestyle | 节日礼物情感呈现 |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.1 | 2026-04-28 | 新增场景关键词检测，支持一键生成 6 张商品图 |
| 1.0 | 2026-04-28 | 初始版本，实现自动生成流程 |

