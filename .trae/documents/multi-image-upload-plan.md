# 多图上传优化计划

## Repo 研究结论

当前对话助手的图片上传流程存在问题：
1. 上传单张图片后立即发送到对话中（显示"图片上传成功"消息）
2. 用户无法先上传多张图片再一起发送
3. 需要改为：先收集多张图片 → 输入文字 → 一起发送

## 需要修改的文件

### 1. `src/app/page.tsx`（对话助手组件）

**修改点：**
- 将 `userImage: string | null` 改为 `userImages: string[]`
- 修改 `handleImageUpload`：上传图片后不立即发送消息，仅添加到 `userImages` 数组
- 修改图片预览区域：横向排列多张带序号标签的缩略图
- 修改发送逻辑：发送时将文字 + 所有图片一起打包发送
- 添加 `clearAllImages` 和 `removeImage(index)` 函数
- 文件输入添加 `multiple` 属性

### 2. `src/app/api/chat/route.ts`

**修改点：**
- 修改消息中图片提取逻辑，支持提取多张图片
- 修改 `generateWithGPTImage2` 支持多张图片作为 `image_url` 数组

## 修改步骤

### 步骤 1: 修改状态定义

```typescript
// 原代码
const [userImage, setUserImage] = useState<string | null>(null);

// 修改为
const [userImages, setUserImages] = useState<string[]>([]);
```

### 步骤 2: 修改 handleImageUpload

```typescript
// 原逻辑：上传后立即发送消息
// 修改为：上传后仅添加到 userImages 数组，不发送消息
```

### 步骤 3: 修改图片预览区域

```typescript
// 原逻辑：显示单张图片
// 修改为：横向排列多张带序号标签（①②③）的缩略图，每张可单独删除
```

### 步骤 4: 修改 sendMessage

```typescript
// 原逻辑：只处理单张图片
// 修改为：将所有图片作为 image_url 数组添加到消息内容中
```

### 步骤 5: 修改 API 层图片提取

```typescript
// 原逻辑：只提取单张图片
// 修改为：提取所有 image_url 内容项
```

### 步骤 6: 修改 GPT Image 2 调用

```typescript
// 原逻辑：单张图片
// 修改为：多张图片作为 image_url 数组
```

## 序号标签设计

使用 Unicode 带圆圈数字：① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ⑪ ⑫ ⑬ ⑭ ⑮ ⑯

超过 16 张时提示限制。

## 风险处理

- 图片数量限制：最多 16 张（API 限制）
- 文件大小限制：总大小不超过 50MB（API 限制）
- 内存占用：Base64 编码会增加约 33% 体积，大量大图可能影响性能
- 向后兼容：API 层保持对单图的兼容支持

## 图片格式

使用 `accept="image/jpeg,image/png,image/webp,image/gif"` 限制上传格式。
