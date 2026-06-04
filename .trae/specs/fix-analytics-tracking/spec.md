# 数据分析仪表盘生图记录修复 Spec

## Why
用户反馈数据分析仪表盘没有记录到已部署项目的生图信息。经过排查发现：
1. `useAnalytics` hook 已定义但没有任何组件调用 `trackGeneration` 方法
2. 当前使用文件系统存储数据，在 Vercel Serverless 环境中不持久化

## What Changes
- 在 `ImageGeneratorWorkflow.tsx` 中集成 `useAnalytics` hook 追踪生图事件
- 在 `page.tsx` 对话助手中集成 `useAnalytics` hook 追踪生图事件
- 添加 Vercel KV 存储支持作为持久化方案
- 更新 analytics.ts 支持多种存储后端

## Impact
- Affected code: `src/components/workflows/ImageGeneratorWorkflow.tsx`, `src/app/page.tsx`, `src/lib/analytics.ts`
- 不影响其他功能

## 根因分析

### 问题 1: 缺少 analytics 调用
- `useAnalytics` hook 定义了 `trackGeneration` 方法，但没有被调用
- `ImageGeneratorWorkflow.tsx` 和 `page.tsx` 都没有集成 analytics

### 问题 2: 文件系统存储不持久（Vercel 环境）
- 当前使用 `fs` 模块写入本地文件
- Vercel Serverless 函数的 `/tmp` 和工作目录都是临时的
- 函数冷启动后数据丢失

## ADDED Requirements

### Requirement: ImageGeneratorWorkflow 生图追踪
系统 SHALL 在 `ImageGeneratorWorkflow` 组件中追踪每次生图请求和结果。

#### Scenario: 生图成功
- **WHEN** 用户点击生成按钮并成功生成图片
- **THEN** 系统调用 `trackGeneration` 创建记录，再调用 `updateGeneration` 更新状态为 success

#### Scenario: 生图失败
- **WHEN** 用户点击生成按钮但生图失败
- **THEN** 系统调用 `trackGeneration` 创建记录，再调用 `updateGeneration` 更新状态为 failed

### Requirement: 对话助手生图追踪
系统 SHALL 在对话助手组件中追踪每次生图请求和结果。

#### Scenario: 图片生成模型生图
- **WHEN** 用户选择图片生成模型并发送消息
- **THEN** 系统追踪生图请求和结果

### Requirement: 持久化存储
系统 SHALL 使用持久化存储方案，确保部署后的数据不会丢失。

#### Scenario: Vercel 部署
- **WHEN** 项目部署到 Vercel
- **THEN** 生图数据持久保存，函数重启后仍可访问

## MODIFIED Requirements

### Requirement: analytics.ts 存储抽象
`analytics.ts` SHALL 支持多种存储后端（文件系统、KV 存储）。

### Requirement: useAnalytics hook 调用
生图相关组件 SHALL 调用 `useAnalytics` hook 追踪生图事件。

## REMOVED Requirements
无
