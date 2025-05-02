/**
 * Mermaid Gantt Chart Enhancer
 *
 * This script improves the display and interaction of Mermaid Gantt charts
 * by adding containers, responsive adjustments, and interactive features.
 */

(function () {
  // Execute when DOM is fully loaded
  document.addEventListener("DOMContentLoaded", function () {
    // Wait a bit for Mermaid to render
    setTimeout(enhanceGanttCharts, 1000);

    // Also enhance on window resize
    window.addEventListener("resize", debounce(enhanceGanttCharts, 250));
  });

  /**
   * Debounce function to limit how often a function is called
   */
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  /**
   * Main function to enhance Gantt charts
   */
  function enhanceGanttCharts() {
    // Find all Gantt charts
    const ganttCharts = document.querySelectorAll(".mermaid:has(svg.gantt)");

    ganttCharts.forEach(function (chart) {
      // Skip if already enhanced
      if (chart.parentElement.classList.contains("mermaid-gantt-container")) {
        return;
      }

      // Enhance task text visibility
      const taskTexts = chart.querySelectorAll(".taskText");
      taskTexts.forEach((text) => {
        // Add text shadow for better visibility
        text.style.textShadow =
          "0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white";
        text.style.fontWeight = "bold";
        text.style.fontSize = "12px";
      });

      // Make Deployment section tasks more transparent
      setTimeout(() => {
        const deploymentTasks = chart.querySelectorAll(".section4 rect");
        deploymentTasks.forEach((task) => {
          // Get current fill color and make it more transparent
          const currentFill = task.getAttribute("fill");
          if (currentFill) {
            // Extract RGB values and create a more transparent version
            const rgbaMatch = currentFill.match(
              /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
            );
            if (rgbaMatch) {
              const r = rgbaMatch[1];
              const g = rgbaMatch[2];
              const b = rgbaMatch[3];
              const a = rgbaMatch[4] || 1;
              // Make it more transparent (50% of current opacity)
              const newOpacity = parseFloat(a) * 0.5;
              task.setAttribute(
                "fill",
                `rgba(${r}, ${g}, ${b}, ${newOpacity})`
              );
            }
          }
        });

        // Make task4 match Analytics Engine color
        const task4Elements = chart.querySelectorAll(".task.task4 rect");
        task4Elements.forEach((task) => {
          // Apply Analytics Engine color to task4 elements
          task.setAttribute("fill", "rgba(158, 158, 158, 0.6)");
          task.setAttribute("stroke", "#757575");
        });

        // Find and style deploy tasks by ID
        const allTasks = chart.querySelectorAll(".task, g[class*='task']");
        allTasks.forEach((taskElement) => {
          // Check if the task has an ID or data-id containing "deploy"
          const taskId = taskElement.id || "";
          const dataId = taskElement.getAttribute("data-id") || "";

          if (
            taskId.toLowerCase().includes("deploy") ||
            dataId.toLowerCase().includes("deploy") ||
            taskId.toLowerCase().includes("deployed") ||
            dataId.toLowerCase().includes("deployed")
          ) {
            const rectElement = taskElement.querySelector("rect");
            if (rectElement) {
              rectElement.setAttribute("fill", "rgba(158, 158, 158, 0.6)");
              rectElement.setAttribute("stroke", "#757575");
            }

            const textElement = taskElement.querySelector(".taskText");
            if (textElement) {
              textElement.style.fontWeight = "700";
              textElement.style.textShadow =
                "0 0 4px white, 0 0 4px white, 0 0 4px white, 0 0 4px white";
            }
          }
        });

        // Also look for any text containing "deploy" in the task text
        const allTaskTexts = chart.querySelectorAll(".taskText");
        allTaskTexts.forEach((textElement) => {
          if (textElement.textContent.toLowerCase().includes("deploy") || 
              textElement.textContent.toLowerCase().includes("deployed")) {
            // Find the parent task element
            let taskElement =
              textElement.closest(".task") || textElement.parentElement;
            if (taskElement) {
              const rectElement = taskElement.querySelector("rect");
              if (rectElement) {
                rectElement.setAttribute("fill", "rgba(158, 158, 158, 0.6)");
                rectElement.setAttribute("stroke", "#757575");
              }

              textElement.style.fontWeight = "700";
              textElement.style.textShadow =
                "0 0 4px white, 0 0 4px white, 0 0 4px white, 0 0 4px white";
            }
          }
        });
      }, 500); // Small delay to ensure the chart is fully rendered

      // Create container
      const container = document.createElement("div");
      container.className = "mermaid-gantt-container";

      // Wrap chart in container
      chart.parentNode.insertBefore(container, chart);
      container.appendChild(chart);

      // Add class to the chart for specific styling
      chart.classList.add("gantt");

      // Get the SVG element
      const svg = chart.querySelector("svg");
      if (!svg) return;

      // Increase SVG height
      const currentHeight = parseInt(svg.getAttribute("height") || "300");
      svg.setAttribute("height", Math.max(currentHeight, 600));

      // Make SVG responsive
      svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
      svg.setAttribute("width", "100%");

      // Enhance axis labels
      const axisLabels = svg.querySelectorAll(".tick text");
      axisLabels.forEach((label) => {
        label.setAttribute("font-size", "24px");
        label.setAttribute("font-weight", "bold");
        label.setAttribute("dy", "1em");
        label.setAttribute("text-anchor", "middle");

        // Make month names uppercase for better visibility
        if (label.textContent) {
          label.textContent = label.textContent.toUpperCase();
        }

        // Add a subtle text shadow for better contrast
        label.setAttribute(
          "filter",
          "drop-shadow(0px 1px 1px rgba(0,0,0,0.2))"
        );
      });

      // Adjust for mobile if needed
      if (window.innerWidth <= 768) {
        adjustForMobile(svg);
      }

      // Add zoom controls if not already added
      if (!container.querySelector(".gantt-zoom-controls")) {
        addZoomControls(container, svg);
      }
    });
  }

  /**
   * Adjusts Gantt chart for mobile display
   */
  function adjustForMobile(svg) {
    // Find all text elements in the axis
    const axisTexts = svg.querySelectorAll(".tick text");

    // Rotate text elements to prevent overlap
    axisTexts.forEach(function (text) {
      text.setAttribute("transform", "rotate(-45)");
      text.setAttribute("text-anchor", "end");
      text.setAttribute("x", "-10");
      text.setAttribute("y", "10");
      text.setAttribute("font-size", "20px");
    });

    // Hide every other label on very small screens
    if (window.innerWidth <= 480) {
      Array.from(axisTexts).forEach((text, index) => {
        if (index % 2 !== 0) {
          text.style.display = "none";
        }
      });
    }
  }

  /**
   * Adds zoom controls to the Gantt chart
   */
  function addZoomControls(container, svg) {
    // Create zoom controls
    const controls = document.createElement("div");
    controls.className = "gantt-zoom-controls";
    controls.innerHTML = `
      <button class="gantt-zoom-in" title="Zoom In">+</button>
      <button class="gantt-zoom-out" title="Zoom Out">-</button>
      <button class="gantt-zoom-reset" title="Reset Zoom">Reset</button>
    `;

    // Style the controls
    controls.style.position = "absolute";
    controls.style.top = "10px";
    controls.style.right = "10px";
    controls.style.display = "flex";
    controls.style.gap = "5px";
    controls.style.zIndex = "10";

    // Style the buttons
    const buttons = controls.querySelectorAll("button");
    buttons.forEach((button) => {
      button.style.padding = "5px 10px";
      button.style.background = "var(--ifm-color-primary)";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.cursor = "pointer";
      button.style.fontSize = "14px";
      button.style.fontWeight = "bold";

      // Add hover effect
      button.addEventListener("mouseenter", function () {
        this.style.background = "var(--ifm-color-primary-dark)";
      });

      button.addEventListener("mouseleave", function () {
        this.style.background = "var(--ifm-color-primary)";
      });
    });

    // Add controls to container
    container.style.position = "relative";
    container.appendChild(controls);

    // Initialize zoom state
    let currentZoom = 1;
    const zoomStep = 0.1;
    const minZoom = 0.5;
    const maxZoom = 2;

    // Apply zoom function
    function applyZoom() {
      const ganttContent = svg.querySelector("g");
      if (ganttContent) {
        ganttContent.style.transform = `scale(${currentZoom})`;
        ganttContent.style.transformOrigin = "left top";
      }
    }

    // Add event listeners for zoom controls
    controls
      .querySelector(".gantt-zoom-in")
      .addEventListener("click", function () {
        if (currentZoom < maxZoom) {
          currentZoom += zoomStep;
          applyZoom();
        }
      });

    controls
      .querySelector(".gantt-zoom-out")
      .addEventListener("click", function () {
        if (currentZoom > minZoom) {
          currentZoom -= zoomStep;
          applyZoom();
        }
      });

    controls
      .querySelector(".gantt-zoom-reset")
      .addEventListener("click", function () {
        currentZoom = 1;
        applyZoom();
      });
  }
})();

