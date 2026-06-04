# 修复连续删除会话报错 - Spec (v9)

## Why

**v8 单次删除可能成功，但连续删除仍报错**。真正根因终于浮出水面：

**`window.confirm()` 是元凶**。原生 `confirm()` 对话框会**冻结 JavaScript 执行**，但 React 的 fiber 调度可能在 confirm 弹窗显示期间进入"渲染中"状态。当用户点击确认后：

1. `confirm()` 返回 `true`
2. 后续 `dispatchChat` / `setMessages` 立即执行
3. 但此时 React 内部状态可能仍处于 "rendering" 阶段（Trae IDE 内嵌环境的 fiber 行为异常）
4. **"Cannot update a component while rendering a different component"** → #185

连续删除时这个问题更明显，因为前一次删除的渲染未完全结束，第二次 `confirm` 又介入。

**额外问题**：`React.memo(ChatSessionList)` + 内部 `ErrorBoundary` 在 React 19 严格模式下可能加剧 fiber 时序冲突。

## What Changes

- **移除 `confirm('确定要删除这个会话吗？')`**：不再使用阻塞性原生对话框，删除即生效
- **`ChatSessionList` 移除 `React.memo` 包裹**：组件本身渲染开销极低，memo 反而带来 fiber 调度复杂度
- **`ChatSessionList` 移除内部 `ErrorBoundary`**：内部嵌套的 ErrorBoundary 可能在错误恢复时触发额外 setState，导致连锁渲染冲突

## Impact

- Affected specs: 对话助手 - 会话管理
- Affected code: `src/app/page.tsx` (handleDeleteSession), `src/components/ChatSessionList.tsx`
- UX 变化：删除会话不再有确认弹窗（即时生效）
