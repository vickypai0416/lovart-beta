# 画布不显示内容排查 - PRD

## Overview
- **Summary**: 画布组件工具栏显示正常，但画布内容区域空白，需要全面排查并修复
- **Purpose**: 找出画布不显示内容的根本原因并修复，确保画布功能正常工作
- **Target Users**: 所有使用画布功能的用户

## Goals
- 找出画布不显示内容的根本原因
- 修复画布显示问题，确保网格背景和元素能正常渲染
- 验证画布的基本功能（缩放、拖拽、添加元素）正常工作

## Non-Goals (Out of Scope)
- 不修改画布的核心功能逻辑
- 不添加新功能

## Background & Context
- 画布组件使用 Konva.js 库实现
- 之前已修复了类型错误和布局问题
- 从截图看，工具栏显示正常，但画布区域为空白

## Functional Requirements
- **FR-1**: 画布应显示网格背景
- **FR-2**: 画布应支持缩放和拖拽操作
- **FR-3**: 画布应能显示添加的元素（图片、文字、矩形）

## Non-Functional Requirements
- **NFR-1**: 画布应在页面加载后立即显示内容
- **NFR-2**: 画布应正确响应容器尺寸变化

## Constraints
- **Technical**: 使用 Konva.js 库，Next.js 框架
- **Dependencies**: React Konva, ResizeObserver API

## Assumptions
- 用户已进入聊天工作流
- 画布组件已正确挂载

## Acceptance Criteria

### AC-1: 画布显示网格背景
- **Given**: 用户进入聊天工作流
- **When**: 页面加载完成
- **Then**: 画布区域应显示浅灰色网格背景
- **Verification**: `human-judgment`

### AC-2: 画布支持缩放操作
- **Given**: 画布显示正常
- **When**: 用户使用鼠标滚轮或缩放按钮
- **Then**: 画布应正确放大/缩小
- **Verification**: `human-judgment`

### AC-3: 画布支持拖拽操作
- **Given**: 画布显示正常
- **When**: 用户拖拽画布空白区域
- **Then**: 画布视图应跟随鼠标移动
- **Verification**: `human-judgment`

### AC-4: 画布能添加图片元素
- **Given**: 用户点击上传图片按钮
- **When**: 选择一张图片上传
- **Then**: 图片应显示在画布上
- **Verification**: `human-judgment`

## Open Questions
- [ ] Stage 的 width/height 是否正确获取
- [ ] Stage 是否正确挂载到 DOM
- [ ] 是否存在 CSS 覆盖导致画布不可见