# 关闭对话任务时 React 错误修复计划

## 问题分析

### 根本原因
React 错误 #185 通常是因为在渲染过程中更新了状态。当用户删除会话时，`handleDeleteSession` 函数会同时更新多个状态：
1. `setSessions(updatedSessions)`
2. `setCurrentSessionId(newSession.id)`
3. `setMessages([...])`

这些状态更新可能触发组件重新渲染，而在重新渲染过程中又可能触发其他状态更新，形成循环。

### 当前代码位置
`src/app/page.tsx` 第227-250行的 `handleDeleteSession` 函数

## 修复方案

### 方案一：使用 setTimeout 延迟状态更新（推荐）
将状态更新包装在 `setTimeout` 中，确保在渲染完成后再执行状态更新。

### 方案二：使用 useCallback 包装函数
使用 `useCallback` 确保函数引用稳定，避免不必要的重新渲染。

### 方案三：合并状态更新
将多个状态更新合并为一个，减少状态更新次数。

## 修改文件

### `src/app/page.tsx`
修改 `handleDeleteSession` 函数，使用 `setTimeout` 延迟状态更新

## 实施步骤

1. 修改 `handleDeleteSession` 函数
2. 将状态更新包装在 `setTimeout` 中（延迟 0ms，确保在渲染完成后执行）
3. 确保删除会话逻辑正确执行

## 预期效果

修复后，关闭对话任务时不会再出现 React 错误 #185，因为状态更新会在渲染完成后执行，避免了渲染过程中的状态更新冲突。