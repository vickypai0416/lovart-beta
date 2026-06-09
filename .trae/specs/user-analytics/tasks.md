# 用户行为和生图数据收集系统 - 实施计划

## [ ] Task 1: 创建数据库模型和迁移
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建用户会话表（Session）
  - 创建事件记录表（Event）
  - 创建图片生成记录表（Generation）
  - 创建用户反馈表（Feedback）
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 数据库迁移成功，所有表结构正确创建
  - `programmatic` TR-1.2: 表之间的关联关系正确
- **Notes**: 使用Prisma ORM，支持SQLite（开发）和PostgreSQL（生产）

## [ ] Task 2: 创建数据收集API
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建 `/api/track/event` 端点用于记录用户事件
  - 创建 `/api/track/generation` 端点用于记录生成请求
  - 创建 `/api/track/feedback` 端点用于收集用户反馈
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-2.1: POST 请求成功创建记录并返回 200
  - `programmatic` TR-2.2: 无效请求返回 400 错误
- **Notes**: 支持批量事件上报以减少请求次数

## [ ] Task 3: 前端集成数据追踪
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 创建 `useAnalytics` hook 封装追踪逻辑
  - 在工作流切换时调用事件追踪
  - 在图片生成请求前后记录数据
  - 添加图片评分组件和反馈收集UI
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `human-judgment` TR-3.1: 工作流切换时控制台打印追踪日志
  - `human-judgment` TR-3.2: 生成图片后显示评分按钮
- **Notes**: 使用 `useEffect` 监听状态变化自动触发追踪

## [ ] Task 4: 创建数据查询API
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 创建 `/api/analytics/summary` 端点获取汇总数据
  - 创建 `/api/analytics/generations` 端点获取生成记录列表
  - 创建 `/api/analytics/events` 端点获取事件统计
  - 创建 `/api/analytics/feedback` 端点获取用户反馈
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: GET 请求返回正确的数据格式
  - `programmatic` TR-4.2: 支持时间范围过滤参数
- **Notes**: 支持分页和筛选参数

## [ ] Task 5: 创建数据可视化仪表盘
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - 创建 `/analytics` 页面作为数据仪表盘
  - 展示关键指标卡片（总生成次数、成功率、平均耗时）
  - 展示趋势图表（生成量趋势、工作流分布）
  - 展示用户反馈列表
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgment` TR-5.1: 仪表盘页面加载正常
  - `human-judgment` TR-5.2: 图表数据正确显示
- **Notes**: 使用 Chart.js 或 Recharts 作为图表库

## [ ] Task 6: 数据导出功能
- **Priority**: P2
- **Depends On**: Task 4
- **Description**: 
  - 添加 CSV 导出按钮
  - 支持导出生成记录、事件日志、用户反馈
- **Acceptance Criteria Addressed**: NFR-3
- **Test Requirements**:
  - `human-judgment` TR-6.1: 点击导出按钮下载CSV文件
  - `programmatic` TR-6.2: CSV文件格式正确
- **Notes**: 使用 papaparse 库处理CSV格式

## [x] Task 7: 用户同意和隐私合规
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在页面底部添加数据收集说明
  - 更新隐私政策页面说明数据收集内容
  - 确保不收集个人身份信息
- **Acceptance Criteria Addressed**: NFR-2
- **Test Requirements**:
  - `human-judgment` TR-7.1: 页面显示数据收集说明
  - `human-judgment` TR-7.2: 隐私政策页面更新完成
- **Notes**: 已添加数据收集说明和数据分析入口链接

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 1
- Task 5 depends on Task 4
- Task 6 depends on Task 4
- Task 7 has no dependencies