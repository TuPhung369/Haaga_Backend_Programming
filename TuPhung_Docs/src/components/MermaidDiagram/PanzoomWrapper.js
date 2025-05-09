import React, { useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";

const PanzoomWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const panzoomRef = useRef(null);
  const svgRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Default to true to prevent initialization until we check
  const [mobileScale, setMobileScale] = useState(1); // Track mobile scaling

  // Check if device is a touch device (mobile, tablet, iPad, etc.) and screen size
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkDeviceAndScreenSize = () => {
      // Check if device has touch capability
      const hasTouchCapability =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;

      // Check screen size - only consider small screens as touch devices
      // This allows large touch screens (like Surface) to still use panzoom
      const smallScreen = window.innerWidth <= 1024;
      setIsSmallScreen(smallScreen);

      // Only disable panzoom on small touch screens (phones, tablets)
      const isSmallTouchDevice = hasTouchCapability && smallScreen;

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
    checkDeviceAndScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkDeviceAndScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkDeviceAndScreenSize);
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
    // Skip initialization on small screens completely
    if (isSmallScreen) {
      console.log(
        "PanzoomWrapper: Small screen detected, skipping Panzoom initialization"
      );
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
      // Initialize Panzoom only for desktop with standard options
      const panzoomOptions = {
        maxScale: 5,
        minScale: 0.5,
        step: 0.1,
        canvas: true,
        touch: false,
        disablePan: false, // Allow panning/dragging on desktop
        touchAction: "auto",
      };

      // Initialize Panzoom with the appropriate options
      const panzoom = Panzoom(svgElem, panzoomOptions);

      // Store Panzoom instance
      panzoomRef.current = panzoom;

      console.log("PanzoomWrapper: Initialized successfully for desktop");
      return true;
    } catch (error) {
      console.error("PanzoomWrapper: Error initializing panzoom", error);
      return false;
    }
  };

  useEffect(() => {
    if (isSmallScreen) {
      // For small screens, set up native browser zooming
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

      // Find the SVG element and apply styles to prevent dragging
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

          // Add a class to identify it
          svgElement.classList.add("no-drag-mobile");

          // Apply direct styles to prevent dragging but allow zooming
          svgElement.style.touchAction = "pinch-zoom";
          svgElement.style.userDrag = "none";
          svgElement.style.WebkitUserDrag = "none";
          svgElement.style.userSelect = "none";
          svgElement.style.WebkitUserSelect = "none";

          // Remove any transform that might interfere with zooming
          svgElement.style.transform = "none";

          // Add event listeners directly to the SVG to prevent dragging
          const preventDrag = (e) => {
            if (e.touches && e.touches.length === 1) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          };

          svgElement.addEventListener("touchmove", preventDrag, {
            passive: false,
          });

          console.log("PanzoomWrapper: Mobile native zoom enabled");

          // Clean up
          return () => {
            svgElement.removeEventListener("touchmove", preventDrag);
          };
        }
      }
    } else {
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
    }
  }, [isSmallScreen]);

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
    if (isSmallScreen) {
      if (e.touches.length === 2) {
        // Two finger touch - potential pinch gesture
        const distance = getDistance(e.touches[0], e.touches[1]);
        setTouchStartDistance(distance);
        setInitialScale(mobileScale);
      } else if (e.touches.length === 1) {
        // Single finger touch - potential drag gesture
        // Prevent drag behavior on mobile
        // We don't call preventDefault here as it would prevent all touch events
        // Instead we'll handle it in touchMove
      }
    }
  };

  // Handle touch move event
  const handleTouchMove = (e) => {
    if (isSmallScreen) {
      // On small screens, only allow pinch-zoom gestures, prevent panning/dragging
      if (e.touches.length === 2) {
        // This is a pinch gesture, let it through for zooming
        // Don't prevent default to allow zoom behavior
      } else if (e.touches.length === 1) {
        // This is a drag/pan gesture, prevent it completely
        // We need to prevent default here to stop any dragging
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  // Handle touch end event
  const handleTouchEnd = () => {
    setTouchStartDistance(null);
  };

  // Zoom functions for all devices
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
        // Only allow pinch-zoom on small screens, normal behavior on desktop
        touchAction: isSmallScreen ? "pinch-zoom" : "auto",
        WebkitTapHighlightColor: "rgba(0,0,0,0)",
        // Prevent dragging behavior only on small screens
        userDrag: isSmallScreen ? "none" : "auto",
        WebkitUserDrag: isSmallScreen ? "none" : "auto",
        // Additional properties for small screens
        ...(isSmallScreen && {
          // Prevent any transform that might enable dragging
          transform: "none",
          // Prevent any transition that might enable dragging
          transition: "none",
          // Prevent any animation that might enable dragging
          animation: "none",
        }),
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          position: "relative",
          // Only allow pinch-zoom on small screens, normal behavior on desktop
          touchAction: isSmallScreen ? "pinch-zoom" : "auto",
          // Ensure content can be zoomed on mobile
          maxWidth: "100%",
          // Prevent text selection
          WebkitUserSelect: "none",
          userSelect: "none",
          // Prevent dragging behavior only on small screens
          userDrag: isSmallScreen ? "none" : "auto",
          WebkitUserDrag: isSmallScreen ? "none" : "auto",
          // Prevent cursor changes that might suggest dragging only on small screens
          cursor: isSmallScreen ? "default" : "auto",
          // Additional properties to prevent dragging on mobile
          ...(isSmallScreen && {
            pointerEvents: "auto",
            touchAction: "pinch-zoom",
            WebkitTouchCallout: "none",
            WebkitOverflowScrolling: "touch",
            // Prevent any transform that might enable dragging
            transform: "none",
            // Prevent any transition that might enable dragging
            transition: "none",
            // Prevent any animation that might enable dragging
            animation: "none",
            // Disable pointer events for dragging
            pointerEvents: "none",
            // Re-enable pointer events for pinch-zoom
            touchAction: "pinch-zoom",
          }),
        }}
        // Always attach touch handlers, but they will have different behavior based on device type
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
      {/* Show zoom controls only on desktop devices */}
      {!isSmallScreen && (
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

