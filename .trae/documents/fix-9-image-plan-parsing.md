# 修复9图视觉方案解析问题 + 单图生成功能

## 问题分析

### 问题1：9图变成6图
- **根因**：`page.tsx` 中的 `parseAmazonVisualPlan` 函数（第442行）循环范围是 `for (let i = 1; i <= 6; i++)`
- **影响**：只解析前6张图，忽略后面的3张

### 问题2：卡片内容与AI输出不一致
- **根因**：两个解析函数逻辑不一致
- **影响**：卡片显示的标题和提示词与AI实际输出的方案内容不匹配

### 新需求：单图生成功能
- **需求**：用户可以点击单个卡片生成对应的图，而不是必须生成全部
- **场景**：用户只想看某一个方案的生图效果

## 修复计划

### 步骤1：统一 `parseAmazonVisualPlan` 函数（page.tsx）
- 将循环范围从 `i <= 6` 改为 `i <= 9`
- 保持现有的详细解析逻辑（提取构图、风格等）

### 步骤2：统一 `fallbackParseAmazonPlan` 函数（ChatMessages.tsx）
- 保持循环范围为 `i <= 9`
- 改进解析逻辑，使其与 `parseAmazonVisualPlan` 一致
- 提取完整的方案信息（标题、构图、风格等）

### 步骤3：添加单图生成功能
- **修改 ChatMessages.tsx**：
  - 为每个卡片添加"生成此图"按钮
  - 点击按钮时调用 `onGenerateSingleImage(messageId, planIndex, referenceImage)`
  
- **修改 page.tsx**：
  - 添加 `generateSingleImage` 函数，只生成指定索引的图片
  - 更新消息状态，只更新对应索引的图片状态

### 步骤4：更新UI交互
- 保留原有的"按照方案生成图片"按钮（生成全部）
- 每个卡片上添加单独的生成按钮（生成单张）
- 生成中的卡片显示加载动画
- 生成失败的卡片显示重试按钮

### 步骤5：验证构建
- 运行 `npm run build` 确保没有编译错误
- 重启服务器测试

## 涉及文件
1. `src/app/page.tsx` - `parseAmazonVisualPlan` 函数 + `generateSingleImage` 函数
2. `src/components/ChatMessages.tsx` - `fallbackParseAmazonPlan` 函数 + 单图生成按钮

## 预期结果
- 正确识别并解析9张图
- 卡片内容与AI输出的方案完全一致
- "按照方案生成图片"按钮生成全部图片
- 每个卡片可以单独生成对应的图片
