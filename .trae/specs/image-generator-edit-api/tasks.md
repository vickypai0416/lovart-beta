# 图片生成组件编辑API调用修复 - 实现计划

## [x] Task 1: 分析ImageGeneratorWorkflow组件中的图片处理逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查referenceImage状态的管理和传递方式
  - 分析generateImage函数中的API调用逻辑
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `human-judgement` TR-1.1: 确认referenceImage状态正确存储
  - `human-judgement` TR-1.2: 确认API调用时包含referenceImage参数

## [x] Task 2: 修复API调用逻辑
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 确保当存在参考图片时，正确调用图片编辑API
  - 修复可能存在的参数传递问题
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证API请求中包含referenceImage参数
  - `human-judgement` TR-2.2: 验证控制台日志显示正确的API调用

## [ ] Task 3: 验证图片编辑功能
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - 测试参考图片编辑功能
  - 确保生成的图片正确显示
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-3.1: 上传图片并生成，验证结果正确显示
  - `human-judgement` TR-3.2: 检查控制台是否有错误日志