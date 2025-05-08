import React, { useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

const PanzoomWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const panzoomRef = useRef(null);
  const svgRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Default to true to prevent initialization until we check

  // Check if device is a touch device (mobile, tablet, iPad, etc.)
  useEffect(() => {
    const checkIfTouchDevice = () => {
      // Check if device has touch capability
      const hasTouchCapability =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;

      // Check screen size - only consider small screens as touch devices
      // This allows large touch screens (like Surface) to still use panzoom
      const isSmallScreen = window.innerWidth <= 1024;

      // Only disable panzoom on small touch screens (phones, tablets)
      const isSmallTouchDevice = hasTouchCapability && isSmallScreen;

      setIsTouchDevice(isSmallTouchDevice);

      if (isSmallTouchDevice) {
        console.log(
          "PanzoomWrapper: Small touch device detected, panzoom disabled"
        );
      } else if (hasTouchCapability) {
        console.log(
          "PanzoomWrapper: Large touch device detected, panzoom enabled"
        );
      }
    };

    // Check on initial load
    checkIfTouchDevice();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfTouchDevice);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfTouchDevice);
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
    // Skip initialization on touch devices completely
    if (isTouchDevice) {
      return false;
    }

    const elem = containerRef.current;
    if (!elem) {
      console.error("PanzoomWrapper: Container element not found");
      return false;
    }

    // Try to find SVG with a more robust approach
    const svgElem = elem.querySelector("svg");
    if (!svgElem) {
      // Don't log warning to avoid console spam
      return false;
    }

    // Avoid re-initializing if the SVG hasn't changed
    if (svgRef.current === svgElem && panzoomRef.current) {
      return true;
    }

    svgRef.current = svgElem;

    try {
      // Initialize or re-initialize Panzoom
      const panzoom = Panzoom(svgElem, {
        maxScale: 5,
        minScale: 0.5,
        step: 0.1,
        canvas: true,
        // Disable panzoom's handling of touch events to allow native browser behavior
        touch: false,
        // Set this to false to prevent panzoom from capturing all pointer events
        disablePan: false,
        // Allow browser's native touch gestures
        touchAction: "auto",
      });

      // Store Panzoom instance
      panzoomRef.current = panzoom;

      console.log(
        "PanzoomWrapper: Initialized successfully for desktop/large screens"
      );
      return true;
    } catch (error) {
      console.error("PanzoomWrapper: Error initializing panzoom", error);
      return false;
    }
  };

  useEffect(() => {
    // Don't even try to initialize on touch devices
    if (isTouchDevice) {
      // For touch devices, we'll just make sure the SVG is properly set up for native browser zooming
      const setupMobileZoom = () => {
        if (containerRef.current) {
          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            // Make SVG responsive
            if (!svgElement.getAttribute("viewBox")) {
              const width = svgElement.getAttribute("width") || "100%";
              const height = svgElement.getAttribute("height") || "100%";
              svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
              svgElement.setAttribute("width", "100%");
              svgElement.setAttribute("height", "auto");
            }

            // Remove any transform that might interfere with native zooming
            svgElement.style.transform = "none";

            console.log(
              "PanzoomWrapper: Mobile native zoom enabled for touch device"
            );
            return true;
          }
        }
        return false;
      };

      // Try to set up mobile zoom
      if (!setupMobileZoom()) {
        // Retry a few times if SVG isn't immediately available
        let attempts = 0;
        const maxAttempts = 10;

        const interval = setInterval(() => {
          attempts++;
          if (setupMobileZoom() || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 300);

        // Cleanup interval after a maximum time
        setTimeout(() => clearInterval(interval), 3000);
      }

      return;
    }

    // For desktop devices, initialize Panzoom
    if (!initializePanzoom()) {
      // Only retry a few times to avoid infinite loops
      let attempts = 0;
      const maxAttempts = 10;

      const interval = setInterval(() => {
        attempts++;
        if (initializePanzoom() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 300);

      // Cleanup interval after a maximum time
      setTimeout(() => clearInterval(interval), 3000);
    }

    // Cleanup
    return () => {
      if (panzoomRef.current) {
        try {
          panzoomRef.current.destroy();
        } catch (e) {
          console.error("Error destroying panzoom", e);
        }
        panzoomRef.current = null;
      }
    };
  }, [isTouchDevice]);

  // Desktop zoom functions only

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

  // Common button style for both desktop and mobile
  const buttonStyle = {
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
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "visible",
        // Enable standard touch behavior
        touchAction: "auto",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          position: "relative",
          // Allow browser's native touch gestures on touch devices
          touchAction: isTouchDevice ? "auto" : "none",
          // Enable content scaling on mobile
          WebkitOverflowScrolling: isTouchDevice ? "touch" : "auto",
          // Ensure content can be zoomed on mobile
          maxWidth: "100%",
        }}
      >
        {children}
      </div>

      {/* Only show zoom controls on desktop devices */}
      {!isTouchDevice && (
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
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            ➕
          </button>
          <button
            onClick={zoomOut}
            className="panzoom-button"
            title="Zoom Out"
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            ➖
          </button>
          <button
            onClick={resetZoom}
            className="panzoom-button"
            title="Reset"
            style={buttonStyle}
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

