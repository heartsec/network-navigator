/**
 * Parse edges_full.tsv file and build edge metadata mapping
 * This creates a lookup table for edge relationships with rich information
 */

export default function parseEdgesFile(tsvContent) {
  const lines = tsvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      edgeMap: new Map(),
      errors: ['Empty or invalid edges file']
    };
  }

  const headers = lines[0].split('\t');
  const edgeMap = new Map(); // Key: "from_id|to_id" -> edge metadata
  const errors = [];

  // Parse each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t');
    const edge = {};

    // Map values to headers
    headers.forEach((header, index) => {
      edge[header] = values[index] || '';
    });

    // Create lookup keys
    // Support both directed and undirected edges
    const fromId = edge.from_fact_id;
    const toId = edge.to_fact_id;
    
    if (!fromId || !toId) {
      errors.push(`Line ${i + 1}: Missing from_fact_id or to_fact_id`);
      continue;
    }

    const directedKey = `${fromId}|${toId}`;
    edgeMap.set(directedKey, edge);

    // If undirected, also add reverse key
    if (edge.direction === 'undirected') {
      const reverseKey = `${toId}|${fromId}`;
      edgeMap.set(reverseKey, edge);
    }
  }

  return {
    edgeMap,
    errors
  };
}

/**
 * Get edge metadata for a specific link
 * @param {Map} edgeMap - The edge metadata map
 * @param {string} sourceId - Source node fact_id
 * @param {string} targetId - Target node fact_id
 * @returns {Object|null} Edge metadata or null if not found
 */
export function getEdgeMetadata(edgeMap, sourceId, targetId) {
  if (!edgeMap || !sourceId || !targetId) return null;
  
  const key = `${sourceId}|${targetId}`;
  return edgeMap.get(key) || null;
}

/**
 * Get all edges connected to a node
 * @param {Map} edgeMap - The edge metadata map
 * @param {string} nodeId - Node fact_id
 * @returns {Array} Array of edge metadata objects
 */
export function getNodeEdges(edgeMap, nodeId) {
  if (!edgeMap || !nodeId) return [];
  
  const edges = [];
  
  for (const [key, edge] of edgeMap.entries()) {
    const [fromId, toId] = key.split('|');
    
    // Only include each edge once (not both directions for undirected)
    if (fromId === nodeId) {
      edges.push({
        ...edge,
        isOutgoing: true,
        connectedNodeId: toId
      });
    } else if (toId === nodeId && edge.direction === 'directed') {
      // For directed edges, also include incoming
      edges.push({
        ...edge,
        isOutgoing: false,
        connectedNodeId: fromId
      });
    }
  }
  
  // Remove duplicates for undirected edges
  const seen = new Set();
  return edges.filter(edge => {
    const edgeId = edge.edge_id;
    if (seen.has(edgeId)) return false;
    seen.add(edgeId);
    return true;
  });
}
