# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

---

## 业务知识库 (Business Knowledge)

### 亚马逊商品图规范

一个完整的亚马逊 Listing 商品图套系应包含 **6 张图片**：

#### 图片顺序与用途

| 序号 | 类型 | 描述 | 要求 |
|------|------|------|------|
| **1** | **白底主图** | 纯白背景商品展示 | 必须纯白背景 (#FFFFFF)，商品占比 85%，无边框无水印，仅展示商品本身 |
| 2 | 场景图 | 商品使用场景 | 展示商品在实际环境中的使用状态，增强代入感 |
| 3 | 功能卖点图 | 核心功能展示 | 用图文结合方式突出 3-5 个核心卖点/功能 |
| 4 | 细节图 | 局部特写 | 展示材质、工艺、细节，增强信任感 |
| 5 | 尺寸/对比图 | 大小参照 | 展示尺寸参数或与其他物品对比，帮助用户感知大小 |
| 6 | 生活/情感图 | 情感共鸣 | 模特使用图或生活方式图，传递情感价值 |

#### 主图（白底图）硬性要求

- **背景**：纯白色 (#FFFFFF)，RGB 值 (255, 255, 255)
- **商品占比**：画面面积的 85% 左右
- **禁止**：边框、水印、文字、Logo、阴影、倒影
- **格式**：JPEG/PNG，建议 2000x2000px 以上
- **角度**：正面或 3/4 角度，清晰展示商品全貌

#### 图片生成提示词模板

```text
# 白底主图模板
Professional Amazon product photography, pure white background (#FFFFFF), 
[PRODUCT_NAME] centered in frame, product fills 85% of image, 
studio lighting, no shadows, no reflections, no text, no watermark, 
high resolution, 4K quality

# 场景图模板
Lifestyle product photography of [PRODUCT_NAME] in [SCENE], 
natural lighting, realistic usage scenario, [MOOD] atmosphere, 
professional composition, high quality commercial photo

# 功能卖点图模板
Product feature highlight image for [PRODUCT_NAME], 
showing [FEATURE_1], [FEATURE_2], [FEATURE_3], 
clean infographic style, modern design, clear icons, 
professional commercial photography

# 细节图模板
Macro close-up detail shot of [PRODUCT_NAME], 
showing [MATERIAL/TEXTURE/DETAIL], 
studio lighting, shallow depth of field, 
professional product photography

# 尺寸对比图模板
Size comparison image for [PRODUCT_NAME], 
showing dimensions [X x Y x Z] cm, 
with reference object for scale, clean layout, 
informative and clear

# 生活情感图模板
Lifestyle image of person using [PRODUCT_NAME] in [SETTING], 
[EMOTION] expression, warm lighting, aspirational mood, 
professional commercial photography
```

---

### 当前项目模型配置

| 模型 ID | 模型名称 | 类型 | API Key 环境变量 |
|---------|----------|------|------------------|
| doubao-seed | 豆包 SeedDream | 图片生成 | SDK 内置 |
| gpt-image-2 | GPT Image 2 | 图片生成 | GPT_IMAGE_2_API_KEY |
| gpt-4o-image | GPT-4o Image | 图片生成 | YUNWU_API_KEY |
| gpt-5-nano | GPT-5 nano | 文本生成 | YUNWU_API_KEY |
| openai-dalle | DALL-E 3 | 图片生成 | OPENAI_API_KEY |
