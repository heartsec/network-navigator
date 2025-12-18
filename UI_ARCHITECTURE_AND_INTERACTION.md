# 界面架构与交互逻辑分析文档

## 1. 组件结构概览

整个应用以 `src/components/App.js` 为入口，当网络数据加载完成后，主要由 `src/components/Layout.js` 负责整体布局和状态管理。

*   **`App.js`**: 根组件。
    *   负责初始状态检查。如果没有加载网络数据，显示 `LoadNetwork`（加载页面）。
    *   数据加载后，渲染 `Layout` 组件。
*   **`Layout.js`**: 核心布局组件。
    *   **状态管理**: 使用 `useReducer` 管理全局状态（如 `selectedNode`, `highlightedFacts`, `sidebarVisible` 等）。
    *   **上下文**: 通过 `Dispatch.Provider` 向下层组件提供 `dispatch` 方法，用于触发状态更新。
    *   **布局**: 使用 Semantic UI 的 `Sidebar.Pushable` 结构。

## 2. 核心组件及其功能

在 `Layout.js` 中，主要包含以下四个核心交互组件：

### A. `NetworkNavigator` (主视图)
*   **位置**: 占据屏幕主要区域。
*   **功能**: 使用 D3.js 渲染网络拓扑图 (`<svg>`)。
*   **交互**:
    *   **接收**: 通过 `props` 接收全局状态（如 `highlightedFacts`）。在 `componentDidUpdate` 中监听这些属性变化，并调用 D3 逻辑（如 `highlightFactNodes`）来更新图表样式（高亮/淡化节点）。
    *   **发出**: 监听图上的点击、拖拽事件，通过 `dispatch` 更新 `selectedNode` 等状态。

### B. `Sidebar` (右侧边栏)
*   **位置**: 屏幕右侧，可折叠。
*   **呼出**:
    *   默认可能隐藏或显示。
    *   通过点击右上角的菜单按钮（在 `Layout.js` 中定义的 `Rail` -> `Menu`）触发 `dispatch({ type: "sidebarVisible", value: true })` 来呼出。
*   **功能**: 包含多个选项卡（搜索、选中节点详情、边详情、设置、分布统计等）。
*   **交互**:
    *   用户在侧边栏修改设置（如节点大小、标签显示）或搜索节点。
    *   操作触发 `dispatch` 更新状态，`NetworkNavigator` 响应这些状态变化重绘图表。

### C. `CaseRecordFloater` (案情浮窗)
*   **位置**: 屏幕左上角（通常），悬浮在图表之上。
*   **呼出**: 加载案情数据后自动显示。
*   **功能**: 展示案情文本记录，支持文本高亮标注。
*   **交互**:
    *   **文本交互**: 当用户鼠标悬停或点击文书中的某段事实（Fact）时。
    *   **联动**: 触发 `dispatch` 发送高亮动作，`NetworkNavigator` 接收后高亮图中对应的节点。

### D. `MaterialsDrawer` (资料抽屉)
*   **位置**: 屏幕底部（通常），类似抽屉的效果。
*   **呼出**: 总是存在，可能通过按钮或交互展开/收起。
*   **功能**: 展示证据资料列表（如合同、发票等）。
*   **交互**:
    *   **列表交互**: 用户点击某个资料项。
    *   **联动**: 触发 `dispatch({ type: "highlightFacts", value: [...] })`，将该资料关联的所有事实 ID 发送出去。`NetworkNavigator` 收到后高亮这些事实对应的节点。

## 3. 交互数据流向总结

整个交互遵循 **单向数据流** 模式：

1.  **Action**: 用户在 `Sidebar`、`CaseRecordFloater` 或 `MaterialsDrawer` 中进行操作（如点击资料）。
2.  **Dispatch**: 组件调用 `dispatch` 发送 Action（如 `highlightFacts`）。
3.  **Reducer**: `Layout.js` 中的 `reducer` 接收 Action 并更新 State。
4.  **Update**: 新的 State 通过 `props` 传递给 `NetworkNavigator`。
5.  **Render**: `NetworkNavigator` 的 `componentDidUpdate` 检测到 `props` 变化，调用 D3 方法更新 SVG 视图（如高亮节点）。
