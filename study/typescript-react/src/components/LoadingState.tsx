import React, { useState, useEffect, useMemo, ReactNode } from "react";

const SHAPE_COLORS = [
  "#FF6B6B", // Vibrant Red
  "#4ECDC4", // Teal
  "#45B7D1", // Sky Blue
  "#FDCB6E", // Soft Yellow
  "#6C5CE7", // Purple
  "#A8E6CF", // Mint Green
  "#FF8ED4", // Pink
  "#FAD390", // Pale Orange
];

interface LoadingStateProps {
  tip?: string;
  fullscreen?: boolean;
  buttonMode?: boolean;
  children?: ReactNode;
  isLoading?: boolean;
  size?: "small" | "medium" | "large";
  color?: string;
  className?: string;
  tipChangeSpeed?: number; // New prop to control tip change speed
}

const LoadingState: React.FC<LoadingStateProps> = ({
  fullscreen = true,
  tip = "Preparing something amazing...",
  buttonMode = false,
  children,
  isLoading = false,
  size = "medium",
  color,
  className = "",
  tipChangeSpeed = 20, // Default value: higher = slower change
}) => {
  const [shapeProgress, setShapeProgress] = useState(0);
  const [shapeType, setShapeType] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentQuote, setCurrentQuote] = useState(tip);
  const [currentColor, setCurrentColor] = useState(color || SHAPE_COLORS[0]);
  const [backgroundColors, setBackgroundColors] = useState({
    color1: SHAPE_COLORS[0],
    color2: SHAPE_COLORS[1],
  });
  // We'll use a ref instead of state since we don't need to trigger re-renders with this counter
  const tipChangeCounter = React.useRef(0);

  // Animated quotes for variety (slower quote rotation)
  const loadingQuotes = useMemo(
    () => [
      tip,
      "Brewing digital magic...",
      "Assembling pixel puzzles...",
      "Charging creativity circuits...",
      "Unleashing innovation...",
      "Connecting the digital dots...",
    ],
    [tip]
  );

  // Shape and position animation
  useEffect(() => {
    if (!buttonMode && (fullscreen || isLoading)) {
      const animationTimer = setInterval(() => {
        // Progress shape morphing
        setShapeProgress((prev) => {
          if (prev >= 1) {
            // Reset progress and change shape/color when complete
            setShapeType((prevType) => (prevType + 1) % 4);
            const newColor =
              SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];
            setCurrentColor(newColor);

            // Update background colors
            setBackgroundColors((prev) => ({
              color1: prev.color2,
              color2: newColor,
            }));

            return 0;
          }
          return prev + 0.02;
        });

        // Smooth, constrained movement for shapes
        setPosition({
          x: Math.sin(Date.now() * 0.0005) * 200 - 100, // Wider horizontal movement
          y: Math.cos(Date.now() * 0.0005) * 100, // Move below text area
        });

        // Only change the quote occasionally based on tipChangeSpeed
        tipChangeCounter.current += 1;

        // Only change quote when counter reaches the specified speed
        if (tipChangeCounter.current >= tipChangeSpeed) {
          setCurrentQuote(
            loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)]
          );
          tipChangeCounter.current = 0; // Reset counter
        }
      }, 100);

      return () => clearInterval(animationTimer);
    }
  }, [loadingQuotes, buttonMode, fullscreen, isLoading, tipChangeSpeed]);

  // Calculate shape morphing
  const calculatePath = (progress: number) => {
    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;

    // Different shape transformations
    switch (shapeType) {
      case 0: {
        // Square to Circle
        const t1 = progress * 2;
        const cornerRadius = t1 * (size / 2);
        return `
          M${cornerRadius},0 
          H${size - cornerRadius} 
          Q${size},0 ${size},${cornerRadius} 
          V${size - cornerRadius} 
          Q${size},${size} ${size - cornerRadius},${size} 
          H${cornerRadius} 
          Q0,${size} 0,${size - cornerRadius} 
          V${cornerRadius} 
          Q0,0 ${cornerRadius},0
        `;
      }

      case 1: {
        // Circle to Triangle
        const radius = size / 2;
        const angle1 = Math.PI * 1.5 - progress * Math.PI * 2;
        const angle2 = Math.PI * 1.5;
        const angle3 = Math.PI * 1.5 + progress * Math.PI * 2;

        return `
          M${centerX + radius * Math.cos(angle1)},${
          centerY + radius * Math.sin(angle1)
        }
          L${centerX + radius * Math.cos(angle2)},${
          centerY + radius * Math.sin(angle2)
        }
          L${centerX + radius * Math.cos(angle3)},${
          centerY + radius * Math.sin(angle3)
        }
          Z
        `;
      }

      case 2: {
        // Triangle to Pentagon
        const pentagonRadius = size / 2;
        const pentagonRotation = progress * Math.PI * 2;
        const pentagonPoints =
          Array.from({ length: 5 }, (_, i) => {
            const angle = (i * 2 * Math.PI) / 5 + pentagonRotation;
            return `${i === 0 ? "M" : "L"}${
              centerX + pentagonRadius * Math.cos(angle)
            },${centerY + pentagonRadius * Math.sin(angle)}`;
          }).join(" ") + " Z";

        return pentagonPoints;
      }

      case 3: {
        // Pentagon to Hexagon
        const hexagonRadius = size / 2;
        const hexagonRotation = progress * Math.PI * 2;
        const hexagonPoints =
          Array.from({ length: 6 }, (_, i) => {
            const angle = (i * 2 * Math.PI) / 6 + hexagonRotation;
            return `${i === 0 ? "M" : "L"}${
              centerX + hexagonRadius * Math.cos(angle)
            },${centerY + hexagonRadius * Math.sin(angle)}`;
          }).join(" ") + " Z";

        return hexagonPoints;
      }

      default:
        return "";
    }
  };

  // Button mode styles
  if (buttonMode) {
    const spinnerSize = size === "small" ? 16 : size === "medium" ? 24 : 32;

    return (
      <div
        className={`loading-button-wrapper ${className}`}
        style={{ position: "relative", display: "inline-block" }}
      >
        {children}

        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "inherit",
            }}
          >
            <div
              className="loading-spinner"
              style={{
                width: `${spinnerSize}px`,
                height: `${spinnerSize}px`,
                borderRadius: "50%",
                border: `3px solid ${currentColor}`,
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Fullscreen mode styles - Fixed style properties to avoid conflicts
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    height: fullscreen ? "100vh" : "400px",
    width: fullscreen ? "100vw" : "100%",
    backgroundImage: `linear-gradient(45deg, ${backgroundColors.color1}, ${backgroundColors.color2})`,
    backgroundSize: "400% 400%",
    position: fullscreen ? "fixed" : "relative",
    top: 0,
    left: 0,
    zIndex: 9999,
    overflow: "hidden",
    animation: "shimmerBackground 15s ease infinite",
    paddingTop: "0", // Adjust top padding
  };

  return (
    <div style={containerStyle}>
      {/* Dynamic Shape - Moved higher up */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        style={{
          position: "absolute",
          top: `calc(+400px + ${position.y}px)`,
          left: `calc(50% + ${position.x}px)`,
          transform: "translateX(-50%)",
          transition: "transform 0.1s linear",
          zIndex: 1,
        }}
      >
        <path
          d={calculatePath(shapeProgress)}
          fill={currentColor}
          fillOpacity="0.5"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
        />
      </svg>

      {/* Content Container - Moved lower down */}
      <div
        style={{
          textAlign: "center",
          color: "white",
          zIndex: 10,
          padding: "20px 20px 40px", // Increased bottom padding
          width: "100%",
          marginTop: "100px", // Moved down
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "15px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            animation: "pulse 10s infinite",
            color: "white",
          }}
        >
          {currentQuote}
        </h1>

        {/* Loading Dots */}
        <div>
          <span
            style={{
              fontSize: "1.5rem",
              animation: "bounce 1s infinite",
              color: "white",
            }}
          >
            Loading{".".repeat(Math.floor(Date.now() / 500) % 4)}
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmerBackground {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;

