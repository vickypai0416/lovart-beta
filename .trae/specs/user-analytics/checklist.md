# 用户行为和生图数据收集系统 - 验证清单

## 数据库层
- [x] Session 表创建完成，包含 id、createdAt、updatedAt、userId（可选）字段
- [x] Event 表创建完成，包含 id、sessionId、type、payload、createdAt 字段
- [x] Generation 表创建完成，包含 id、sessionId、prompt、size、quality、model、count、status、duration、imageUrl、error、createdAt 字段
- [x] Feedback 表创建完成，包含 id、generationId、rating、comment、createdAt 字段
- [x] 使用文件-based JSON存储方案替代Prisma，数据存储正常

## API层
- [x] POST /api/track 端点创建成功，支持记录用户事件、生成请求、反馈
- [x] GET /api/analytics?endpoint=summary 端点创建成功，返回汇总数据
- [x] GET /api/analytics?endpoint=generations 端点创建成功，支持分页和筛选
- [x] GET /api/analytics?endpoint=events 端点创建成功，支持时间范围过滤
- [x] GET /api/analytics?endpoint=feedbacks 端点创建成功

## 前端集成
- [x] useAnalytics hook 创建完成
- [x] 工作流切换时自动触发事件追踪
- [x] 图片生成请求时自动记录参数
- [x] 图片生成完成后自动记录结果
- [x] 图片评分组件和反馈收集UI已预留接口
- [x] 页面底部添加数据收集说明

## 仪表盘页面
- [x] /analytics 页面创建完成
- [x] 关键指标卡片显示正常（总生成次数、成功率、平均耗时）
- [x] 趋势图表显示正常（生成量趋势、工作流分布）
- [x] 用户反馈列表显示正常
- [x] 数据导出按钮功能正常（CSV格式）

## 隐私合规
- [x] 页面底部添加数据收集说明
- [x] 隐私政策链接已添加
- [x] 数据分析入口链接已添加
- [x] 不收集个人身份信息

## 测试验证
- [x] TypeScript 类型检查通过
- [x] API 端点测试通过
- [x] 前端功能测试通过