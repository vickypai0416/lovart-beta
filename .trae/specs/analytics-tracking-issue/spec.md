# 数据分析仪表盘无记录问题排查 - 产品需求文档

## Overview
- **Summary**: 数据分析仪表盘无法记录用户交互（包括文本消息和图片生成），需要全面排查并修复追踪机制
- **Purpose**: 解决用户反馈的"仪表盘没有任何记录"的问题，确保所有用户交互都能正确追踪和存储
- **Target Users**: 应用管理员和开发者

## Goals
- 定位并修复追踪机制失败的根本原因
- 确保所有用户消息和生图操作都能被正确记录到仪表盘
- 添加调试日志以便后续排查

## Non-Goals (Out of Scope)
- 不改变现有的数据存储架构（文件/KV）
- 不添加新的分析功能

## Background & Context
- 用户报告在部署的网页应用中发送消息后，`/analytics` 仪表盘没有显示任何记录
- 已实现的追踪功能包括：trackGeneration、trackMessage、trackEvent
- 存储后端支持文件存储（本地）和 KV 存储（Vercel）

## Functional Requirements
- **FR-1**: 用户发送消息时必须调用 trackMessage API
- **FR-2**: trackMessage API 必须成功存储消息记录
- **FR-3**: 仪表盘必须能查询并显示所有消息记录

## Non-Functional Requirements
- **NFR-1**: 追踪操作必须在后台异步执行，不影响用户体验
- **NFR-2**: 必须添加足够的调试日志

## Constraints
- **Technical**: Next.js 16.1.1 + React 19，服务端/客户端混合渲染
- **Dependencies**: localStorage 用于 sessionId 存储

## Assumptions
- localStorage 在客户端环境中可用
- API 端点 `/api/track` 正常工作

## Acceptance Criteria

### AC-1: 用户消息能被追踪
- **Given**: 用户在对话助手发送消息
- **When**: 消息发送成功
- **Then**: trackMessage 被调用并返回消息 ID
- **Verification**: `programmatic` - 检查控制台日志和 API 响应

### AC-2: 消息记录能被存储
- **Given**: trackMessage API 被调用
- **When**: 请求成功
- **Then**: 消息记录被存储到后端
- **Verification**: `programmatic` - 检查存储文件或 KV

### AC-3: 仪表盘能显示消息
- **Given**: 消息已存储
- **When**: 访问 `/analytics` 仪表盘的"消息记录"标签页
- **Then**: 显示所有消息记录
- **Verification**: `human-judgment`

## Open Questions
- [ ] localStorage 在部署环境中是否可用？
- [ ] trackMessage API 是否被正确调用？
- [ ] 存储后端是否正常工作？
