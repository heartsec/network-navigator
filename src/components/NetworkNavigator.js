import * as d3 from "d3";
import PropTypes from "prop-types";
import React from "react";
import { connectedLinks, takeLargest as largestNodes } from "../lib/filter";
import { halfLink, undirectedLink } from "../lib/link-renderer";
import NetworkLayout from "../lib/network-layout";
import Point from "../lib/point";
import makeRenderStyle from "../lib/render-style";
import Dispatch from "../context/Dispatch";

function takeLargest(network, amount) {
  let { nodes, links } = network;

  nodes.forEach((node) => (node.shouldRender = false));
  links.forEach((link) => (link.shouldRender = false));

  nodes = largestNodes(nodes, amount);
  links = links.filter((link) => link.flow > 0);
  links = connectedLinks({ nodes, links });

  nodes.forEach((node) => (node.shouldRender = true));
  links.forEach((link) => (link.shouldRender = true));
}

export default class NetworkNavigator extends React.Component {
  static propTypes = {
    network: PropTypes.any.isRequired,
    nodeSize: PropTypes.string,
    nodeScale: PropTypes.string,
    linkScale: PropTypes.string,
    labelsVisible: PropTypes.bool,
    simulationEnabled: PropTypes.bool,
    lodEnabled: PropTypes.bool,
  };

  static contextType = Dispatch;

  constructor(props) {
    super(props);
    const { network } = props;
    this.layouts = new Map();

    this.renderStyle = makeRenderStyle(
      network.maxNodeFlow,
      network.maxNodeExitFlow,
      network.maxLinkFlow,
    );

    if (network.directed) {
      this.linkRenderer = halfLink()
        .nodeRadius((node) => this.renderStyle.nodeRadius(node))
        .width((link) => this.renderStyle.linkWidth(link))
        .oppositeLink((link) => link.oppositeLink)
        .bend((link, distance) => this.renderStyle.linkBend(distance));
    } else {
      this.linkRenderer = undirectedLink()
        .nodeRadius((node) => this.renderStyle.nodeRadius(node))
        .width((link) => this.renderStyle.linkWidth(link))
        .bend((link, distance) => this.renderStyle.linkBend(distance));
    }
  }

  componentDidUpdate(prevProps) {
    const {
      network,
      occurrences,
      nodeSize,
      nodeScale,
      linkScale,
      labelsVisible,
      simulationEnabled,
      lodEnabled,
      nodeLimit,
      highlightedFacts,
    } = this.props;

    // Handle fact highlighting from materials drawer
    // 检查数组内容是否变化（不仅仅是引用）
    const factsChanged = highlightedFacts !== prevProps.highlightedFacts || 
      (highlightedFacts && prevProps.highlightedFacts && 
       JSON.stringify(highlightedFacts) !== JSON.stringify(prevProps.highlightedFacts));
    
    if (factsChanged) {
      console.log("=== NetworkNavigator.componentDidUpdate: 检测到 highlightedFacts 变化 ===");
      console.log("prevProps.highlightedFacts:", prevProps.highlightedFacts);
      console.log("this.props.highlightedFacts:", highlightedFacts);
      console.log("调用 highlightFactNodes()");
      this.highlightFactNodes(highlightedFacts);
    }

    if (nodeSize !== prevProps.nodeSize || nodeScale !== prevProps.nodeScale) {
      const scale = nodeScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;

      if (nodeSize === "flow") {
        const nodeRadius = scale()
          .domain([0, network.maxNodeFlow])
          .range([10, 70]);
        const nodeFillColor = scale()
          .domain([0, network.maxNodeFlow])
          .range(this.renderStyle.nodeFill);
        this.renderStyle.nodeRadius = (node) => nodeRadius(node.flow);
        this.renderStyle.nodeFillColor = (node) => nodeFillColor(node.flow);
      } else if (nodeSize === "nodes") {
        const nodeRadius = scale()
          .domain([0, network.totalChildren])
          .range([10, 70]);
        const nodeFillColor = scale()
          .domain([0, network.totalChildren])
          .range(this.renderStyle.nodeFill);
        this.renderStyle.nodeRadius = (node) =>
          node.totalChildren ? nodeRadius(node.totalChildren) : nodeRadius(1);
        this.renderStyle.nodeFillColor = (node) =>
          node.totalChildren
            ? nodeFillColor(node.totalChildren)
            : nodeFillColor(1);
      }
    }

    if (linkScale !== prevProps.linkScale) {
      const scale = linkScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;
      const linkWidth = scale()
        .domain([0, network.maxLinkFlow])
        .range([2, 15]);
      const linkFillColor = scale()
        .domain([0, network.maxLinkFlow])
        .range(this.renderStyle.linkFill);
      this.renderStyle.linkWidth = (link) => linkWidth(link.flow);
      this.renderStyle.linkFillColor = (link) => linkFillColor(link.flow);
    }

    if (occurrences) {
      network.clearOccurrences();
      occurrences.forEach((o) => network.markOccurrences(o));
    }

    this.layouts.forEach((layout) => {
      layout.renderStyle = this.renderStyle;
      layout.labelsVisible = labelsVisible;
      layout.simulationEnabled = simulationEnabled;
      layout.lodEnabled = lodEnabled;
      layout.nodeLimit = nodeLimit;
      layout.updateAttributes();
    });
  }

  renderPath(currentPath) {
    const { network, nodeLimit } = this.props;
    const { dispatch } = this.context;

    const treeNode = network.getNodeByPath(currentPath);

    takeLargest(treeNode, nodeLimit);

    const layout = this.layouts.get(currentPath);

    layout.on("click", (node) => {
      console.log(node);
      dispatch({ type: "selectedNode", value: node });
      // 选中节点时自动打开侧边栏
      dispatch({ type: "sidebarVisible", value: true });
      this.layouts.forEach((l) => l.clearSelectedNodes());
    });

    layout.on("render", ({ path, layout }) => {
      this.layouts.set(path, layout);
      this.renderPath(path);
    });

    layout.on("destroy", (path) => {
      const layoutToDelete = this.layouts.get(path);
      if (layoutToDelete) {
        layoutToDelete.destroy();
        this.layouts.delete(path);
      }
    });

    layout.init(treeNode);
  }

  componentDidMount() {
    const { network, nodeLimit } = this.props;
    const { dispatch } = this.context;
    const { innerWidth, innerHeight } = window;

    dispatch({
      type: "searchCallback",
      value: (name) => {
        const hits = network.search(name);
        this.layouts.forEach((l) => l.updateAttributes());
        return hits;
      },
    });

    const zoom = d3.zoom().scaleExtent([0.1, 100000]);

    const svg = d3.select(this.svgNode).call(zoom);

    const networkEl = svg.select("#network");

    zoom.on("zoom", () => {
      this.layouts.forEach((layout) =>
        layout.applyTransform(d3.event.transform).updateAttributes(),
      );
      networkEl.attr("transform", d3.event.transform);
    });

    svg.select(".background").on("click", () => {
      console.log("Background clicked");
      dispatch({ type: "selectedNode", value: null });
      dispatch({ type: "highlightFacts", value: null });
      this.layouts.forEach((l) => l.clearSelectedNodes());
    });

    const rootPath = network.path.toString();

    this.layouts.set(
      rootPath,
      new NetworkLayout({
        linkRenderer: this.linkRenderer,
        renderStyle: this.renderStyle,
        renderTarget: {
          parent: networkEl.append("g").attr("class", "network"),
          labels: svg
            .select("#labelsContainer")
            .append("g")
            .attr("class", "network labels"),
        },
        position: new Point(innerWidth / 2 - 150, innerHeight / 2),
        nodeLimit,
      }),
    );

    this.renderPath(rootPath);
  }

  highlightFactNodes(factIds) {
    console.log("=== NetworkNavigator.highlightFactNodes: 开始高亮处理 ===");
    console.log("传入的 factIds:", factIds);
    
    const svg = d3.select(this.svgNode);
    console.log("SVG 元素:", this.svgNode);
    
    // 尝试多种选择器
    const nodesByClass = svg.selectAll(".node");
    const nodesByG = svg.selectAll("g.nodes g");
    const allGs = svg.selectAll("g");
    
    console.log("使用 .node 选择器找到的节点数量:", nodesByClass.size());
    console.log("使用 g.nodes g 选择器找到的节点数量:", nodesByG.size());
    console.log("所有 g 元素数量:", allGs.size());
    
    // 打印前几个节点的数据
    nodesByG.each(function(d, i) {
      if (i < 3) {
        console.log(`节点 ${i}:`, {
          name: d.name,
          path: d.path ? d.path.toString() : 'undefined',
          id: this.getAttribute('id')
        });
      }
    });

    const nodes = nodesByG; // 使用 g.nodes g 选择器

    if (!factIds || factIds.length === 0) {
      console.log("factIds 为空，清除所有高亮");
      // Clear all highlights
      nodes.select("circle")
        .style("stroke", this.renderStyle.nodeBorderColor)
        .style("stroke-width", this.renderStyle.nodeBorderWidth)
        .style("opacity", 1);
      return;
    }

    console.log("开始遍历节点，应用高亮效果...");
    let highlightedCount = 0;
    let dimmedCount = 0;
    
    const self = this;
    
    // 构建 module path 到 fact_ids 的映射
    const moduleToFactIds = new Map();
    
    if (self.props.nodeData && self.props.network && self.props.network.nodes) {
      console.log("nodeData 总数:", self.props.nodeData.size);
      console.log("network.nodes 总数:", self.props.network.nodes.length);
      
      // 打印第一个模组节点的结构
      if (self.props.network.nodes.length > 0) {
        const firstModule = self.props.network.nodes[0];
        console.log("第一个模组节点的结构:", {
          path: firstModule.path,
          name: firstModule.name,
          nodes: firstModule.nodes,
          hasNodes: !!firstModule.nodes,
          nodeCount: firstModule.nodes ? firstModule.nodes.length : 0,
          allKeys: Object.keys(firstModule)
        });
        
        if (firstModule.nodes && firstModule.nodes.length > 0) {
          console.log("第一个fact节点的结构:", {
            ...firstModule.nodes[0],
            allKeys: Object.keys(firstModule.nodes[0])
          });
        }
      }
      
      // 遍历 network.nodes（模组节点）
      self.props.network.nodes.forEach(moduleNode => {
        const modulePath = moduleNode.path ? moduleNode.path.toString() : null;
        if (!modulePath) return;
        
        const factIds = [];
        
        // moduleNode.nodes 包含该模组下的所有子节点（facts）
        if (moduleNode.nodes && moduleNode.nodes.length > 0) {
          moduleNode.nodes.forEach(factNode => {
            // factNode.physicalId 是 node_id (从 ftree 文件中读取的原始 ID)
            const nodeId = factNode.physicalId;
            
            console.log(`模组 ${modulePath}, fact node_id (physicalId): ${nodeId}`);
            
            // 在 nodeData 中查找对应的 fact_id
            for (const [factId, data] of self.props.nodeData.entries()) {
              if (data.node_id == nodeId) {
                factIds.push(factId);
                console.log(`  ✓ 找到对应的 fact_id: ${factId}`);
                break;
              }
            }
          });
        }
        
        moduleToFactIds.set(modulePath, factIds);
        console.log(`模组 ${modulePath} 最终包含的 fact_ids:`, factIds);
      });
      
      console.log("module path 到 fact_id 映射:", Array.from(moduleToFactIds.entries()));
      console.log("要高亮的 factIds:", factIds);
    }
    
    // Apply highlighting
    nodes.each(function(node) {
      // 'this' 在这里是 DOM 元素，node 是数据对象
      const nodeElement = d3.select(this);
      const circle = nodeElement.select("circle");
      
      // 获取该模组的 path
      const modulePath = node.path ? node.path.toString() : null;
      
      if (!modulePath) {
        console.log("节点没有 path，跳过");
        return;
      }
      
      // 获取该模组包含的所有 fact_ids
      const moduleFactIds = moduleToFactIds.get(modulePath) || [];
      
      if (highlightedCount + dimmedCount < 3) {
        console.log(`模组 ${modulePath}:`, {
          name: node.name,
          containsFactIds: moduleFactIds
        });
      }
      
      // 检查这个模块节点是否包含要高亮的任何 fact
      let shouldHighlight = false;
      let matchedFactIds = [];
      
      for (const factId of factIds) {
        if (moduleFactIds.includes(factId)) {
          shouldHighlight = true;
          matchedFactIds.push(factId);
        }
      }
      
      if (shouldHighlight) {
        // Highlight this node
        console.log(`  ✓ 高亮模组 ${modulePath}！匹配到的facts: ${matchedFactIds.join(', ')}`);
        circle
          .style("stroke", "#FFD700") // Gold color for highlight
          .style("stroke-width", "4px")
          .style("opacity", 1);
        highlightedCount++;
      } else {
        // Dim other nodes
        if (dimmedCount < 3) {
          console.log(`  ○ 淡化模组 ${modulePath}`);
        }
        circle
          .style("stroke", self.renderStyle.nodeBorderColor)
          .style("stroke-width", self.renderStyle.nodeBorderWidth)
          .style("opacity", 0.3);
        dimmedCount++;
      }
    });
    
    console.log(`高亮完成: ${highlightedCount} 个节点被高亮, ${dimmedCount} 个节点被淡化`);
  }

  render() {
    return (
      <svg
        ref={(node) => (this.svgNode = node)}
        style={{ width: "100vw", height: "100vh" }}
        xmlns={d3.namespaces.svg}
        xmlnsXlink={d3.namespaces.xlink}
        id="networkNavigatorSvg"
      >
        <rect className="background" width="100%" height="100%" fill="#fff" />
        <g id="network" />
        <g id="labelsContainer" />
      </svg>
    );
  }
}
