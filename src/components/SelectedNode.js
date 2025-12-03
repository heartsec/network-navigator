import PropTypes from "prop-types";
import React, { useContext, useLayoutEffect, useState } from "react";
import { Input, Popup, Table } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";


const count = (items) => {
  const visibleCount = items.filter(item => item.shouldRender).length;
  if (visibleCount === items.length) {
    return items.length;
  }
  return <span>{items.length} <span style={{ color: "#999" }}>({visibleCount})</span></span>;
};

const countLeafNodes = (node) => {
  const total = node.totalChildren;
  const visibleModules = node.nodes
    .filter(node => node.shouldRender);
  if (visibleModules.length === node.nodes.length) {
    return total;
  }
  const visibleCount = visibleModules.reduce((total, node) => total + node.totalChildren, 0);
  return <span>{total} <span style={{ color: "#999" }}>({visibleCount})</span></span>;
};

export default function SelectedNode(props) {
  const { node, directed, nodeData } = props;
  const [name, setName] = useState(node.name);
  const { dispatch } = useContext(Dispatch);
  
  // 获取节点详细信息
  const getNodeDetails = () => {
    if (!nodeData || !node.name) return null;
    
    // 遍历 nodeData 找到匹配 fact_name 的记录
    for (const [factId, data] of nodeData.entries()) {
      if (data.fact_name === node.name) {
        return data;
      }
    }
    
    // 如果没找到，可能 name 就是 fact_id，直接查找
    return nodeData.get(node.name);
  };
  
  const nodeDetails = getNodeDetails();

  const handleChange = (e, { value }) => {
    node.name = value;
    setName(value);
    dispatch({ type: "selectedNodeNameChange" });
  };

  useLayoutEffect(() => {
    setName(node.name);
  }, [node]);

  const isRoot = node.path.toString() === "root";

  return (
    <Table celled striped compact size="small">
      <Table.Body>
        <Table.Row>
          <Popup
            trigger={<Table.Cell width={5} content='名称'/>}
            size='tiny'
            content='事实名称或其包含的主要事实描述'
          />
          <Table.Cell style={{ 
            padding: "8px",
            wordBreak: "break-word",
            whiteSpace: "normal"
          }}>
            <div style={{
              width: "100%",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap"
            }}>
              {name}
            </div>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='树路径'/>}
            size='tiny'
            content='从根节点到最细级别模块的冒号分隔路径'
          />
          <Table.Cell content={node.path.toString()}/>
        </Table.Row>
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='风险权重'/>}
            size='tiny'
            content='该事实节点的风险重要度'
          />
          <Table.Cell content={(+node.flow).toPrecision(4)}/>
        </Table.Row>
        {node.enterFlow != null &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='风险流入'/>}
            size='tiny'
            content='流入该事实的风险关联度'
          />
          <Table.Cell content={(+node.enterFlow).toPrecision(4)}/>
        </Table.Row>
        }
        {node.exitFlow != null &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='风险流出'/>}
            size='tiny'
            content='从该事实流出的风险关联度'
          />
          <Table.Cell content={(+node.exitFlow).toPrecision(4)}/>
        </Table.Row>
        }
        {isRoot && directed &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='被引用数'/>}
            size='tiny'
            content='其他事实引用该事实的勾稽关系数量'
          />
          <Table.Cell content={node.kin}/>
        </Table.Row>
        }
        {isRoot && directed &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='引用数'/>}
            size='tiny'
            content='该事实引用其他事实的勾稽关系数量'
          />
          <Table.Cell content={node.kout}/>
        </Table.Row>
        }
        {isRoot && !directed &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='关联数'/>}
            size='tiny'
            content='与该事实相关的勾稽关系总数'
          />
          <Table.Cell content={node.kin + node.kout}/>
        </Table.Row>
        }
        {node.nodes &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='包含事实数'/>}
            size='tiny'
            content='此类别中包含的事实节点数量'
          />
          <Popup
            trigger={<Table.Cell content={count(node.nodes)}/>}
            size='tiny'
            content='总数 (可见)'
          />
        </Table.Row>
        }
        {node.links &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='勾稽关系数'/>}
            size='tiny'
            content='此类别中的勾稽关系数量'
          />
          <Popup
            trigger={<Table.Cell content={count(node.links)}/>}
            size='tiny'
            content='总数 (可见)'
          />
        </Table.Row>
        }
        {node.totalChildren != null &&
        <Table.Row>
          <Popup
            trigger={<Table.Cell content='细节事实数'/>}
            size='tiny'
            content='此类别及其子类别中包含的细节事实数量'
          />
          <Popup
            trigger={<Table.Cell content={countLeafNodes(node)}/>}
            size="tiny"
            content="总数 (可见)"
          />
        </Table.Row>
        }
        {nodeDetails && nodeDetails.fact_detail &&
        <Table.Row>
          <Table.Cell colSpan="2" style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '12px',
            borderTop: '2px solid #ddd'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#2185d0' }}>详细描述</strong>
            </div>
            <div style={{ 
              fontSize: '0.95em', 
              lineHeight: '1.6',
              color: '#333',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {nodeDetails.fact_detail}
            </div>
          </Table.Cell>
        </Table.Row>
        }
      </Table.Body>
    </Table>
  );
}

SelectedNode.propTypes = {
  node: PropTypes.shape({
    name: PropTypes.string,
    path: PropTypes.object,
    kin: PropTypes.number,
    kout: PropTypes.number,
    flow: PropTypes.number,
    exitFlow: PropTypes.number,
    nodes: PropTypes.array,
    links: PropTypes.array,
    totalChildren: PropTypes.number
  }).isRequired,
  directed: PropTypes.bool
};
