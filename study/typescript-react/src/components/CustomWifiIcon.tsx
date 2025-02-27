// src/components/CustomWifiIcon.tsx
import React from "react";

interface CustomWifiIconProps {
  priority: "High" | "Medium" | "Low";
}

const CustomWifiIcon: React.FC<CustomWifiIconProps> = ({ priority }) => {
  let barCount: number;
  let filledCount: number;
  let colorClass: string;

  switch (priority) {
    case "High":
      barCount = 9;
      filledCount = 9;
      colorClass = "text-red-700";
      break;
    case "Medium":
      barCount = 9;
      filledCount = 7;
      colorClass = "text-blue-600";
      break;
    case "Low":
    default:
      barCount = 9;
      filledCount = 7;
      colorClass = "text-black";
      break;
  }

  const bars: JSX.Element[] = [];
  for (let i = 0; i < barCount; i++) {
    const width = 10 + i * 2; // Start at 2px, increase by 3px per bar
    const isFilled = i < filledCount;
    bars.push(
      <path
        key={i}
        d={`M${12 - width / 2} ${18 - i * 2} h${width} v2 h-${width} z`}
        fill={isFilled ? "currentColor" : "none"}
        stroke={isFilled ? "currentColor" : "gray"}
        strokeWidth={isFilled ? 0 : 1}
      />
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={colorClass}
    >
      {bars}
    </svg>
  );
};

export default CustomWifiIcon;

