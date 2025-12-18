# 尝试 1：实现后台解析资料生成图谱 (初始上传与后续更新)

## 目标
实现基于后台解析资料后生成图谱的功能，包括：
1.  **初始资料上传**：在应用启动时上传资料（如会议记录），生成初始图谱。
2.  **后续资料上传**：在图谱展示界面，上传补充资料，触发图谱的更新与重载。

## 核心改动

### 1. 逻辑抽离与模拟后端 (`src/io/data-loader.js`)
*   **新建文件**：创建了 `src/io/data-loader.js`。
*   **功能**：
    *   将原分散在组件中的 TSV 解析逻辑（`parseEdgeData`, `parseNodeData`, `parseNodeInfo`）抽离为纯函数，便于复用。
    *   实现了 `mockBackendProcessingAndLoad` 函数，用于模拟后端接收文件、处理并返回完整图谱数据（Ftree, 边数据, 节点信息等）的过程。目前使用静态资源模拟。

### 2. 初始加载改造 (`src/components/LoadNetworkDynamicWithEdgeInfo.js`)
*   **引入 Data Loader**：使用新抽离的解析函数替代组件内硬编码的逻辑。
*   **支持数据源注入**：修改 `loadNetwork` 方法，使其支持直接传入预处理好的 `dataSources` 对象，而不仅仅依赖文件路径加载。
*   **UI 更新**：
    *   激活了原本禁用的 "上传待审会议记录" 区域。
    *   添加了隐藏的文件输入框和点击触发逻辑。
*   **交互逻辑**：
    *   实现了 `handleFileUpload`，用户选择文件后，调用模拟后端接口。
    *   获取数据后，直接调用 `loadNetwork` 渲染图谱。

### 3. 侧边栏更新机制 (`src/components/Sidebar.js`)
*   **UI 更新**：在侧边栏菜单中添加了 "添加补充资料" 按钮。
*   **交互逻辑**：
    *   点击按钮触发文件选择。
    *   选择文件后，调用 `mockBackendProcessingAndLoad` 模拟后端处理。
    *   通过新传入的 `onUpdateNetwork` 回调，更新 App 的全局状态。

### 4. 全局状态传递 (`src/components/App.js`)
*   **Props 传递**：将 `setState` 函数以 `onUpdateNetwork` 的名义传递给 `Layout` 组件，最终传递给 `Sidebar`。
*   **目的**：允许侧边栏组件直接更新根组件的 `network` 及相关数据状态，实现图谱的动态重载。

## 修改文件列表
1.  `src/io/data-loader.js` (新增)
2.  `src/components/LoadNetworkDynamicWithEdgeInfo.js`
3.  `src/components/Sidebar.js`
4.  `src/components/App.js`
