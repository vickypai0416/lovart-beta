# 部署应用数据共享问题 - 产品需求文档

## Overview
- **Summary**: 当前部署的网页应用使用文件存储，导致不同用户的数据无法共享，仪表盘看不到其他用户的生图记录
- **Purpose**: 配置 Vercel KV 存储实现跨实例数据共享
- **Target Users**: 应用管理员和所有用户

## Goals
- 配置 Vercel KV 存储
- 修改存储适配器使用 KV 存储
- 确保仪表盘能看到所有用户的生图记录

## Non-Goals (Out of Scope)
- 不改变现有的数据模型
- 不添加新的分析功能

## Background & Context
- 当前使用文件存储（`data/`目录）
- Vercel Serverless 环境中文件存储不持久、不共享
- 代码已支持 KV 存储适配器，但未配置

## Functional Requirements
- **FR-1**: 部署应用必须使用 Vercel KV 存储
- **FR-2**: 所有用户的生图记录必须存储到 KV
- **FR-3**: 仪表盘必须能查询到所有用户的记录

## Non-Functional Requirements
- **NFR-1**: 数据必须持久化存储
- **NFR-2**: 数据必须跨服务器实例共享

## Constraints
- **Technical**: Vercel Serverless 环境，需要配置 KV 绑定
- **Dependencies**: 需要安装 `@vercel/kv` 包

## Assumptions
- Vercel KV 已在控制台配置
- 环境变量已正确设置

## Acceptance Criteria

### AC-1: KV 存储配置完成
- **Given**: 在 Vercel 控制台配置了 KV 数据库
- **When**: 部署应用
- **Then**: 应用自动使用 KV 存储
- **Verification**: `programmatic` - 检查环境变量 `KV_REST_API_URL` 是否存在

### AC-2: 生图记录存储到 KV
- **Given**: 用户生成图片
- **When**: 追踪 API 被调用
- **Then**: 记录存储到 KV
- **Verification**: `programmatic` - 检查 KV 中是否有记录

### AC-3: 仪表盘显示所有用户记录
- **Given**: 多个用户生成图片
- **When**: 访问仪表盘
- **Then**: 显示所有用户的记录
- **Verification**: `human-judgment`

## Open Questions
- [ ] Vercel KV 是否已配置？
- [ ] `@vercel/kv` 包是否已安装？
