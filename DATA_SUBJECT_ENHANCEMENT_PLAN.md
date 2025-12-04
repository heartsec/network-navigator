# 数据主体归属增强方案

## 问题描述

当前 `credit_case_nodes_ai_info.tsv` 中的 `primary_source` 和 `secondary_source` 列存在**主体归属不明确**的问题，导致 Material View 聚合时产生混淆。

### 典型案例

| Fact ID | Fact Name | Primary Source | 实际主体 | 业务含义 |
|---------|-----------|----------------|----------|----------|
| F16 | 法定代表人对外担保余额（他行） | 担保人征信与资产证明 | **法定代表人** | 法人的负债 |
| F27 | 担保人保证贷款余额 | 担保人征信与资产证明 | **担保人** | 担保人的风险 |

两个不同主体的事实使用了相同的资料来源名称，但实际上：
- F16 需要的是"法定代表人"的征信报告
- F27 需要的是"担保人"的征信报告

## 根本原因

1. **资料项名称本身混淆了主体**
   - `担保人征信与资产证明` 这个名称暗示了主体是"担保人"
   - 但实际使用中也用于"法定代表人"的征信

2. **general_material_priority.csv 中的资料项定义不够明确**
   ```
   担保人征信与资产证明          ← 包含主体信息
   企业及担保人基本资料          ← 混合了多个主体
   担保人/实际控制人收入证明     ← 混合了多个主体
   ```

3. **数据结构缺少主体归属字段**
   - 当前只有资料类型，没有明确该资料属于哪个主体

## 解决方案

### 方案设计：增加主体归属列

在 `credit_case_nodes_ai_info.tsv` 中增加以下列：

```
fact_id | fact_name | category | subject_type | 
primary_source | primary_subject | 
secondary_source | secondary_subject | 
check_points
```

#### 新增字段说明

**1. `subject_type`** - 事实的主体类型
- 贷款主体/借款企业
- 法定代表人
- 担保人
- 实际控制人
- 关联企业
- 其他

**2. `primary_subject`** - 主要资料来源的归属主体
- 贷款主体
- 法定代表人
- 担保人
- 实际控制人
- 关联企业
- 不限/通用（如工商公示信息）

**3. `secondary_subject`** - 辅助资料来源的归属主体
- 同上

### 示例数据

```tsv
fact_id	fact_name	category	subject_type	primary_source	primary_subject	secondary_source	secondary_subject	check_points
F1	主体成立时间	企业经营情况	贷款主体	工商登记与股权结构	贷款主体	企业及担保人基本资料（身份证、营业执照等）	贷款主体	核对营业执照注册日期与工商系统是否一致
F12	法定代表人自有房产数量与类型	关联情况	法定代表人	担保人征信与资产证明	法定代表人	不动产登记查询	法定代表人	需核实房产产权归属、是否抵押、估值合理性
F16	法定代表人对外担保余额（他行）	关联情况	法定代表人	担保人征信与资产证明	法定代表人	司法、执行、失信信息	法定代表人	通过征信报告核实担保余额准确性，是否存在逾期
F21	担保人自有房产及租金收入	贷款担保分析及对外担保情况分析	担保人	担保人征信与资产证明	担保人	租赁合同	担保人	核实房产产权、租金收入真实性及稳定性
F27	担保人保证贷款余额	贷款担保分析及对外担保情况分析	担保人	担保人征信与资产证明	担保人	信贷系统记录	不限	核实贷款状态（正常/逾期）、担保责任类型
```

## 实施步骤

### Step 1: 数据结构调整

1. **备份现有数据**
   ```bash
   cp credit_case_nodes_ai_info.tsv credit_case_nodes_ai_info.tsv.backup
   ```

2. **修改 TSV 文件表头**
   - 在 `category` 后增加 `subject_type` 列
   - 在 `primary_source` 后增加 `primary_subject` 列
   - 在 `secondary_source` 后增加 `secondary_subject` 列

3. **填充主体归属信息**
   - 逐行分析每个 fact 的实际主体
   - 填写对应的主体类型

### Step 2: 标准化资料项名称

**将 general_material_priority.csv 中的资料项重命名为主体无关的通用名称**：

| 当前名称 | 建议修改为 |
|---------|-----------|
| 企业及担保人基本资料（身份证、营业执照等） | 基本身份与工商资料 |
| 担保人征信与资产证明 | 个人征信与资产证明 |
| 担保人/实际控制人收入证明 | 个人收入证明 |
| 对公银行流水（部分） | 银行账户流水 |
| 发票与税务数据（具体开票明细） | 发票与税务数据 |
| 纳税申报表、纳税记录（完税证明） | 纳税申报与完税记录 |
| 合同资料（购销合同、租赁合同等） | 合同资料 |

**优点**：
- 资料类型更纯粹，不带主体信息
- 通过 `primary_subject` 字段明确归属
- 避免名称混淆

### Step 3: 代码适配

**修改 `MaterialsDrawer.js` 的聚合逻辑**：

当前逻辑（仅按资料名称聚合）：
```javascript
const materialFactsMap = useMemo(() => {
  const map = new Map();
  for (const [factId, info] of nodeInfo.entries()) {
    const primary = info.primary_source || "";
    // 将资料名称作为 key
    map.set(primary, [...factIds]);
  }
  return map;
}, [nodeInfo]);
```

**改进方案 A：按资料名称聚合（保持现状，但显示时增强）**
```javascript
// 聚合时仍按资料名称，但在展示时显示主体信息
const materialStats = useMemo(() => {
  return materialPriority.materials.map(material => {
    const facts = materialFactsMap.get(material.name) || [];
    
    // 统计该资料涉及的主体类型
    const subjectTypes = new Set();
    facts.forEach(factId => {
      const info = nodeInfo.get(factId);
      if (info.primary_source === material.name) {
        subjectTypes.add(info.primary_subject);
      }
    });
    
    return {
      ...material,
      usageCount: facts.length,
      factIds: facts,
      subjects: Array.from(subjectTypes) // 新增：涉及的主体列表
    };
  });
}, [materialPriority, materialFactsMap, nodeInfo]);
```

**改进方案 B：按资料名称+主体聚合（更精细）**
```javascript
const materialFactsMap = useMemo(() => {
  const map = new Map();
  
  for (const [factId, info] of nodeInfo.entries()) {
    const primary = info.primary_source || "";
    const subject = info.primary_subject || "未分类";
    
    // 使用 "资料名称::主体" 作为复合 key
    const key = `${primary}::${subject}`;
    
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(factId);
  }
  
  return map;
}, [nodeInfo]);
```

### Step 4: UI 展示增强

**在 MaterialsDrawer 中显示主体信息**：

```jsx
<List.Item key={material.name}>
  <List.Content>
    <List.Header>{material.name}</List.Header>
    <List.Description>
      使用次数: {material.usageCount}
      {material.subjects && material.subjects.length > 0 && (
        <span style={{ marginLeft: '10px', color: '#666' }}>
          涉及主体: {material.subjects.join(', ')}
        </span>
      )}
    </List.Description>
  </List.Content>
</List.Item>
```

## 数据迁移清单

### 需要修改的文件

1. **`credit_case_nodes_ai_info.tsv`** ✓ 核心文件
   - 增加 3 个新列
   - 填充 29 行数据的主体信息

2. **`general_material_priority.csv`** （可选）
   - 标准化资料项名称，去除主体信息

3. **`general_material_evaluation_checklist.csv`** （可选）
   - 同步更新资料项名称

4. **`MaterialsDrawer.js`**
   - 调整聚合逻辑
   - 增强 UI 显示

### 主体类型枚举建议

```javascript
const SUBJECT_TYPES = {
  BORROWER: '贷款主体',
  LEGAL_REP: '法定代表人',
  GUARANTOR: '担保人',
  ACTUAL_CONTROLLER: '实际控制人',
  RELATED_ENTITY: '关联企业',
  GENERIC: '不限/通用'
};
```

## 预期收益

1. **消除主体混淆**
   - 明确区分"法定代表人的征信"和"担保人的征信"
   - Material View 可以按主体细分统计

2. **提升数据质量**
   - 资料来源和归属主体分离
   - 支持更精细的查询和分析

3. **增强可维护性**
   - 资料项名称标准化
   - 数据结构更清晰

4. **扩展性更强**
   - 未来可以按主体维度进行风险分析
   - 支持多主体关联查询

## 注意事项

1. **向后兼容**
   - 如果现有系统已经在使用，需要提供兼容方案
   - 可以先增加列但不强制使用，逐步迁移

2. **数据一致性**
   - 确保所有 fact 的主体信息填写准确
   - 建立主体类型的验证规则

3. **性能影响**
   - 增加列后文件略大，但影响很小
   - 聚合逻辑复杂度略增，需要测试

## 附录：当前问题行汇总

| Fact ID | Fact Name | Current Primary Source | 实际需要的主体 |
|---------|-----------|------------------------|----------------|
| F11 | 法定代表人公职身份 | 企业及担保人基本资料 | 法定代表人 |
| F12 | 法定代表人自有房产数量与类型 | 担保人征信与资产证明 | 法定代表人 |
| F16 | 法定代表人对外担保余额（他行） | 担保人征信与资产证明 | 法定代表人 |
| F17 | 法定代表人信用卡透支余额 | 担保人征信与资产证明 | 法定代表人 |
| F18 | 法定代表人对外担保金额 | 担保人征信与资产证明 | 法定代表人 |
| F19 | 贷款担保人身份 | 企业及担保人基本资料 | 担保人 |
| F21-F28 | 担保人相关事实 | 担保人征信与资产证明 | 担保人 |

---

**文档版本**: v1.0  
**创建日期**: 2025-12-04  
**状态**: 待实施
