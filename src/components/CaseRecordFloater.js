import React, { useState, useEffect, useContext } from "react";
import { Card, Icon, Popup } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";

export default function CaseRecordFloater(props) {
  const { caseRecord, annotations } = props;
  const { dispatch } = useContext(Dispatch);
  const [collapsed, setCollapsed] = useState(true);
  
  // 添加宽度和高度状态
  const [floaterWidth, setFloaterWidth] = useState({ collapsed: 280, expanded: 450 });
  const [maxHeight, setMaxHeight] = useState(60); // 百分比
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null); // 'width' or 'height'
  
  // 悬停状态
  const [hoveredFactId, setHoveredFactId] = useState(null);

  // 处理拖拽调整大小 - 必须在所有 Hooks 调用之后，在条件返回之前
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (resizeType === 'width') {
        // 调整宽度：从左边界到鼠标位置
        const newWidth = e.clientX - 20; // 减去左边距
        const constrainedWidth = Math.max(250, Math.min(1600, newWidth)); // 增加到1600px
        if (collapsed) {
          setFloaterWidth({ ...floaterWidth, collapsed: constrainedWidth });
        } else {
          setFloaterWidth({ ...floaterWidth, expanded: constrainedWidth });
        }
      } else if (resizeType === 'height') {
        // 调整高度：从顶部到鼠标位置
        const newHeight = ((e.clientY - 20) / window.innerHeight) * 100; // 转换为百分比
        setMaxHeight(Math.max(30, Math.min(80, newHeight)));
      } else if (resizeType === 'both') {
        // 同时调整宽度和高度
        const newWidth = e.clientX - 20;
        const constrainedWidth = Math.max(250, Math.min(1600, newWidth)); // 增加到1600px
        if (collapsed) {
          setFloaterWidth({ ...floaterWidth, collapsed: constrainedWidth });
        } else {
          setFloaterWidth({ ...floaterWidth, expanded: constrainedWidth });
        }
        
        const newHeight = ((e.clientY - 20) / window.innerHeight) * 100;
        setMaxHeight(Math.max(30, Math.min(80, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeType(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeType, collapsed, floaterWidth]);

  // 开始调整宽度
  const startResizeWidth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType('width');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // 开始调整高度
  const startResizeHeight = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType('height');
    document.body.style.cursor = 'ns-resize';
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
        textColor = annotation.hasRelation ? '#e65100' : '#1565c0';
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
            position="right center"
            size="small"
            hoverable
            offset={[20, 0]}
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

  // 如果没有数据，在所有 Hooks 调用之后返回
  if (!caseRecord) return null;

  const {
    title = "贷审会记录",
    meetingNumber = "桃源支行 20251118-02号",
    creditAmount = "250万元",
    content = ""
  } = caseRecord;

  const currentWidth = collapsed ? floaterWidth.collapsed : floaterWidth.expanded;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 999,
        width: `${currentWidth}px`,
        maxWidth: "none", // 移除宽度限制
        transition: collapsed === !collapsed ? "all 0.3s ease" : "none", // 只在折叠/展开时过渡
        boxSizing: "border-box"
      }}
    >
      <Card
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          margin: 0,
          position: "relative",
          width: "100%", // 确保 Card 占满父容器宽度
          maxWidth: "none", // 移除 Semantic UI 的默认最大宽度
          boxSizing: "border-box"
        }}
      >
        {/* 右侧调整宽度手柄 */}
        <div
          onMouseDown={startResizeWidth}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "6px",
            cursor: "ew-resize",
            backgroundColor: "transparent",
            zIndex: 1001,
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(33, 133, 208, 0.3)'}
          onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
        />
        
        {/* 底部调整高度手柄（仅在展开时显示） */}
        {!collapsed && (
          <div
            onMouseDown={startResizeHeight}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "6px",
              cursor: "ns-resize",
              backgroundColor: "transparent",
              zIndex: 1001,
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(33, 133, 208, 0.3)'}
            onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
          />
        )}
        
        {/* 右下角调整宽高手柄（仅在展开时显示） */}
        {!collapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
              setResizeType('both');
              document.body.style.cursor = 'nwse-resize';
              document.body.style.userSelect = 'none';
            }}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "12px",
              height: "12px",
              cursor: "nwse-resize",
              backgroundColor: "transparent",
              zIndex: 1002,
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(33, 133, 208, 0.5)'}
            onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
          />
        )}
        
        <Card.Content
          style={{
            padding: "10px 14px",
            backgroundColor: "#f8f9fa",
            cursor: "pointer",
            borderBottom: collapsed ? "none" : "2px solid #e0e0e0",
            width: "100%",
            boxSizing: "border-box"
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            marginBottom: "3px"
          }}>
            <Icon name="file alternate" color="blue" size="small" />
            <strong style={{ fontSize: "0.95em", color: "#2185d0" }}>
              {title}
            </strong>
            {collapsed && (
              <span style={{
                marginLeft: "4px",
                padding: "2px 6px",
                backgroundColor: "#21ba45",
                color: "white",
                borderRadius: "3px",
                fontSize: "0.75em",
                fontWeight: "bold",
                whiteSpace: "nowrap"
              }}>
                {creditAmount}
              </span>
            )}
            <Icon
              name={collapsed ? "angle down" : "angle up"}
              style={{ marginLeft: "auto", cursor: "pointer", color: "#666" }}
              size="small"
            />
          </div>
          <div style={{ 
            fontSize: "0.7em", 
            color: "#666",
            marginTop: "2px"
          }}>
            会议编号：{meetingNumber}
          </div>
        </Card.Content>

        {!collapsed && (
          <Card.Content
            style={{
              padding: "14px",
              maxHeight: `${maxHeight}vh`,
              overflowY: "auto",
              backgroundColor: "white",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            {renderAnnotatedContent()}
            <div style={{
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ fontSize: '0.75em', color: '#666' }}>
                {annotations && annotations.statistics && (
                  <>
                    <Icon name="flag" color="red" size="small" />
                    {annotations.statistics.factsWithRelations} 项勾稽关系
                    <span style={{ marginLeft: '8px' }}>
                      <Icon name="info circle" color="blue" size="small" />
                      {annotations.statistics.factsWithoutRelations} 项普通信息
                    </span>
                  </>
                )}
              </div>
              <span style={{
                padding: "5px 12px",
                backgroundColor: "#21ba45",
                color: "white",
                borderRadius: "4px",
                fontSize: "0.85em",
                fontWeight: "bold"
              }}>
                授信金额：{creditAmount}
              </span>
            </div>
          </Card.Content>
        )}
      </Card>
    </div>
  );
}
