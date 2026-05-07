# Tasks

- [x] Task 1: 创建 /api/enhance-prompt API 端点
  - [x] 1.1: 创建 route.ts，接收 imageUrl 和可选的 userDescription
  - [x] 1.2: 调用支持图片识别的文本模型（GPT-5 nano），分析产品图片并生成商品图提示词
  - [x] 1.3: 返回中文提示词（displayPrompt）和英文提示词（prompt）

- [x] Task 2: 在 ImageGeneratorWorkflow 中添加AI识别按钮
  - [x] 2.1: 当用户上传了参考图片后，在参考图预览区域旁显示"AI识别"按钮
  - [x] 2.2: 点击后调用 /api/enhance-prompt，将中文提示词填入输入框
  - [x] 2.3: 识别过程中按钮显示加载状态
  - [x] 2.4: 未上传图片时按钮不显示

- [x] Task 3: 添加预设商品图场景模板
  - [x] 3.1: 定义预设模板数据（主图白底、场景图、细节图、生活方式图、对比图、节日主题图）
  - [x] 3.2: 在输入框工具栏添加模板选择按钮
  - [x] 3.3: 点击模板后将提示词填入输入框

- [x] Task 4: 中文提示词自动翻译为英文
  - [x] 4.1: 在 /api/generate 中检测提示词是否为中文
  - [x] 4.2: 如果是中文，先调用文本模型翻译为英文，再发送给图片生成API
  - [x] 4.3: 纯英文提示词直接发送

# Task Dependencies
- Task 2 depends on Task 1（需要 API 端点）
- Task 3 独立，可与 Task 1/2 并行
- Task 4 独立，可与 Task 1/2/3 并行
