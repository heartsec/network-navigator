# 数据加载逻辑梳理与分析

## 1. 现有数据加载流程

目前应用的数据加载逻辑高度集中，主要遵循以下流程：

1.  **入口 (Entry Point)**:
    *   `src/components/App.js` 是应用的根组件。
    *   它维护一个初始状态 `state`，其中 `network` 默认为 `null`。
    *   当 `state.network` 为空时，渲染 `LoadNetworkDynamicWithEdgeInfo` 组件，并将 `setState` 作为 `onLoad` prop 传递给它。

2.  **加载器组件 (Loader Component)**:
    *   `src/components/LoadNetworkDynamicWithEdgeInfo.js` 是核心加载组件。
    *   **初始化**: 在 `componentDidMount` 中，它会请求 `examples-list.json` 来获取可用的示例列表。
    *   **触发加载**: 用户选择一个示例后，触发 `loadExampleData` -> `loadNetwork`。

3.  **数据获取与解析 (Fetching & Parsing)**:
    *   `loadNetwork` 方法负责协调所有数据的加载。它使用 `fetch` API 并行请求多个文件。
    *   **网络结构 (.ftree)**:
        *   使用 `src/io/parse-file.js` (基于 PapaParse) 解析文件内容。
        *   使用 `src/io/ftree.js` 处理解析后的数据。
        *   使用 `src/io/network-from-ftree.js` 构建最终的网络对象。
    *   **辅助数据 (.tsv)**:
        *   包括边数据 (`loadEdgeData`)、节点数据 (`loadNodeData`)、溯源信息 (`loadNodeInfo`)。
        *   **现状**: 这些方法内部包含了重复的手动解析逻辑（`split('\n')` 然后 `split('\t')`）。
    *   **JSON 数据**:
        *   包括案情记录 (`loadCaseRecord`)、资料优先级 (`loadMaterialPriority`)、标注数据 (`loadAnnotations`)。
        *   直接使用 `response.json()` 解析。

4.  **状态更新 (State Update)**:
    *   使用 `Promise.all` 等待所有数据加载完成。
    *   调用 `this.props.onLoad` (即 `App.js` 的 `setState`)，将所有加载的数据（network, edgeData, nodeData 等）更新到 `App` 的状态中。

5.  **渲染 (Rendering)**:
    *   `App.js` 状态更新后，`network` 不再为空。
    *   `App` 渲染 `Layout` 组件，并通过 props 将所有数据传递给它。
    *   `Layout` 再将数据分发给子组件：
        *   `NetworkNavigator`: 接收 `network`, `highlightedFacts` 等。
        *   `Sidebar`: 接收 `network`, `edgeData`, `nodeData` 等。
        *   `MaterialsDrawer`: 接收 `nodeInfo`, `materialPriority`。
        *   `CaseRecordFloater`: 接收 `caseRecord`, `annotations`。

## 2. 问题与改进建议

### 问题：解析逻辑耦合
目前，TSV 文件的解析逻辑（`loadEdgeData`, `loadNodeData`, `loadNodeInfo`）直接硬编码在 `LoadNetworkDynamicWithEdgeInfo.js` 组件中。
*   **代码重复**: 多个方法中有相似的 `split` 和遍历逻辑。
*   **复用困难**: 如果其他组件（如 `Sidebar` 想要实现“上传补充资料”功能）需要解析相同格式的数据，就必须复制粘贴代码。

### 改进建议：抽离 Data Loader
正如您所提到的，将数据解析逻辑单独抽离是非常可取的。

1.  **创建 `src/io/data-loader.js`**:
    *   将 `parseEdgeData`, `parseNodeData`, `parseNodeInfo` 等逻辑提取为纯函数。
    *   这些函数只负责将文本内容转换为 JavaScript 对象/Map，不涉及 UI 或网络请求。

2.  **统一数据加载接口**:
    *   可以进一步封装一个 `loadProjectData(config)` 函数，负责根据配置并行加载所有资源，并返回统一的数据结构。
    *   这样 `LoadNetworkDynamicWithEdgeInfo` 组件只需要关注 UI 交互和调用这个统一接口。

3.  **支持增量加载**:
    *   抽离后的解析器可以被 `Sidebar` 等组件复用，用于处理用户上传的新文件，从而实现图谱的动态更新（增量加载或重载）。

## 3. 涉及文件

*   `src/components/App.js` (状态容器)
*   `src/components/LoadNetworkDynamicWithEdgeInfo.js` (当前加载逻辑所在)
*   `src/io/` (建议新增 `data-loader.js` 的位置)
