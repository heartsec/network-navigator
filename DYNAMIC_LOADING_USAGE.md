# 动态加载组件使用说明

## 文件说明

### LoadNetworkDynamic.js
这是一个支持动态加载示例文件的新组件，位于 `src/components/LoadNetworkDynamic.js`

### examples-list.json
配置文件，位于 `public/examples-list.json`，定义了可用的示例文件列表。

## 使用方法

### 方法一：使用配置文件（推荐）

1. 编辑 `public/examples-list.json`，添加新的示例文件：

```json
{
  "files": [
    {
      "filename": "citation_data.ftree",
      "name": "Citation Network",
      "description": "Citation network data example"
    },
    {
      "filename": "your_new_file.ftree",
      "name": "您的示例名称",
      "description": "示例描述"
    }
  ]
}
```

2. 将您的 `.ftree` 文件放入 `public/` 目录

3. 刷新页面，新的示例会自动出现在下拉列表中

### 方法二：自动检测（备用）

如果删除或无法访问 `examples-list.json`，组件会自动使用默认列表。

要修改默认列表，编辑 `LoadNetworkDynamic.js` 中的 `loadDefaultExamples` 方法：

```javascript
loadDefaultExamples = () => {
  const defaultExamples = [
    "citation_data.ftree",
    "tiny_fact_graph_valid.ftree",
    "your_new_file.ftree",  // 添加新文件
  ];
  // ...
};
```

## 启用动态加载组件

在 `src/components/App.js` 中，将导入更改为：

```javascript
// 原来的导入
// import LoadNetwork from "./LoadNetwork";

// 改为动态加载版本
import LoadNetwork from "./LoadNetworkDynamic";
```

或者直接重命名：
```javascript
import LoadNetworkDynamic from "./LoadNetworkDynamic";
// 然后在使用的地方替换 <LoadNetwork /> 为 <LoadNetworkDynamic />
```

## 特性

- ✅ 自动从配置文件加载示例列表
- ✅ 支持自定义文件名和描述
- ✅ 自动格式化文件名为可读标题
- ✅ 降级到默认列表（如果配置文件不可用）
- ✅ 不修改原有组件，保持向后兼容

## 添加新示例的步骤

1. 将 `.ftree` 文件复制到 `public/` 目录
2. 编辑 `public/examples-list.json`，添加文件信息
3. 刷新页面即可看到新示例

示例：
```bash
# 复制文件
cp my_network.ftree public/

# 编辑配置文件，添加：
# {
#   "filename": "my_network.ftree",
#   "name": "我的网络",
#   "description": "这是我的网络数据"
# }
```

## 文件名自动格式化

如果不在 `examples-list.json` 中指定 `name`，组件会自动格式化文件名：

- `citation_data.ftree` → "Citation Data"
- `tiny_fact_graph_valid.ftree` → "Tiny Fact Graph Valid"
- `my_network.ftree` → "My Network"
