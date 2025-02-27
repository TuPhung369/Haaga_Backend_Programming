import React, { useEffect, useState, useRef } from "react";

interface CustomWifiIconProps {
  priority: "High" | "Medium" | "Low";
}

const CustomWifiIcon: React.FC<CustomWifiIconProps> = ({ priority }) => {
  const [fillProgress, setFillProgress] = useState(0); // Control fill progress (0 to 1)
  const svgRef = useRef<SVGSVGElement>(null); // Ref for the SVG element

  let barCount: number;
  let filledCount: number;
  let color: string;

  switch (priority) {
    case "High":
      barCount = 9;
      filledCount = 9;
      color = "red";
      break;
    case "Medium":
      barCount = 9;
      filledCount = 7;
      color = "blue";
      break;
    case "Low":
    default:
      barCount = 9;
      filledCount = 7;
      color = "black";
      break;
  }

  const bars: JSX.Element[] = [];
  const barHeight = 2; // Height of each rectangle (constant)

  for (let i = 0; i < barCount; i++) {
    const width = 10 + i * 2; // Start at 10px, increase by 2px per bar
    const isFilled = i < Math.floor(filledCount * fillProgress); // Use fillProgress to determine filled bars

    // Each rectangle will be positioned from bottom to top
    const yPosition = 18 - i * 2; // Adjust this to control vertical positioning

    // Render the gray rectangle first (background)
    bars.push(
      <rect
        key={`gray-${i}`}
        x={12 - width / 2} // Center the rectangles horizontally
        y={yPosition}
        width={width}
        height={barHeight}
        fill="gray" // Always gray for the background
      />
    );

    // Render the filled rectangle over the gray one
    bars.push(
      <rect
        key={`fill-${i}`}
        x={12 - width / 2} // Center the rectangles horizontally
        y={yPosition}
        width={width}
        height={barHeight}
        fill={isFilled ? color : "none"} // Fill with color or leave empty based on progress
      />
    );
  }

  // Animation logic using useEffect
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    const animateFill = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 3000, 1);

      setFillProgress(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateFill);
      } else {
        // After reaching max, wait 1 second, then reset and restart
        setTimeout(() => {
          setFillProgress(0); // Reset to empty
          startTime = performance.now(); // Restart animation
          animationFrame = requestAnimationFrame(animateFill);
        }, 1500);
      }
    };

    animationFrame = requestAnimationFrame(animateFill);

    // Cleanup animation on unmount
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [priority]); // Re-run effect if priority changes

  return (
    <svg ref={svgRef} width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* Render all bars */}
      {bars}
    </svg>
  );
};

export default CustomWifiIcon;

