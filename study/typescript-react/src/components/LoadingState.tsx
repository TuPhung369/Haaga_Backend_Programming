import React from "react";
import { Spin } from "antd";

interface LoadingStateProps {
  size?: "small" | "default" | "large";
  tip?: string;
  fullscreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = "large",
  tip = "Loading...",
  fullscreen = false,
}) => {
  // If fullscreen, use the Spin's built-in fullscreen mode
  if (fullscreen) {
    return <Spin size={size} tip={tip} fullscreen />;
  }

  // Otherwise use the nested pattern - create a placeholder div
  // and wrap it with Spin
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 0",
        width: "100%",
        minHeight: "200px",
      }}
    >
      <Spin size={size} tip={tip} spinning={true}>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "200px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        ></div>
      </Spin>
    </div>
  );
};

export default LoadingState;
