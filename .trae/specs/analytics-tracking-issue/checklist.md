# 数据分析仪表盘无记录问题排查 - 验证清单

- [ ] 检查浏览器控制台是否有 trackMessage 调用日志
- [ ] 检查 trackMessage API 是否返回成功响应
- [ ] 检查存储后端（文件/KV）是否有消息记录
- [ ] 检查 GET /api/analytics?endpoint=messages 是否返回数据
- [ ] 检查仪表盘"消息记录"标签页是否显示数据
- [ ] 测试文本消息追踪功能
- [ ] 测试图片生成追踪功能
