# GPT Image 2 Edit 对话助手生成失败修复 - 验证清单

## 参数传递检查
- [x] `generateWithGPTImage2Edit` 函数签名包含 `quality` 参数
- [x] `generateWithGPTImage2Edit` 中 FormData 包含 `quality` 字段
- [x] `generateImageDirectly` 调用 `generateWithGPTImage2Edit` 时传递了 `quality`
- [x] `generateWithYunwuAPIStream` 自动生成调用时传递了 `quality`

## 错误处理检查
- [x] `generateWithRetry` 在重试耗尽后抛出最后一次错误（而非返回空数组）
- [x] `generateImageDirectly` 的 catch 块能捕获并传递具体错误消息
- [x] 前端 SSE 错误事件包含具体错误信息（而非仅"图片生成失败，请重试"）

## 日志检查
- [x] `generateWithGPTImage2Edit` 记录完整的请求参数（prompt, model, n, size, quality, 参考图片数量）
- [x] `generateSingleImageWithGPTImage2EditFormData` 在 API 返回非 200 时记录完整响应

## 功能验证
- [ ] 选择 GPT Image 2 Edit 模型 + 上传图片 + 输入文本 → 能成功生成图片
- [ ] 选择 GPT Image 2 Edit 模型 + 不上传图片 → 显示"图片编辑需要提供参考图片"
- [ ] API 返回错误时 → 前端显示具体错误信息
- [ ] 其他模型（gpt-image-2, gpt-image-2-gen, gpt-5-nano）功能不受影响
