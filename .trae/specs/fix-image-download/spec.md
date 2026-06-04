# 优化图片下载功能 Spec

## Why
当前所有图片下载功能（除 InfiniteCanvas 外）都使用直接 `a.href + download` 方式。当图片 URL 为跨域 HTTP URL 时，浏览器会忽略 `download` 属性，导致点击下载按钮后在新标签页打开图片而非直接下载，需要再次右键保存。用户体验差。

## What Changes
- 将所有图片下载实现从"直接 href 模式"改为"fetch + blob + Object URL 模式"
- 统一提取公共下载工具函数，避免各组件重复实现
- 下载完成后释放 Object URL 内存

## Impact
- Affected code:
  - `src/lib/download.ts`（新增公共工具函数）
  - `src/components/workflows/ImageGeneratorWorkflow.tsx`（downloadImage、downloadAllImages）
  - `src/components/workflows/EcommerceWorkflow.tsx`（downloadAll、Step5 单张下载、历史记录下载、预览弹窗下载）
  - `src/app/page.tsx`（聊天图片历史下载）

## ADDED Requirements

### Requirement: 统一图片下载工具函数
系统 SHALL 提供公共的图片下载工具函数 `downloadImageByUrl`，使用 fetch + blob + Object URL 方式下载图片，确保无论原始 URL 是 data URL 还是跨域 HTTP URL，都能正确触发浏览器下载。

#### Scenario: 下载 data URL 图片
- **WHEN** 用户点击下载按钮，图片 URL 为 data:image/png;base64,... 格式
- **THEN** 浏览器直接下载图片文件，不打开新页面

#### Scenario: 下载跨域 HTTP URL 图片
- **WHEN** 用户点击下载按钮，图片 URL 为 https://yunwu.ai/... 等跨域地址
- **THEN** 浏览器直接下载图片文件，不打开新页面

#### Scenario: 下载失败处理
- **WHEN** fetch 请求失败（网络错误或 URL 无效）
- **THEN** 回退到直接 a.href 方式尝试下载，并提示用户

### Requirement: 批量下载功能
系统 SHALL 提供 `downloadMultipleImages` 工具函数，支持按顺序下载多张图片，每张图片间隔一定时间避免浏览器拦截。

#### Scenario: 批量下载多张图片
- **WHEN** 用户点击"下载全部"按钮
- **THEN** 按顺序逐张下载所有图片，每张间隔 500ms

### Requirement: 内存管理
系统 SHALL 在下载完成后释放 Object URL，避免内存泄漏。

#### Scenario: 下载完成后释放资源
- **WHEN** 图片下载完成
- **THEN** 调用 URL.revokeObjectURL 释放 Object URL 占用的内存

## MODIFIED Requirements

### Requirement: ImageGeneratorWorkflow 下载功能
将 `downloadImage` 和 `downloadAllImages` 函数改为使用公共工具函数。

### Requirement: EcommerceWorkflow 下载功能
将 `downloadAll`、Step5 单张下载、历史记录下载、预览弹窗下载改为使用公共工具函数。

### Requirement: page.tsx 聊天图片下载
将聊天图片历史中的下载改为使用公共工具函数。
