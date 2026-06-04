# Tasks

- [x] Task 1: 更新图片生成器尺寸选项
  - [x] SubTask 1.1: 将 sizes 数组替换为统一列表：1024×1024, 1536×1024, 1024×1536, 2000×1125, 1125×2000, 2000×2000

- [x] Task 2: 对话助手增加尺寸选择器
  - [x] SubTask 2.1: 新增 `selectedSize` 状态，默认 `1024x1024`
  - [x] SubTask 2.2: 在头部区域模型选择器旁增加尺寸 Select，仅在选择图片模型时显示
  - [x] SubTask 2.3: 在 `sendMessage` 的生图请求中传入 `size: selectedSize`

- [x] Task 3: 电商套图增加尺寸选择器
  - [x] SubTask 3.1: 新增 `selectedSize` 状态，默认 `1024x1024`
  - [x] SubTask 3.2: 在头部区域增加尺寸 Select
  - [x] SubTask 3.3: 将 `generateImages` 中4处硬编码的 `size: '1024x1024'` 替换为 `size: selectedSize`

- [x] Task 4: 验证构建无错误

# Task Dependencies

- Task 1, 2, 3 可并行执行
- Task 4 依赖 Task 1, 2, 3
