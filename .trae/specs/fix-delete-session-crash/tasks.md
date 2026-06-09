# Tasks

- [x] Task 1: 修复 `handleDeleteSession` 函数 - 移除 setTimeout 延迟，同步更新状态
  - 取消正在进行的请求
  - 同步计算并更新会话列表
  - 如果删除的是当前会话，立即切换到最后一个会话
  - 使用 `isMounted` 保护所有异步操作

- [x] Task 2: 修复 `generateImagesFromPlan` 函数 - 添加 isMounted 检查和 AbortController 支持
  - 所有 `setMessages` 调用前添加 `isMounted` 检查
  - 添加 `AbortController` 支持请求取消
  - 在循环中检查 `isMounted`，组件卸载时提前退出

- [x] Task 3: 修复 `retryGenerateImage` 函数 - 添加 isMounted 检查
  - 所有 `setMessages` 调用前添加 `isMounted` 检查
  - catch/finally 块中的 `setIsLoading` 也添加检查

- [x] Task 4: 修复 `switchSession` 和 `createNewSession` - 切换/新建时取消请求
  - 切换会话前取消正在进行的请求
  - 新建会话前取消正在进行的请求

- [x] Task 5: 修复 `updateCurrentSession` 和 `saveChatMessages` 副作用 - 检查会话是否存在
  - 在执行前检查当前会话是否仍然存在于会话列表中
  - 如果会话已被删除，跳过更新

- [x] Task 6: 添加 ErrorBoundary 包裹会话列表 - 防止单个会话渲染错误导致页面崩溃
  - 用 ErrorBoundary 包裹会话列表渲染区域
  - 确保错误不会传播到整个页面

# Task Dependencies

- [Task 1] 无依赖
- [Task 2] 无依赖
- [Task 3] 无依赖
- [Task 4] 无依赖
- [Task 5] 无依赖
- [Task 6] 无依赖

所有任务无依赖关系，可并行执行。