import localforage from "localforage";
import PropTypes from "prop-types";
import React from "react";
import {
  Container,
  Divider,
  Dropdown,
  Image,
  Label,
  Progress,
  Segment,
  Step,
} from "semantic-ui-react";
import Background from "../images/Background.svg";
import parseFTree from "../io/ftree";
import networkFromFTree from "../io/network-from-ftree";
import parseFile from "../io/parse-file";

const errorState = (err) => ({
  progressError: true,
  progressLabel: err.toString(),
});

export default class LoadNetworkDynamicWithEdgeInfo extends React.Component {
  state = {
    progressVisible: false,
    progressLabel: "",
    progressValue: 0,
    progressError: false,
    ftree: null,
    selectedExample: "",
    selectedEdgeDataPath: "",
    selectedNodeDataPath: "",
    selectedNodeInfoPath: "",
    selectedCaseRecordPath: "",
    selectedMaterialPriorityPath: "",
    exampleFiles: [],
    loading: true,
  };

  static propTypes = {
    onLoad: PropTypes.func.isRequired,
  };

  progressTimeout = null;

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const args = urlParams.get("infomap");

    localforage.config({ name: "infomap" });
    localforage
      .getItem("network")
      .then((network) => {
        if (!network) return;

        const ftree = network.ftree_states ?? network.ftree;
        if (!ftree) return;

        this.setState({ ftree });
        if (args) {
          this.loadNetwork(ftree, args);
        }
      })
      .catch((err) => console.error(err));

    // 动态加载可用的示例文件列表
    this.loadAvailableExamples();
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
  }

  // 动态获取 public 目录下的所有 .ftree 文件
  loadAvailableExamples = async () => {
    try {
      // 尝试获取文件列表
      const response = await fetch(`${process.env.PUBLIC_URL}/examples-list.json`);
      
      if (response.ok) {
        // 如果存在 examples-list.json，使用它
        const data = await response.json();
        const exampleFiles = data.files.map((file) => ({
          key: file.filename.replace(".ftree", ""),
          text: file.name || this.formatFileName(file.filename),
          value: file.filename,
          description: file.description || "",
          edgeDataPath: file.edgeDataPath || "",
          nodeDataPath: file.nodeDataPath || "",
          nodeInfoPath: file.nodeInfoPath || "",
          caseRecordPath: file.caseRecordPath || "",
          materialPriorityPath: file.materialPriorityPath || "",
          annotationsPath: file.annotationsPath || "",
        }));
        
        this.setState({
          exampleFiles,
          selectedExample: exampleFiles[0]?.value || "",
          selectedEdgeDataPath: exampleFiles[0]?.edgeDataPath || "",
          selectedNodeDataPath: exampleFiles[0]?.nodeDataPath || "",
          selectedNodeInfoPath: exampleFiles[0]?.nodeInfoPath || "",
          selectedCaseRecordPath: exampleFiles[0]?.caseRecordPath || "",
          selectedMaterialPriorityPath: exampleFiles[0]?.materialPriorityPath || "",
          selectedAnnotationsPath: exampleFiles[0]?.annotationsPath || "",
          loading: false,
        });
      } else {
        // 如果不存在配置文件，使用默认列表
        this.loadDefaultExamples();
      }
    } catch (err) {
      console.log("Failed to load examples list, using defaults:", err);
      this.loadDefaultExamples();
    }
  };

  // 加载默认示例列表
  loadDefaultExamples = () => {
    const defaultExamples = [
      "citation_data.ftree",
      "tiny_fact_graph_valid.ftree",
    ];

    const exampleFiles = defaultExamples.map((filename) => ({
      key: filename.replace(".ftree", ""),
      text: this.formatFileName(filename),
      value: filename,
      description: "",
    }));

    this.setState({
      exampleFiles,
      selectedExample: exampleFiles[0]?.value || "",
      loading: false,
    });
  };

  // 格式化文件名为可读的标题
  formatFileName = (filename) => {
    return filename
      .replace(".ftree", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // 加载节点数据（TSV 格式）
  loadNodeData = async (nodeDataPath) => {
    try {
      if (!nodeDataPath) {
        console.log("No node data path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${nodeDataPath}`);
      
      if (!response.ok) {
        console.log(`No node data file found at ${nodeDataPath}`);
        return null;
      }

      const text = await response.text();
      const lines = text.trim().split("\n");
      
      if (lines.length < 2) {
        console.log("Node data file is empty");
        return null;
      }

      // 解析 TSV 表头
      const headers = lines[0].split("\t").map(h => h.trim());
      
      // 创建 fact_id -> node data 的映射
      const nodeMap = new Map();
      
      lines.slice(1).forEach(line => {
        const values = line.split("\t");
        const node = {};
        
        headers.forEach((header, index) => {
          node[header] = values[index] ? values[index].trim() : "";
        });
        
        if (node.fact_id) {
          nodeMap.set(node.fact_id, node);
        }
      });
      
      console.log(`Loaded ${nodeMap.size} node records`);
      return nodeMap;
    } catch (err) {
      console.error("Error loading node data:", err);
      return null;
    }
  };

  // 加载节点溯源信息（TSV 格式）
  loadNodeInfo = async (nodeInfoPath) => {
    try {
      if (!nodeInfoPath) {
        console.log("No node info path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${nodeInfoPath}`);
      
      if (!response.ok) {
        console.log(`No node info file found at ${nodeInfoPath}`);
        return null;
      }

      const text = await response.text();
      const lines = text.trim().split("\n");
      
      if (lines.length < 2) {
        console.log("Node info file is empty");
        return null;
      }

      // 解析 TSV 表头
      const headers = lines[0].split("\t").map(h => h.trim());
      
      // 创建 fact_id -> node info 的映射
      const nodeInfoMap = new Map();
      
      lines.slice(1).forEach(line => {
        const values = line.split("\t");
        const info = {};
        
        headers.forEach((header, index) => {
          info[header] = values[index] ? values[index].trim() : "";
        });
        
        if (info.fact_id) {
          nodeInfoMap.set(info.fact_id, info);
        }
      });
      
      console.log(`Loaded ${nodeInfoMap.size} node info records`);
      return nodeInfoMap;
    } catch (err) {
      console.error("Error loading node info:", err);
      return null;
    }
  };

  // 加载案例记录（JSON 格式）
  loadCaseRecord = async (caseRecordPath) => {
    try {
      if (!caseRecordPath) {
        console.log("No case record path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${caseRecordPath}`);
      
      if (!response.ok) {
        console.log(`No case record file found at ${caseRecordPath}`);
        return null;
      }

      const caseRecord = await response.json();
      console.log("Loaded case record");
      return caseRecord;
    } catch (err) {
      console.error("Error loading case record:", err);
      return null;
    }
  };

  loadMaterialPriority = async (materialPriorityPath) => {
    try {
      if (!materialPriorityPath) {
        console.log("No material priority path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${materialPriorityPath}`);
      
      if (!response.ok) {
        console.log(`No material priority file found at ${materialPriorityPath}`);
        return null;
      }

      const materialPriority = await response.json();
      console.log("Loaded material priority");
      return materialPriority;
    } catch (err) {
      console.error("Error loading material priority:", err);
      return null;
    }
  };

  // 加载标注数据（JSON 格式）
  loadAnnotations = async (annotationsPath) => {
    try {
      if (!annotationsPath) {
        console.log("No annotations path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${annotationsPath}`);
      
      if (!response.ok) {
        console.log(`No annotations file found at ${annotationsPath}`);
        return null;
      }

      const annotations = await response.json();
      console.log("Loaded annotations:", annotations.statistics);
      return annotations;
    } catch (err) {
      console.error("Error loading annotations:", err);
      return null;
    }
  };

  // 加载边关系数据（TSV 格式）
  loadEdgeData = async (edgeDataPath) => {
    try {
      // 如果没有指定边数据路径，返回空
      if (!edgeDataPath) {
        console.log("No edge data path specified");
        return null;
      }
      
      const response = await fetch(`${process.env.PUBLIC_URL}/${edgeDataPath}`);
      
      if (!response.ok) {
        console.log(`No edge data file found at ${edgeDataPath}`);
        return null;
      }

      const text = await response.text();
      const lines = text.trim().split("\n");
      
      if (lines.length < 2) {
        console.log("Edge data file is empty");
        return null;
      }

      // 解析 TSV 表头
      const headers = lines[0].split("\t").map(h => h.trim());
      
      // 解析数据行
      const edges = lines.slice(1).map(line => {
        const values = line.split("\t");
        const edge = {};
        
        headers.forEach((header, index) => {
          edge[header] = values[index] ? values[index].trim() : "";
        });
        
        return edge;
      });

      console.log(`Loaded ${edges.length} edge relationships`);
      return edges;
    } catch (err) {
      console.log("Failed to load edge data:", err);
      return null;
    }
  };

  loadNetwork = (file, name) => {
    if (!name && file && file.name) {
      name = file.name;
    }

    this.setState({
      progressVisible: true,
      progressValue: 1,
      progressLabel: "Reading file",
      progressError: false,
    });

    this.progressTimeout = setTimeout(
      () =>
        this.setState({
          progressValue: 2,
          progressLabel: "Parsing",
        }),
      400
    );

    return parseFile(file)
      .then((parsed) => {
        clearTimeout(this.progressTimeout);

        if (parsed.errors.length) {
          throw new Error(parsed.errors[0].message);
        }

        const ftree = parseFTree(parsed.data);

        if (ftree.errors.length) {
          throw new Error(ftree.errors[0]);
        }

        const network = networkFromFTree(ftree);

        this.setState({
          progressValue: 3,
          progressLabel: "Loading additional data...",
        });

        // 同时加载边关系数据、节点数据、溯源信息、案例记录、资料优先级和标注数据
        return Promise.all([
          this.loadEdgeData(this.state.selectedEdgeDataPath),
          this.loadNodeData(this.state.selectedNodeDataPath),
          this.loadNodeInfo(this.state.selectedNodeInfoPath),
          this.loadCaseRecord(this.state.selectedCaseRecordPath),
          this.loadMaterialPriority(this.state.selectedMaterialPriorityPath),
          this.loadAnnotations(this.state.selectedAnnotationsPath)
        ]).then(([edgeData, nodeData, nodeInfo, caseRecord, materialPriority, annotations]) => {
          this.setState({
            progressLabel: "Success",
          });

          this.progressTimeout = setTimeout(() => {
            this.setState({ progressVisible: false });
            this.props.onLoad({ 
              network, 
              filename: name,
              edgeData: edgeData || [],
              nodeData: nodeData || null,
              nodeInfo: nodeInfo || null,
              caseRecord: caseRecord || null,
              materialPriority: materialPriority || null,
              annotations: annotations || null
            });
          }, 200);
        });
      })
      .catch((err) => {
        clearTimeout(this.progressTimeout);
        this.setState(errorState(err));
        console.log(err);
      });
  };

  loadExampleData = () => {
    const filename = this.state.selectedExample;

    if (!filename) {
      console.error("No example file selected");
      return;
    }

    this.setState({
      progressVisible: true,
      progressValue: 1,
      progressLabel: "Reading file",
      progressError: false,
    });

    fetch(`${process.env.PUBLIC_URL}/${filename}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${filename}: ${res.statusText}`);
        }
        return res.text();
      })
      .then((file) => this.loadNetwork(file, filename))
      .catch((err) => {
        this.setState(errorState(err));
        console.log(err);
      });
  };

  handleExampleChange = (e, { value }) => {
    // 查找对应的边数据路径
    const selectedFile = this.state.exampleFiles.find(file => file.value === value);
    this.setState({
      selectedExample: value,
      selectedEdgeDataPath: selectedFile?.edgeDataPath || "",
      selectedNodeDataPath: selectedFile?.nodeDataPath || "",
      selectedNodeInfoPath: selectedFile?.nodeInfoPath || "",
      selectedCaseRecordPath: selectedFile?.caseRecordPath || "",
      selectedMaterialPriorityPath: selectedFile?.materialPriorityPath || "",
      selectedAnnotationsPath: selectedFile?.annotationsPath || ""
    });
  };

  render() {
    const {
      progressError,
      progressLabel,
      progressValue,
      progressVisible,
      ftree,
      selectedExample,
      exampleFiles,
      loading,
    } = this.state;

    const disabled = progressVisible && !progressError;

    const background = {
      padding: "100px 0 100px 0",
      background: `linear-gradient(hsla(0, 0%, 100%, 0.5), hsla(0, 0%, 100%, 0.5)), url(${Background}) no-repeat`,
      backgroundSize: "cover, cover",
      backgroundPosition: "center top",
    };

    return (
      <div style={background}>
        <Segment
          as={Container}
          textAlign="center"
          style={{ padding: "50px 40px", maxWidth: "1200px" }}
          padded="very"
        >
          <Label attached="top right">v {process.env.REACT_APP_VERSION}</Label>

          {loading ? (
            <div style={{ padding: "20px" }}>加载示例中...</div>
          ) : exampleFiles.length > 0 ? (
            <div style={{ 
              display: "flex", 
              alignItems: "stretch", 
              justifyContent: "center",
              gap: "30px",
              minHeight: "200px",
              padding: "20px 0"
            }}>
              {/* 左侧：加载示例数据 */}
              <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                padding: "10px",
                maxWidth: "450px"
              }}>
                <h3 style={{ marginBottom: "20px", color: "#333", fontSize: "1.2em" }}>加载示例数据</h3>
                <div style={{ marginBottom: "20px", width: "100%" }}>
                  <Dropdown
                    selection
                    disabled={disabled}
                    value={selectedExample}
                    options={exampleFiles}
                    onChange={this.handleExampleChange}
                    placeholder="选择示例"
                    style={{ width: "100%", maxWidth: "320px" }}
                  />
                </div>
                <Step.Group style={{ margin: 0 }}>
                  <Step
                    disabled={disabled || !selectedExample}
                    icon="book"
                    title="加载示例"
                    description={
                      exampleFiles.find((opt) => opt.value === selectedExample)
                        ?.text || "选择示例"
                    }
                    link
                    onClick={this.loadExampleData}
                    style={{ padding: "1em 2em" }}
                  />
                </Step.Group>
              </div>

              {/* 中间分隔线 */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                justifyContent: "center",
                padding: "0 20px"
              }}>
                <div style={{ 
                  width: "2px", 
                  height: "60px", 
                  background: "linear-gradient(to bottom, transparent, #ccc, #ccc)"
                }} />
                <div style={{ 
                  padding: "15px 0",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#666"
                }}>OR</div>
                <div style={{ 
                  width: "2px", 
                  height: "60px", 
                  background: "linear-gradient(to bottom, #ccc, #ccc, transparent)"
                }} />
              </div>

              {/* 右侧：上传文件 */}
              <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                padding: "10px",
                maxWidth: "450px",
                opacity: 0.5
              }}>
                <h3 style={{ marginBottom: "20px", color: "#999", fontSize: "1.2em" }}>上传待审会议记录</h3>
                <Step.Group style={{ margin: 0 }}>
                  <Step
                    disabled={true}
                    link={false}
                    active={false}
                    icon="upload"
                    title="上传会议记录文件"
                    description="功能未开通"
                    style={{ 
                      padding: "1em 2em",
                      cursor: "not-allowed",
                      opacity: 0.6
                    }}
                  />
                </Step.Group>
                <div style={{ 
                  marginTop: "10px", 
                  fontSize: "0.85em", 
                  color: "#999",
                  textAlign: "center"
                }}>
                  上传贷审会会记录：如贷款审议小组会议纪要
                  <br />
                  <span style={{ fontSize: "0.9em", fontStyle: "italic" }}>（即将开放）</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "20px" }}>未找到示例文件</div>
          )}

          <input
            style={{ visibility: "hidden" }}
            type="file"
            id="upload"
            onChange={() => this.loadNetwork(this.input.files[0])}
            accept=".ftree"
            ref={(input) => (this.input = input)}
            disabled={true}
          />

          {progressVisible && (
            <div style={{ padding: "50px 100px 0" }}>
              <Progress
                align="left"
                indicating
                total={3}
                error={progressError}
                label={progressLabel}
                value={progressValue}
              />
            </div>
          )}
        </Segment>
      </div>
    );
  }
}
