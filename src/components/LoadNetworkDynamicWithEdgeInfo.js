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
      const response = await fetch("/navigator/examples-list.json");
      
      if (response.ok) {
        // 如果存在 examples-list.json，使用它
        const data = await response.json();
        const exampleFiles = data.files.map((file) => ({
          key: file.filename.replace(".ftree", ""),
          text: file.name || this.formatFileName(file.filename),
          value: file.filename,
          description: file.description || "",
        }));
        
        this.setState({
          exampleFiles,
          selectedExample: exampleFiles[0]?.value || "",
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

  // 加载边关系数据（TSV 格式）
  loadEdgeData = async (filename) => {
    try {
      // 尝试加载对应的边数据文件
      const baseName = filename.replace(".ftree", "");
      const edgeFileName = `fact_graph_bundle/edges_full.tsv`;
      
      const response = await fetch(`/navigator/${edgeFileName}`);
      
      if (!response.ok) {
        console.log(`No edge data file found for ${filename}`);
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
          progressLabel: "Loading edge data...",
        });

        // 尝试加载边关系数据
        return this.loadEdgeData(name).then((edgeData) => {
          this.setState({
            progressLabel: "Success",
          });

          this.progressTimeout = setTimeout(() => {
            this.setState({ progressVisible: false });
            this.props.onLoad({ 
              network, 
              filename: name,
              edgeData: edgeData || []
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

    fetch(`/navigator/${filename}`)
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
    this.setState({ selectedExample: value });
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
          text
          textAlign="center"
          style={{ padding: "50px 0px" }}
          padded="very"
        >
          <Label attached="top right">v {process.env.REACT_APP_VERSION}</Label>

          {loading ? (
            <div style={{ padding: "20px" }}>Loading examples...</div>
          ) : exampleFiles.length > 0 ? (
            <>
              <div style={{ marginBottom: "20px" }}>
                <Dropdown
                  selection
                  disabled={disabled}
                  value={selectedExample}
                  options={exampleFiles}
                  onChange={this.handleExampleChange}
                  placeholder="Select an example"
                  style={{ minWidth: "300px" }}
                />
              </div>

              <Step.Group>
                <Step
                  disabled={disabled || !selectedExample}
                  icon="book"
                  title="Load example"
                  description={
                    exampleFiles.find((opt) => opt.value === selectedExample)
                      ?.text || "Select example"
                  }
                  link
                  onClick={this.loadExampleData}
                />
              </Step.Group>
            </>
          ) : (
            <div style={{ padding: "20px" }}>No example files found</div>
          )}

          {!!ftree && (
            <React.Fragment>
              <Divider hidden />

              <Step.Group>
                <Step
                  disabled={disabled}
                  link
                  onClick={() => this.loadNetwork(ftree, "infomap.ftree")}
                >
                  <Image
                    spaced="right"
                    size="tiny"
                    disabled={disabled}
                    verticalAlign="middle"
                    src="//www.mapequation.org/assets/img/twocolormapicon_whiteboarder.svg"
                    alt="mapequation-icon"
                  />
                  <Step.Content>
                    <Step.Title>
                      Open from{" "}
                      <span className="brand brand-infomap">Infomap</span>{" "}
                      <span className="brand brand-nn">Online</span>
                    </Step.Title>
                  </Step.Content>
                </Step>
              </Step.Group>
            </React.Fragment>
          )}

          <Divider
            horizontal
            style={{ margin: "20px 100px 30px 100px" }}
            content="Or"
          />

          <Step.Group ordered>
            <Step
              disabled={disabled}
              link
              as="a"
              href="//www.mapequation.org/infomap"
            >
              <Step.Content>
                <Step.Title>Cluster network with Infomap</Step.Title>
                <Step.Description>
                  Command line version or{" "}
                  <span className="brand brand-infomap">Infomap</span>{" "}
                  <span className="brand brand-nn">Online</span>
                </Step.Description>
              </Step.Content>
            </Step>
            <Step
              disabled={disabled}
              as="label"
              link
              active={!disabled}
              title="Load ftree file"
              htmlFor="upload"
            />
          </Step.Group>
          <input
            style={{ visibility: "hidden" }}
            type="file"
            id="upload"
            onChange={() => this.loadNetwork(this.input.files[0])}
            accept=".ftree"
            ref={(input) => (this.input = input)}
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
