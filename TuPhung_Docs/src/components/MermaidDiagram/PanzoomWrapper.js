import React, { useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

const PanzoomWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const panzoomRef = useRef(null);
  const svgRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

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
    // Skip initialization on mobile devices as they have native touch zoom
    if (isMobile) {
      return false;
    }

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

    // Avoid re-initializing if the SVG hasn't changed
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

    // Không thêm wheel event listener để vô hiệu hóa zoom bằng chuột
    // Chỉ sử dụng các nút zoom thay vì wheel

    console.log(
      "PanzoomWrapper: Initialized successfully (mouse wheel zoom and panning disabled)"
    );

    return true;
  };

  useEffect(() => {
    // Initial attempt to initialize Panzoom (will be skipped on mobile)
    if (!initializePanzoom()) {
      // Only attempt to initialize on non-mobile devices
      if (!isMobile) {
        const interval = setInterval(() => {
          if (initializePanzoom()) {
            clearInterval(interval);
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 5000);
      }
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
      if (panzoomRef.current) {
        panzoomRef.current.destroy();
        panzoomRef.current = null;
      }
    };
  }, [isMobile]);

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
    <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
      <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
        {children}
      </div>
      {!isMobile && (
        <div
          style={{
            position: "absolute",
            top: "0px",
            right: "5px",
            left: "auto", // Ensure it's not placed on the left
            zIndex: 10,
            display: "flex",
            flexDirection: "row",
            gap: "8px",
            background: "transparent",
            transform: "none", // Ensure no transform is applied
            margin: 0, // Ensure no margin
            padding: 0, // Ensure no padding
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
      )}
    </div>
  );
};

export default PanzoomWrapper;

