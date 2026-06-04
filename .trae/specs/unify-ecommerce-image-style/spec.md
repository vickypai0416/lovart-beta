# 电商套图风格统一方案 Spec

## Why

当前电商套图工作流存在核心痛点：6张商品图通过独立 API 调用逐张生成，每次调用互不感知，导致风格、配色、光影不一致。用户期望的是一套视觉统一的商品图（像专业摄影师一次拍摄完成的效果），而不是6张风格各异的独立图片。

## 问题根因分析

当前架构的调用链路：

```
上传产品图 → AI分析产品 → 生成6段独立提示词 → 逐张调用生图API（6次独立请求）
```

每次 `/api/generate` 调用都是无状态的、独立的：
1. **提示词层面**：6段提示词虽然包含相同的产品名和卖点，但缺少统一的风格锚定词（如色板、光影参数、视觉风格描述）
2. **生图层面**：每次请求只传 `prompt + referenceImage`，生图模型无法知道"前一张图用了什么风格"
3. **API 层面**：`/api/generate` 是单次单图接口，没有"批量生成"或"风格继承"的概念

## 解决方案：风格锚定 + 首图驱动

核心思路：**先确定风格，再用风格驱动所有图片**。

### 方案架构

```
上传产品图 → AI分析产品 → 生成风格锚定词 → 生成主图(第1张) → 用主图作为风格参考生成其余5张
```

关键改动：
1. **提示词生成阶段**：增加"风格锚定词"输出，所有提示词共享同一组风格描述
2. **生图阶段**：先生成主图（白底图），然后将主图作为 `referenceImage` 传入后续5次生图调用，确保风格继承
3. **API 层面**：`/api/generate` 支持接收多个 `image` 参数（GPT Image 2 Edit 的 FormData 支持多图输入）

### 为什么这个方案可行

- GPT Image 2 Edit API 的 FormData 本身就支持多个 `image` 字段（用户之前提供的 curl 示例就有两个 image）
- 主图（白底图）的风格最纯粹，作为风格参考最合适
- 不需要修改外部 API，只需调整调用顺序和参数传递

## What Changes

- **`/api/generate-prompts` 路由**：增加 `styleAnchor` 字段输出，包含统一的风格描述词（色板、光影、构图风格等）
- **`/api/generate` 路由**：支持接收 `styleReferenceImage` 参数，作为额外的风格参考图传入 FormData
- **`EcommerceWorkflow.tsx` 组件**：改造 `generateImages` 函数，实现"首图驱动"生成流程——先生成主图，再以主图为风格参考生成其余图片
- **提示词模板**：所有6张图的提示词末尾追加统一的风格锚定词

## Impact

- Affected code:
  - `src/app/api/generate-prompts/route.ts` — 增加风格锚定词输出
  - `src/app/api/generate/route.ts` — 支持多图输入
  - `src/components/workflows/EcommerceWorkflow.tsx` — 改造生成流程
- 不影响其他组件（对话助手、图片生成器）

## ADDED Requirements

### Requirement: 风格锚定词生成

系统 SHALL 在生成提示词时，同时输出一组 `styleAnchor` 风格锚定词，包含：
- `colorPalette`：主色 + 辅色 + 强调色（如 "warm earth tones: cream white #FFF8F0, soft gold #D4A574, deep brown #5C3A21"）
- `lightingStyle`：统一光影描述（如 "soft natural window lighting, golden hour warmth, gentle shadows"）
- `visualStyle`：整体视觉风格（如 "minimalist luxury, clean composition, premium commercial photography"）
- `moodKeyword`：情绪关键词（如 "warm, elegant, heartfelt"）

#### Scenario: 生成提示词时自动产出风格锚定词

- **WHEN** 用户选择平台和场景后点击"生成提示词"
- **THEN** API 返回的响应中除了 `prompts` 数组外，还包含 `styleAnchor` 对象
- **AND** 每个 prompt 的末尾自动追加 styleAnchor 中的关键风格词

### Requirement: 首图驱动生成流程

系统 SHALL 实现"首图驱动"的图片生成流程：

1. 先生成主图（第1张，白底图）
2. 主图生成成功后，将其作为 `styleReferenceImage` 传入后续5次生图请求
3. 后续请求同时传入产品原图和主图，让 AI 在保持风格一致的前提下生成不同场景

#### Scenario: 主图生成成功后驱动后续图片生成

- **WHEN** 用户点击"生成选中的图片"
- **THEN** 系统首先生成主图（type=main）
- **AND** 主图生成成功后，将主图 URL 作为 styleReferenceImage 传入后续请求
- **AND** 后续请求的 FormData 中包含两个 image 字段：产品原图 + 主图
- **AND** UI 显示"正在生成主图... → 正在以主图风格生成其余图片..."

#### Scenario: 主图生成失败时的降级处理

- **WHEN** 主图生成失败
- **THEN** 系统降级为原有流程（不使用风格参考图，逐张独立生成）
- **AND** UI 提示"主图生成失败，将独立生成其余图片"

### Requirement: 多图输入 API 支持

`/api/generate` 路由 SHALL 支持接收 `styleReferenceImage` 参数：
- 当 `styleReferenceImage` 存在时，将其作为第二个 `image` 字段追加到 FormData
- 不影响无 `styleReferenceImage` 时的现有行为

#### Scenario: 带风格参考图的生图请求

- **WHEN** `/api/generate` 收到包含 `styleReferenceImage` 的请求
- **THEN** FormData 中追加第二个 `image` 字段（风格参考图）
- **AND** prompt 末尾追加风格一致性指令

#### Scenario: 不带风格参考图的生图请求

- **WHEN** `/api/generate` 收到不包含 `styleReferenceImage` 的请求
- **THEN** 行为与现有逻辑完全一致（向后兼容）

## MODIFIED Requirements

### Requirement: 提示词生成格式

原有提示词格式不变，但每个 prompt 末尾 SHALL 追加统一的风格锚定词片段，格式为：

```
[原有提示词内容], Style consistency: [colorPalette], [lightingStyle], [visualStyle], [moodKeyword]
```

### Requirement: 电商套图生成流程

原有"逐张独立生成"流程 SHALL 改为"首图驱动"流程：
- 原流程：`for (prompt of prompts) { generate(prompt, referenceImage) }`
- 新流程：`mainImage = generate(mainPrompt, referenceImage); for (prompt of restPrompts) { generate(prompt, referenceImage, mainImage) }`
