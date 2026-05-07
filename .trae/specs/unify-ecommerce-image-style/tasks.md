# Tasks

- [x] Task 1: 改造 `/api/generate-prompts` 路由，增加风格锚定词输出
  - [x] SubTask 1.1: 定义 `styleAnchor` 数据结构（colorPalette, lightingStyle, visualStyle, moodKeyword）
  - [x] SubTask 1.2: 在提示词生成逻辑中，根据产品类型和场景生成风格锚定词
  - [x] SubTask 1.3: 将 styleAnchor 片段追加到每个 prompt 末尾
  - [x] SubTask 1.4: 在 API 响应中增加 `styleAnchor` 字段

- [x] Task 2: 改造 `/api/generate` 路由，支持多图输入
  - [x] SubTask 2.1: 解析新参数 `styleReferenceImage`
  - [x] SubTask 2.2: 当 styleReferenceImage 存在时，将其转为 Blob 并作为第二个 `image` 字段追加到 FormData
  - [x] SubTask 2.3: 当 styleReferenceImage 存在时，在 prompt 末尾追加风格一致性指令
  - [x] SubTask 2.4: 确保无 styleReferenceImage 时行为不变（向后兼容）

- [x] Task 3: 改造 `EcommerceWorkflow.tsx` 的生成流程
  - [x] SubTask 3.1: 在 `generatePrompts` 成功后，保存 `styleAnchor` 到组件状态
  - [x] SubTask 3.2: 改造 `generateImages` 函数，实现"首图驱动"流程
    - 先从 selectedPrompts 中找到 type=main 的提示词并优先生成
    - 主图生成成功后，将其 URL 保存为 `styleReferenceImage`
    - 后续请求传入 `styleReferenceImage` 参数
  - [x] SubTask 3.3: 主图生成失败时降级为原有独立生成流程
  - [x] SubTask 3.4: 更新 UI 状态提示（"正在生成主图..." → "正在以主图风格生成其余图片..."）

# Task Dependencies

- Task 2 依赖 Task 1（API 需要先支持 styleAnchor 才能传递风格参考图）
- Task 3 依赖 Task 1 和 Task 2（前端需要两个 API 都改造完成才能实现首图驱动流程）
