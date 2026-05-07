# 项目更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [未发布]

### 新增

### 变更

### 修复

### 移除

---

## [2026-04-28] - 初始版本

### 新增

#### 核心功能
- ✅ 项目解压与初始化完成
- ✅ 环境变量配置文件创建 (`.env`)
- ✅ API Key 配置支持 (YUNWU_API_KEY, GPT_IMAGE_2_API_KEY, OPENAI_API_KEY)

#### 图片生成功能
- ✅ 多模型支持 (GPT Image 2, GPT-4o Image, GPT-5 nano, DALL-E 3)
- ✅ 图文生图功能
- ✅ AI 识图分析 (上传图片自动分析)
- ✅ 亚马逊图片规格支持（主图/辅图/A+内容图/缩略图）
- ✅ 图片尺寸规范（最小1000x1000像素）
- ✅ 图片大小限制（10MB）
- ✅ 文件格式检查（支持 JPEG/PNG/GIF）
- ✅ 图片验证 API (`/api/validate-image`)
- ✅ 亚马逊 CTR 视觉 Agent（完整的 Listing 六图生成流程）

#### 亚马逊 CTR Agent 功能
- ✅ 产品分析模块：自动识别产品类型、材质、颜色、风格、使用场景
- ✅ 视觉策略模块：支持9种场景（父亲节、母亲节、圣诞节、生日、婚礼、纪念日、毕业季、情人节、日常）
- ✅ 六图计划生成：主图、定制说明、情绪场景、产品细节、送礼场景、情绪收尾
- ✅ 合规检测模块：检查尺寸、格式、大小、水印、边框、背景色等
- ✅ CTR Agent API (`/api/ctr-agent`)

#### 画布编辑功能
- ✅ 画布组件 (InfiniteCanvas)
- ✅ 图片上传与添加
- ✅ 元素选择、移动、缩放、旋转、翻转
- ✅ 画笔工具
- ✅ 箭头工具
- ✅ 文字工具
- ✅ 矩形工具
- ✅ 滚轮缩放
- ✅ 画布平移

#### 持久化功能
- ✅ 自动保存画布内容到 localStorage
- ✅ 页面刷新/热更新后自动恢复画布状态
- ✅ 清空画布功能

#### 导出功能
- ✅ 服务端图片合成 API (`/api/export-canvas`)
- ✅ 使用 sharp 库合成图片，解决跨域问题

#### 文件上传功能
- ✅ 本地文件存储支持 (当 S3 未配置时自动使用本地存储)
- ✅ 图片预览功能

### 变更

- ⚠️ 修改 `src/server.ts`：添加 dotenv 配置，支持加载 `.env` 和 `.env.local` 文件
- ⚠️ 修改 `next.config.ts`：添加 turbopack.root 配置
- ⚠️ 修改 `src/app/api/upload/route.ts`：添加本地文件存储作为备用方案
- ⚠️ 修改 `src/app/api/generate/route.ts`：添加亚马逊图片规格验证

### 新增文件

- ✅ `src/lib/image-specs.ts`：亚马逊图片规格配置（尺寸、分辨率、格式、大小限制）
- ✅ `src/app/api/validate-image/route.ts`：图片验证 API
- ✅ `src/lib/amazon/product-analyzer.ts`：产品分析模块（GPT-5 nano 识图分析）
- ✅ `src/lib/amazon/visual-strategy.ts`：视觉策略模块（场景策略、六图计划）
- ✅ `src/lib/amazon/compliance-checker.ts`：合规检测模块（亚马逊规范检查）
- ✅ `src/lib/amazon/ctr-agent.ts`：CTR Agent 核心模块
- ✅ `src/app/api/ctr-agent/route.ts`：CTR Agent API 接口

### 修复

- ✅ 修复 Canvas 跨域问题：使用服务端合成替代浏览器 toDataURL
- ✅ 修复图片上传失败问题：添加本地存储备用方案
- ✅ 修复 TurboPack 构建问题：配置项目根目录

### 移除

- ❌ 移除一次性生成6张商品图功能 (`/api/generate-6-images`)
  - 原因：该功能存在问题，需要进一步完善

---

## 版本说明

### 状态标识

| 标识 | 含义 |
|------|------|
| ✅ | 已完成 |
| ⚠️ | 已修改 |
| ❌ | 已移除 |
| 🚀 | 待开发 |

### 功能分类

| 分类 | 说明 |
|------|------|
| 核心功能 | 项目基础配置和启动相关 |
| 图片生成 | AI 图片生成相关功能 |
| 画布编辑 | 画布操作和编辑功能 |
| 持久化 | 数据保存和恢复 |
| 导出 | 图片导出功能 |
| 文件上传 | 图片上传和存储 |

---

## 后续开发计划

- 🚀 预设提示词模板（Skills 系统）
- 🚀 Mockup 场景贴图功能
- 🚀 批量生成套图功能
- 🚀 多画布支持
- 🚀 团队协作功能
- 🚀 云端存储同步
