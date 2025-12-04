import React, { useState } from "react";
import { Card, Icon } from "semantic-ui-react";

export default function CaseRecordFloater(props) {
  const { caseRecord } = props;
  const [collapsed, setCollapsed] = useState(true);

  if (!caseRecord) return null;

  const {
    title = "贷审会记录",
    meetingNumber = "桃源支行 20251118-02号",
    creditAmount = "250万元",
    content = ""
  } = caseRecord;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 999,
        width: collapsed ? "280px" : "450px",
        maxWidth: "90vw",
        transition: "all 0.3s ease"
      }}
    >
      <Card
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          margin: 0
        }}
      >
        <Card.Content
          style={{
            padding: "10px 14px",
            backgroundColor: "#f8f9fa",
            cursor: "pointer",
            borderBottom: collapsed ? "none" : "2px solid #e0e0e0"
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            marginBottom: "3px"
          }}>
            <Icon name="file alternate" color="blue" size="small" />
            <strong style={{ fontSize: "0.95em", color: "#2185d0" }}>
              {title}
            </strong>
            {collapsed && (
              <span style={{
                marginLeft: "4px",
                padding: "2px 6px",
                backgroundColor: "#21ba45",
                color: "white",
                borderRadius: "3px",
                fontSize: "0.75em",
                fontWeight: "bold",
                whiteSpace: "nowrap"
              }}>
                {creditAmount}
              </span>
            )}
            <Icon
              name={collapsed ? "angle down" : "angle up"}
              style={{ marginLeft: "auto", cursor: "pointer", color: "#666" }}
              size="small"
            />
          </div>
          <div style={{ 
            fontSize: "0.7em", 
            color: "#666",
            marginTop: "2px"
          }}>
            会议编号：{meetingNumber}
          </div>
        </Card.Content>

        {!collapsed && (
          <Card.Content
            style={{
              padding: "14px",
              maxHeight: "60vh",
              overflowY: "auto",
              backgroundColor: "white"
            }}
          >
            <div style={{
              fontSize: "0.85em",
              lineHeight: "1.7",
              color: "#333",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {content}
            </div>
            <div style={{
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <span style={{
                padding: "5px 12px",
                backgroundColor: "#21ba45",
                color: "white",
                borderRadius: "4px",
                fontSize: "0.85em",
                fontWeight: "bold"
              }}>
                授信金额：{creditAmount}
              </span>
            </div>
          </Card.Content>
        )}
      </Card>
    </div>
  );
}
