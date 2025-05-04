import React, { useEffect, useRef, useState } from "react";
import useIsBrowser from "@docusaurus/useIsBrowser";
import styles from "./styles.module.css";

/**
 * MermaidDiagram component for rendering Mermaid diagrams
 *
 * @param {Object} props Component properties
 * @param {string} props.chart The Mermaid diagram code
 * @returns {JSX.Element} The rendered diagram
 */
export default function MermaidDiagram({ chart }) {
  const ref = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const isBrowser = useIsBrowser();
  const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
  // Add a class to identify this is a mermaid diagram for CSS targeting

  useEffect(() => {
    if (!isBrowser) return;

    // Dynamically import mermaid only on the client side
    import("mermaid").then((mermaid) => {
      mermaid.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          curve: "linear",
        },
      });
      setInitialized(true);
    });
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser || !initialized || !ref.current) return;

    // Only render when we're in the browser and mermaid is initialized
    import("mermaid").then((mermaid) => {
      try {
        // Clear previous content
        ref.current.innerHTML = "";

        // Render new diagram
        mermaid.default.render(id, chart, (svgCode) => {
          if (ref.current) {
            // Force a minimum width to ensure scrolling is needed
            const minWidth = 600;
            
            // Create a wrapper div for the SVG
            const wrapperDiv = document.createElement('div');
            wrapperDiv.style.minWidth = `${minWidth}px`;
            wrapperDiv.style.display = 'inline-block';
            wrapperDiv.style.overflow = 'visible';
            wrapperDiv.innerHTML = svgCode;
            
            // Clear the container and append the wrapper
            ref.current.innerHTML = '';
            ref.current.appendChild(wrapperDiv);
            
            // Get the SVG element
            const svg = wrapperDiv.querySelector('svg');
            if (svg) {
              // Ensure SVG has minimum width
              if (parseInt(svg.getAttribute('width') || '0') < minWidth) {
                svg.setAttribute('width', `${minWidth}px`);
              }
              
              // Add inline styles to ensure visibility
              svg.style.overflow = 'visible';
              svg.style.maxWidth = '100%';
              svg.style.minWidth = `${minWidth}px`;
            }
          }
        });
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        if (ref.current) {
          ref.current.innerHTML = `<div class="${styles.errorMessage}">Error rendering diagram</div>`;
        }
      }
    });
  }, [chart, id, initialized, isBrowser]);

  // Show a loading state or placeholder when not in browser
  if (!isBrowser) {
    return (
      <div className={styles.diagramContainer}>
        <div className={styles.loadingMessage}>Loading diagram...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.diagramContainer} mermaid-wrapper`} ref={ref} />
  );
}

