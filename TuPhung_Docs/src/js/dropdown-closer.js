// This script ensures dropdowns close when a menu item is clicked
// and adds some UI enhancements
document.addEventListener("DOMContentLoaded", function () {
  // Function to close all dropdowns
  function closeAllDropdowns() {
    const dropdownButtons = document.querySelectorAll(
      ".navbar__link.dropdown__link"
    );
    dropdownButtons.forEach((button) => {
      const ariaExpanded = button.getAttribute("aria-expanded");
      if (ariaExpanded === "true") {
        button.click(); // This will close the dropdown
      }
    });
  }

  // Add click event listeners to all dropdown links
  function setupDropdownCloser() {
    // Select ALL links inside dropdown menus - both native and custom HTML links
    const dropdownLinks = document.querySelectorAll(
      ".dropdown__menu a, .dropdown__menu .dropdown__link"
    );

    dropdownLinks.forEach((link) => {
      // Skip if it's a dropdown toggle button or section header
      if (
        !link.classList.contains("dropdown__link--active-trail") &&
        !link.closest(".dropdown-section-header")
      ) {
        // Remove existing listeners to prevent duplicates
        link.removeEventListener("click", handleDropdownLinkClick);
        // Add new listener
        link.addEventListener("click", handleDropdownLinkClick);
      }
    });

    // Also handle doc links specifically (they might have different structure)
    const docLinks = document.querySelectorAll(
      '.dropdown__menu .menu__link, .dropdown__menu [class*="docLink"], .dropdown__menu a[href*="/video/"]'
    );

    docLinks.forEach((link) => {
      link.removeEventListener("click", handleDropdownLinkClick);
      link.addEventListener("click", handleDropdownLinkClick);
    });

    // Specifically handle video dropdown links
    const videoLinks = document.querySelectorAll(
      '.dropdown__menu a[href*="/docs/video/project-video#"]'
    );
    videoLinks.forEach((link) => {
      link.removeEventListener("click", handleVideoDropdownLinkClick);
      link.addEventListener("click", handleVideoDropdownLinkClick);
    });
  }

  // Handler function for dropdown link clicks
  function handleDropdownLinkClick(e) {
    // Add a subtle ripple effect
    const ripple = document.createElement("span");
    ripple.classList.add("dropdown-link-ripple");
    this.appendChild(ripple);

    // Position the ripple where the click happened
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    // Remove the ripple after animation completes
    setTimeout(() => {
      if (ripple && ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);

    // Close all dropdowns after a small delay to allow navigation
    setTimeout(closeAllDropdowns, 10);

    // Force close dropdown by clicking outside
    setTimeout(() => {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.body.dispatchEvent(clickEvent);
    }, 50);
  }

  // Add ripple effect styles
  function addRippleStyles() {
    if (!document.getElementById("ripple-styles")) {
      const style = document.createElement("style");
      style.id = "ripple-styles";
      style.textContent = `
        .dropdown-link-ripple {
          position: absolute;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }
        
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        html[data-theme='dark'] .dropdown-link-ripple {
          background: rgba(255, 255, 255, 0.15);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Enhance category pages
  function enhanceCategoryPages() {
    // Check if we're on a category page
    const categoryHeading = document.querySelector(
      ".docCategoryGeneratedIndexHeading"
    );
    if (categoryHeading) {
      // Add animation classes to cards
      const cards = document.querySelectorAll(".card");
      cards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        card.style.transitionDelay = `${index * 0.1}s`;

        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 100);
      });
    }
  }

  // Handler function for video dropdown link clicks
  function handleVideoDropdownLinkClick(e) {
    console.log("Video dropdown link clicked");

    // If we're already on the video page, prevent default navigation
    if (window.location.pathname.includes("/docs/video/project-video")) {
      e.preventDefault();

      // Get the hash from the link
      const hash = this.getAttribute("href").split("#")[1];
      console.log("Extracted hash:", hash);

      // Update the URL hash
      window.location.hash = hash;
    }

    // Add a subtle ripple effect
    const ripple = document.createElement("span");
    ripple.classList.add("dropdown-link-ripple");
    this.appendChild(ripple);

    // Position the ripple where the click happened
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    // Remove the ripple after animation completes
    setTimeout(() => {
      if (ripple && ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);

    // Close all dropdowns after a small delay to allow navigation
    setTimeout(closeAllDropdowns, 10);

    // Force close dropdown by clicking outside
    setTimeout(() => {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.body.dispatchEvent(clickEvent);
    }, 50);
  }

  // Initial setup
  addRippleStyles();
  setupDropdownCloser();
  enhanceCategoryPages();

  // Setup observer to handle dynamically loaded content
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        setupDropdownCloser();
        enhanceCategoryPages();
      }
    });
  });

  // Start observing the document for added nodes
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle page navigation (for SPA behavior)
  document.addEventListener("click", function (e) {
    // Wait for page transition
    setTimeout(enhanceCategoryPages, 300);
  });
});

