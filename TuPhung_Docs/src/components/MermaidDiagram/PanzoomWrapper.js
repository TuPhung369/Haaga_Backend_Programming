import React, { useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

const PanzoomWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const panzoomRef = useRef(null);
  const svgRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Default to true to prevent initialization until we check
  const [mobileScale, setMobileScale] = useState(1); // Track mobile scaling

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
        // First, ensure the viewport meta tag is set correctly for zooming
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          // Update existing viewport meta tag to ensure zoom is enabled
          viewportMeta.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
          );
        } else {
          // Create a new viewport meta tag if it doesn't exist
          viewportMeta = document.createElement("meta");
          viewportMeta.setAttribute("name", "viewport");
          viewportMeta.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
          );
          document.head.appendChild(viewportMeta);
        }

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

            // Add additional properties to ensure zooming works
            svgElement.style.touchAction = "pinch-zoom";
            svgElement.style.WebkitUserSelect = "text";
            svgElement.style.userSelect = "text";

            // Make sure the SVG is not preventing touch events
            svgElement.style.pointerEvents = "auto";

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

  // Touch event handling for mobile devices
  const [touchStartDistance, setTouchStartDistance] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

  // Calculate distance between two touch points
  const getDistance = (touch1, touch2) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Handle touch start event
  const handleTouchStart = (e) => {
    if (isTouchDevice && e.touches.length === 2) {
      // Two finger touch - potential pinch gesture
      const distance = getDistance(e.touches[0], e.touches[1]);
      setTouchStartDistance(distance);
      setInitialScale(mobileScale);
    }
  };

  // Handle touch move event
  const handleTouchMove = (e) => {
    if (isTouchDevice && e.touches.length === 2 && touchStartDistance) {
      // Calculate new scale based on finger distance change
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDistance / touchStartDistance;
      const newScale = Math.max(0.5, Math.min(5, initialScale * scaleFactor));

      setMobileScale(newScale);

      // Apply scale to SVG
      if (containerRef.current) {
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.transform = `scale(${newScale})`;
          svgElement.style.transformOrigin = "center center";
        }
      }

      // Prevent default to avoid browser's native zoom
      e.preventDefault();
    }
  };

  // Handle touch end event
  const handleTouchEnd = () => {
    setTouchStartDistance(null);
  };

  // Desktop zoom functions
  const zoomIn = () => {
    if (isTouchDevice) {
      // For mobile, use our custom zoom
      const newScale = Math.min(mobileScale + 0.2, 5);
      setMobileScale(newScale);

      if (containerRef.current) {
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.transform = `scale(${newScale})`;
          svgElement.style.transformOrigin = "center center";
        }
      }
    } else if (panzoomRef.current) {
      panzoomRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (isTouchDevice) {
      // For mobile, use our custom zoom
      const newScale = Math.max(mobileScale - 0.2, 0.5);
      setMobileScale(newScale);

      if (containerRef.current) {
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.transform = `scale(${newScale})`;
          svgElement.style.transformOrigin = "center center";
        }
      }
    } else if (panzoomRef.current) {
      panzoomRef.current.zoomOut();
    }
  };

  const resetZoom = () => {
    if (isTouchDevice) {
      // Reset mobile zoom
      setMobileScale(1);

      if (containerRef.current) {
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.transform = "scale(1)";
          svgElement.style.transformOrigin = "center center";
        }
      }
    } else if (panzoomRef.current) {
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
        // Enable pinch-zoom specifically
        touchAction: isTouchDevice ? "pinch-zoom" : "auto",
        // Add these properties to enable mobile zooming
        WebkitTextSizeAdjust: isTouchDevice ? "100%" : "none",
        WebkitTapHighlightColor: "rgba(0,0,0,0)",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          position: "relative",
          // Allow browser's native touch gestures on touch devices
          touchAction: isTouchDevice ? "pinch-zoom" : "none",
          // Enable content scaling on mobile
          WebkitOverflowScrolling: isTouchDevice ? "touch" : "auto",
          // Ensure content can be zoomed on mobile
          maxWidth: "100%",
          // Add these properties to enable pinch-zoom on mobile
          WebkitUserSelect: isTouchDevice ? "text" : "none",
          userSelect: isTouchDevice ? "text" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
      {/* Show zoom controls on all devices */}
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
    </div>
  );
};

export default PanzoomWrapper;

