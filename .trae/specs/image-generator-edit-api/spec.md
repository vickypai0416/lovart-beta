# 图片生成组件编辑API调用修复 - 产品需求文档

## Overview
- **Summary**: ImageGeneratorWorkflow组件在使用参考图片时没有正确调用图片编辑API，导致图片和文字一起发送后无法生成图片。
- **Purpose**: 修复图片生成组件中的API调用逻辑，确保参考图片能正确传递给图片编辑API。
- **Target Users**: 所有使用图片生成功能的用户

## Goals
- [ ] 修复ImageGeneratorWorkflow组件中的API调用逻辑
- [ ] 确保参考图片正确传递给图片编辑API
- [ ] 验证图片编辑功能能正常工作

## Non-Goals (Out of Scope)
- 不修改其他工作流组件
- 不修改后端API实现

## Background & Context
用户报告在图片生成功能组件中上传图片并输入文字后，API监控中没有收到请求，说明前端没有正确调用API。

## Functional Requirements
- **FR-1**: ImageGeneratorWorkflow组件应正确检测参考图片的存在
- **FR-2**: 当存在参考图片时，应使用图片编辑模式调用API
- **FR-3**: 参考图片应正确传递到API请求中

## Non-Functional Requirements
- **NFR-1**: API调用应在300秒内完成
- **NFR-2**: 错误处理应清晰，便于调试

## Constraints
- **Technical**: 必须使用现有的API端点 `/api/generate`
- **Dependencies**: 依赖后端图片编辑API的正确实现

## Assumptions
- [ ] 后端API `/api/generate` 已正确实现图片编辑功能
- [ ] 参考图片以base64格式传递

## Acceptance Criteria

### AC-1: 参考图片检测
- **Given**: 用户在ImageGeneratorWorkflow中上传了一张参考图片
- **When**: 用户点击生成按钮
- **Then**: 组件应检测到参考图片存在
- **Verification**: `human-judgment`

### AC-2: API调用
- **Given**: 用户上传了参考图片并输入了提示词
- **When**: 用户点击生成按钮
- **Then**: 应调用 `/api/generate` 并传递参考图片参数
- **Verification**: `programmatic`

### AC-3: 图片生成结果
- **Given**: API调用成功
- **When**: API返回图片URL
- **Then**: 图片应正确显示在界面上
- **Verification**: `human-judgment`

## Open Questions
- [ ] 参考图片在组件中是如何存储和传递的？
- [ ] API调用时是否正确包含了referenceImage参数？