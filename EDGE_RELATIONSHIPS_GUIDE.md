# 边关系功能使用指南

## 功能概述

本项目现已支持加载和显示富信息的边关系数据。这个功能允许你：

1. 从 TSV 文件加载边关系的详细元数据
2. 在可视化图谱中查看节点时，显示与该节点相关的所有边关系
3. 查看每条边的详细信息，包括：
   - 关系类型
   - 风险倾向（positive/negative/neutral）
   - 模型置信度
   - 人工标注结果
   - 风险标签
   - 来源文档
   - 创建理由等

## 文件结构

### 1. 富信息边文件：`edges_full.tsv`

位置：`public/fact_graph_bundle/edges_full.tsv`

包含以下字段：

| 字段名 | 说明 |
|--------|------|
| `edge_id` | 边的唯一标识符 |
| `from_fact_id` | 起点 Fact ID |
| `to_fact_id` | 终点 Fact ID |
| `from_entity_id` | 起点实体 ID（可选） |
| `to_entity_id` | 终点实体 ID（可选） |
| `relation_type` | 关系类型（如 SAME_RISK_THEME） |
| `direction` | 方向（directed/undirected） |
| `weight` | 图算法权重 |
| `llm_confidence` | LLM 置信度（0-1） |
| `risk_polarity` | 风险倾向（positive/negative/neutral） |
| `risk_tags` | 风险标签（逗号分隔） |
| `reason_brief` | 简要理由 |
| `source_doc_ids` | 来源文档（逗号分隔） |
| `created_by_model` | 创建模型版本 |
| `created_at` | 创建时间 |
| `human_label` | 人工标注（confirmed/rejected/unknown） |
| `human_confidence` | 人工置信度（0-1） |
| `reviewer` | 审核人 |
| `reviewed_at` | 审核时间 |

### 2. 示例数据

项目包含示例数据位于 `public/fact_graph_bundle/`：

- `tiny_fact_graph_valid.ftree` - 图谱数据
- `edges_full.tsv` - 边关系数据
- `nodes.tsv` - 节点映射数据
- `edges_infomap.tsv` - Infomap 用的精简边数据

## 使用方法

### 1. 加载图谱

启动应用后：

1. 从下拉菜单选择 `Tiny Fact Graph Valid`
2. 点击 "Load example" 按钮
3. 系统会自动加载对应的边关系数据

### 2. 查看边关系

1. 在图谱中点击任意节点
2. 在右侧边栏找到 "边关系详情" 部分
3. 展开可以看到：
   - 该节点的所有相关边
   - 每条边的详细信息
   - 按入边、出边、无向边分组显示

### 3. 边关系信息展示

每条边显示：
- **关系类型标签**（蓝色）
- **风险倾向标签**（红色=负面，绿色=正面，灰色=中性）
- **置信度百分比**
- **详细表格**：
  - 连接的理由说明
  - 方向和连接节点
  - 权重值
  - 风险标签
  - 来源文档
  - 创建模型
  - 人工审核结果

## 代码架构

### 关键组件

1. **LoadNetworkDynamicWithEdgeInfo.js**
   - 负责加载图谱和边数据
   - 自动查找对应的 `edges_full.tsv` 文件
   - 解析 TSV 格式数据

2. **EdgeDetails.js**
   - 显示边关系详情的 UI 组件
   - 根据节点 ID 筛选相关的边
   - 以折叠面板形式展示每条边的信息

3. **App.js & Layout.js & Sidebar.js**
   - 负责数据流传递
   - 将 edgeData 从顶层传递到边栏组件

### 数据流

```
LoadNetworkDynamicWithEdgeInfo.js
  ↓ (loads .ftree + edges_full.tsv)
App.js (state: { network, filename, edgeData })
  ↓
Layout.js (passes props)
  ↓
Sidebar.js (receives edgeData)
  ↓
EdgeDetails.js (filters & displays edges for selected node)
```

## 自定义边数据

### 添加新的图谱和边数据

1. 准备你的 `.ftree` 文件，放到 `public/` 目录
2. 创建对应的 `edges_full.tsv` 文件，放到 `public/fact_graph_bundle/`
3. 确保 TSV 文件：
   - 第一行是表头
   - 使用 Tab 字符分隔
   - `from_fact_id` 和 `to_fact_id` 要与 `.ftree` 中的节点名称匹配

### 示例 TSV 格式

```tsv
edge_id	from_fact_id	to_fact_id	relation_type	direction	weight	llm_confidence	risk_polarity	reason_brief
e1	F_A_rev_conc	F_B_dep_A	SUPPLY_CHAIN_CO_DEPENDENCE	directed	1.0	0.95	negative	"A 对 B 收入集中 + B 对 A 供货集中"
e2	F_A_rev_conc	F_A_ltv_high	SAME_RISK_THEME	undirected	0.8	0.9	negative	"两条 fact 都指向对单一现金流过度依赖"
```

## 调试提示

- 打开浏览器控制台查看加载日志
- 如果边数据未显示，检查：
  - TSV 文件路径是否正确
  - fact_id 是否与节点名称匹配
  - TSV 格式是否正确（Tab 分隔，不是空格）

## 未来扩展

可能的功能增强：

1. 支持 CSV 格式
2. 支持从多个数据源加载
3. 边关系的筛选和搜索
4. 边关系的可视化突出显示
5. 导出边关系报告
6. 批量编辑人工标注
