# Tasks

- [x] Task 1: 改造 `getImageUrl()` 返回 Base64 Data URL
  - [x] SubTask 1.1: 在 `idb-storage.ts` 中新增 `blobToDataURL()` 工具函数
  - [x] SubTask 1.2: 修改 `getImageUrl()` 使用 `blobToDataURL()` 替代 `URL.createObjectURL()`

- [x] Task 2: 改造对话助手图片渲染
  - [x] SubTask 2.1: 消息中的 `imageUrl` 渲染时，通过 `getChatHistoryWithUrls()` 获取 Data URL
  - [x] SubTask 2.2: 确保新生成的图片在保存后使用 Data URL 渲染

- [x] Task 3: 改造电商套图图片渲染
  - [x] SubTask 3.1: `generateImages` 成功后，从 `saveImageToHistory` 返回的 item 中获取 Data URL
  - [x] SubTask 3.2: `generatedImages` 状态使用 Data URL 而非外部 URL

- [x] Task 4: 改造图片生成器图片渲染
  - [x] SubTask 4.1: 生成图片成功后，将 URL 保存到 IndexedDB
  - [x] SubTask 4.2: 渲染时使用 Data URL

- [x] Task 5: 验证构建无错误，刷新后图片仍然显示

# Task Dependencies

- Task 2, 3, 4 均依赖 Task 1（需要 `getImageUrl()` 先返回 Data URL）
- Task 2, 3, 4 可并行执行
