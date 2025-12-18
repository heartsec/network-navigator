import React, { useReducer } from "react";
import NetworkNavigator from "./NetworkNavigator";
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
    selectedNode: null,
    selectedNodeNameUpdatedBit: true,
    occurrences: null,
    lodEnabled: true,
    searchCallback: () => null,
    highlightedFacts: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <Dispatch.Provider value={{ dispatch }}>
      <CaseRecordFloater 
        caseRecord={props.caseRecord}
        annotations={props.annotations}
      />
      <MaterialsDrawer 
        nodeInfo={props.nodeInfo}
        materialPriority={props.materialPriority}
        network={props.network}
        highlightedFacts={state.highlightedFacts}
      />
      <div style={{ height: "100vh", overflow: "hidden" }}>
        <React.StrictMode>
          <NetworkNavigator {...state} {...props} />
        </React.StrictMode>
      </div>
    </Dispatch.Provider>
  );
}
