# Tasks

- [x] Task 1: 全面排查 n 参数传递链并添加日志
  - [x] 在 `generateImageDirectly` 中添加 `n` 参数值的日志
  - [x] 在 `generateWithGPTImage2Edit` 中添加 `n` 参数值的日志
  - [x] 在 `generateWithGPTImage2Gen` 中添加 `n` 参数值的日志
  - [x] 在 `generateWithDALL3` 中添加 `n` 参数值的日志
  - [x] 在响应解析后添加 `data.data.length` 的日志

- [x] Task 2: 修复 generateWithGPTImage2Edit 响应解析
  - [x] 添加 `data.data.length` 日志，确认 API 返回了多少张图片
  - [x] 检查 b64_json 格式响应是否被正确解析
  - [x] 添加 `urls.length` 日志，确认解析出了多少张图片

- [x] Task 3: 修复前端 SSE 事件处理
  - [x] 检查 `handleSaveChatImage` 的竞态条件问题（已使用函数式更新，无需修改）
  - [x] 确保多个 `type: 'image'` 事件都能正确追加到 `imageUrls`
  - [x] 修复 `isGenerating: false` 在第一张图片后就设置的问题

- [x] Task 4: 修复 /api/generate/route.ts 中缺失的 n 参数
  - [x] 文生图模式添加 `n: imageCount` 到请求体
  - [x] 编辑模式添加 `formData.append('n', String(imageCount))`

# Task Dependencies
- Task 2, 3, 4 可并行执行
- Task 1 应先执行以获取诊断信息
