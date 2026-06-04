# Tasks

- [ ] Task 1: 在 ImageGeneratorWorkflow.tsx 中集成 useAnalytics
  - [ ] SubTask 1.1: 导入 useAnalytics hook
  - [ ] SubTask 1.2: 在生图请求前调用 trackGeneration
  - [ ] SubTask 1.3: 在生图成功后调用 updateGeneration 更新为 success
  - [ ] SubTask 1.4: 在生图失败后调用 updateGeneration 更新为 failed

- [ ] Task 2: 在 page.tsx 对话助手中集成 useAnalytics
  - [ ] SubTask 2.1: 导入 useAnalytics hook
  - [ ] SubTask 2.2: 在图片生成模型发送请求前调用 trackGeneration
  - [ ] SubTask 2.3: 在收到图片后调用 updateGeneration 更新为 success
  - [ ] SubTask 2.4: 在收到错误后调用 updateGeneration 更新为 failed

- [ ] Task 3: 添加 Vercel KV 存储支持（持久化）
  - [ ] SubTask 3.1: 安装 @vercel/kv 依赖
  - [ ] SubTask 3.2: 创建 KV 存储适配器
  - [ ] SubTask 3.3: 修改 analytics.ts 支持多存储后端
  - [ ] SubTask 3.4: 配置 vercel.json 添加 KV 绑定

# Task Dependencies
- Task 1 and Task 2 are independent
- Task 3 is independent
