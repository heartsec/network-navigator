import React, { useState, useMemo, useContext, useEffect } from "react";
import { Button, List, Input, Label, Icon, Segment, Dropdown } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";

export default function MaterialsDrawer(props) {
  const { nodeInfo, materialPriority, network, highlightedFacts } = props;
  const { dispatch } = useContext(Dispatch);
  const [open, setOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("usage"); // usage, priority, name
  const [selectedMaterialId, setSelectedMaterialId] = useState(null); // 追踪选中的资料项
  
  // 添加宽度状态
  const [drawerWidth, setDrawerWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  // 当前面板类型（用于复用同一抽屉组件显示不同列表）
  const [panelType, setPanelType] = useState("materials");
  // 当前悬停按钮（用于显示右侧标签）
  const [hoveredButton, setHoveredButton] = useState(null);

  // 当外部取消高亮时，取消选中状态
  useEffect(() => {
    if (!highlightedFacts) {
      setSelectedMaterialId(null);
    }
  }, [highlightedFacts]);

  // 处理拖拽调整大小
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // 调整宽度：从左边界到鼠标位置
      const newWidth = e.clientX - 20; // 减去左边距
      setDrawerWidth(Math.max(250, Math.min(1600, newWidth))); // 增加到1600px
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
  }, [isResizing]);

  // 开始调整宽度
  const startResizeWidth = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // 构建资料项到事实ID的映射
  const materialFactsMap = useMemo(() => {
    if (!nodeInfo || !materialPriority) return new Map();

    const map = new Map();
    
    // 遍历所有节点信息
    for (const [factId, info] of nodeInfo.entries()) {
      const primary = info.primary_source || "";
      const secondary = info.secondary_source || "";
      
      // 处理主要资料来源
      if (primary) {
        primary.split(/[、，,]+/).forEach(source => {
          const trimmed = source.trim();
          if (trimmed) {
            if (!map.has(trimmed)) {
              map.set(trimmed, []);
            }
            map.get(trimmed).push(factId);
          }
        });
      }
      
      // 处理辅助资料来源
      if (secondary) {
        secondary.split(/[、，,]+/).forEach(source => {
          const trimmed = source.trim();
          if (trimmed) {
            if (!map.has(trimmed)) {
              map.set(trimmed, []);
            }
            if (!map.get(trimmed).includes(factId)) {
              map.get(trimmed).push(factId);
            }
          }
        });
      }
    }
    
    return map;
  }, [nodeInfo, materialPriority]);

  // 获取资料项统计信息
  const materialStats = useMemo(() => {
    let materialsList = [];
    if (Array.isArray(materialPriority)) {
      materialsList = materialPriority;
    } else if (materialPriority && Array.isArray(materialPriority.materials)) {
      materialsList = materialPriority.materials;
    } else {
      return [];
    }

    return materialsList.map(material => {
      const facts = materialFactsMap.get(material.name) || [];
      return {
        ...material,
        usageCount: facts.length,
        factIds: facts
      };
    }).filter(item => item.usageCount > 0); // 只显示被使用的资料项
  }, [materialPriority, materialFactsMap]);

  // 排序和过滤
  const sortedMaterials = useMemo(() => {
    let filtered = materialStats;
    
    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 排序
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.usageCount - a.usageCount;
        case "priority":
          return a.priority - b.priority;
        case "name":
          return a.name.localeCompare(b.name, 'zh-CN');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [materialStats, searchText, sortBy]);

  // 点击资料项，高亮相关节点
  const handleMaterialClick = (material) => {
    console.log("=== MaterialsDrawer: 用户点击资料项 ===");
    console.log("资料名称:", material.name);
    console.log("关联的事实IDs:", material.factIds);
    console.log("发送 dispatch action: selectMaterial");
    
    // 设置选中状态
    setSelectedMaterialId(material.id);
    
    dispatch({
      type: "selectMaterial",
      value: material
    });
  };

  const sortOptions = [
    { key: "usage", text: "引用次数", value: "usage" },
    { key: "priority", text: "优先级", value: "priority" },
    { key: "name", text: "名称", value: "name" }
  ];

  const difficultyColor = (difficulty) => {
    if (difficulty <= 1) return "green";
    if (difficulty <= 2) return "olive";
    if (difficulty <= 3) return "yellow";
    if (difficulty <= 4) return "orange";
    return "red";
  };

  return (
    <>
      {!open && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          {/* 主按钮：项目资料清单（绿色） */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Button
              circular
              icon
              size="large"
              color="green"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              onClick={() => { setPanelType("materials"); setOpen(true); }}
              onMouseEnter={() => setHoveredButton('materials')}
              onMouseLeave={() => setHoveredButton(null)}
              onFocus={() => setHoveredButton('materials')}
              onBlur={() => setHoveredButton(null)}
              title="项目资料清单"
            >
              <Icon name="book" />
            </Button>

            <div
              style={{
                position: 'absolute',
                left: '56px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 10px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                opacity: hoveredButton === 'materials' ? 1 : 0,
                pointerEvents: 'none',
                transition: 'opacity 120ms ease-in-out'
              }}
              aria-hidden={hoveredButton !== 'materials'}
            >
              项目资料清单
            </div>
          </div>

          {/* 额外按钮：合规知识库 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Button
              circular
              icon
              size="large"
              color="teal"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              onClick={() => { setPanelType("compliance"); setOpen(true); }}
              onMouseEnter={() => setHoveredButton('compliance')}
              onMouseLeave={() => setHoveredButton(null)}
              onFocus={() => setHoveredButton('compliance')}
              onBlur={() => setHoveredButton(null)}
              title="合规知识库"
            >
              <Icon name="list" />
            </Button>

            <div
              style={{
                position: 'absolute',
                left: '56px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 10px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                opacity: hoveredButton === 'compliance' ? 1 : 0,
                pointerEvents: 'none',
                transition: 'opacity 120ms ease-in-out'
              }}
              aria-hidden={hoveredButton !== 'compliance'}
            >
              合规知识库
            </div>
          </div>

          {/* 额外按钮：产业相关信息 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Button
              circular
              icon
              size="large"
              color="teal"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              onClick={() => { setPanelType("industry"); setOpen(true); }}
              onMouseEnter={() => setHoveredButton('industry')}
              onMouseLeave={() => setHoveredButton(null)}
              onFocus={() => setHoveredButton('industry')}
              onBlur={() => setHoveredButton(null)}
              title="产业相关信息"
            >
              <Icon name="industry" />
            </Button>

            <div
              style={{
                position: 'absolute',
                left: '56px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 10px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                opacity: hoveredButton === 'industry' ? 1 : 0,
                pointerEvents: 'none',
                transition: 'opacity 120ms ease-in-out'
              }}
              aria-hidden={hoveredButton !== 'industry'}
            >
              产业相关信息
            </div>
          </div>

          {/* 额外按钮：数据分析 */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Button
              circular
              icon
              size="large"
              color="teal"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              onClick={() => { setPanelType("data"); setOpen(true); }}
              onMouseEnter={() => setHoveredButton('data')}
              onMouseLeave={() => setHoveredButton(null)}
              onFocus={() => setHoveredButton('data')}
              onBlur={() => setHoveredButton(null)}
              title="数据分析"
            >
              <Icon name="chart bar" />
            </Button>

            <div
              style={{
                position: 'absolute',
                left: '56px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 10px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                opacity: hoveredButton === 'data' ? 1 : 0,
                pointerEvents: 'none',
                transition: 'opacity 120ms ease-in-out'
              }}
              aria-hidden={hoveredButton !== 'data'}
            >
              数据分析
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            bottom: "20px",
            left: "20px",
            width: `${drawerWidth}px`,
            maxWidth: "none", // 移除宽度限制
            backgroundColor: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            borderRadius: "8px",
            overflow: "hidden"
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
        
        <Segment
          style={{
            margin: 0,
            borderRadius: 0,
            padding: "10px 14px",
            backgroundColor: "#f8f9fa",
            borderBottom: "2px solid #e0e0e0"
          }}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="book" color="blue" size="small" />
              <strong style={{ fontSize: "0.95em", color: "#2185d0" }}>
                {
                  // 根据当前面板类型显示标题
                  ({
                    materials: "项目资料清单",
                    compliance: "合规知识库",
                    industry: "产业相关信息",
                    data: "数据分析"
                  }[panelType] || "资料清单")
                }
              </strong>
            </div>
            <Icon 
              name="close" 
              link 
              onClick={() => setOpen(false)}
              style={{ cursor: "pointer", fontSize: "0.9em", color: "#666" }}
            />
          </div>
          
          <Input
            icon="search"
            placeholder="搜索资料项..."
            fluid
            size="mini"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: "8px", fontSize: "0.85em" }}
          />
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8em", color: "#666" }}>排序:</span>
            <Dropdown
              compact
              selection
              options={sortOptions}
              value={sortBy}
              onChange={(e, { value }) => setSortBy(value)}
              style={{ minWidth: "100px", fontSize: "0.85em" }}
            />
            <Label size="mini" color="blue">
              {sortedMaterials.length} 项
            </Label>
          </div>
        </Segment>

        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "10px" 
        }}>
          <List divided relaxed>
            {sortedMaterials.map((material) => {
              const isSelected = selectedMaterialId === material.id;
              return (
              <List.Item
                key={material.id}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                  backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                  border: isSelected ? "2px solid #2185d0" : "2px solid transparent"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "#f0f8ff";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => handleMaterialClick(material)}
              >
                <List.Content>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    marginBottom: "4px"
                  }}>
                    <strong style={{ 
                      fontSize: "0.85em",
                      flex: 1,
                      color: "#333"
                    }}>
                      {material.name}
                    </strong>
                    <Label size="mini" color="blue" circular>
                      {material.usageCount}
                    </Label>
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    gap: "4px", 
                    marginBottom: "4px",
                    flexWrap: "wrap"
                  }}>
                    <Label size="mini" color={difficultyColor(material.difficulty)} style={{ fontSize: "0.7em" }}>
                      难度 {"★".repeat(material.difficulty)}
                    </Label>
                    <Label size="mini" basic style={{ fontSize: "0.7em" }}>
                      优先级 {material.priority}
                    </Label>
                  </div>
                  
                  <div style={{ 
                    fontSize: "0.7em", 
                    color: "#666",
                    marginBottom: "4px",
                    lineHeight: "1.4"
                  }}>
                    {material.reason}
                  </div>
                  
                  <div style={{ 
                    fontSize: "0.65em", 
                    color: "#999",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "3px"
                  }}>
                    <span>用于事实:</span>
                    {material.factIds.slice(0, 5).map(factId => (
                      <Label key={factId} size="mini" basic color="grey" style={{ fontSize: "0.7em", padding: "2px 4px" }}>
                        {factId}
                      </Label>
                    ))}
                    {material.factIds.length > 5 && (
                      <span style={{ color: "#999" }}>
                        +{material.factIds.length - 5}
                      </span>
                    )}
                  </div>
                  
                  {material.files && material.files.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      {material.files.map((file, idx) => (
                        <Label key={idx} size="mini" as="a" color="teal" style={{ fontSize: "0.7em" }}>
                          <Icon name="paperclip" /> {file.name}
                        </Label>
                      ))}
                    </div>
                  )}
                </List.Content>
              </List.Item>
              );
            })}
          </List>
          
          {sortedMaterials.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "30px 15px",
              color: "#999"
            }}>
              <Icon name="search" size="large" style={{ opacity: 0.3 }} />
              <div style={{ marginTop: "8px", fontSize: "0.85em" }}>
                未找到相关资料项
              </div>
            </div>
          )}
        </div>
        </div>
      )}
    </>
  );
}
