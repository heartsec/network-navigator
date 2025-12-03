import FileSaver from "file-saver";
import React, { useContext, useRef, useEffect, useState } from "react";
import { Header, Menu, Sidebar as SemanticSidebar, Tab } from "semantic-ui-react";
import { savePng, saveSvg } from "../io/export";
import ftreeFromNetwork from "../io/ftree-from-network";
import Distributions from "./Distributions";
import MenuHeader from "./MenuHeader";
import Occurrences from "./Occurrences";
import SelectedNode from "./SelectedNode";
import Settings from "./Settings";
import Dispatch from "../context/Dispatch";
import Search from "./Search";
import EdgeDetails from "./EdgeDetails";


export default function Sidebar(props) {
  const {
    network,
    filename,
    sidebarVisible,
    sidebarWidth = 350,
    searchCallback,
    selectedNode,
    edgeData = [],
    nodeData = null
  } = props;

  const { dispatch } = useContext(Dispatch);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);

  const handleDownloadClick = () => {
    const ftree = ftreeFromNetwork(network);
    const blob = new Blob([ftree], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, filename);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 800) {
        dispatch({ type: "sidebarWidth", value: newWidth });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dispatch]);

  return <React.Fragment>
    {sidebarVisible && (
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          right: `${sidebarWidth}px`,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          backgroundColor: isDragging ? 'rgba(33, 133, 208, 0.5)' : 'transparent',
          zIndex: 10000,
          transition: isDragging ? 'none' : 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(33, 133, 208, 0.3)'}
        onMouseLeave={(e) => !isDragging && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
    )}
    <SemanticSidebar
      ref={sidebarRef}
      style={{ 
        overflow: "auto",
        width: `${sidebarWidth}px !important`,
        minWidth: `${sidebarWidth}px`,
        maxWidth: `${sidebarWidth}px`
      }}
      as={Menu}
      animation='push'
      direction='right'
      visible={sidebarVisible}
      vertical
    >
    <Menu.Item header>
      <MenuHeader/>
    </Menu.Item>
    <Menu.Item onClick={() => dispatch({ type: "sidebarVisible", value: false })} icon='close' content='隐藏侧边栏'/>
    <Menu.Item>
      <Search onChange={searchCallback}/>
    </Menu.Item>
    <Menu.Item style={{ padding: 0 }}>
      <Tab 
        menu={{ secondary: true, pointing: true }} 
        panes={[
          {
            menuItem: '事实详情',
            render: () => (
              <Tab.Pane style={{ border: 'none', padding: '1em' }}>
                <Header as="h4">
                  {selectedNode.physicalId ? "选中事实" : "选中类别"}
                </Header>
                <SelectedNode
                  node={selectedNode}
                  directed={network.directed}
                  nodeData={nodeData}
                />
                <EdgeDetails
                  node={selectedNode}
                  edgeData={edgeData}
                  nodeData={nodeData}
                />
                {/* 暂时隐藏：Flow 和 Degree 分布图 */}
                {/* <Distributions
                  nodes={selectedNode.nodes || []}
                  directed={network.directed}
                /> */}
                {/* 暂时隐藏：出现次数 */}
                {/* <div style={{ marginTop: '1.5em' }}>
                  <Header as="h4">出现次数</Header>
                  <Occurrences
                    onChange={value => dispatch({ type: "occurrences", value })}
                    selectedNode={selectedNode}
                    filename={filename}
                    totalNodes={network.totalChildren}
                  />
                </div> */}
              </Tab.Pane>
            ),
          },
          {
            menuItem: '设置与导出',
            render: () => (
              <Tab.Pane style={{ border: 'none', padding: '1em' }}>
                <Header as="h4">可视化设置</Header>
                <Settings {...props} />
                
                <div style={{ marginTop: '1.5em' }}>
                  <Header as="h4">导出</Header>
                  <Menu.Menu>
                    <Menu.Item
                      icon="download"
                      content="下载网络数据"
                      onClick={handleDownloadClick}
                    />
                  </Menu.Menu>
                  <Menu.Menu>
                    <Menu.Item
                      icon="download"
                      onClick={() => saveSvg("networkNavigatorSvg", filename + ".svg")}
                      content="下载 SVG"
                    />
                  </Menu.Menu>
                  <Menu.Menu>
                    <Menu.Item
                      icon="image"
                      onClick={() => savePng("networkNavigatorSvg", filename + ".png")}
                      content="下载 PNG"
                    />
                  </Menu.Menu>
                </div>
              </Tab.Pane>
            ),
          },
        ]}
      />
    </Menu.Item>
  </SemanticSidebar>
  </React.Fragment>;
}
