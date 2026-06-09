# Tasks

- [x] Task 1: 在 history-manager.ts 中新增图片生成器历史记录数据层
  - [x] SubTask 1.1: 新增 `ImgGenHistoryItem` 接口（id, url, prompt, size, model, timestamp）
  - [x] SubTask 1.2: 新增 `saveImgGenHistory` 函数，保存记录到 localStorage 并持久化 Blob 到 IndexedDB
  - [x] SubTask 1.3: 新增 `getImgGenHistory` 函数，读取 localStorage 中的历史元数据
  - [x] SubTask 1.4: 新增 `getImgGenHistoryWithUrls` 函数，返回含持久化 URL 的历史记录
  - [x] SubTask 1.5: 新增 `deleteImgGenImage` 函数，删除单条记录及 Blob
  - [x] SubTask 1.6: 新增 `clearImgGenHistory` 函数，清空所有记录及 Blob

- [x] Task 2: 修改 ImageGeneratorWorkflow.tsx，添加标签页 UI 和历史记录功能
  - [x] SubTask 2.1: 添加 `activeTab` 状态（'generator' | 'history'）和 `imageHistory` 状态
  - [x] SubTask 2.2: 在组件头部添加标签页切换按钮（图片生成 / 图片历史）
  - [x] SubTask 2.3: 在 useEffect 中加载历史记录
  - [x] SubTask 2.4: 修改 generateImage 函数，生成成功后调用 saveImgGenHistory 并更新 imageHistory
  - [x] SubTask 2.5: 移除旧的内存 `history` 状态及其 UI
  - [x] SubTask 2.6: 实现"图片历史"标签页 UI：网格展示、悬停删除、清空全部、点击切换到大图
  - [x] SubTask 2.7: 添加必要的 import 和 icon 引入

# Task Dependencies
- Task 2 depends on Task 1
