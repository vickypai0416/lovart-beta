# Tasks

- [x] Task 1: 修复 `generateWithGPTImage2Edit` 缺少 `quality` 参数
  - [x] SubTask 1.1: 在 `generateWithGPTImage2Edit` 函数签名中添加 `quality` 参数（默认值 `'high'`）
  - [x] SubTask 1.2: 在 FormData 构建中添加 `formData.append('quality', quality)`
  - [x] SubTask 1.3: 在 `generateImageDirectly` 中调用 `generateWithGPTImage2Edit` 时传递 `quality` 参数
  - [x] SubTask 1.4: 在 `generateWithYunwuAPIStream` 中自动生成调用 `generateWithGPTImage2Edit` 时也传递 `quality`

- [x] Task 2: 修复 `generateWithRetry` 吞没错误信息的问题
  - [x] SubTask 2.1: 修改 `generateWithRetry` 函数，在所有重试失败后抛出最后一次的错误，而非返回空数组
  - [x] SubTask 2.2: 保存最后一次的错误信息，在重试耗尽后抛出

- [x] Task 3: 修复 `generateImageDirectly` 错误消息不具体的问题
  - [x] SubTask 3.1: 确认 `generateImageDirectly` 的 catch 块已能捕获并传递具体错误信息（无需修改，因为 `generateWithRetry` 现在会抛出错误）
  - [x] SubTask 3.2: 确认 `generateWithRetry` 抛出错误后，catch 块能正确传递具体错误消息到前端

- [x] Task 4: 增强日志记录
  - [x] SubTask 4.1: 在 `generateWithGPTImage2Edit` 中添加更详细的请求参数日志（包含 size 和 quality）
  - [x] SubTask 4.2: 确认 `generateSingleImageWithGPTImage2EditFormData` 已有完整的 API 响应日志（无需修改）

# Task Dependencies
- Task 3 depends on Task 2（需要 generateWithRetry 先抛出错误，generateImageDirectly 才能捕获）
- Task 1 is independent
- Task 4 is independent
