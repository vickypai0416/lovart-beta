# React 错误 #185 深度修复计划

## 问题分析

### 根本原因
React 错误 #185 是因为在渲染过程中更新了状态（Error: Rendered more hooks than during the previous render）。

从错误堆栈来看，问题出现在 `Array.map` 操作中，可能是由于：
1. **滚动处理逻辑**：`handleScroll` 函数在滚动过程中更新状态
2. **消息渲染**：渲染消息时可能触发状态更新
3. **条件渲染**：某些条件判断导致渲染过程中状态变化

### 当前代码位置
- `src/app/page.tsx` 中的 `handleScroll` 函数
- 消息列表渲染代码

## 修复方案

### 方案一：使用 useRef 替代 useState 存储滚动位置
滚动位置不需要触发重新渲染，应该使用 useRef

### 方案二：添加错误边界组件
创建错误边界组件来捕获渲染错误

### 方案三：简化状态更新逻辑
减少状态更新次数，合并相关的状态更新

## 修改文件

### `src/app/page.tsx`
- 修改滚动位置存储方式
- 添加错误边界组件

### `src/components/ErrorBoundary.tsx`（新建）
- 创建错误边界组件

## 实施步骤

1. 将 `scrollPosition` 从 useState 改为 useRef
2. 修改 `handleScroll` 函数，直接更新 ref 而不是调用 setState
3. 创建错误边界组件
4. 用错误边界包裹消息列表

## 预期效果

修复后，关闭对话任务时不会再出现 React 错误 #185