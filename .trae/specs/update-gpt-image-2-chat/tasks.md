# Tasks

- [x] Task 1: 更新 image-models.ts 中 gpt-image-2 模型配置
  - [x] SubTask 1.1: 更新模型名称和描述，添加图片识别功能说明
  - [x] SubTask 1.2: 确保 API 端点和模型名称正确

- [x] Task 2: 更新 /api/chat/route.ts 中的 generateWithGPTImage2 函数
  - [x] SubTask 2.1: 按照文档格式构建请求体
  - [x] SubTask 2.2: 添加完整的系统提示词
  - [x] SubTask 2.3: 增强响应解析逻辑，支持多种响应格式
  - [x] SubTask 2.4: 添加图片识别模式支持（返回纯文本）

- [x] Task 3: 更新 page.tsx 对话助手组件
  - [x] SubTask 3.1: 添加图片识别模式选项（仅分析/生成）
  - [x] SubTask 3.2: 更新模型选择器，明确标识 GPT Image 2 的功能
  - [x] SubTask 3.3: 添加图片识别结果展示

# Task Dependencies
- Task 3 depends on Task 2
