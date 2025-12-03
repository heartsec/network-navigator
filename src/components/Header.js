import React from "react";
import "./Header.css";


const Header = () => (
  <header className="documentation">
    <div className="ui container">
      <div className="menu">
        <div>
          <h1 className="ui header">
            <div className="content">
              <span className="brand">
                <span className="brand-nn">信贷风险分析可视化系统</span>
              </span>
              <div className="sub header">基于 AI 智能体的信贷审查自动化分析与可视化平台</div>
            </div>
          </h1>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
