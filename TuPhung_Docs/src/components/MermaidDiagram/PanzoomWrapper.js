import React, { useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

const PanzoomWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const panzoomRef = useRef(null);
  const svgRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check initial theme and observe changes
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkMode(theme === "dark");
    };

    // Check initial theme
    checkTheme();

    // Setup observer for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const initializePanzoom = () => {
    const elem = containerRef.current;
    if (!elem) {
      console.error("PanzoomWrapper: Container element not found");
      return false;
    }

    const svgElem = elem.querySelector("svg");
    if (!svgElem) {
      console.warn("PanzoomWrapper: SVG element not found, retrying...");
      return false;
    }

    // Avoid re-initializing if the SVG hasn’t changed
    if (svgRef.current === svgElem && panzoomRef.current) {
      return true;
    }

    svgRef.current = svgElem;

    // Initialize or re-initialize Panzoom
    const panzoom = Panzoom(svgElem, {
      maxScale: 5,
      minScale: 0.5,
      step: 0.1,
      canvas: true,
    });

    // Store Panzoom instance
    panzoomRef.current = panzoom;

    // Add wheel event listener
    const wheelHandler = (event) => {
      panzoom.zoomWithWheel(event);
    };
    svgElem.addEventListener("wheel", wheelHandler);

    console.log("PanzoomWrapper: Initialized successfully");

    // Store wheel handler for cleanup
    svgElem.__wheelHandler = wheelHandler;

    return true;
  };

  useEffect(() => {
    // Initial attempt to initialize Panzoom
    if (!initializePanzoom()) {
      const interval = setInterval(() => {
        if (initializePanzoom()) {
          clearInterval(interval);
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }

    // Listen for theme changes
    const themeObserver = new MutationObserver(() => {
      console.log("PanzoomWrapper: Theme change detected, re-initializing...");
      initializePanzoom();
    });

    // Observe changes to the data-theme attribute on the document element
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Cleanup
    return () => {
      themeObserver.disconnect();
      if (svgRef.current && svgRef.current.__wheelHandler) {
        svgRef.current.removeEventListener(
          "wheel",
          svgRef.current.__wheelHandler
        );
        delete svgRef.current.__wheelHandler;
      }
      if (panzoomRef.current) {
        panzoomRef.current.destroy();
        panzoomRef.current = null;
      }
    };
  }, []);

  const zoomIn = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (panzoomRef.current) {
      panzoomRef.current.zoomOut();
    }
  };

  const resetZoom = () => {
    if (panzoomRef.current) {
      panzoomRef.current.reset();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef}>{children}</div>
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          background: "transparent",
        }}
      >
        <button
          onClick={zoomIn}
          className="panzoom-button"
          title="Zoom In"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            background: "transparent",
            border: "1px solid var(--border-color, rgba(0, 0, 0, 0.1))",
            borderRadius: "4px",
            cursor: "pointer",
            color: isDarkMode ? "#ffffff" : "#000000",
            backdropFilter: "blur(2px)",
            transition: "all 0.2s ease",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ➕
        </button>
        <button
          onClick={zoomOut}
          className="panzoom-button"
          title="Zoom Out"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            background: "transparent",
            border: "1px solid var(--border-color, rgba(0, 0, 0, 0.1))",
            borderRadius: "4px",
            cursor: "pointer",
            color: isDarkMode ? "#ffffff" : "#000000",
            backdropFilter: "blur(2px)",
            transition: "all 0.2s ease",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ➖
        </button>
        <button
          onClick={resetZoom}
          className="panzoom-button"
          title="Reset"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            background: "transparent",
            border: "1px solid var(--border-color, rgba(0, 0, 0, 0.1))",
            borderRadius: "4px",
            cursor: "pointer",
            color: isDarkMode ? "#ffffff" : "#000000",
            backdropFilter: "blur(2px)",
            transition: "all 0.2s ease",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default PanzoomWrapper;

