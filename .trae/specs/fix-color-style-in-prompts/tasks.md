# Tasks

- [x] Task 1: 修复 generate-prompts API 中 moodKeyword 覆盖问题
  - [x] 1.1: 修改 colorScheme 和 visualStyle 的 moodKeyword 合并逻辑，将两者合并而非覆盖
  - [x] 1.2: 在提示词中更明确地体现配色方案和视觉风格，将配色指令和风格指令放在提示词关键位置

- [x] Task 2: 在 EcommerceWorkflow Step4 中显示风格信息
  - [x] 2.1: 将 styleAnchor 信息传递到 Step4 组件
  - [x] 2.2: 在 Step4 页面顶部显示当前配色方案名称、色块预览和视觉风格信息

# Task Dependencies
- Task 2 depends on Task 1（需要 API 返回正确的 styleAnchor 信息）
