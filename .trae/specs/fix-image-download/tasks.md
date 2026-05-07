# Tasks

- [x] Task 1: 创建公共图片下载工具函数 `src/lib/download.ts`
  - [x] 实现 `downloadImageByUrl(url: string, filename: string)` 函数，使用 fetch + blob + Object URL 方式
  - [x] 处理 data URL 类型（直接转为 blob，无需 fetch）
  - [x] 实现 fetch 失败时回退到直接 a.href 方式
  - [x] 实现 `downloadMultipleImages(images: Array<{url: string, filename: string}>)` 批量下载函数
  - [x] 下载完成后调用 `URL.revokeObjectURL` 释放内存

- [x] Task 2: 更新 ImageGeneratorWorkflow.tsx 使用公共下载函数
  - [x] 替换 `downloadImage` 函数实现
  - [x] 替换 `downloadAllImages` 函数实现

- [x] Task 3: 更新 EcommerceWorkflow.tsx 使用公共下载函数
  - [x] 替换 `downloadAll` 函数实现
  - [x] 替换 Step5 中单张图片下载代码
  - [x] 替换历史记录中单张图片下载代码
  - [x] 替换预览弹窗中下载代码

- [x] Task 4: 更新 page.tsx 使用公共下载函数
  - [x] 替换聊天图片历史中下载代码

# Task Dependencies
- Task 2, 3, 4 依赖 Task 1
- Task 2, 3, 4 可并行执行
