import React from "react";
import { Container, Grid, Header, Icon, Image } from "semantic-ui-react";
import Legend from "./Legend";


const Documentation = () => {
  const codeStyle = {
    backgroundColor: "#f5f5f5",
    fontSize: "0.9em",
    whiteSpace: "pre-wrap",
    padding: "10px 15px",
    lineHeight: 1.5,
    borderRadius: "4px",
    border: "1px solid #ddd"
  };

  return <Container style={{ padding: "40px 0 100px 0" }}>
    <Grid columns={2}>
      <Grid.Column>
        <Header as="h1">信贷风险分析可视化系统</Header>
        <p>
          这是一个基于 AI 智能体的信贷审查自动化分析与可视化系统。系统将贷审会案例文本自动转换为结构化的风险分析数据，
          并通过交互式网络图谱展示事实节点、风险关系和社区结构。所有处理都在本地完成，无需上传数据到服务器。
        </p>

        <Header as="h2">系统特点</Header>
        <p>
          <strong>⏱️ 高效自动化</strong>：基于 LangGraph 的智能工作流，自动完成事实提取、标签生成和风险分析，减少 90% 手工操作。
        </p>
        <p>
          <strong>🎯 结构化输出</strong>：使用 Pydantic 模型验证，确保数据一致性和准确性。
        </p>
        <p>
          <strong>🔒 数据隐私</strong>：本地 LLM 模型运行（Ollama），敏感数据不离开本地环境。
        </p>
        <p>
          <strong>📊 可视化图谱</strong>：自动生成交互式网络图谱，直观展示事实节点间的风险关系和社区结构。
        </p>

        <Header as="h2">工作流程</Header>
        <p>
          系统采用三阶段自动化处理流程：
        </p>
        <ol style={{ lineHeight: 2 }}>
          <li><strong>事实提取与资料映射</strong>：从案例文本中提取关键事实，并映射到相应的资料来源</li>
          <li><strong>通用标签生成</strong>：为每个事实生成标准化的通用标签</li>
          <li><strong>风险关系分析</strong>：识别标签间的风险勾稽关系，生成风险转移边</li>
        </ol>
        <p>
          处理完成后，系统自动生成网络图谱数据，并运行 Infomap 进行社区检测，最终在此可视化界面中展示。
        </p>

        <Header as="h2">图例说明</Header>
        <p>
          节点绘制为圆形，面积与其重要性成正比。节点边框粗细表示流出权重。
          节点之间的连线表示风险勾稽关系，线条粗细与风险流量成正比。
          不同颜色的模块表示通过社区检测算法识别出的风险社区。
        </p>
        <Image size="large">
          <Legend />
        </Image>

        <Header as="h2">导航操作</Header>
        <Header as="h3">缩放显示</Header>
        <p>
          使用鼠标滚轮或触控板双指滑动进行缩放。放大足够深入时可以显示子模块。
          请勿使用触控板的捏合缩放手势，这会缩放整个页面。
        </p>

        <Header as="h3">点击拖拽</Header>
        <p>
          在空白区域点击拖拽可以平移视图。拖拽节点或模块可以调整其位置。
          只能移动当前层级的元素，已展开子模块的节点无法移动。
        </p>

        <Header as="h3">节点信息</Header>
        <p>
          点击节点或模块可以选中它。选中节点的详细信息会显示在侧边栏的"选中节点"区域中。
        </p>
      </Grid.Column>
      <Grid.Column>
        <Header as="h2">技术架构</Header>
        <p>
          <strong>AI 智能体</strong>：基于 LangGraph 的多阶段工作流，使用本地 LLM 模型（Qwen2.5）进行自然语言处理。
        </p>
        <p>
          <strong>可视化引擎</strong>：基于 React + D3.js 的交互式网络图谱，支持层级缩放和物理模拟。
        </p>
        <p>
          <strong>社区检测</strong>：集成 Infomap 算法进行网络社区结构分析。
        </p>

        <Header as="h2">快速开始</Header>
        <p>
          <strong>1. 安装依赖</strong>
        </p>
        <code>
          <pre style={codeStyle}>
{`cd credit_rationing_tools/agent
pip install -r requirements.txt
ollama pull qwen2.5:14b`}
          </pre>
        </code>

        <p style={{ marginTop: 15 }}>
          <strong>2. 处理案例</strong>
        </p>
        <code>
          <pre style={codeStyle}>
{`python main.py run case.txt
# 输出：
# - fact_material_mapping.tsv
# - fact_label_mapping.tsv
# - risk_transfering_edge.tsv`}
          </pre>
        </code>

        <p style={{ marginTop: 15 }}>
          <strong>3. 生成可视化</strong>
        </p>
        <code>
          <pre style={codeStyle}>
{`./generate_bundle.sh
# 自动部署到 Network Navigator`}
          </pre>
        </code>

        <Header as="h2">输出文件说明</Header>
        <p>
          <strong>fact_material_mapping.tsv</strong>：事实节点与资料来源的映射关系
        </p>
        <p>
          <strong>fact_label_mapping.tsv</strong>：事实节点的通用标签分类
        </p>
        <p>
          <strong>risk_transfering_edge.tsv</strong>：标签间的风险勾稽关系和规则说明
        </p>

        <Header as="h2">系统要求</Header>
        <p>
          推荐使用最新版本的 Chrome、Safari 或 Firefox 浏览器。
          本应用具有图形密集型特性，较旧的计算机或集成 GPU 的笔记本电脑可能难以保持高帧率。
        </p>

        <Header as="h2">限制说明</Header>
        <p>
          当前每个模块最多显示 20 个最高权重的节点。支持的文件大小通常在几十兆字节范围内。
        </p>

        <Header as="h2">反馈与支持</Header>
        <p>
          如有任何问题、建议或反馈，欢迎通过以下方式联系：
        </p>
        <ul>
          <li>项目文档：credit_rationing_tools/agent/README.md</li>
          <li>快速开始：credit_rationing_tools/agent/QUICK_START.md</li>
          <li>安装指南：credit_rationing_tools/agent/INSTALLATION.md</li>
        </ul>

        <Header as="h2">数据格式</Header>
        <p>
          系统支持由 <a href="https://www.mapequation.org/code.html">Infomap</a> 生成的 <a
          href="https://www.mapequation.org/code.html#FTree-format">ftree</a> 格式网络数据。
        </p>
        <p>
          智能体处理完成后，会自动调用 Infomap 进行社区检测，并生成可视化所需的所有数据文件。
        </p>
      </Grid.Column>
    </Grid>
  </Container>;
};

export default Documentation;
