# Image 5送礼场景提示词增强计划

## 问题分析

用户要求修改Image 5送礼场景的提示词，具体要求：
1. **禁止礼盒/礼品包装** - 不能出现礼盒、丝带、卡片等包装元素
2. **人物露出全脸** - 允许展示人物完整面部表情
3. **场景氛围符合节日** - 根据用户输入的节日（父亲节、母亲节等）调整场景
4. **禁止中文** - 所有图片提示词必须使用英文，因为主打亚马逊美国站

## 当前代码位置

需要修改以下文件：

### 1. `src/lib/persona.ts`（亚马逊专家人设）
- 第112-118行：Image 5送礼场景描述
- 第171-177行：切菜板示例中的送礼场景描述

### 2. `src/lib/amazon/prompt-generator.ts`
- 第221-232行：`buildGiftPrompt` 方法

### 3. `src/components/workflows/AmazonCreativeDirectorWorkflow.tsx`
- 第117-123行：礼物属性图的配置

### 4. `src/app/api/generate-prompts/route.ts`
- 第225-230行：送礼场景提示词

## 修复方案

### 核心修改点

1. **移除包装相关词汇**：删除所有"gift box"、"ribbon"、"packaging"、"card"等词汇
2. **添加全脸描述**：添加"full face visible"、"natural facial expressions"等
3. **增强节日氛围**：根据场景配置动态调整提示词
4. **确保全英文**：所有提示词使用英文

## 修改文件

### 1. `src/lib/persona.ts`
修改Image 5的描述，强调真实人物互动和节日氛围

### 2. `src/lib/amazon/prompt-generator.ts`
修改 `buildGiftPrompt` 方法，添加节日元素和全脸描述

### 3. `src/components/workflows/AmazonCreativeDirectorWorkflow.tsx`
更新礼物属性图的默认提示词

### 4. `src/app/api/generate-prompts/route.ts`
确认送礼场景提示词符合要求

## 实施步骤

1. 修改 `persona.ts` 中的送礼场景描述
2. 修改 `prompt-generator.ts` 中的提示词生成逻辑
3. 修改 `AmazonCreativeDirectorWorkflow.tsx` 中的配置
4. 确认 `generate-prompts/route.ts` 中的提示词

## 预期效果

修改后的送礼场景提示词将：
- ✅ 无礼盒、丝带、卡片等包装元素
- ✅ 人物露出全脸，展示自然表情
- ✅ 根据节日调整场景氛围（如父亲节用蓝色系，母亲节用粉色系）
- ✅ 所有提示词使用英文，符合亚马逊美国站要求