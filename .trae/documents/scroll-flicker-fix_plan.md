# 滚轮对话框闪烁抖动问题修复计划

## 问题分析

### 根本原因
滚动对话框时出现闪烁抖动的原因是 **滚动事件和状态更新之间形成了循环**：

1. 用户滚动 → `handleScroll` 被触发 → `setScrollPosition(scrollTop)` 更新状态
2. `scrollPosition` 变化 → `useEffect` 监听触发 → 设置 `scrollTop = scrollPosition`
3. 设置 scrollTop → 可能再次触发滚动事件 → 回到步骤1

### 代码问题位置
- `src/app/page.tsx:161-169` - useEffect 在 scrollPosition 变化时重新设置 scrollTop
- `src/app/page.tsx:185-188` - handleScroll 在滚动时更新 scrollPosition 状态

## 修复方案

### 方案一：移除不必要的滚动位置同步（推荐）
- 移除 `useEffect` 中对 scrollTop 的同步设置
- 只在初始化时恢复滚动位置
- 使用 ref 替代 useState 来跟踪滚动位置，避免不必要的重渲染

### 方案二：添加防抖处理
- 对 handleScroll 添加防抖
- 减少状态更新频率

### 方案三：使用 useLayoutEffect
- 使用 useLayoutEffect 确保 DOM 同步更新

## 推荐方案

选择**方案一**，因为：
1. 当前的 scrollPosition 同步逻辑是不必要的，会导致循环更新
2. 使用 ref 可以避免不必要的组件重渲染
3. 只在初始化时恢复滚动位置即可

## 修改文件

### `src/app/page.tsx`
1. 将 `scrollPosition` 从 useState 改为 useRef
2. 移除监听 scrollPosition 的 useEffect
3. 修改相关的事件处理函数

## 实施步骤

1. 将 `const [scrollPosition, setScrollPosition] = useState(0)` 改为 `const scrollPositionRef = useRef(0)`
2. 修改 `handleScroll` 函数使用 ref 而不是 setState
3. 移除监听 scrollPosition 的 useEffect（第161-169行）
4. 修改切换工作流时保存滚动位置的逻辑
5. 在初始化时恢复滚动位置

## 预期效果

修复后，滚动对话框时不会再出现闪烁抖动，因为：
- 滚动位置使用 ref 存储，不会触发组件重渲染
- 移除了导致循环更新的 useEffect
- 只有在必要时才更新滚动位置（如页面初始化、切换工作流）