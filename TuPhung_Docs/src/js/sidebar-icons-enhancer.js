/**
 * This script ensures that sidebar icons are properly applied to all items
 * and adds any dynamic behavior needed for the sidebar icons
 */
document.addEventListener("DOMContentLoaded", function () {
  // Add CSS to fix collapsed sidebar icons issue
  function addSidebarIconFixes() {
    // Create a style element if it doesn't exist
    let styleEl = document.getElementById("sidebar-icon-fix-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "sidebar-icon-fix-style";
      document.head.appendChild(styleEl);
    }

    // Add CSS rules to ensure hamburger menu is visible and other icons are hidden
    styleEl.textContent = `
      /* Hide the icons container when sidebar is collapsed */
      #plugin-sidebar:not(.active) .sidebar-icons-container {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      /* Hide all icons except the menu icon when sidebar is collapsed */
      #plugin-sidebar:not(.active) .sidebar-icon:not(.menu-icon) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      /* Make menu icon clearly visible in collapsed state */
      #plugin-sidebar:not(.active) .menu-icon {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 9999 !important;
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
      }
      
      /* Ensure no overflow in collapsed state */
      #plugin-sidebar:not(.active) .sidebar-title-content {
        overflow: hidden !important;
        width: 40px !important;
        height: 40px !important;
      }
      
      /* Show the icon container when sidebar is active */
      #plugin-sidebar.active .sidebar-icons-container {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        position: static !important;
        justify-content: space-evenly !important;
        width: 100% !important;
      }
    `;
  }

  // Fix icons directly through DOM manipulation
  function fixCollapsedSidebarIcons() {
    const sidebar = document.getElementById("plugin-sidebar");
    if (!sidebar) return;

    // Handle collapsed sidebar icon visibility
    if (!sidebar.classList.contains("active")) {
      // Hide icon container
      const iconContainer = sidebar.querySelector(".sidebar-icons-container");
      if (iconContainer) {
        iconContainer.style.cssText =
          "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; left: -9999px !important;";
      }

      // Make sure menu icon is visible and positioned correctly
      const menuIcon = sidebar.querySelector(".menu-icon");
      if (menuIcon) {
        menuIcon.style.cssText =
          "display: inline-block !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important; position: absolute !important; left: 3px !important; top: -3px !important; padding: 0 !important; margin: 0 !important;";
      }
    } else {
      // Show icon container when sidebar is active
      const iconContainer = sidebar.querySelector(".sidebar-icons-container");
      if (iconContainer) {
        iconContainer.style.cssText =
          "display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; position: static !important; justify-content: space-evenly !important; width: 100% !important;";
      }
    }
  }

  // Add the CSS fixes
  addSidebarIconFixes();

  // Run the fix on load, periodically, and on sidebar toggle
  fixCollapsedSidebarIcons();
  setInterval(fixCollapsedSidebarIcons, 500);

  // Function to enhance sidebar icons
  function enhanceSidebarIcons() {
    // Make sure all icons are properly sized and aligned
    const menuLinks = document.querySelectorAll(".menu__link");

    menuLinks.forEach((link) => {
      // Ensure proper alignment for all menu items
      link.style.display = "flex";
      link.style.alignItems = "center";

      // Add a subtle hover effect for all menu items
      link.addEventListener("mouseenter", function () {
        this.style.transition = "all 0.2s ease";
        this.style.transform = "translateX(2px)";
      });

      link.addEventListener("mouseleave", function () {
        this.style.transition = "all 0.2s ease";
        this.style.transform = "translateX(0)";
      });

      // Add the proper icon8 class based on URL pattern
      if (link.href) {
        const href = link.href.toLowerCase();
        let iconClass = null;

        // Determine the appropriate icon class based on URL
        if (href.includes("/intro")) {
          iconClass = "icon-intro";
        } else if (href.includes("/tech-stack")) {
          iconClass = "icon-tech-stack";
        } else if (href.includes("/architecture")) {
          iconClass = "icon-architecture";
        } else if (
          href.includes("/deployment") ||
          href.endsWith("/deployment") ||
          href.includes("deployment.html") ||
          href.includes("deployment.md")
        ) {
          iconClass = "icon-deployment";
        } else if (href.includes("/frontend")) {
          iconClass = "icon-frontend";
        } else if (href.includes("/backend")) {
          iconClass = "icon-backend";
        } else if (href.includes("/video")) {
          iconClass = "icon-video";
        } else if (href.includes("github.com")) {
          iconClass = "icon-github";
        }

        // If we found a matching icon class, add the icon
        if (iconClass && !link.querySelector(".footer-icon")) {
          const iconSpan = document.createElement("span");
          iconSpan.className = "footer-icon " + iconClass;
          link.insertBefore(iconSpan, link.firstChild);
        }
      }
    });

    // Add specific behavior for Frontend and Backend category children
    const frontendBackendItems = document.querySelectorAll(
      '.menu__link[href*="/docs/frontend/"], .menu__link[href*="/docs/backend/"]'
    );

    frontendBackendItems.forEach((item) => {
      // Add a subtle scale effect for the icons
      item.addEventListener("mouseenter", function () {
        const iconElement = this.querySelector("::before");
        if (iconElement) {
          iconElement.style.transform = "scale(1.1)";
        }
      });

      item.addEventListener("mouseleave", function () {
        const iconElement = this.querySelector("::before");
        if (iconElement) {
          iconElement.style.transform = "scale(1)";
        }
      });
    });
  }

  // Call the function when the page loads
  enhanceSidebarIcons();

  // Also call the function when the sidebar is updated (for SPA navigation)
  const sidebarContainer = document.querySelector(
    ".theme-doc-sidebar-container"
  );
  if (sidebarContainer) {
    const observer = new MutationObserver(enhanceSidebarIcons);
    observer.observe(sidebarContainer, { childList: true, subtree: true });
  }

  // Observe the custom sidebar for changes and fix the icons display
  function observeCustomSidebar() {
    const customSidebar = document.getElementById("plugin-sidebar");
    if (!customSidebar) {
      // If sidebar isn't found yet, try again soon
      setTimeout(observeCustomSidebar, 500);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      fixCollapsedSidebarIcons();
    });

    // Observe changes to the class attribute
    observer.observe(customSidebar, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Start observing the custom sidebar
  observeCustomSidebar();
});

