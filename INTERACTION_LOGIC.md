# Network Navigator 交互逻辑文档

本文档梳理了 `network-navigator` 项目中现有的数据流、核心组件架构以及 D3 图谱的交互逻辑。

## 1. 数据架构 (Data Architecture)

数据主要通过 `src/io/` 目录下的脚本进行解析，并在 `src/lib/network.js` 中定义的类中建模。

### 核心模型 (`src/lib/network.js`)
*   **`Network`**: 顶层容器，包含所有的节点 (`nodes`) 和连线 (`links`)。
*   **`Node`**: 代表图谱中的节点。
    *   **属性**: `flow` (流量/权重), `path` (层级路径 `TreePath`), `physicalId`, `name` 等。
    *   **层级**: 节点是分层的，可以包含子节点（模组）。
*   **`Link`**: 代表节点间的连接。
    *   **属性**: `source`, `target`, `flow`。

### 数据加载
*   **入口**: `src/components/App.js`。
*   **加载器**: 使用 `LoadNetworkDynamicWithEdgeInfo` (或类似组件) 读取文件。
*   **格式**: 支持 `.ftree` (层级结构与流量) 和 `.tsv` (节点/边信息)。

### 状态管理
*   **全局数据**: `src/components/App.js` 持有核心的 `network` 对象实例。
*   **UI 状态**: `src/components/Layout.js` 使用 `useReducer` 和 `Dispatch.Provider` 管理：
    *   `selectedNode`: 当前选中的节点对象。
    *   `sidebarVisible`: 侧边栏的显示/隐藏状态。
    *   `highlightedFacts`: 当前高亮的事实 ID 列表。
    *   `nodeSize` / `nodeScale`: 节点视觉属性配置。

## 2. 关键组件 (Key Components)

React 组件主要负责 UI 框架和状态传递，而 D3 逻辑被封装在特定的组件和库文件中。

### React 组件层
*   **`App.js`**
    *   应用程序根组件。
    *   负责初始化数据加载，数据就绪后渲染 `Layout`。
*   **`Layout.js`**
    *   主布局容器。
    *   包裹 `NetworkNavigator` (图谱) 和辅助面板 (`Sidebar`, `MaterialsDrawer`, `CaseRecordFloater`)。
    *   提供 `Dispatch` 上下文，允许子组件触发全局动作。
*   **`NetworkNavigator.js`** (核心)
    *   **角色**: React 和 D3 之间的桥梁。
    *   **职责**:
        *   初始化 SVG 画布和 D3 Zoom 行为。
        *   管理多个 `NetworkLayout` 实例（用于处理不同层级的显示）。
        *   监听 React props 变化（如 `highlightedFacts`），调用 D3 方法更新视觉效果。

### D3 渲染层
*   **`NetworkLayout` (`src/lib/network-layout.js`)**
    *   **角色**: D3 渲染控制器（非 React 组件，是一个 JS 类）。
    *   **职责**:
        *   管理特定层级或模组内的节点/连线的 D3 Selections。
        *   管理力导向图模拟 (`Simulation`)。
        *   处理底层的 D3 事件（拖拽、点击）。

## 3. D3 图谱交互逻辑 (D3 Interaction Logic)

交互逻辑分散在 `NetworkNavigator.js` (全局) 和 `NetworkLayout.js` (局部) 中。

### A. 渲染与布局 (Rendering & Layout)
1.  **初始化**: `NetworkNavigator` 创建 SVG，并为根路径实例化一个 `NetworkLayout`。
2.  **力导向模拟**: 每个 `NetworkLayout` 拥有独立的 `Simulation` (`src/lib/simulation.js`)，使用 `d3-force` 计算位置。
3.  **层级细节 (LOD)**: 支持向下钻取。`NetworkNavigator` 通过 `renderPath` 递归地为子模组创建新的 `NetworkLayout`。

### B. 用户交互事件 (User Interactions)

| 交互行为 | 处理位置 | 逻辑描述 |
| :--- | :--- | :--- |
| **缩放/平移** | `NetworkNavigator.js` | 由 `d3.zoom()` 处理。触发时更新 SVG `transform` 并通知所有 Layout 更新坐标映射。 |
| **点击节点** | `NetworkLayout.js` -> `NetworkNavigator.js` | 1. `NetworkLayout` 捕获点击。<br>2. 转发给 `NetworkNavigator`。<br>3. `dispatch` 更新全局 `selectedNode`。<br>4. `Layout` 响应并打开侧边栏。 |
| **点击背景** | `NetworkNavigator.js` | 监听 SVG 背景点击。触发清除选中 (`selectedNode: null`) 和清除高亮 (`highlightFacts: null`)。 |
| **拖拽节点** | `NetworkLayout.js` | 使用 `d3.drag()`。拖拽开始时激活模拟器，拖拽中更新节点 `fx`/`fy`，结束时释放。 |
| **外部高亮** | `NetworkNavigator.js` | `componentDidUpdate` 监听 `highlightedFacts` 变化，调用 `highlightFactNodes` 遍历 D3 节点修改样式。 |

### C. 视觉反馈与更新
*   **样式更新**: 当用户在设置中更改 `nodeSize` (如按流量或子节点数) 或 `nodeScale` 时：
    1.  `NetworkNavigator` 重新计算 D3 比例尺 (Scales)。
    2.  更新 `renderStyle` 配置对象。
    3.  强制所有 `NetworkLayout` 实例重绘 (`updateAttributes`)。

## 4. 组件交互详情 (Component Interactions)

除了核心图谱，三个主要辅助组件通过 `Dispatch` 上下文与图谱进行深度交互。

### Sidebar (侧边栏)
*   **文件**: `src/components/Sidebar.js`
*   **功能**: 显示当前选中节点的详细信息、全局搜索、导出和设置。
*   **交互方式**:
    *   **显示详情**: 当 `selectedNode` 状态更新时，Sidebar 自动显示。内部组件 `SelectedNode` 会结合 `nodeData` (属性) 和 `nodeInfo` (溯源) 展示丰富信息。
    *   **调整宽度**: 支持拖拽边缘调整宽度，触发 `dispatch({ type: "sidebarWidth", value: newWidth })`，图谱布局会自动适应剩余空间。
    *   **重命名**: 用户修改节点名称时，触发 `selectedNodeNameChange`，通知图谱更新标签。
    *   **全局搜索 (Search)**:
        *   **组件**: `src/components/Search.js`，嵌入在 Sidebar 中。
        *   **逻辑流**:
            1.  `NetworkNavigator` 在挂载时定义搜索回调函数（调用 `network.search(name)` 并强制所有 Layout 更新）。
            2.  该回调通过 `dispatch` 传递给全局状态，最终作为 props 传给 `Search` 组件。
            3.  用户输入关键词 -> 触发回调 -> `Network` 模型更新节点的 `searchHits` 属性 -> `NetworkLayout` 根据命中情况更新节点视觉效果（如大小、颜色）。
            4.  同时返回搜索结果列表供下拉框显示。

### MaterialsDrawer (资料抽屉)
*   **文件**: `src/components/MaterialsDrawer.js`
*   **功能**: 展示案件资料列表、优先级及引用统计。
*   **交互方式**:
    *   **点击资料项**:
        1.  用户点击某个资料（如“审计报告”）。
        2.  组件查找该资料关联的所有 `factIds`。
        3.  触发 `dispatch({ type: "highlightFacts", value: [id1, id2...] })`。
        4.  图谱响应并高亮显示引用了该资料的所有节点。
    *   **状态同步**: 监听 `highlightedFacts` 属性。如果用户点击图谱背景取消了高亮，抽屉会自动取消选中状态。

### CaseRecordFloater (案情浮窗)
*   **文件**: `src/components/CaseRecordFloater.js`
*   **功能**: 显示带有标注的案情文本，展示事实与文本的对应关系。
*   **交互方式**:
    *   **悬停/点击标注**:
        1.  用户鼠标悬停在文本中的标注片段上。
        2.  组件识别该片段对应的 `factId` 及其关联事实 `relatedFactIds`。
        3.  触发 `dispatch({ type: "highlightFacts", value: [factId, ...relatedIds] })`。
        4.  图谱实时高亮相关节点，形成“文本-图谱”联动。
    *   **视觉反馈**: 浮窗内的文本也会根据悬停状态改变透明度，突出显示当前关注的段落。
