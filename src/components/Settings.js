import React, { useContext } from "react";
import { Checkbox, Input } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";

const MyCheckbox = (props) => (
  <Checkbox
    style={{ display: "block", margin: "0.3em 0 0.3em 0" }}
    {...props}
  />
);

const SliderCheckbox = (props) => <MyCheckbox slider {...props} />;

export default function Settings(props) {
  const {
    nodeSize,
    nodeScale,
    linkScale,
    labelsVisible,
    simulationEnabled,
    lodEnabled,
    nodeLimit,
  } = props;
  const { dispatch } = useContext(Dispatch);

  return (
    <React.Fragment>
      <SliderCheckbox
        label={`事实大小基于: ${nodeSize === 'flow' ? '风险权重' : '事实数量'}`}
        checked={nodeSize === "flow"}
        onChange={(e, { checked }) =>
          dispatch({ type: "nodeSize", value: checked ? "flow" : "nodes" })
        }
      />
      <SliderCheckbox
        label={`事实节点缩放: ${nodeScale === 'root' ? '平方根' : '线性'}`}
        checked={nodeScale === "root"}
        onChange={(e, { checked }) =>
          dispatch({ type: "nodeScale", value: checked ? "root" : "linear" })
        }
      />
      <SliderCheckbox
        label={`勾稽关系线宽: ${linkScale === 'root' ? '平方根' : '线性'}`}
        checked={linkScale === "root"}
        onChange={(e, { checked }) =>
          dispatch({ type: "linkScale", value: checked ? "root" : "linear" })
        }
      />
      <MyCheckbox
        label="显示标签"
        checked={labelsVisible}
        onChange={(e, { checked }) =>
          dispatch({ type: "labelsVisible", value: checked })
        }
      />
      <MyCheckbox
        label="运行物理模拟"
        checked={simulationEnabled}
        onChange={(e, { checked }) =>
          dispatch({ type: "simulationEnabled", value: checked })
        }
      />
      <MyCheckbox
        label="使用细节层次"
        checked={lodEnabled}
        onChange={(e, { checked }) =>
          dispatch({ type: "lodEnabled", value: checked })
        }
      />
      <Input
        label={{ basic: true, content: "类别事实数限制" }}
        type="number"
        size="small"
        value={nodeLimit}
        fluid
        onChange={(e) => {
          dispatch({ type: "nodeLimit", value: parseInt(e.target.value) });
        }}
      />
    </React.Fragment>
  );
}
