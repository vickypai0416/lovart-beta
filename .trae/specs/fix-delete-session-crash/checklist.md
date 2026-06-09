# 修复删除会话时程序崩溃 - 检查清单

## 功能检查

- [x] 删除正在生成图片的会话时，请求被立即取消，不报错
- [x] 删除非当前会话时，当前会话不变，不报错
- [x] 删除当前会话时，自动切换到最后一个会话，不报错
- [x] 只剩一个会话时，删除按钮不显示，提示"至少需要保留一个会话"
- [x] 生成过程中切换会话，旧请求被取消，新会话正常显示
- [x] 生成过程中新建会话，旧请求被取消，新会话正常创建
- [x] 会话列表中的单个会话数据异常不会导致整个页面崩溃

## 代码检查

- [x] `handleDeleteSession` 没有使用 `setTimeout` 延迟
- [x] `handleDeleteSession` 在更新状态前取消了请求
- [x] `generateImagesFromPlan` 所有 `setMessages` 前有 `isMounted` 检查
- [x] `generateImagesFromPlan` 的 fetch 请求使用 `AbortController.signal`
- [x] `generateImagesFromPlan` 的循环中有 `isMounted` 提前退出检查
- [x] `retryGenerateImage` 所有 `setMessages` 前有 `isMounted` 检查
- [x] `switchSession` 在切换前取消正在进行的请求
- [x] `createNewSession` 在新建前取消正在进行的请求
- [x] `updateCurrentSession` 在执行前检查当前会话是否存在
- [x] `saveChatMessages` 在执行前检查当前会话是否存在
- [x] 会话列表区域被 `ErrorBoundary` 包裹

## 回归检查

- [x] 正常发送消息功能不受影响（编译通过，服务器运行正常）
- [x] 图片生成功能不受影响
- [x] 亚马逊专家方案生成不受影响
- [x] 选择性生图功能不受影响
- [x] 图片历史功能不受影响
- [x] 其他工作流（图片生成、提示词分析、电商套图、亚马逊创意总监）不受影响