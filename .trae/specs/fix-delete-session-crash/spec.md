# 修复删除会话时程序崩溃 Spec

## Why

用户在对话助手页面的会话列表中删除会话时，程序会报错并导致页面崩溃，只能强制关闭网页。此前多次修复尝试均未彻底解决问题，需要全面排查所有可能导致崩溃的代码路径。

## What Changes

- **修复 `handleDeleteSession` 函数**：移除脆弱的 `setTimeout` 延迟机制，改用同步状态更新 + 请求取消
- **修复 `generateImagesFromPlan` 函数**：添加 `isMounted` 检查和 `AbortController` 支持
- **修复 `retryGenerateImage` 函数**：添加 `isMounted` 检查
- **修复 `switchSession` 函数**：切换会话时取消正在进行的请求
- **修复 `createNewSession` 函数**：新建会话时取消正在进行的请求
- **修复 `updateCurrentSession` 副作用**：在会话被删除后不执行更新
- **修复 `saveChatMessages` 副作用**：在会话被删除后不执行保存
- **添加 `ErrorBoundary` 包裹会话列表**：防止单个会话渲染错误导致整个页面崩溃

## Impact

- Affected specs: 对话助手 - 会话管理
- Affected code: `src/app/page.tsx`

## ADDED Requirements

### Requirement: 删除会话时立即取消所有请求

#### Scenario: 删除正在生成图片的会话
- **WHEN** 用户删除一个正在生成图片的会话
- **THEN** 立即取消所有正在进行的 fetch 请求
- **THEN** 所有 `setMessages` 调用在组件卸载后不会执行
- **THEN** 不会出现 React 错误 #185

#### Scenario: 删除非活跃会话
- **WHEN** 用户删除一个非当前会话
- **THEN** 会话从列表中移除
- **THEN** 当前会话不变
- **THEN** 不触发任何错误

### Requirement: 切换会话时取消旧请求

#### Scenario: 生成过程中切换会话
- **WHEN** 图片正在生成时用户切换到其他会话
- **THEN** 取消当前正在进行的请求
- **THEN** 切换到目标会话并显示其消息
- **THEN** 不会出现状态更新错误

### Requirement: 新建会话时取消旧请求

#### Scenario: 生成过程中新建会话
- **WHEN** 图片正在生成时用户新建会话
- **THEN** 取消当前正在进行的请求
- **THEN** 创建新会话并切换到新会话
- **THEN** 不会出现状态更新错误

### Requirement: 会话列表渲染错误不导致页面崩溃

#### Scenario: 单个会话数据异常
- **WHEN** 某个会话的数据格式异常
- **THEN** 该会话显示错误状态
- **THEN** 其他会话和页面功能正常

## MODIFIED Requirements

### Requirement: handleDeleteSession 函数

**修改前**：使用 `setTimeout` 延迟 50ms 执行状态更新，依赖 ref 获取最新值

**修改后**：
1. 立即取消 `abortControllerRef.current` 的所有请求
2. 同步计算更新后的会话列表
3. 立即更新 `sessions` 状态（无延迟）
4. 如果删除的是当前会话，立即切换到最后一个会话
5. 使用 `isMounted` 保护所有异步操作

### Requirement: generateImagesFromPlan 函数

**修改前**：没有 `isMounted` 检查，没有 `AbortController` 支持

**修改后**：
1. 所有 `setMessages` 调用前添加 `isMounted` 检查
2. 添加 `AbortController` 支持请求取消
3. 在循环中检查 `isMounted`，组件卸载时提前退出

### Requirement: retryGenerateImage 函数

**修改前**：没有 `isMounted` 检查

**修改后**：所有 `setMessages` 调用前添加 `isMounted` 检查

### Requirement: updateCurrentSession 和 saveChatMessages 副作用

**修改前**：在 `messages` 变化时无条件执行，可能访问已删除的会话

**修改后**：在执行前检查当前会话是否仍然存在

## REMOVED Requirements

无