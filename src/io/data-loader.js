import parseFile from "./parse-file";
import parseFTree from "./ftree";
import networkFromFTree from "./network-from-ftree";

// 解析边数据文本
export const parseEdgeData = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split("\t");
    const edge = {};
    headers.forEach((header, index) => {
      edge[header] = values[index] ? values[index].trim() : "";
    });
    return edge;
  });
};

// 解析节点数据文本
export const parseNodeData = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return new Map();
  const headers = lines[0].split("\t").map(h => h.trim());
  const nodeMap = new Map();
  lines.slice(1).forEach(line => {
    const values = line.split("\t");
    const node = {};
    headers.forEach((header, index) => {
      node[header] = values[index] ? values[index].trim() : "";
    });
    if (node.fact_id) nodeMap.set(node.fact_id, node);
  });
  return nodeMap;
};

// 解析节点信息文本
export const parseNodeInfo = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return new Map();
  const headers = lines[0].split("\t").map(h => h.trim());
  const nodeInfoMap = new Map();
  lines.slice(1).forEach(line => {
    const values = line.split("\t");
    const info = {};
    headers.forEach((header, index) => {
      info[header] = values[index] ? values[index].trim() : "";
    });
    if (info.fact_id) nodeInfoMap.set(info.fact_id, info);
  });
  return nodeInfoMap;
};

/**
 * 处理统一格式的 Bundle 数据
 * @param {Object} bundle - 统一格式的 JSON 对象
 * @returns {Promise<Object>} - 返回 App 所需的 state 对象
 */
export const processUnifiedBundle = async (bundle) => {
  try {
    // 1. Parse Network from FTree string
    const parsedFtree = await parseFile(bundle.rendering.ftree);
    if (parsedFtree.errors.length) throw new Error(parsedFtree.errors[0].message);
    
    const ftree = parseFTree(parsedFtree.data);
    if (ftree.errors.length) throw new Error(ftree.errors[0]);
    
    const network = networkFromFTree(ftree);

    // 2. Process Nodes
    // 将 nodes 列表转换为 Map，同时作为 nodeData 和 nodeInfo 使用
    // 这样可以保持兼容性，同时利用了合并后的数据
    const nodeMap = new Map();
    if (Array.isArray(bundle.nodes)) {
      bundle.nodes.forEach(node => {
        if (node.fact_id) {
          nodeMap.set(node.fact_id, node);
        }
      });
    }

    return {
      network,
      edgeData: bundle.edges || [],
      nodeData: nodeMap,
      nodeInfo: nodeMap, // 使用同一个 Map，因为数据已经合并
      caseRecord: bundle.raw_record || null,
      materialPriority: bundle.materials || [],
      annotations: bundle.annotations || null
    };
  } catch (err) {
    console.error("Error processing unified bundle:", err);
    throw err;
  }
};

/**
 * 模拟后端处理：获取原始文件，组装成 Unified Bundle，然后处理返回
 */
export const mockBackendProcessingAndLoad = async (baseUrl = `${process.env.PUBLIC_URL}/credit_case_ai_bundle`) => {
  try {
    // 1. Fetch all raw resources
    const [ftreeRes, edgeRes, nodeRes, infoRes, recordRes, priorityRes, annotRes] = await Promise.all([
      fetch(`${baseUrl}/credit_case_ai_fact_graph.ftree`).then(r => r.text()),
      fetch(`${baseUrl}/credit_case_edges_ai.tsv`).then(r => r.text()),
      fetch(`${baseUrl}/credit_case_nodes_ai.tsv`).then(r => r.text()),
      fetch(`${baseUrl}/credit_case_nodes_ai_info.tsv`).then(r => r.text()),
      fetch(`${baseUrl}/case_record.json`).then(r => r.json()),
      fetch(`${baseUrl}/material_priority.json`).then(r => r.json()),
      fetch(`${baseUrl}/case_annotations.json`).then(r => r.json()),
    ]);

    // 2. Parse raw data to construct the Bundle (Simulating Backend Logic)
    const nodesDataMap = parseNodeData(nodeRes);
    const nodesInfoMap = parseNodeInfo(infoRes);
    
    // Merge nodes
    const nodes = [];
    const allFactIds = new Set([...nodesDataMap.keys(), ...nodesInfoMap.keys()]);
    
    allFactIds.forEach(factId => {
        const data = nodesDataMap.get(factId) || {};
        const info = nodesInfoMap.get(factId) || {};
        nodes.push({ ...data, ...info });
    });

    const edges = parseEdgeData(edgeRes);

    // Construct the bundle object
    const bundle = {
        meta: { version: "1.0", generated_at: new Date().toISOString() },
        materials: priorityRes, // Using priority list as materials list for now
        nodes: nodes,
        edges: edges,
        edge_details: edges,
        rendering: {
            ftree: ftreeRes
        },
        raw_record: recordRes,
        annotations: annotRes
    };

    // 3. Process the bundle for Frontend
    return await processUnifiedBundle(bundle);

  } catch (err) {
    console.error("Error in mock backend processing:", err);
    throw err;
  }
};
