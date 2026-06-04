# 亚马逊6图视觉方案 - Image 5送礼场景提示词修复计划

## 问题分析

用户要求修改Image 5（送礼场景）的提示词，具体要求：
1. 专注于送礼的瞬间
2. 真实的人物之间送礼的场景
3. 不要出现小卡牌、礼品包装等可能误导买家的元素

## 涉及文件

根据搜索结果，有以下文件包含送礼场景的提示词：

### 1. `src/lib/persona.ts`（亚马逊专家人设）
- 第112-117行：Image 5礼品属性描述
- 第170-174行：切菜板示例中的送礼场景描述

### 2. `src/lib/amazon/prompt-generator.ts`
- 第221-231行：`buildGiftPrompt` 方法

### 3. `src/components/workflows/AmazonCreativeDirectorWorkflow.tsx`
- 第117-123行：礼物属性图的配置

### 4. `src/app/api/generate-prompts/route.ts`
- 第225-230行：送礼场景提示词
- 第290-295行：另一个送礼场景提示词

## 问题点

1. `persona.ts` 中描述"产品放入礼盒中，搭配丝带、厨房小配件"等包装元素
2. `AmazonCreativeDirectorWorkflow.tsx` 中包含"礼盒包装"等词汇
3. `prompt-generator.ts` 中引用了可能包含礼品盒的场景元素

## 修复方案

修改所有涉及送礼场景的提示词，确保：
1. 强调真实人物互动和送礼瞬间
2. 移除所有礼品包装相关的词汇（礼盒、丝带、卡片等）
3. 明确要求展示真实的送礼场景

## 修改文件

### 1. `src/lib/persona.ts`
修改Image 5礼品属性的描述，移除礼盒包装相关内容

### 2. `src/lib/amazon/prompt-generator.ts`
修改 `buildGiftPrompt` 方法，移除可能包含包装的元素

### 3. `src/components/workflows/AmazonCreativeDirectorWorkflow.tsx`
修改礼物属性图的配置，移除礼盒包装相关词汇

### 4. `src/app/api/generate-prompts/route.ts`
确认送礼场景提示词已符合要求（已有"no gift wrapping visible"）

## 实施步骤

1. 修改 `persona.ts` 中的送礼场景描述
2. 修改 `prompt-generator.ts` 中的 `buildGiftPrompt` 方法
3. 修改 `AmazonCreativeDirectorWorkflow.tsx` 中的礼物属性配置
4. 确认 `generate-prompts/route.ts` 中的提示词符合要求

## 预期效果

修改后的送礼场景提示词将：
- 专注于真实的送礼瞬间
- 强调人物之间的真实互动
- 不包含任何礼品包装相关的词汇
- 确保生成的图片展示真实的送礼场景