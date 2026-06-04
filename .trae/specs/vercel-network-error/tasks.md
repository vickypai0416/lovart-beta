# Vercel 部署生图网络错误排查 - 实施计划

## [x] Task 1: 检查 Vercel 函数超时配置
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查当前 Vercel 函数的超时时间配置
  - 修改 vercel.json 配置增加超时时间（最大 60 秒）
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查 vercel.json 配置文件
  - `programmatic` TR-1.2: 验证函数超时时间设置为 60 秒
- **Notes**: Vercel Serverless 函数默认超时 10 秒，图片生成可能需要更长时间

## [x] Task 2: 检查并修复 CORS 配置
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查当前 CORS 配置
  - 添加或修改中间件配置 CORS 头
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 检查浏览器控制台是否有 CORS 错误
  - `programmatic` TR-2.2: 验证响应头包含正确的 CORS 配置
- **Notes**: Vercel 环境下可能需要显式配置 CORS

## [x] Task 3: 检查流式响应处理
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查当前的 SSE（Server-Sent Events）实现
  - 确保流式响应在 Vercel 环境下正常工作
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-3.1: 检查前端控制台是否有 SSE 错误
  - `programmatic` TR-3.2: 验证 Vercel 日志中的响应状态
- **Notes**: 流式响应在 Serverless 环境下可能需要特殊处理

## [x] Task 4: 添加请求超时和重试机制
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 在前端添加请求超时处理
  - 添加请求重试机制（最多 3 次）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-4.1: 测试超时场景的错误提示
  - `programmatic` TR-4.2: 验证重试机制正常工作
- **Notes**: 提升用户体验，减少因网络波动导致的失败

## [x] Task 5: 添加详细日志记录
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 在后端 API 添加详细日志
  - 记录请求开始、响应接收、错误信息等
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: 检查 Vercel 函数日志
  - `human-judgment` TR-5.2: 验证日志能帮助定位问题
- **Notes**: 便于后续问题排查

# Task Dependencies
- Task 4 depends on Task 1