# 产品感知的9图提示词模板系统 - 实现计划

## 一、需求分析

### 1.1 问题背景
当前系统使用统一的9图提示词模板，无法根据产品类型进行适配，导致某些产品套用通用模板时效果不佳（如：水杯、相框、钥匙扣、T恤等不同类型产品需要不同的拍摄角度和场景）。

### 1.2 核心需求
- **自动识别产品类型**：通过图片分析识别产品类别（如：水杯、相框、饰品、服装等）
- **智能选择模板**：根据产品类型选择最合适的9图方案模板
- **动态调整提示词**：根据产品特性（材质、风格、用途）动态调整提示词内容

### 1.3 预期效果
- 用户上传产品图片后，系统自动分析产品类型
- 根据产品类型选择最适合的9图方案模板
- 提示词自动适配产品特性，生成更精准的图片

---

## 二、技术方案

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    产品感知提示词系统                        │
├─────────────────────────────────────────────────────────────┤
│  [产品图片] → [ProductAnalyzer] → [ProductAnalysis]         │
│                                      ↓                    │
│                          [TemplateSelector]                │
│                                      ↓                    │
│              [ProductTypeTemplates] → [SelectedTemplate]   │
│                                      ↓                    │
│                          [PromptGenerator]                │
│                                      ↓                    │
│                          [9张图提示词]                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 关键组件

| 组件 | 职责 | 说明 |
|------|------|------|
| **ProductAnalyzer** | 产品图片分析 | 已存在，识别产品类型、材质、风格等 |
| **TemplateSelector** | 模板选择器 | 新增，根据产品类型选择合适模板 |
| **ProductTypeTemplates** | 产品类型模板库 | 新增，存储不同产品类型的9图模板 |
| **PromptGenerator** | 提示词生成器 | 增强，动态替换模板占位符 |

### 2.3 产品类型分类

| 产品类别 | 子类 | 特征描述 |
|----------|------|----------|
| **家居装饰** | 相框、画框、摆件、装饰品 | 需要展示场景布置、装饰效果 |
| **餐饮器具** | 水杯、马克杯、餐具、水壶 | 需要展示使用场景、容量、材质 |
| **时尚饰品** | 项链、手链、耳环、钥匙扣 | 需要展示佩戴效果、细节工艺 |
| **服装配饰** | T恤、卫衣、帽子、围巾 | 需要展示穿着效果、版型 |
| **办公用品** | 笔记本、笔、文件夹 | 需要展示办公场景、功能特性 |
| **电子产品** | 手机壳、充电器、数据线 | 需要展示产品细节、兼容性 |

### 2.4 模板设计

每个产品类型需要定制以下内容：
- **镜头角度**：不同产品适合的拍摄角度（如：水杯适合45度角，相框适合正面展示）
- **场景搭配**：适合的使用场景（如：办公用品适合办公室场景）
- **人物互动**：是否需要人物（如：服装需要模特，电子产品可能不需要）
- **材质表现**：如何突出材质质感（如：金属、陶瓷、布料）

---

## 三、实现步骤

### 3.1 创建产品类型模板库

**文件路径**：`src/lib/amazon/product-templates.ts`

```typescript
export interface ProductTypeTemplate {
  type: string;                    // 产品类型标识
  name: string;                    // 产品类型名称
  description: string;             // 类型描述
  cameraAngles: string[];          // 推荐拍摄角度
  typicalScenes: string[];         // 典型使用场景
  peopleInteraction: boolean;      // 是否需要人物
  materialFocus: string[];         // 材质关注点
  imageTemplates: ImageTemplate[]; // 9图模板
}

export interface ImageTemplate {
  index: number;
  purpose: string;
  promptTemplate: string;
  title: string;
  subtitle: string;
}
```

### 3.2 实现模板选择器

**文件路径**：`src/lib/amazon/template-selector.ts`

```typescript
export class TemplateSelector {
  private templates: ProductTypeTemplate[];
  
  constructor() {
    this.templates = this.loadTemplates();
  }
  
  selectTemplate(analysis: ProductAnalysis): ProductTypeTemplate {
    // 根据产品类型匹配最佳模板
    // 如果没有精确匹配，返回通用模板
  }
  
  private loadTemplates(): ProductTypeTemplate[] {
    // 加载预定义的产品类型模板
  }
}
```

### 3.3 增强提示词生成器

**文件路径**：`src/lib/amazon/prompt-generator.ts`

增强现有生成器，支持：
- 动态替换模板中的占位符
- 根据产品特性调整提示词内容
- 统一风格约束应用

### 3.4 集成到工作流

**文件路径**：`src/components/workflows/AmazonCreativeDirectorWorkflow.tsx`

修改工作流，在生成9图方案前：
1. 使用 ProductAnalyzer 分析产品
2. 使用 TemplateSelector 选择合适模板
3. 使用 PromptGenerator 生成个性化提示词

---

## 四、文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/amazon/product-templates.ts` | 新建 | 产品类型模板库 |
| `src/lib/amazon/template-selector.ts` | 新建 | 模板选择器 |
| `src/lib/amazon/prompt-generator.ts` | 修改 | 增强动态提示词生成 |
| `src/components/workflows/AmazonCreativeDirectorWorkflow.tsx` | 修改 | 集成产品分析和模板选择 |
| `src/lib/persona.ts` | 修改 | 添加产品类型识别逻辑 |

---

## 五、风险与依赖

### 5.1 潜在风险

| 风险 | 描述 | 应对策略 |
|------|------|----------|
| **产品识别不准确** | AI分析可能识别错误产品类型 | 设置回退机制，使用通用模板 |
| **模板覆盖不全** | 某些产品类型没有对应模板 | 建立通用模板作为默认选项 |
| **性能影响** | 额外的产品分析会增加响应时间 | 异步执行分析，不阻塞主流程 |

### 5.2 依赖关系

- **ProductAnalyzer**：已有组件，用于产品图片分析
- **Yunwu API**：用于AI模型调用
- **现有9图方案**：作为通用模板的基础

---

## 六、测试计划

### 6.1 测试用例

| 测试场景 | 输入 | 预期输出 |
|----------|------|----------|
| 水杯产品 | 上传水杯图片 | 选择餐饮器具模板 |
| 相框产品 | 上传相框图片 | 选择家居装饰模板 |
| 项链产品 | 上传项链图片 | 选择时尚饰品模板 |
| 未知产品 | 上传不常见产品 | 使用通用模板 |

### 6.2 验收标准

- 产品识别准确率 ≥ 80%
- 模板选择正确匹配产品类型
- 提示词动态替换正确
- 响应时间增加 ≤ 2秒

---

## 七、进度安排

| 阶段 | 任务 | 时间估算 |
|------|------|----------|
| 第一阶段 | 创建产品类型模板库 | 1天 |
| 第二阶段 | 实现模板选择器 | 1天 |
| 第三阶段 | 增强提示词生成器 | 1天 |
| 第四阶段 | 集成到工作流 | 1天 |
| 第五阶段 | 测试与调试 | 1天 |

---

## 八、附加说明

此方案保持与现有系统的兼容性，不会影响现有功能。当产品识别失败或没有匹配模板时，会自动回退到通用模板，确保系统稳定性。
