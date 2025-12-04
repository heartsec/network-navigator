import React, { useReducer } from "react";
import { Menu, Rail, Sidebar as SemanticSidebar } from "semantic-ui-react";
import NetworkNavigator from "./NetworkNavigator";
import Sidebar from "./Sidebar";
import CaseRecordFloater from "./CaseRecordFloater";
import MaterialsDrawer from "./MaterialsDrawer";
import Dispatch from "../context/Dispatch";

function reducer(state, action) {
  switch (action.type) {
    case "nodeLimit":
      return { ...state, nodeLimit: action.value };
    case "nodeSize":
      return { ...state, nodeSize: action.value };
    case "nodeScale":
      return { ...state, nodeScale: action.value };
    case "linkScale":
      return { ...state, linkScale: action.value };
    case "labelsVisible":
      return { ...state, labelsVisible: action.value };
    case "simulationEnabled":
      return { ...state, simulationEnabled: action.value };
    case "sidebarVisible":
      return { ...state, sidebarVisible: action.value };
    case "sidebarWidth":
      return { ...state, sidebarWidth: action.value };
    case "selectedNode":
      return { ...state, selectedNode: action.value };
    case "searchCallback":
      return { ...state, searchCallback: action.value };
    case "selectedNodeNameChange":
      return {
        ...state,
        selectedNodeNameUpdatedBit: !state.selectedNodeNameUpdatedBit,
      };
    case "occurrences":
      return { ...state, occurrences: action.value };
    case "lodEnabled":
      return { ...state, lodEnabled: action.value };
    case "highlightFacts":
      console.log("=== Layout.reducer: 接收到 highlightFacts action ===");
      console.log("action.value (要高亮的事实IDs):", action.value);
      console.log("当前 state.highlightedFacts:", state.highlightedFacts);
      const newState = { ...state, highlightedFacts: action.value };
      console.log("新的 state.highlightedFacts:", newState.highlightedFacts);
      return newState;
    default:
      throw new Error();
  }
}

export default function Layout(props) {
  const initialState = {
    nodeLimit: 20,
    nodeSize: "flow",
    nodeScale: "root",
    linkScale: "root",
    labelsVisible: true,
    simulationEnabled: true,
    sidebarVisible: false,
    sidebarWidth: 350,
    selectedNode: props.network,
    selectedNodeNameUpdatedBit: true,
    occurrences: null,
    lodEnabled: true,
    searchCallback: () => null,
    highlightedFacts: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <Dispatch.Provider value={{ dispatch }}>
      <CaseRecordFloater caseRecord={props.caseRecord} />
      <MaterialsDrawer 
        nodeInfo={props.nodeInfo}
        materialPriority={props.materialPriority}
        network={props.network}
      />
      <SemanticSidebar.Pushable style={{ height: "100vh", overflow: "hidden" }}>
        <Sidebar {...state} {...props} />
        <SemanticSidebar.Pusher>
          {!state.sidebarVisible && (
            <Rail
              internal
              position="right"
              style={{ padding: 0, margin: 0, height: "auto", width: "auto", zIndex: 1000 }}
            >
              <Menu vertical size="small" style={{ minWidth: '120px' }}>
                <Menu.Item
                  onClick={() =>
                    dispatch({ type: "sidebarVisible", value: true })
                  }
                  style={{ cursor: 'pointer', padding: '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="sidebar icon" style={{ margin: 0 }}></i>
                    <div style={{ fontSize: '0.85em', lineHeight: '1.3' }}>
                      <div><strong>{props.nodeData ? props.nodeData.size : 0}</strong> 事实</div>
                      <div><strong>{props.edgeData ? props.edgeData.length : 0}</strong> 勾稽</div>
                    </div>
                  </div>
                </Menu.Item>
              </Menu>
            </Rail>
          )}
          <React.StrictMode>
            <NetworkNavigator {...state} {...props} />
          </React.StrictMode>
        </SemanticSidebar.Pusher>
      </SemanticSidebar.Pushable>
    </Dispatch.Provider>
  );
}
