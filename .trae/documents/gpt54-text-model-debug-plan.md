# GPT-5.4 文本模型 API 调用失败排查计划

## 排查结果

### 完整调用链路

```
前端 page.tsx                    后端 route.ts                      外部 API
┌─────────────────┐          ┌──────────────────────┐          ┌──────────────────┐
│ sendMessage()    │          │ POST /api/chat       │          │ yunwu.ai         │
│ selectedModel=   │  ────►   │ modelConfig.type=    │  ────►   │ /v1/chat/        │
│ 'gpt-5-nano'     │          │ 'text'               │          │ completions      │
│                  │          │ → generateWithYunwu  │          │ model=gpt-5.4    │
│ fetch('/api/chat'│          │   APIStream()        │          │ stream=true      │
│  model, messages │          │ → fetch yunwu.ai     │          │                  │
│  autoGenerate)   │          │ → 解析 SSE 流        │  ◄────   │ SSE 流式响应      │
│                  │  ◄────   │ → 转发 SSE 给前端    │          │                  │
│ 解析 SSE 显示    │          │                      │          │                  │
└─────────────────┘          └──────────────────────┘          └──────────────────┘
```

### 发现的问题

#### 🔴 问题 1：`modelName` 默认值未更新（关键问题）

**文件**：`src/app/api/chat/route.ts` 第 488 行

```typescript
const modelName = modelConfig.modelName || 'gpt-5.4-nano';
```

虽然 `image-models.ts` 中已将 `modelName` 改为 `'gpt-5.4'`，但这里的 fallback 值仍然是旧的 `'gpt-5.4-nano'`。如果 `modelConfig.modelName` 因某种原因为空，就会使用错误的模型名。

**修复**：改为 `modelConfig.modelName || 'gpt-5.4'`

***

#### 🔴 问题 2：纯文本消息被错误包装为数组格式（关键问题）

**文件**：`src/app/api/chat/route.ts` 第 548-551 行

```typescript
...messages.map(m => ({
  role: m.role,
  content: Array.isArray(m.content) ? m.content : [{ type: 'text', text: m.content }]
}))
```

当用户发送纯文本消息时，前端发送的 `content` 是字符串（如 `"你好"`），后端将其包装为 `[{ type: 'text', text: '你好' }]`。

**问题**：GPT-5.4 文本模型可能不支持这种 OpenAI Vision API 格式的消息内容。纯文本对话应该直接传字符串，只有包含图片时才用数组格式。

**修复**：纯文本消息保持字符串格式，只有包含图片时才用数组格式。

***

#### 🟡 问题 3：流式响应解析可能遗漏数据

**文件**：`src/app/api/chat/route.ts` 第 612-614 行

```typescript
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() || '';
```

SSE 标准用 `\n\n` 分隔事件，但代码只按 `\n` 分割。如果 yunwu.ai 返回的 SSE 格式不规范，可能导致解析失败。

**修复**：改为按 `\n\n` 分割事件，然后按 `\n` 分割行。

***

#### 🟡 问题 4：API 错误时没有重试机制

文本模型调用 `generateWithYunwuAPIStream` 没有重试逻辑（图片模型已有重试），遇到 502/503 等临时错误直接返回失败。

**修复**：为文本模型也添加重试机制。

***

#### 🟢 问题 5：前端错误处理不够友好

**文件**：`src/app/page.tsx` 第 262 行

```typescript
if (!response.ok) throw new Error('请求失败');
```

只抛出通用错误，没有显示具体的 API 错误信息。

**修复**：读取错误响应体中的详细信息。

***

## 实施步骤

### 步骤 1：修复 modelName 默认值

* 文件：`src/app/api/chat/route.ts`

* 改 `'gpt-5.4-nano'` → `'gpt-5.4'`

### 步骤 2：修复消息格式

* 文件：`src/app/api/chat/route.ts`

* 纯文本消息保持字符串 content，只有包含图片的消息才用数组格式

### 步骤 3：改进 SSE 解析

* 文件：`src/app/api/chat/route.ts`

* 按 `\n\n` 分割事件

### 步骤 4：添加文本模型重试机制

* 文件：`src/app/api/chat/route.ts`

* 对 502/503/429 错误自动重试 3 次

### 步骤 5：改进前端错误提示

* 文件：`src/app/page.tsx`

* 显示 API 返回的具体错误信息

### 影响范围

* 仅修改 `src/app/api/chat/route.ts` 和 `src/app/page.tsx`

* 不影响电商套图组件和其他功能

