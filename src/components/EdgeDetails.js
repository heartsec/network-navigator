import PropTypes from "prop-types";
import React from "react";
import { Accordion, Header, Icon, Label, Table, Popup } from "semantic-ui-react";

/**
 * Component to display edge relationship details
 * Shows rich metadata about edges connected to the selected node
 */
export default class EdgeDetails extends React.Component {
  state = {
    activeIndex: -1
  };

  static propTypes = {
    node: PropTypes.object.isRequired,
    edgeData: PropTypes.array,
    nodeData: PropTypes.object,
  };

  handleAccordionClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    this.setState({ activeIndex: newIndex });
  };

  getRiskPolarityColor = (polarity) => {
    switch (polarity) {
      case 'negative': return 'red';
      case 'positive': return 'green';
      case 'neutral': return 'grey';
      default: return 'grey';
    }
  };

  getDirectionIcon = (direction, isOutgoing) => {
    if (direction === 'undirected') {
      return 'arrows alternate horizontal';
    }
    return isOutgoing ? 'arrow right' : 'arrow left';
  };

  renderEdgeCard = (edge, index) => {
    const { activeIndex } = this.state;
    const isActive = activeIndex === index;

    return (
      <React.Fragment key={edge.edge_id || index}>
        <Accordion.Title
          active={isActive}
          index={index}
          onClick={this.handleAccordionClick}
        >
          <Icon name='dropdown' />
          <Icon name={this.getDirectionIcon(edge.direction, edge.isOutgoing)} />
          <strong>{edge.relation_type || 'Unknown'}</strong>
          <Label
            size="mini"
            color={this.getRiskPolarityColor(edge.risk_polarity)}
            style={{ marginLeft: '8px' }}
          >
            {edge.risk_polarity || 'neutral'}
          </Label>
          {edge.llm_confidence && (
            <Label size="mini" style={{ marginLeft: '4px' }}>
              {(parseFloat(edge.llm_confidence) * 100).toFixed(0)}%
            </Label>
          )}
        </Accordion.Title>
        <Accordion.Content active={isActive}>
          <Table basic='very' compact size='small'>
            <Table.Body>
              {edge.reason_brief && (
                <Table.Row>
                  <Table.Cell width={4}>
                    <strong>理由</strong>
                  </Table.Cell>
                  <Table.Cell>
                    <em>{edge.reason_brief}</em>
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row>
                <Table.Cell>
                  <strong>方向</strong>
                </Table.Cell>
                <Table.Cell>
                  {edge.direction === 'directed' ? '有向' : '无向'}
                  {edge.direction === 'directed' && (
                    <span style={{ marginLeft: '8px', color: '#999' }}>
                      ({edge.isOutgoing ? '出边' : '入边'})
                    </span>
                  )}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>连接节点</strong>
                </Table.Cell>
                <Table.Cell>
                  {edge.isOutgoing ? edge.to_fact_id : edge.from_fact_id}
                </Table.Cell>
              </Table.Row>
              {edge.from_entity_id && edge.to_entity_id && (
                <Table.Row>
                  <Table.Cell>
                    <strong>实体</strong>
                  </Table.Cell>
                  <Table.Cell>
                    {edge.from_entity_id} → {edge.to_entity_id}
                  </Table.Cell>
                </Table.Row>
              )}
              {edge.weight && (
                <Table.Row>
                  <Table.Cell>
                    <strong>权重</strong>
                  </Table.Cell>
                  <Table.Cell>{parseFloat(edge.weight).toFixed(2)}</Table.Cell>
                </Table.Row>
              )}
              {edge.risk_tags && (
                <Table.Row>
                  <Table.Cell>
                    <strong>风险标签</strong>
                  </Table.Cell>
                  <Table.Cell>
                    {edge.risk_tags.split(',').map((tag, i) => (
                      <Label key={i} size='mini' style={{ marginRight: '4px' }}>
                        {tag.trim()}
                      </Label>
                    ))}
                  </Table.Cell>
                </Table.Row>
              )}
              {edge.source_doc_ids && (
                <Table.Row>
                  <Table.Cell>
                    <strong>来源文档</strong>
                  </Table.Cell>
                  <Table.Cell>
                    {edge.source_doc_ids.split(',').map((doc, i) => (
                      <Label key={i} size='mini' basic style={{ marginRight: '4px' }}>
                        {doc.trim()}
                      </Label>
                    ))}
                  </Table.Cell>
                </Table.Row>
              )}
              {edge.created_by_model && (
                <Table.Row>
                  <Table.Cell>
                    <strong>创建模型</strong>
                  </Table.Cell>
                  <Table.Cell>
                    <code style={{ fontSize: '0.9em' }}>{edge.created_by_model}</code>
                  </Table.Cell>
                </Table.Row>
              )}
              {edge.human_label && edge.human_label !== 'unknown' && (
                <Table.Row>
                  <Table.Cell>
                    <strong>人工标注</strong>
                  </Table.Cell>
                  <Table.Cell>
                    <Label 
                      color={edge.human_label === 'confirmed' ? 'green' : 'red'}
                      size='mini'
                    >
                      {edge.human_label === 'confirmed' ? '已确认' : '已拒绝'}
                    </Label>
                    {edge.human_confidence && (
                      <span style={{ marginLeft: '8px' }}>
                        置信度: {(parseFloat(edge.human_confidence) * 100).toFixed(0)}%
                      </span>
                    )}
                    {edge.reviewer && (
                      <span style={{ marginLeft: '8px', color: '#999' }}>
                        by {edge.reviewer}
                      </span>
                    )}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Accordion.Content>
      </React.Fragment>
    );
  };

  // Get edges connected to this node from edgeData array
  getNodeEdges = (nodeId) => {
    const { edgeData = [], nodeData } = this.props;
    
    if (!edgeData || edgeData.length === 0) {
      return [];
    }

    const edges = [];
    
    // 如果有 nodeData，通过 fact_name 反查 fact_id
    let factId = nodeId;
    if (nodeData) {
      // 遍历 nodeData 找到匹配的 fact_id
      for (const [id, data] of nodeData.entries()) {
        if (data.fact_name === nodeId) {
          factId = id;
          break;
        }
      }
    }
    
    edgeData.forEach(edge => {
      const fromFactId = edge.from_fact_id || "";
      const toFactId = edge.to_fact_id || "";
      
      // Check if this edge connects to the current node
      if (fromFactId === factId) {
        edges.push({
          ...edge,
          isOutgoing: true
        });
      } else if (toFactId === factId) {
        edges.push({
          ...edge,
          isOutgoing: false
        });
      }
    });
    
    return edges;
  };

  render() {
    const { node, edgeData, nodeData } = this.props;

    if (!edgeData || edgeData.length === 0) {
      return null;
    }

    // Get node's fact_name or fact_id from name or physicalId
    const nodeId = node.name || node.physicalId;
    if (!nodeId) return null;

    const edges = this.getNodeEdges(nodeId);

    if (edges.length === 0) {
      return null;
    }

    // Group edges by type
    const outgoingEdges = edges.filter(e => e.isOutgoing && e.direction !== 'undirected');
    const incomingEdges = edges.filter(e => !e.isOutgoing && e.direction !== 'undirected');
    const undirectedEdges = edges.filter(e => e.direction === 'undirected');

    return (
      <div style={{ marginTop: '20px' }}>
        <Header as="h4">
          <Icon name="sitemap" />
          <Header.Content>
            边关系详情
            <Popup
              trigger={<Icon name="info circle" size="small" style={{ marginLeft: '8px' }} />}
              content="显示该节点相关的所有边关系及其元数据信息"
              size="tiny"
            />
          </Header.Content>
        </Header>

        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          background: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <div style={{ marginBottom: '10px', color: '#666', fontSize: '0.9em' }}>
            总计 {edges.length} 条边关系
            {outgoingEdges.length > 0 && ` | ${outgoingEdges.length} 出边`}
            {incomingEdges.length > 0 && ` | ${incomingEdges.length} 入边`}
            {undirectedEdges.length > 0 && ` | ${undirectedEdges.length} 无向边`}
          </div>

          <Accordion styled fluid>
            {edges.map((edge, index) => this.renderEdgeCard(edge, index))}
          </Accordion>
        </div>
      </div>
    );
  }
}
