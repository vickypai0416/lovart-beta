# Tasks

- [ ] Task 1: 修改 page.tsx 对话助手组件 — 单图改为多图上传
  - [ ] SubTask 1.1: 将 `userImage: string | null` 改为 `userImages: string[]`，更新相关逻辑
  - [ ] SubTask 1.2: 修改 `handleImageUpload` 支持多文件上传（`e.target.files` 遍历），校验数量≤16、总大小≤50MB
  - [ ] SubTask 1.3: 修改图片预览区域，横向排列带序号标签（①②③）的缩略图，每张可单独删除
  - [ ] SubTask 1.4: 修改 `clearUserImage` 为 `clearAllImages`（清空全部）和 `removeImage(index)`（删除单张）
  - [ ] SubTask 1.5: 修改 `sendMessage` 中消息格式，将多张图片作为多个 `image_url` 传递
  - [ ] SubTask 1.6: 修改 `fileInputRef` 的 `<input>` 添加 `multiple` 属性
  - [ ] SubTask 1.7: 更新图片模式切换 UI（生成图片/图片识别），适配多图状态

- [ ] Task 2: 修改 ImageGeneratorWorkflow.tsx — 单图改为多图上传
  - [ ] SubTask 2.1: 将 `referenceImage: string | null` 改为 `referenceImages: string[]`
  - [ ] SubTask 2.2: 修改 file input 添加 `multiple`，遍历 `files` 上传
  - [ ] SubTask 2.3: 修改参考图预览区域，横向排列带序号标签的缩略图
  - [ ] SubTask 2.4: 修改 API 请求体，将 `referenceImage` 改为 `referenceImages` 数组

- [ ] Task 3: 修改 EcommerceWorkflow.tsx — 单图改为多图上传
  - [ ] SubTask 3.1: 将 `referenceImage: string | null` 改为 `referenceImages: string[]`
  - [ ] SubTask 3.2: 修改 `handleFileUpload` 支持多文件上传
  - [ ] SubTask 3.3: 修改 Step1 上传区域和预览，显示带序号标签的多图缩略图
  - [ ] SubTask 3.4: 修改 Step2 参考图预览区域
  - [ ] SubTask 3.5: 修改 API 请求体，将 `referenceImage` 改为 `referenceImages` 数组
  - [ ] SubTask 3.6: 修改 `analyzeProduct` 传递多图

- [ ] Task 4: 修改 /api/chat/route.ts — 支持多图传递
  - [ ] SubTask 4.1: 修改消息中图片提取逻辑，从消息中提取所有 `image_url` 为数组
  - [ ] SubTask 4.2: 修改 `generateWithGPTImage2` 支持多张图片作为 `image_url` 数组
  - [ ] SubTask 4.3: 修改 `generateWithGPTImage2Edit` 支持多张图片作为多个 `image` FormData 字段
  - [ ] SubTask 4.4: 修改 `generateImageDirectly` 函数签名，接受 `referenceImages: string[]`

- [ ] Task 5: 修改 /api/generate/route.ts — 支持多图传递
  - [ ] SubTask 5.1: 解析 `referenceImages` 数组参数
  - [ ] SubTask 5.2: 修改 edits 端点 FormData，将多张图片作为多个 `image` 字段附加
  - [ ] SubTask 5.3: 修改 generations 端点（无参考图时不传图片）

# Task Dependencies
- Task 4 depends on Task 1
- Task 5 depends on Task 2 and Task 3
