# 仪表盘显示生图记录问题 - 产品需求文档

## Overview
- **Summary**: 分析仪表盘只显示了总事件数，但没有显示用户生成的图片记录，需要调查并修复数据存储和显示问题。
- **Purpose**: 确保所有用户的生图记录都能正确存储到 Upstash Redis 并在仪表盘中显示
- **Target Users**: 应用管理员和开发者

## Goals
- 调查数据是否正确存储到 Upstash Redis
- 修复可能存在的数据读取问题
- 确保仪表盘能正确显示所有生图记录

## Non-Goals (Out of Scope)
- 不改变现有的数据模型
- 不添加新的分析功能

## Background & Context
- 当前已配置 Upstash Redis
- 用户反馈仪表盘只看到总事件数，但没有看到生图记录
- 代码已经支持 Redis 存储，但可能存在数据读取或显示问题

## Functional Requirements
- **FR-1**: 生图记录必须正确存储到 Redis
- **FR-2**: 生图记录必须正确从 Redis 读取
- **FR-3**: 仪表盘必须能显示所有生图记录

## Non-Functional Requirements
- **NFR-1**: 添加详细的调试日志
- **NFR-2**: 确保数据持久化存储

## Constraints
- **Technical**: Vercel Serverless 环境，Upstash Redis
- **Dependencies**: @upstash/redis 包

## Assumptions
- Upstash Redis 已正确连接
- 环境变量已正确配置

## Acceptance Criteria

### AC-1: 数据正确存储
- **Given**: 用户在应用中生成图片
- **When**: 追踪 API 被调用
- **Then**: 生图记录必须存储到 Redis
- **Verification**: `programmatic`
- **Notes**: 检查 analytics:generations:ids 是否有数据

### AC-2: 数据正确读取
- **Given**: 生图记录已存储到 Redis
- **When**: 调用 analytics API 的 generations 端点
- **Then**: 必须返回所有生图记录
- **Verification**: `programmatic`

### AC-3: 仪表盘显示记录
- **Given**: 生图记录已存在
- **When**: 访问仪表盘的生成记录标签页
- **Then**: 必须显示所有生图记录
- **Verification**: `human-judgment`

## Open Questions
- [ ] 数据是否正确存储到了 Redis?
- [ ] API 是否正确读取了数据?
- [ ] 仪表盘是否正确显示了数据?