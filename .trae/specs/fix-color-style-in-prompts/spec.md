# 修复电商套图提示词中配色方案和视觉风格未正确体现 Spec

## Why

用户选择了配色方案（如蓝色系）和视觉风格（如简约）后，生成的6张图片提示词中没有正确体现用户的选择。虽然 `appendStyleAnchor` 会追加风格锚定词，但存在两个问题：
1. 同时选择配色和风格时，视觉风格的 `moodKeyword` 会覆盖配色方案已设置的 `moodKeyword`
2. 配色方案和视觉风格信息只是作为 `Style consistency:` 后的附加文字追加在提示词末尾，不够明确和突出，用户在预览提示词时很难确认自己的选择是否生效

## What Changes

- **`generate-prompts/route.ts`**：修复 `moodKeyword` 覆盖问题，改为合并；在提示词中更明确地体现用户选择的配色和风格
- **`EcommerceWorkflow.tsx`**：在 Step4 提示词预览中显示当前使用的配色方案和视觉风格信息

## Impact

- Affected code:
  - `src/app/api/generate-prompts/route.ts` — 修复 moodKeyword 合并逻辑，增强提示词中的风格表达
  - `src/components/workflows/EcommerceWorkflow.tsx` — Step4 显示风格信息

## MODIFIED Requirements

### Requirement: 配色方案和视觉风格的 moodKeyword 合并

当用户同时选择配色方案和视觉风格时，系统 SHALL 将两者的 `moodKeyword` 合并而非覆盖。

#### Scenario: 同时选择配色方案和视觉风格

- **WHEN** 用户选择配色方案为"蓝色系"（moodKeyword: "calm, professional, trustworthy"）且视觉风格为"简约"（moodKeyword: "clean, simple, refined"）
- **THEN** 最终的 `moodKeyword` 应为 "calm, professional, trustworthy, clean, simple, refined"（合并而非覆盖）

### Requirement: 提示词中明确体现配色方案和视觉风格

当用户选择了非"自动"的配色方案或视觉风格时，系统 SHALL 在提示词中更明确地表达用户的选择，而不仅仅是作为 `Style consistency:` 后的附加文字。

#### Scenario: 用户选择蓝色系配色 + 简约风格

- **WHEN** 用户选择配色方案为"蓝色系"且视觉风格为"简约"
- **THEN** 每个提示词中应包含明确的配色指令（如 "Use blue color palette: deep navy #1B3A5C, sky blue #4A90D9, ice white #E8F1FA"）和风格指令（如 "Apply minimalist clean design style"）
- **AND** 这些指令应出现在提示词的关键位置，而不仅仅是末尾的 `Style consistency:` 部分

### Requirement: Step4 提示词预览中显示风格信息

系统 SHALL 在 Step4（提示词预览）页面中显示当前使用的配色方案和视觉风格，让用户确认自己的选择已生效。

#### Scenario: 用户进入 Step4 查看提示词

- **WHEN** 用户选择了配色方案和/或视觉风格后进入 Step4
- **THEN** 页面顶部应显示当前配色方案名称和色块预览
- **AND** 页面顶部应显示当前视觉风格名称和描述
