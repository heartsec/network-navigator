import React, { useState, useEffect } from "react";
import { Card, Icon } from "semantic-ui-react";

export default function CaseRecordFloater(props) {
  const { caseRecord } = props;
  const [collapsed, setCollapsed] = useState(true);
  
  // 添加宽度和高度状态
  const [floaterWidth, setFloaterWidth] = useState({ collapsed: 280, expanded: 450 });
  const [maxHeight, setMaxHeight] = useState(60); // 百分比
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null); // 'width' or 'height'

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
            <div style={{
              fontSize: "0.85em",
              lineHeight: "1.7",
              color: "#333",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {content}
            </div>
            <div style={{
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "flex-end"
            }}>
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
