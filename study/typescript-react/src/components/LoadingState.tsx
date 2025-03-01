// src/components/LoadingState.tsx
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
  const containerStyle = fullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        zIndex: 1000,
      }
    : {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 0",
        width: "100%",
      };

  return (
    <div style={containerStyle as React.CSSProperties}>
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default LoadingState;

