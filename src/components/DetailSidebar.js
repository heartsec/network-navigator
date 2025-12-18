import React, { useContext, useState, useEffect } from "react";
import { Sidebar, Header, Segment, List, Button, Icon, Popup } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";

export default function DetailSidebar(props) {
  const { 
    caseRecord, 
    annotations, 
    selectedMaterial, 
    visible = true, 
    width = 350,
    nodeInfo
  } = props;
  
  const { dispatch } = useContext(Dispatch);
  const [hoveredFactId, setHoveredFactId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // 处理拖拽调整宽度
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // 计算新宽度：窗口宽度 - 鼠标X坐标
      const newWidth = window.innerWidth - e.clientX;
      // 限制宽度范围
      const constrainedWidth = Math.max(250, Math.min(1200, newWidth));
      dispatch({ type: "sidebarWidth", value: constrainedWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dispatch]);

  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // 渲染带标注的内容
  const renderAnnotatedContent = () => {
    if (!caseRecord || !caseRecord.content) return null;
    if (!annotations || !annotations.annotations || annotations.annotations.length === 0) {
      // 如果没有标注数据，直接显示原始内容
      return (
        <div style={{
          fontSize: "0.85em",
          lineHeight: "1.7",
          color: "#333",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {caseRecord.content}
        </div>
      );
    }

    const content = caseRecord.content;
    const annotationList = annotations.annotations;
    
    // 按 startPos 排序
    const sortedAnnotations = [...annotationList].sort((a, b) => a.startPos - b.startPos);
    
    const elements = [];
    let lastIndex = 0;
    
    sortedAnnotations.forEach((annotation, idx) => {
      // 添加标注前的普通文本
      if (annotation.startPos > lastIndex) {
        elements.push(
          <span 
            key={`text-${idx}`}
            style={{
              opacity: hoveredFactId ? 0.3 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {content.substring(lastIndex, annotation.startPos)}
          </span>
        );
      }
      
      // 确定样式 - 只改变字体颜色
      const isHovered = hoveredFactId === annotation.factId;
      const isRelatedHovered = hoveredFactId && annotation.relatedFactIds.includes(hoveredFactId);
      const shouldFade = hoveredFactId && !isHovered && !isRelatedHovered;
      
      let textColor, fontWeight, textDecoration, opacity;
      
      if (isHovered) {
        // 当前悬停的标注 - 高亮加粗
        textColor = '#e65100';
        fontWeight = 'bold';
        textDecoration = 'underline';
        opacity = 1;
      } else if (isRelatedHovered) {
        // 关联的标注 - 也高亮
        textColor = '#f57c00';
        fontWeight = 'bold';
        textDecoration = 'underline wavy';
        opacity = 1;
      } else if (shouldFade) {
        // 其他标注 - 淡化显示
        if (annotation.highlightColor === 'red') {
          textColor = '#d32f2f';
          fontWeight = '600';
        } else if (annotation.highlightColor === 'orange') {
          textColor = '#f57c00';
          fontWeight = '600';
        } else {
          textColor = '#1976d2';
          fontWeight = 'normal';
        }
        textDecoration = 'none';
        opacity = 0.3;
      } else {
        // 普通状态
        if (annotation.highlightColor === 'red') {
          textColor = '#d32f2f';
          fontWeight = '600';
        } else if (annotation.highlightColor === 'orange') {
          textColor = '#f57c00';
          fontWeight = '600';
        } else {
          textColor = '#1976d2';
          fontWeight = 'normal';
        }
        textDecoration = 'none';
        opacity = 1;
      }
      
      // 创建标注的文本元素
      const annotatedText = (
        <span
          key={`annotation-${idx}`}
          style={{
            color: textColor,
            fontWeight: fontWeight,
            textDecoration: textDecoration,
            opacity: opacity,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline'
          }}
          onMouseEnter={() => {
            setHoveredFactId(annotation.factId);
            // 如果有关系，高亮图谱中的节点
            if (annotation.hasRelation) {
              const factsToHighlight = [annotation.factId, ...annotation.relatedFactIds];
              dispatch({ type: "highlightFacts", value: factsToHighlight });
            }
          }}
          onMouseLeave={() => {
            setHoveredFactId(null);
            // 取消高亮
            dispatch({ type: "highlightFacts", value: null });
          }}
          onClick={() => {
            // 点击时也触发高亮
            if (annotation.hasRelation) {
              const factsToHighlight = [annotation.factId, ...annotation.relatedFactIds];
              dispatch({ type: "highlightFacts", value: factsToHighlight });
            }
          }}
        >
          {content.substring(annotation.startPos, annotation.endPos)}
          {annotation.hasRelation && (
            <Icon 
              name="linkify" 
              size="tiny" 
              style={{ 
                marginLeft: '2px',
                color: isHovered ? '#e65100' : textColor
              }} 
            />
          )}
        </span>
      );
      
      // 如果有关系信息，用 Popup 包装
      if (annotation.hasRelation && annotation.relatedEdges && annotation.relatedEdges.length > 0) {
        elements.push(
          <Popup
            key={`popup-${idx}`}
            trigger={annotatedText}
            position="left center"
            size="small"
            hoverable
            offset={[0, 10]}
            style={{ 
              maxWidth: '450px',
              zIndex: 10000
            }}
            on="hover"
          >
            <Popup.Header>
              <Icon name="warning sign" color="orange" />
              {annotation.factName} ({annotation.factId})
            </Popup.Header>
            <Popup.Content>
              <div style={{ fontSize: '0.9em' }}>
                <strong>勾稽关系：</strong>
                {annotation.relatedEdges.map((edge, i) => (
                  <div key={i} style={{ 
                    marginTop: '8px', 
                    paddingLeft: '8px',
                    borderLeft: '3px solid #ff9800'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#ff6f00' }}>
                      ↔ {edge.relatedFactId}: {edge.relationType}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                      {edge.reasonBrief}
                    </div>
                  </div>
                ))}
              </div>
            </Popup.Content>
          </Popup>
        );
      } else {
        elements.push(annotatedText);
      }
      
      lastIndex = annotation.endPos;
    });
    
    // 添加最后的普通文本
    if (lastIndex < content.length) {
      elements.push(
        <span 
          key="text-last"
          style={{
            opacity: hoveredFactId ? 0.3 : 1,
            transition: 'opacity 0.2s ease'
          }}
        >
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return (
      <div style={{
        fontSize: "0.85em",
        lineHeight: "2",
        color: "#333",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }}>
        {elements}
      </div>
    );
  };

  const renderMaterialDetails = () => {
    if (!selectedMaterial) return null;

    return (
      <div style={{ padding: '1em' }}>
        <Button 
          icon="arrow left" 
          content="返回贷审会记录" 
          onClick={() => dispatch({ type: "selectMaterial", value: null })}
          basic
          size="small"
          style={{ marginBottom: '1em' }}
        />
        <Header as="h3">
          {selectedMaterial.name}
          <Header.Subheader>
            优先级: {selectedMaterial.priority} | 引用次数: {selectedMaterial.usageCount}
          </Header.Subheader>
        </Header>
        
        <Header as="h4">关联事实 ({selectedMaterial.factIds.length})</Header>
        <List divided relaxed selection>
          {selectedMaterial.factIds.map(factId => {
            const info = nodeInfo ? nodeInfo.get(factId) : null;
            return (
              <List.Item 
                key={factId}
                onMouseEnter={() => dispatch({ type: "highlightFacts", value: [factId] })}
                onMouseLeave={() => dispatch({ type: "highlightFacts", value: selectedMaterial.factIds })}
              >
                <List.Content>
                  <List.Header>{factId}</List.Header>
                  <List.Description>
                    {info ? info.label : "未知事实"}
                  </List.Description>
                </List.Content>
              </List.Item>
            );
          })}
        </List>
      </div>
    );
  };

  return (
    <Sidebar
      as={Segment}
      animation="overlay"
      direction="right"
      visible={visible}
      style={{ 
        width: width, 
        padding: 0, 
        backgroundColor: 'white', 
        borderLeft: '1px solid #ccc',
        overflowY: 'auto',
        zIndex: 1000,
        margin: 0,
        height: '100%'
      }}
    >
      {/* 调整宽度手柄 */}
      <div
        onMouseDown={startResize}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "6px",
          cursor: "ew-resize",
          zIndex: 1001,
          backgroundColor: isResizing ? "rgba(33, 133, 208, 0.5)" : "transparent",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(33, 133, 208, 0.3)"}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = "transparent")}
      />

      {selectedMaterial ? renderMaterialDetails() : (
        <div style={{ padding: '1em' }}>
          <Header as="h3" dividing>贷审会记录</Header>
          {renderAnnotatedContent()}
        </div>
      )}
    </Sidebar>
  );
}