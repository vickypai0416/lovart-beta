# Tasks (v9)

- [x] Task 1: 移除 `handleDeleteSession` 中的 `confirm()` 原生对话框
  - 这是触发 #185 的真正根因
  - 删除即生效，不再阻塞 React 调度

- [x] Task 2: 重写 `ChatSessionList` 组件
  - 移除 `React.memo` 包裹（避免 fiber 复用复杂度）
  - 移除内部嵌套的 `ErrorBoundary`（避免错误恢复触发的额外 setState）
  - 改为纯函数组件直接 export default

- [x] Task 3: 验证 - 编译 + 服务测试
  - TypeScript 零错误
  - 服务 HTTP 200 正常启动

# Task Dependencies

- Task 1 与 Task 2 独立可并行
- Task 3 依赖 Task 1 + Task 2
