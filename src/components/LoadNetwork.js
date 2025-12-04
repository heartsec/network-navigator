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
import parseEdgesFile from "../io/parse-edges";

const errorState = (err) => ({
  progressError: true,
  progressLabel: err.toString(),
});

const exampleDataOptions = [
  {
    key: "citation_data",
    text: "Citation Network",
    value: "citation_data.ftree",
    description: "Citation network data",
  },
  {
    key: "tiny_fact_graph",
    text: "Tiny Fact Graph",
    value: "tiny_fact_graph_valid.ftree",
    description: "Tiny fact graph example",
  },
];

export default class LoadNetwork extends React.Component {
  state = {
    progressVisible: false,
    progressLabel: "",
    progressValue: 0,
    progressError: false,
    ftree: null,
    selectedExample: "citation_data.ftree",
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

        const ftree = network.ftree_states ?? network.ftree
        if (!ftree) return;

        this.setState({ ftree });
        if (args) {
          this.loadNetwork(ftree, args);
        }
      })
      .catch((err) => console.error(err));
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
  }

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
      400,
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

        // Try to load corresponding edges_full.tsv
        this.loadEdgesForNetwork(name, network);

        this.setState({
          progressValue: 3,
          progressLabel: "Success",
        });

        this.progressTimeout = setTimeout(() => {
          this.setState({ progressVisible: false });
          this.props.onLoad({ network, filename: name });
        }, 200);
      })
      .catch((err) => {
        clearTimeout(this.progressTimeout);
        this.setState(errorState(err));
        console.log(err);
      });
  };

  loadEdgesForNetwork = (filename, network) => {
    // Try to find edges_full.tsv in the same directory
    let edgesPath = '';
    
    if (filename.includes('tiny_fact_graph')) {
      edgesPath = 'fact_graph_bundle/edges_full.tsv';
    } else if (filename.endsWith('.ftree')) {
      // Try replacing .ftree with _edges_full.tsv or look in same dir
      const baseDir = filename.substring(0, filename.lastIndexOf('/'));
      edgesPath = `${baseDir}/edges_full.tsv`;
    }

    if (!edgesPath) return;

    fetch(edgesPath)
      .then(res => {
        if (!res.ok) throw new Error('Edges file not found');
        return res.text();
      })
      .then(tsvContent => {
        const { edgeMap, errors } = parseEdgesFile(tsvContent);
        
        if (errors.length > 0) {
          console.warn('Edge parsing errors:', errors);
        }
        
        // Attach edge metadata to network
        network.edgeMetadata = edgeMap;
        console.log(`Loaded ${edgeMap.size} edge relationships`);
      })
      .catch(err => {
        console.log('No edges file found or failed to load:', err.message);
        network.edgeMetadata = new Map();
      });
  };

  loadExampleData = () => {
    const filename = this.state.selectedExample;

    this.setState({
      progressVisible: true,
      progressValue: 1,
      progressLabel: "Reading file",
      progressError: false,
    });

    fetch(`${process.env.PUBLIC_URL}/${filename}`)
      .then((res) => res.text())
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

          <div style={{ marginBottom: "20px" }}>
            <Dropdown
              selection
              disabled={disabled}
              value={selectedExample}
              options={exampleDataOptions}
              onChange={this.handleExampleChange}
              style={{ minWidth: "250px" }}
            />
          </div>

          <Step.Group>
            <Step
              disabled={disabled}
              icon="book"
              title="Load example"
              description={
                exampleDataOptions.find((opt) => opt.value === selectedExample)
                  ?.text || "Select example"
              }
              link
              onClick={this.loadExampleData}
            />
          </Step.Group>

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
