# 电商商品图生成 - 配色与风格选择功能

## 需求分析
用户希望在电商商品图生成流程中，能够指定套图的配色方案和视觉风格（如蓝色色调、简约风格），使生成的6张套图在视觉上保持统一。

## 当前架构分析
- **Step3**（选择平台和场景）已有 `styleAnchor` 机制，但它是根据场景自动生成的，用户无法自定义
- `generate-prompts` API 中的 `sceneStyleAnchors` 为每个场景预设了固定的配色和风格
- `appendStyleAnchor` 函数将风格锚点追加到每个提示词末尾

## 实现方案

### 1. 新增配色方案预设（前端）
在 `EcommerceWorkflow.tsx` 中添加配色方案常量：
```typescript
const colorSchemes = [
  { value: 'auto', label: '自动', description: '根据场景自动匹配', colors: [] },
  { value: 'blue', label: '蓝色系', description: '冷静专业', colors: ['#1B3A5C', '#4A90D9', '#E8F1FA'] },
  { value: 'warm', label: '暖色系', description: '温暖亲切', colors: ['#C8963E', '#D4A574', '#FFF8F0'] },
  { value: 'green', label: '绿色系', description: '自然清新', colors: ['#2D5A27', '#9DC183', '#F0F7EC'] },
  { value: 'red', label: '红色系', description: '热情活力', colors: ['#8B1A1A', '#C41E3A', '#FFF0F0'] },
  { value: 'purple', label: '紫色系', description: '优雅神秘', colors: ['#4A1A6B', '#9B59B6', '#F5E6FF'] },
  { value: 'black', label: '黑白灰', description: '简约高级', colors: ['#1A1A1A', '#808080', '#F5F5F5'] },
  { value: 'pink', label: '粉色系', description: '柔美浪漫', colors: ['#C41E5A', '#FFB6C1', '#FFF0F5'] },
];
```

### 2. 新增视觉风格预设（前端）
```typescript
const visualStyles = [
  { value: 'auto', label: '自动', description: '根据场景自动匹配' },
  { value: 'minimalist', label: '简约', description: '干净简洁，留白多' },
  { value: 'luxury', label: '奢华', description: '高端质感，金色点缀' },
  { value: 'natural', label: '自然', description: '自然光线，真实感' },
  { value: 'vibrant', label: '活力', description: '色彩鲜明，动感十足' },
  { value: 'retro', label: '复古', description: '怀旧色调，经典氛围' },
  { value: 'modern', label: '现代', description: '时尚前卫，几何元素' },
  { value: 'dreamy', label: '梦幻', description: '柔焦光晕，浪漫氛围' },
];
```

### 3. 修改 Step3 UI
在 Step3（选择平台和场景）中，在"场景节日"选择器下方新增：
- **配色方案**选择器：下拉菜单 + 色块预览
- **视觉风格**选择器：下拉菜单 + 描述文字

### 4. 新增状态
```typescript
const [selectedColorScheme, setSelectedColorScheme] = useState('auto');
const [selectedVisualStyle, setSelectedVisualStyle] = useState('auto');
```

### 5. 修改 `generatePrompts` 函数
将 `selectedColorScheme` 和 `selectedVisualStyle` 传递给 `/api/generate-prompts` API。

### 6. 修改 `generate-prompts` API
- 接收 `colorScheme` 和 `visualStyle` 参数
- 当用户选择非"auto"时，用用户选择的配色/风格覆盖场景默认的 `styleAnchor`
- 定义配色方案到具体色值的映射
- 定义视觉风格到具体描述的映射

## 修改文件清单
1. `src/components/workflows/EcommerceWorkflow.tsx` - 新增配色/风格选择UI和状态
2. `src/app/api/generate-prompts/route.ts` - 支持用户自定义配色和风格

## 不涉及的文件（无污染风险）
- `page.tsx` - 不修改
- `InfiniteCanvas.tsx` - 不修改
- `route.ts` (chat API) - 不修改
- 其他工作流组件 - 不修改
