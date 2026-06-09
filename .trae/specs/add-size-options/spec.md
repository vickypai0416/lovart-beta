# 组件尺寸选项 Spec

## Why

当前只有图片生成器组件有尺寸选择，电商套图硬编码 1024x1024，对话助手不传 size 参数（使用 API 默认值）。用户无法根据需求选择合适的图片尺寸和比例，导致生成的图片可能不符合使用场景（如电商横幅需要宽图、手机端需要竖图等）。

## What Changes

- **对话助手（page.tsx）**：在头部模型选择器旁增加尺寸选择器，生图请求时传入 size 参数
- **电商套图（EcommerceWorkflow.tsx）**：增加尺寸选择器，替换硬编码的 `1024x1024`
- **图片生成器（ImageGeneratorWorkflow.tsx）**：更新尺寸选项，增加 2K 分辨率选项

## Impact

- Affected code:
  - `src/app/page.tsx` — 对话助手增加尺寸选择器和 size 参数传递
  - `src/components/workflows/EcommerceWorkflow.tsx` — 增加尺寸选择器
  - `src/components/workflows/ImageGeneratorWorkflow.tsx` — 更新尺寸选项列表

## ADDED Requirements

### Requirement: 统一尺寸选项

所有组件 SHALL 使用统一的尺寸选项列表，基于 GPT Image 2 支持的分辨率：

| 尺寸 | 比例 | 适用场景 |
|------|------|---------|
| 1024×1024 | 1:1 | 正方形商品图、社交媒体 |
| 1536×1024 | 3:2 | 横版商品图 |
| 1024×1536 | 2:3 | 竖版商品图、手机端 |
| 2000×1125 | 16:9 | 宽幅横幅、视频封面 |
| 1125×2000 | 9:16 | 竖版海报、手机壁纸 |
| 2000×2000 | 1:1 | 高清正方形 |

#### Scenario: 用户选择尺寸后生图

- **WHEN** 用户在任意组件中选择尺寸并生成图片
- **THEN** 请求体中包含 `size` 参数，值为用户选择的尺寸
- **AND** API 根据该尺寸生成图片

### Requirement: 对话助手尺寸选择器

对话助手 SHALL 在头部区域（模型选择器旁）增加尺寸选择器，仅在选择了图片模型时显示。

#### Scenario: 选择图片模型时显示尺寸选择器

- **WHEN** 用户选择了图片类模型（gpt-image-2 / gpt-image-2-gen / gpt-image-2-edit）
- **THEN** 尺寸选择器出现在模型选择器旁边
- **AND** 默认值为 1024×1024

#### Scenario: 选择文本模型时隐藏尺寸选择器

- **WHEN** 用户选择了文本类模型（gpt-5-nano / gpt-5.4）
- **THEN** 尺寸选择器隐藏

### Requirement: 电商套图尺寸选择器

电商套图 SHALL 在头部区域增加尺寸选择器，默认值为 1024×1024。

#### Scenario: 电商套图生图时传入尺寸

- **WHEN** 用户在电商套图中生成图片
- **THEN** 所有 `generateImages` 中的 API 请求使用用户选择的尺寸
- **AND** 替换当前硬编码的 `1024x1024`

## MODIFIED Requirements

### Requirement: 图片生成器尺寸选项

图片生成器的尺寸选项 SHALL 更新为统一列表，替换当前的旧列表。

旧列表：512×512, 1024×1024, 1024×1792, 1792×1024, 1464×600, 1500×1500
新列表：1024×1024, 1536×1024, 1024×1536, 2000×1125, 1125×2000, 2000×2000
