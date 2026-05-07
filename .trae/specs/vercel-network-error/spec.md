# Vercel 部署生图网络错误排查 - PRD

## Overview
- **Summary**: 部署到 Vercel 后，图片生成功能显示"请求失败: network error"，但 API 监控显示余额已消耗，说明请求已成功发送但响应处理失败
- **Purpose**: 定位并修复 Vercel 部署环境下图片生成请求失败的问题
- **Target Users**: 开发团队、运维团队

## Goals
- 定位网络错误的根本原因
- 修复 Vercel 部署环境下的图片生成功能
- 确保前端能正确接收和处理 API 响应

## Non-Goals (Out of Scope)
- 不涉及后端 API 逻辑修改（请求已成功发送）
- 不修改第三方 API 调用方式

## Background & Context
- 本地开发环境正常工作
- 部署到 Vercel 后出现网络错误
- API 监控显示请求已成功发送并消耗余额
- 错误信息为 "network error"，通常表示请求超时或响应无法到达前端

## Functional Requirements
- **FR-1**: 图片生成请求能正确发送到后端 API
- **FR-2**: 后端 API 响应能正确返回给前端
- **FR-3**: 生成的图片能正确显示在前端

## Non-Functional Requirements
- **NFR-1**: API 请求超时时间合理
- **NFR-2**: 错误处理清晰，用户能理解失败原因
- **NFR-3**: 支持 Serverless 环境的长耗时请求

## Constraints
- **Technical**: Vercel Serverless 函数默认超时 10 秒，图片生成可能需要更长时间
- **Business**: 需要保持用户体验，避免长时间等待
- **Dependencies**: 第三方图片生成 API 的响应时间

## Assumptions
- 后端 API 代码正确（请求已成功发送）
- 环境变量配置正确（API Key 有效）
- 网络连接正常

## Acceptance Criteria

### AC-1: 请求超时问题
- **Given**: 图片生成请求发送到后端
- **When**: 第三方 API 响应时间超过 Vercel 函数超时时间
- **Then**: 前端显示超时错误，后端记录详细日志
- **Verification**: `programmatic` - 检查 Vercel 函数日志

### AC-2: CORS 问题
- **Given**: 前端发起图片生成请求
- **When**: 请求跨越不同域名
- **Then**: 请求被正确处理，CORS 头正确设置
- **Verification**: `programmatic` - 检查浏览器控制台网络请求

### AC-3: 响应处理问题
- **Given**: 后端 API 返回成功响应
- **When**: 前端接收响应
- **Then**: 响应被正确解析，图片显示正常
- **Verification**: `human-judgment` - 检查前端控制台错误

### AC-4: Serverless 超时配置
- **Given**: 部署到 Vercel
- **When**: 图片生成请求耗时较长
- **Then**: 函数能处理长耗时请求
- **Verification**: `programmatic` - 检查 Vercel 函数配置

## Open Questions
- [ ] Vercel 函数的超时时间是多少？
- [ ] 是否需要配置 CORS 头？
- [ ] 是否需要使用流式响应（SSE）？
- [ ] 是否需要添加请求重试机制？