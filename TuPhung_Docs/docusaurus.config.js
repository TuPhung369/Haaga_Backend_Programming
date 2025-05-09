// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require("prism-react-renderer");
const path = require("path");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Enterprise Nexus",
  tagline: "Comprehensive documentation for the Enterprise Nexus Platform",
  favicon: "img/favicon.ico",

  // Ensure proper mobile viewport settings
  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
      },
    },
    {
      tagName: "style",
      attributes: {
        type: "text/css",
      },
      innerHTML: `
        /* Hide default hamburger menu button on mobile only */
        @media (max-width: 996px) {
          button.navbar__toggle,
          button[class*="toggleButton"],
          button[aria-label="Navigation bar toggle"],
          .navbar__toggle,
          .navbar-sidebar__toggle,
          .navbar-sidebar__backdrop,
          .navbar-sidebar,
          .navbar-sidebar__brand,
          .navbar-sidebar__items,
          .navbar-sidebar__item,
          .navbar-sidebar__close,
          div[class*="navbarSidebarToggle"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }
        
        /* Custom sidebar button styling */
        #plugin-sidebar {
          background: rgba(78, 87, 185, 0.9) !important;
          background-color: rgba(78, 87, 185, 0.9) !important;
          background-image: none !important;
          border: 2px solid rgba(255, 255, 255, 0.8) !important;
          box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.2) !important;
          margin: 0 !important;
          padding: 0 !important;
          position: fixed !important;
          left: 15px !important;
          top: 17px !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          overflow: visible !important;
          transition: all 0.3s ease !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        

        
        /* Move logo and project name to accommodate sidebar button */
        @media (max-width: 996px) {
          .navbar__brand, 
          [class*="navbarTitle"],
          [class*="navbarBrand"] {
            margin-left: 40px !important; /* Width of sidebar button (30px)*/
          }
          
          /* Ensure header doesn't cover the sidebar button */
          .navbar,
          [class*="navbarContainer"],
          [class*="navbarWrapper"],
          [class*="navbar"],
          [class*="header"],
          [class*="navbar__inner"],
          [class*="navbar__brand"],
          [class*="navbar navbar--fixed-top"],
          [class*="navbar__items"],
          .fixedHeaderContainer,
          nav,
          .navigationSlider,
          .docusaurus-highlight-code-line,
          .navPusher,
          .navBreadcrumb,
          .toc,
          .onPageNav,
          .docsNavContainer,
          .docMainWrapper,
          .mainContainer,
          .wrapper {
            z-index: 99999 !important; /* Lower than sidebar z-index */
          }
        }
        
        /* Only show custom sidebar on mobile */
        @media (min-width: 997px) {
          #plugin-sidebar,
          #plugin-sidebar.active {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }
        
        /* Ensure sidebar is responsive on all screens */
        @media (max-width: 768px) {
          #plugin-sidebar {
            left: 15px !important;
            top: 10px !important; /* Slightly higher on smaller screens */
          }
        }
        
        @media (max-width: 480px) {
          #plugin-sidebar {
            left: 15px !important;
            top: 10px !important;
          }
        }
        
        /* Override styles when active */
        #plugin-sidebar.active {
          background: linear-gradient(to bottom, white, rgba(78, 87, 185, 0.8)) !important;
          background-color: transparent !important;
          border: 1px solid rgba(78, 87, 185, 0.5) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          left: 15px !important;
          top: 17px !important;
          width: 220px !important; /* Increased width to accommodate all icons */
          height: auto !important;
          border-radius: 8px !important;
          z-index: 100000 !important;
          overflow: visible !important;
        }
        
        /* Ensure active sidebar is responsive on all screens */
        @media (max-width: 768px) {
          #plugin-sidebar.active {
            left: 15px !important;
            top: 10px !important; /* Slightly higher on smaller screens */
            width: 220px !important; /* Increased width to accommodate all icons */
          }
        }
        
        @media (max-width: 480px) {
          #plugin-sidebar.active {
            left: 15px !important;
            top: 10px !important;
            width: 220px !important; /* Increased width to accommodate all icons */
          }
        }
        
        /* Style for sidebar title when active */
        #plugin-sidebar.active .sidebar-title-content {
          background: rgba(78, 87, 185, 1) !important;
          background-color: rgba(78, 87, 185, 1) !important;
          color: white !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-evenly !important; /* Better spacing for 5 icons */
          width: 100% !important;
          border-radius: 8px 8px 0 0 !important;
          padding: 8px 0 !important;
          text-align: center !important;
        }
        
        #plugin-sidebar.active .sidebar-icon {
          color: white !important;
          display: inline-block !important;
          vertical-align: middle !important;
          font-size: 20px !important;
          line-height: 20px !important;
          margin: 0 2px !important;
          cursor: pointer !important;
          padding-bottom: 0 !important;
          padding-right: 0 !important;
        }
        

        
        /* Hide menu icon when sidebar is active */
        #plugin-sidebar.active .menu-icon {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        #plugin-sidebar.active .sidebar-icon svg {
          width: 20px !important;
          height: 20px !important;
          fill: white !important;
        }
        
        /* Ensure theme toggle icons in sidebar match header */
        #plugin-sidebar.active .toggle-theme-button svg {
          width: 20px !important;
          height: 20px !important;
          fill: white !important;
        }
        
        /* Specific styling for light/dark theme icons in sidebar */
        #plugin-sidebar.active .toggle-theme-button .light-theme-icon,
        #plugin-sidebar.active .toggle-theme-button .dark-theme-icon {
          fill: white !important;
          width: 20px !important;
          height: 20px !important;
        }
        
        /* Ensure proper display of theme icons based on current theme */
        html[data-theme='dark'] #plugin-sidebar.active .toggle-theme-button .light-theme-icon {
          display: none !important;
        }
        
        html[data-theme='dark'] #plugin-sidebar.active .toggle-theme-button .dark-theme-icon {
          display: block !important;
        }
        
        html[data-theme='light'] #plugin-sidebar.active .toggle-theme-button .light-theme-icon {
          display: block !important;
        }
        
        html[data-theme='light'] #plugin-sidebar.active .toggle-theme-button .dark-theme-icon {
          display: none !important;
        }
        
        #plugin-sidebar.active .sidebar-text {
          display: none !important;
        }
        
        /* Add hover effect to icons */
        #plugin-sidebar.active .sidebar-icon:hover {
          transform: scale(1.2) !important;
          transition: transform 0.2s ease !important;
        }
        
        /* Add hover effect to theme toggle button */
        #plugin-sidebar.active .toggle-theme-button:hover {
          transform: scale(1.2) !important;
          transition: transform 0.2s ease !important;
        }
        
        #plugin-sidebar.active ul {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        #plugin-sidebar.active a {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        #plugin-sidebar.active a:hover {
          background: rgba(78, 87, 185, 0.5) !important;
          background-color: rgba(78, 87, 185, 0.5) !important;
          color: white !important;
        }
        
        /* Footer column alignment fix - with high specificity to override other styles */
        html body .footer__links,
        html[data-theme] body .footer__links,
        #__docusaurus .footer__links,
        #__docusaurus[data-theme] .footer__links,
        .footer .footer__links,
        div.footer .footer__links,
        footer .footer__links,
        div.footer__links {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
        }
        
        /* Mobile footer alignment fixes */
        @media (max-width: 996px) {
          html body .footer__links,
          html[data-theme] body .footer__links,
          #__docusaurus .footer__links,
          #__docusaurus[data-theme] .footer__links,
          .footer .footer__links,
          div.footer .footer__links,
          footer .footer__links,
          div.footer__links {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
        
        html body .footer__col,
        html[data-theme] body .footer__col,
        #__docusaurus .footer__col,
        #__docusaurus[data-theme] .footer__col,
        .footer .footer__col,
        div.footer .footer__col,
        footer .footer__col,
        div.footer__col {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
          height: 100% !important;
        }
        
        html body .footer__title,
        html[data-theme] body .footer__title,
        #__docusaurus .footer__title,
        #__docusaurus[data-theme] .footer__title,
        .footer .footer__title,
        div.footer .footer__title,
        footer .footer__title,
        div.footer__title {
          margin-top: 0 !important;
          margin-bottom: 1rem !important;
        }
        
        html body .footer__items,
        html[data-theme] body .footer__items,
        #__docusaurus .footer__items,
        #__docusaurus[data-theme] .footer__items,
        .footer .footer__items,
        div.footer .footer__items,
        footer .footer__items,
        div.footer__items {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
        }
        
        /* Footer icon alignment fixes */
        html body .footer__items a,
        html[data-theme] body .footer__items a,
        #__docusaurus .footer__items a,
        #__docusaurus[data-theme] .footer__items a,
        .footer .footer__items a,
        div.footer .footer__items a,
        footer .footer__items a,
        div.footer__items a {
          display: flex !important;
          align-items: center !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        
        /* Ensure SVG icons in footer are properly aligned */
        html body .footer__items a svg,
        html[data-theme] body .footer__items a svg,
        #__docusaurus .footer__items a svg,
        #__docusaurus[data-theme] .footer__items a svg,
        .footer .footer__items a svg,
        div.footer .footer__items a svg,
        footer .footer__items a svg,
        div.footer__items a svg {
          margin-right: 3px !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        
        /* Override any row styles that might affect the footer */
        html body .footer .row,
        html[data-theme] body .footer .row,
        #__docusaurus .footer .row,
        #__docusaurus[data-theme] .footer .row,
        .footer .row,
        div.footer .row,
        footer .row,
        div.footer .row,
        html body .footer div[class*="row"],
        html[data-theme] body .footer div[class*="row"],
        #__docusaurus .footer div[class*="row"],
        #__docusaurus[data-theme] .footer div[class*="row"],
        .footer div[class*="row"],
        div.footer div[class*="row"],
        footer div[class*="row"],
        div.footer div[class*="row"],
        html body .footer div[class^="row_"],
        html[data-theme] body .footer div[class^="row_"],
        #__docusaurus .footer div[class^="row_"],
        #__docusaurus[data-theme] .footer div[class^="row_"],
        .footer div[class^="row_"],
        div.footer div[class^="row_"],
        footer div[class^="row_"],
        div.footer div[class^="row_"] {
          justify-content: flex-start !important;
          align-items: flex-start !important;
        }
      `,
    },
    {
      tagName: "script",
      attributes: {
        type: "text/javascript",
      },
      innerHTML: `
        // Remove old sidebar button if it exists
        const oldButton = document.getElementById('force-sidebar-button');
        if (oldButton) {
          oldButton.remove();
          console.log('Removed old force-sidebar-button');
        }
        
        // Function to update all theme icons and texts
        function updateAllThemeIcons() {
          const isDarkTheme = document.documentElement.dataset.theme === 'dark';
          console.log('Updating all theme icons to match theme:', isDarkTheme ? 'dark' : 'light');
          
          // Update navbar theme toggle button
          const navbarButtons = document.querySelectorAll('.navbar__items--right button.toggle-theme-button, .navbar__items--right .toggle-theme-button');
          console.log('Found navbar buttons:', navbarButtons.length);
          
          navbarButtons.forEach(button => {
            const navbarLightIcon = button.querySelector('.light-theme-icon');
            const navbarDarkIcon = button.querySelector('.dark-theme-icon');
            
            if (navbarLightIcon && navbarDarkIcon) {
              console.log('Updating navbar theme icons');
              navbarLightIcon.style.display = isDarkTheme ? 'none' : 'block';
              navbarDarkIcon.style.display = isDarkTheme ? 'block' : 'none';
            }
          });
          
          // Update sidebar theme toggle button
          const sidebarButtons = document.querySelectorAll('#plugin-sidebar .toggle-theme-button');
          console.log('Found sidebar buttons:', sidebarButtons.length);
          
          sidebarButtons.forEach(button => {
            const sidebarLightIcon = button.querySelector('.light-theme-icon');
            const sidebarDarkIcon = button.querySelector('.dark-theme-icon');
            
            if (sidebarLightIcon && sidebarDarkIcon) {
              console.log('Updating sidebar theme icons');
              sidebarLightIcon.style.display = isDarkTheme ? 'none' : 'block';
              sidebarDarkIcon.style.display = isDarkTheme ? 'block' : 'none';
              
              // Ensure fill color is white for sidebar icons
              sidebarLightIcon.setAttribute('fill', 'white');
              sidebarDarkIcon.setAttribute('fill', 'white');
            }
          });
          
          // Update all theme icons in the document
          const allLightIcons = document.querySelectorAll('.light-theme-icon');
          const allDarkIcons = document.querySelectorAll('.dark-theme-icon');
          
          console.log('Updating all light icons:', allLightIcons.length);
          console.log('Updating all dark icons:', allDarkIcons.length);
          
          allLightIcons.forEach(icon => {
            icon.style.display = isDarkTheme ? 'none' : 'block';
            icon.setAttribute('fill', icon.closest('#plugin-sidebar') ? 'white' : 'currentColor');
          });
          
          allDarkIcons.forEach(icon => {
            icon.style.display = isDarkTheme ? 'block' : 'none';
            icon.setAttribute('fill', icon.closest('#plugin-sidebar') ? 'white' : 'currentColor');
          });
          
          // Update theme texts
          const themeTexts = document.querySelectorAll('.theme-text');
          themeTexts.forEach(text => {
            text.textContent = isDarkTheme ? 'Dark Mode' : 'Light Mode';
          });
        }
        
        // Create sidebar when the page has loaded
        window.addEventListener('load', function() {
          console.log('Creating custom sidebar - window load event');
          
          // Remove old sidebar if it exists to avoid duplication
          const existingSidebar = document.getElementById('plugin-sidebar');
          if (existingSidebar) {
            existingSidebar.remove();
          }
          
          // Add event listener for theme toggle button in navbar
          setTimeout(() => {
            const navbarThemeToggleButtons = document.querySelectorAll('.navbar__items--right .toggle-theme-button, .navbar__items--right button.toggle-theme-button');
            console.log('Found navbar theme toggle buttons:', navbarThemeToggleButtons.length);
            
            navbarThemeToggleButtons.forEach(navbarThemeToggleButton => {
              const newButton = navbarThemeToggleButton.cloneNode(true);
              navbarThemeToggleButton.parentNode.replaceChild(newButton, navbarThemeToggleButton);
              
              newButton.addEventListener('click', function() {
                console.log('Navbar theme toggle button clicked');
                
                const docusaurusThemeButton = document.querySelector('.navbar__items--right .clean-btn') || 
                                         document.querySelector('[class*="toggleButton"]') || 
                                         document.querySelector('[class*="colorModeToggle"] button') ||
                                         document.querySelector('button[title*="Switch between dark and light mode"]') ||
                                         document.querySelector('button[aria-label*="Switch between dark and light mode"]');
                
                if (docusaurusThemeButton) {
                  docusaurusThemeButton.click();
                  console.log('Theme toggled via navbar button');
                  
                  setTimeout(function() {
                    console.log('Running updateAllThemeIcons from navbar click');
                    updateAllThemeIcons();
                  }, 100);
                }
              });
            });
          }, 1000);
          
          // Create sidebar element
          const sidebar = document.createElement('div');
          sidebar.id = 'plugin-sidebar';
          
          const initialIsDarkTheme = document.documentElement.dataset.theme === 'dark';
          console.log('Initial theme:', initialIsDarkTheme ? 'dark' : 'light');
          
          // Create title element
          const title = document.createElement('div');
          title.style.background = 'transparent';
          title.style.padding = '0';
          title.style.fontWeight = 'bold';
          title.style.textAlign = 'center';
          title.style.cursor = 'pointer';
          title.style.border = 'none';
          title.style.borderRadius = '50%';
          title.style.width = '40px';
          title.style.height = '40px';
          title.style.display = 'flex';
          title.style.alignItems = 'center';
          title.style.justifyContent = 'center';
          title.style.overflow = 'hidden';
          
          const titleContent = document.createElement('div');
          titleContent.className = 'sidebar-title-content';
          titleContent.style.display = 'flex';
          titleContent.style.alignItems = 'center';
          titleContent.style.justifyContent = 'space-around';
          titleContent.style.color = 'white';
          titleContent.style.fontWeight = 'bold';
          titleContent.style.fontSize = '16px';
          titleContent.style.width = '40px';
          titleContent.style.height = '40px';
          titleContent.style.backgroundColor = 'transparent';
          titleContent.style.padding = '0';
          titleContent.style.position = 'relative';
          
          // Menu Hamburger icon
          const menuIcon = document.createElement('span');
          menuIcon.className = 'sidebar-icon menu-icon';
          menuIcon.style.fontSize = '30px';
          menuIcon.style.lineHeight = '30px';
          menuIcon.style.display = 'inline-block';
          menuIcon.style.verticalAlign = 'middle';
          menuIcon.style.color = 'white';
          menuIcon.style.fontWeight = 'bold';
          menuIcon.style.cursor = 'pointer';
          menuIcon.style.margin = '0';
          menuIcon.style.textAlign = 'center';
          menuIcon.style.width = '30px';
          menuIcon.style.height = '30px';
          menuIcon.style.position = 'absolute';
          menuIcon.style.left = 'calc(45% - 2.5px)'; /* Điều chỉnh sang trái thêm 5px */
          menuIcon.style.top = 'calc(50% - 2.55px)'; /* Điều chỉnh lên trên thêm 5px */
          menuIcon.style.transform = 'translate(-50%, -50%)';
          menuIcon.textContent = '☰';
          
          // Video icon
          const videoIcon = document.createElement('a');
          videoIcon.href = '/Haaga_Backend_Programming/docs/video/project-video';
          videoIcon.className = 'sidebar-icon video-icon';
          videoIcon.style.fontSize = '20px';
          videoIcon.style.lineHeight = '20px';
          videoIcon.style.display = 'none';
          videoIcon.style.verticalAlign = 'middle';
          videoIcon.style.color = 'white';
          videoIcon.style.margin = '0 5px';
          videoIcon.style.cursor = 'pointer';
          videoIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z"/><path d="M16 11l-7 4V7z"/></svg>';
          
          // CV icon
          const cvIcon = document.createElement('a');
          cvIcon.href = 'https://tuphung369.github.io/professional-cv/';
          cvIcon.target = '_blank';
          cvIcon.rel = 'noopener noreferrer';
          cvIcon.className = 'sidebar-icon cv-icon';
          cvIcon.style.fontSize = '20px';
          cvIcon.style.lineHeight = '20px';
          cvIcon.style.display = 'none';
          cvIcon.style.verticalAlign = 'middle';
          cvIcon.style.color = 'white';
          cvIcon.style.margin = '0 5px';
          cvIcon.style.cursor = 'pointer';
          cvIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
          
          // LinkedIn icon
          const linkedinIcon = document.createElement('a');
          linkedinIcon.href = 'https://www.linkedin.com/in/tuphung010787/';
          linkedinIcon.target = '_blank';
          linkedinIcon.rel = 'noopener noreferrer';
          linkedinIcon.className = 'sidebar-icon linkedin-icon';
          linkedinIcon.style.fontSize = '20px';
          linkedinIcon.style.lineHeight = '20px';
          linkedinIcon.style.display = 'none';
          linkedinIcon.style.verticalAlign = 'middle';
          linkedinIcon.style.color = 'white';
          linkedinIcon.style.margin = '0 5px';
          linkedinIcon.style.cursor = 'pointer';
          linkedinIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="fill: #0A66C2;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>';
          
          // GitHub icon
          const githubIcon = document.createElement('a');
          githubIcon.href = 'https://github.com/TuPhung369/Haaga_Backend_Programming';
          githubIcon.target = '_blank';
          githubIcon.rel = 'noopener noreferrer';
          githubIcon.className = 'sidebar-icon github-icon';
          githubIcon.style.fontSize = '20px';
          githubIcon.style.lineHeight = '20px';
          githubIcon.style.display = 'none';
          githubIcon.style.verticalAlign = 'middle';
          githubIcon.style.color = 'white';
          githubIcon.style.margin = '0 5px';
          githubIcon.style.cursor = 'pointer';
          githubIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';
          
          // Theme Toggle icon
          const themeToggleIcon = document.createElement('button');
          themeToggleIcon.className = 'sidebar-icon toggle-theme-button theme-toggle-button';
          themeToggleIcon.style.fontSize = '20px';
          themeToggleIcon.style.lineHeight = '20px';
          themeToggleIcon.style.display = 'none';
          themeToggleIcon.style.verticalAlign = 'middle';
          themeToggleIcon.style.color = 'white';
          themeToggleIcon.style.margin = '0 5px';
          themeToggleIcon.style.cursor = 'pointer';
          themeToggleIcon.style.background = 'transparent';
          themeToggleIcon.style.border = 'none';
          themeToggleIcon.style.padding = '0';
          themeToggleIcon.setAttribute('aria-label', 'Toggle between dark and light mode');
          
          const isDarkTheme = document.documentElement.dataset.theme === 'dark';
          
          const lightThemeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          lightThemeIcon.setAttribute('class', 'light-theme-icon');
          lightThemeIcon.setAttribute('width', '20');
          lightThemeIcon.setAttribute('height', '20');
          lightThemeIcon.setAttribute('viewBox', '0 0 24 24');
          lightThemeIcon.setAttribute('fill', 'white');
          lightThemeIcon.style.display = isDarkTheme ? 'none' : 'block';
          
          const lightThemePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          lightThemePath.setAttribute('d', 'M12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zm0-10c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0-4a1 1 0 0 1-1-1V1a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm0 20a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm10-10h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zM4 12H2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm16.95-9.364l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414zm-18.486 18.5l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm18.486 0a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM5.05 5.05a1 1 0 0 1-1.414 0L2.222 3.636a1 1 0 0 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414z');
          lightThemeIcon.appendChild(lightThemePath);
          
          const darkThemeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          darkThemeIcon.setAttribute('class', 'dark-theme-icon');
          darkThemeIcon.setAttribute('width', '20');
          darkThemeIcon.setAttribute('height', '20');
          darkThemeIcon.setAttribute('viewBox', '0 0 24 24');
          darkThemeIcon.setAttribute('fill', 'white');
          darkThemeIcon.style.display = isDarkTheme ? 'block' : 'none';
          
          const darkThemePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          darkThemePath.setAttribute('d', 'M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99a10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z');
          darkThemeIcon.appendChild(darkThemePath);
          
          themeToggleIcon.appendChild(lightThemeIcon);
          themeToggleIcon.appendChild(darkThemeIcon);
          
          themeToggleIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Sidebar theme toggle button clicked');
            
            const docusaurusThemeButton = document.querySelector('.navbar__items--right .clean-btn') || 
                                     document.querySelector('[class*="toggleButton"]') || 
                                     document.querySelector('[class*="colorModeToggle"] button') ||
                                     document.querySelector('button[title*="Switch between dark and light mode"]') ||
                                     document.querySelector('button[aria-label*="Switch between dark and light mode"]');
            
            if (docusaurusThemeButton) {
              docusaurusThemeButton.click();
              console.log('Theme toggled via icon in sidebar title');
              
              setTimeout(function() {
                console.log('Running updateAllThemeIcons from sidebar click');
                updateAllThemeIcons();
              }, 100);
            }
          });
          
          titleContent.appendChild(menuIcon);
          titleContent.appendChild(videoIcon);
          titleContent.appendChild(cvIcon);
          titleContent.appendChild(linkedinIcon);
          titleContent.appendChild(githubIcon);
          titleContent.appendChild(themeToggleIcon);
          
          title.appendChild(titleContent);
          
          const content = document.createElement('div');
          content.style.padding = '0';
          content.style.margin = '0';
          content.style.maxHeight = '0';
          content.style.height = '0';
          content.style.minHeight = '0';
          content.style.overflow = 'hidden';
          content.style.transition = 'all 0.3s ease';
          content.style.backgroundColor = 'transparent';
          content.style.background = 'transparent';
          content.style.backgroundImage = 'none';
          content.style.border = 'none';
          content.style.borderTop = '0';
          content.style.borderRadius = '0 0 8px 8px';
          content.style.flex = '0';
          content.style.display = 'none';
          
          const list = document.createElement('ul');
          list.style.listStyle = 'none';
          list.style.padding = '0';
          list.style.margin = '0';
          list.style.backgroundColor = 'white';
          list.style.background = 'white';
          
          setTimeout(() => {
            const navLinks = document.querySelectorAll('.navbar__items a, .menu__link, .navbar-sidebar__items a, .navbar__item a');
            console.log('Found navigation links:', navLinks.length);
            
            const addedUrls = new Set();
            
            if (navLinks.length === 0) {
              console.log('No navigation links found, adding default links');
              
              const homeItem = document.createElement('li');
              homeItem.style.margin = '5px 0';
              
              const homeLink = document.createElement('a');
              homeLink.href = '/';
              homeLink.textContent = 'Home';
              homeLink.style.display = 'block';
              homeLink.style.padding = '8px 12px';
              homeLink.style.color = '#4e57b9';
              homeLink.style.textDecoration = 'none';
              homeLink.style.borderRadius = '4px';
              homeLink.style.fontSize = '14px';
              homeLink.style.transition = 'background-color 0.2s ease';
              homeLink.style.backgroundColor = 'white';
              homeLink.style.background = 'white';
              homeLink.style.opacity = '1';
              
              homeItem.appendChild(homeLink);
              list.appendChild(homeItem);
              
              const docsItem = document.createElement('li');
              docsItem.style.margin = '5px 0';
              
              const docsLink = document.createElement('a');
              docsLink.href = '/docs';
              docsLink.textContent = 'Documentation';
              docsLink.style.display = 'block';
              docsLink.style.padding = '8px 12px';
              docsLink.style.color = '#4e57b9';
              docsLink.style.textDecoration = 'none';
              docsLink.style.borderRadius = '4px';
              docsLink.style.fontSize = '14px';
              docsLink.style.transition = 'background-color 0.2s ease';
              docsLink.style.backgroundColor = 'white';
              docsLink.style.background = 'white';
              docsLink.style.opacity = '1';
              
              docsItem.appendChild(docsLink);
              list.appendChild(docsItem);
            } else {
              navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent.trim();
                
                if (!href || 
                    href === '#' || 
                    addedUrls.has(href) || 
                    href.includes('linkedin.com') || 
                    href.includes('professional-cv')) {
                  return;
                }
                
                console.log('Adding link:', text, href);
                addedUrls.add(href);
                
                const item = document.createElement('li');
                item.style.margin = '5px 0';
                
                const newLink = document.createElement('a');
                newLink.href = href;
                if (href.startsWith('http')) {
                  newLink.target = '_blank';
                  newLink.rel = 'noopener noreferrer';
                }
                newLink.textContent = text;
                newLink.style.display = 'block';
                newLink.style.padding = '8px 12px';
                newLink.style.color = '#4e57b9';
                newLink.style.textDecoration = 'none';
                newLink.style.borderRadius = '4px';
                newLink.style.fontSize = '14px';
                newLink.style.transition = 'background-color 0.2s ease';
                newLink.style.backgroundColor = 'white';
                newLink.style.background = 'white';
                newLink.style.opacity = '1';
                
                newLink.addEventListener('mouseover', function() {
                  this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
                  this.style.background = 'rgba(78, 87, 185, 0.6)';
                  this.style.color = '#ffffff';
                  this.style.opacity = '1';
                });
                
                newLink.addEventListener('mouseout', function() {
                  this.style.backgroundColor = 'white';
                  this.style.background = 'white';
                  this.style.color = '#4e57b9';
                  this.style.opacity = '1';
                });
                
                item.appendChild(newLink);
                list.appendChild(item);
              });
            }
            
            if (list.children.length === 0) {
              console.log('No links were added to the sidebar');
              
              const noLinksItem = document.createElement('li');
              noLinksItem.style.margin = '5px 0';
              noLinksItem.style.padding = '8px 12px';
              noLinksItem.style.color = '#4e57b9';
              noLinksItem.style.textAlign = 'center';
              noLinksItem.textContent = 'No navigation links found';
              
              list.appendChild(noLinksItem);
            }
            
            const separatorItem = document.createElement('li');
            separatorItem.style.margin = '10px 0';
            separatorItem.style.padding = '0 12px';
            
            const separator = document.createElement('div');
            separator.style.height = '1px';
            separator.style.backgroundColor = '#e0e0e0';
            separator.style.width = '100%';
            
            separatorItem.appendChild(separator);
            list.appendChild(separatorItem);
            
            const cvItem = document.createElement('li');
            cvItem.style.margin = '5px 0';
            
            const cvLink = document.createElement('a');
            cvLink.href = 'https://tuphung369.github.io/professional-cv/';
            cvLink.target = '_blank';
            cvLink.rel = 'noopener noreferrer';
            cvLink.style.display = 'flex';
            cvLink.style.alignItems = 'center';
            cvLink.style.padding = '8px 12px';
            cvLink.style.color = '#4e57b9';
            cvLink.style.textDecoration = 'none';
            cvLink.style.borderRadius = '4px';
            cvLink.style.fontSize = '14px';
            cvLink.style.transition = 'background-color 0.2s ease';
            cvLink.style.backgroundColor = 'white';
            cvLink.style.background = 'white';
            cvLink.style.opacity = '1';
            
            const cvIconSpan = document.createElement('span');
            cvIconSpan.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; fill: #FFFFFF;"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
            
            const cvText = document.createElement('span');
            cvText.textContent = 'My CV';
            
            cvLink.appendChild(cvIconSpan);
            cvLink.appendChild(cvText);
            
            cvLink.addEventListener('mouseover', function() {
              this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
              this.style.background = 'rgba(78, 87, 185, 0.6)';
              this.style.color = '#ffffff';
              this.style.opacity = '1';
            });
            
            cvLink.addEventListener('mouseout', function() {
              this.style.backgroundColor = 'white';
              this.style.background = 'white';
              this.style.color = '#4e57b9';
              this.style.opacity = '1';
            });
            
            cvItem.appendChild(cvLink);
            list.appendChild(cvItem);
            
            const githubItem = document.createElement('li');
            githubItem.style.margin = '5px 0';
            
            const githubLink = document.createElement('a');
            githubLink.href = 'https://github.com/TuPhung369/Haaga_Backend_Programming';
            githubLink.target = '_blank';
            githubLink.rel = 'noopener noreferrer';
            githubLink.style.display = 'flex';
            githubLink.style.alignItems = 'center';
            githubLink.style.padding = '8px 12px';
            githubLink.style.color = '#4e57b9';
            githubLink.style.textDecoration = 'none';
            githubLink.style.borderRadius = '4px';
            githubLink.style.fontSize = '14px';
            githubLink.style.transition = 'background-color 0.2s ease';
            githubLink.style.backgroundColor = 'white';
            githubLink.style.background = 'white';
            githubLink.style.opacity = '1';
            
            const githubIcon = document.createElement('span');
            githubIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; fill: #ffffff;"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';
            
            const githubText = document.createElement('span');
            githubText.textContent = 'GitHub';
            
            githubLink.appendChild(githubIcon);
            githubLink.appendChild(githubText);
            
            githubLink.addEventListener('mouseover', function() {
              this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
              this.style.background = 'rgba(78, 87, 185, 0.6)';
              this.style.color = '#ffffff';
              this.style.opacity = '1';
            });
            
            githubLink.addEventListener('mouseout', function() {
              this.style.backgroundColor = 'white';
              this.style.background = 'white';
              this.style.color = '#4e57b9';
              this.style.opacity = '1';
            });
            
            githubItem.appendChild(githubLink);
            list.appendChild(githubItem);
            
            const linkedinItem = document.createElement('li');
            linkedinItem.style.margin = '5px 0';
            
            const linkedinLink = document.createElement('a');
            linkedinLink.href = 'https://www.linkedin.com/in/tuphung010787/';
            linkedinLink.target = '_blank';
            linkedinLink.rel = 'noopener noreferrer';
            linkedinLink.style.display = 'flex';
            linkedinLink.style.alignItems = 'center';
            linkedinLink.style.padding = '8px 12px';
            linkedinLink.style.color = '#0a66c2';
            linkedinLink.style.textDecoration = 'none';
            linkedinLink.style.borderRadius = '4px';
            linkedinLink.style.fontSize = '14px';
            linkedinLink.style.transition = 'background-color 0.2s ease';
            linkedinLink.style.backgroundColor = 'white';
            linkedinLink.style.background = 'white';
            linkedinLink.style.opacity = '1';
            
            const linkedinIconSpan = document.createElement('span');
            linkedinIconSpan.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; fill: #ffffff;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>';
            
            const linkedinText = document.createElement('span');
            linkedinText.textContent = 'LinkedIn';
            
            linkedinLink.appendChild(linkedinIconSpan);
            linkedinLink.appendChild(linkedinText);
            
            linkedinLink.addEventListener('mouseover', function() {
              this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
              this.style.background = 'rgba(78, 87, 185, 0.6)';
              this.style.color = '#ffffff';
              this.style.opacity = '1';
            });
            
            linkedinLink.addEventListener('mouseout', function() {
              this.style.backgroundColor = 'white';
              this.style.background = 'white';
              this.style.color = '#4e57b9';
              this.style.opacity = '1';
            });
            
            linkedinItem.appendChild(linkedinLink);
            list.appendChild(linkedinItem);
            
            // Add Theme Toggle button
            const themeItem = document.createElement('li');
            themeItem.style.margin = '5px 0';
            
            const themeButton = document.createElement('button');
            themeButton.style.display = 'flex';
            themeButton.style.alignItems = 'center';
            themeButton.style.width = '100%';
            themeButton.style.padding = '8px 12px';
            themeButton.style.color = '#ffffff';
            themeButton.style.textDecoration = 'none';
            themeButton.style.borderRadius = '4px';
            themeButton.style.fontSize = '14px';
            themeButton.style.transition = 'background-color 0.2s ease';
            themeButton.style.backgroundColor = 'transparent';
            themeButton.style.background = 'transparent';
            themeButton.style.opacity = '1';
            themeButton.style.border = 'none';
            themeButton.style.cursor = 'pointer';
            themeButton.style.textAlign = 'left';
            
            // Theme icon container with two SVGs
            const themeIconContainer = document.createElement('span');
            themeIconContainer.style.marginRight = '8px';
            
            const themeLightIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            themeLightIcon.setAttribute('class', 'light-theme-icon');
            themeLightIcon.setAttribute('width', '20');
            themeLightIcon.setAttribute('height', '20');
            themeLightIcon.setAttribute('viewBox', '0 0 24 24');
            themeLightIcon.setAttribute('fill', 'currentColor');
            themeLightIcon.style.display = isDarkTheme ? 'none' : 'block';
            const lightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            lightPath.setAttribute('d', 'M12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zm0-10c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0-4a1 1 0 0 1-1-1V1a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm0 20a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm10-10h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zM4 12H2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm16.95-9.364l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414zm-18.486 18.5l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm18.486 0a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM5.05 5.05a1 1 0 0 1-1.414 0L2.222 3.636a1 1 0 0 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414z');
            themeLightIcon.appendChild(lightPath);
            
            const themeDarkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            themeDarkIcon.setAttribute('class', 'dark-theme-icon');
            themeDarkIcon.setAttribute('width', '20');
            themeDarkIcon.setAttribute('height', '20');
            themeDarkIcon.setAttribute('viewBox', '0 0 24 24');
            themeDarkIcon.setAttribute('fill', 'currentColor');
            themeDarkIcon.style.display = isDarkTheme ? 'block' : 'none';
            const darkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            darkPath.setAttribute('d', 'M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99a10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z');
            themeDarkIcon.appendChild(darkPath);
            
            themeIconContainer.appendChild(themeLightIcon);
            themeIconContainer.appendChild(themeDarkIcon);
            
            const themeText = document.createElement('span');
            themeText.className = 'theme-text';
            themeText.textContent = isDarkTheme ? 'Dark Mode' : 'Light Mode';
            themeText.style.color = 'rgb(30, 1, 124)';
            themeText.style.fontWeight = '500';
            
            themeButton.appendChild(themeIconContainer);
            themeButton.appendChild(themeText);
            
            themeButton.addEventListener('mouseover', function() {
              this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
              this.style.background = 'rgba(78, 87, 185, 0.6)';
              this.style.color = '#ffffff';
              this.style.opacity = '1';
            });
            
            themeButton.addEventListener('mouseout', function() {
              this.style.backgroundColor = 'transparent';
              this.style.background = 'transparent';
              this.style.color = '#000000';
              this.style.opacity = '1';
            });
            
            themeButton.addEventListener('click', function() {
              const docusaurusThemeButton = document.querySelector('.navbar__items--right .clean-btn') || 
                                       document.querySelector('[class*="toggleButton"]') || 
                                       document.querySelector('[class*="colorModeToggle"] button') ||
                                       document.querySelector('button[title*="Switch between dark and light mode"]') ||
                                       document.querySelector('button[aria-label*="Switch between dark and light mode"]');
              
              if (docusaurusThemeButton) {
                docusaurusThemeButton.click();
                console.log('Theme toggled via mobile menu button');
                
                setTimeout(() => {
                  updateAllThemeIcons();
                }, 100);
              }
            });
            
            themeItem.appendChild(themeButton);
            list.appendChild(themeItem);
          }, 500);
          
          content.appendChild(list);
          
          sidebar.appendChild(title);
          sidebar.appendChild(content);
          
          let isOpen = false;
          localStorage.setItem('sidebarOpen', 'false');
          
          function openSidebar() {
            if (window.innerWidth >= 997) return;
            
            sidebar.classList.add('active');
            localStorage.setItem('sidebarOpen', 'true');
            
            sidebar.style.width = '220px';
            sidebar.style.height = 'auto';
            sidebar.style.background = 'linear-gradient(135deg, white, rgba(78, 87, 185, 0.8))';
            sidebar.style.backgroundColor = 'transparent';
            sidebar.style.border = '1px solid rgba(78, 87, 185, 0.5)';
            sidebar.style.borderRadius = '8px';
            
            title.style.borderRadius = '8px 8px 0 0';
            title.style.width = 'auto';
            title.style.height = 'auto';
            title.style.display = 'block';
            
            menuIcon.style.display = 'none';
            
            titleContent.style.background = 'rgba(78, 87, 185, 1)';
            titleContent.style.borderRadius = '8px 8px 0 0';
            titleContent.style.padding = '8px 0';
            titleContent.style.width = '100%';
            titleContent.style.height = 'auto';
            titleContent.style.position = 'static';
            
            // Make icons visible
            videoIcon.style.display = 'inline-block';
            cvIcon.style.display = 'inline-block';
            linkedinIcon.style.display = 'inline-block';
            githubIcon.style.display = 'inline-block';
            themeToggleIcon.style.display = 'inline-block';
            
            const currentIsDarkTheme = document.documentElement.dataset.theme === 'dark';
            const sidebarLightIcon = themeToggleIcon.querySelector('.light-theme-icon');
            const sidebarDarkIcon = themeToggleIcon.querySelector('.dark-theme-icon');
            
            if (sidebarLightIcon && sidebarDarkIcon) {
              sidebarLightIcon.style.display = currentIsDarkTheme ? 'none' : 'block';
              sidebarDarkIcon.style.display = currentIsDarkTheme ? 'block' : 'none';
            }
            
            content.style.display = 'block';
            content.style.padding = '10px';
            content.style.maxHeight = '500px';
            content.style.height = 'auto';
            content.style.minHeight = 'auto';
            content.style.overflowY = 'auto';
            content.style.borderTop = '1px solid #eee';
            content.style.borderRadius = '0 0 8px 8px';
            content.style.backgroundColor = 'white';
            content.style.background = 'white';
            content.style.opacity = '1';
            content.style.visibility = 'visible';
          }
          
          function closeSidebar() {
            sidebar.classList.remove('active');
            localStorage.setItem('sidebarOpen', 'false');
            
            // Show menuIcon again
            menuIcon.style.display = 'inline-block';
            
            content.style.display = 'none';
            content.style.padding = '0';
            content.style.maxHeight = '0';
            content.style.height = '0';
            content.style.minHeight = '0';
            content.style.overflow = 'hidden';
            
            menuIcon.style.fontSize = '30px';
            menuIcon.style.lineHeight = '30px';
            menuIcon.style.width = '30px';
            menuIcon.style.height = '30px';
            menuIcon.style.margin = '0';
            menuIcon.style.display = 'inline-block';
            menuIcon.style.verticalAlign = 'middle';
            menuIcon.style.position = 'absolute';
            menuIcon.style.left = 'calc(45% - 2.5px)'; /* Điều chỉnh sang trái thêm 5px */
            menuIcon.style.top = 'calc(50% - 2.5px)'; /* Điều chỉnh lên trên thêm 5px */
            menuIcon.style.transform = 'translate(-50%, -50%)';
            
            sidebar.style.width = '40px';
            sidebar.style.height = '40px';
            sidebar.style.background = 'rgba(78, 87, 185, 0.9)';
            sidebar.style.backgroundColor = 'rgba(78, 87, 185, 0.9)';
            sidebar.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            sidebar.style.borderRadius = '50%';
            
            title.style.borderRadius = '50%';
            title.style.width = '40px';
            title.style.height = '40px';
            title.style.display = 'flex';
            
            titleContent.style.background = 'transparent';
            titleContent.style.borderRadius = '0';
            titleContent.style.padding = '0';
            titleContent.style.width = '40px';
            titleContent.style.height = '40px';
            titleContent.style.position = 'relative';
            
            videoIcon.style.display = 'none';
            cvIcon.style.display = 'none';
            linkedinIcon.style.display = 'none';
            githubIcon.style.display = 'none';
            themeToggleIcon.style.display = 'none';
          }
          
          sidebar.addEventListener('click', function(e) {
            console.log('Sidebar clicked', e.target);
            
            if (e.target === sidebar || e.target === title || e.target === titleContent || e.target === menuIcon) {
              console.log('Toggle sidebar', isOpen);
              
              if (!isOpen) {
                openSidebar();
                isOpen = true;
              } else {
                if (e.target === menuIcon || e.target === sidebar) {
                  closeSidebar();
                  isOpen = false;
                }
              }
              
              e.stopPropagation();
            }
          });
          
          document.addEventListener('click', function(e) {
            if (isOpen && !sidebar.contains(e.target)) {
              console.log('Clicked outside sidebar, closing');
              closeSidebar();
              isOpen = false;
            }
          });
          
          content.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && !e.target.closest('button')) {
              console.log('Link clicked, closing sidebar');
              
              setTimeout(function() {
                closeSidebar();
                isOpen = false;
              }, 100);
            }
          });
          
          document.body.appendChild(sidebar);
          console.log('Custom sidebar added to body');
          
          const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              if (mutation.attributeName === 'data-theme') {
                console.log('Theme changed, updating all icons');
                updateAllThemeIcons();
              }
            });
          });
          
          observer.observe(document.documentElement, { attributes: true });
        });
        
        window.addEventListener('resize', function() {
          if (window.innerWidth <= 996) {
            const customSidebar = document.getElementById('plugin-sidebar');
            if (!customSidebar) {
              console.log('Window resized to mobile, creating sidebar');
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }
          } else {
            const customSidebar = document.getElementById('plugin-sidebar');
            if (customSidebar) {
              customSidebar.style.display = 'none';
              customSidebar.classList.remove('active');
              localStorage.setItem('sidebarOpen', 'false');
            }
          }
        });
        
        document.addEventListener('DOMContentLoaded', function() {
          console.log('DOMContentLoaded event - checking for sidebar');
          
          setTimeout(function() {
            if (!document.getElementById('plugin-sidebar') && window.innerWidth <= 996) {
              console.log('Sidebar not found on DOMContentLoaded, creating again');
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }
          }, 500);
        });
        
        let lastUrl = location.href;
        
        // Function to set up navigation observer
        function setupNavigationObserver() {
          if (document && document.body) {
            try {
              const navigationObserver = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                  lastUrl = location.href;
                  console.log('URL changed to', location.href);
                  
                  setTimeout(() => {
                    console.log('Updating sidebar for new page');
                    
                    const existingSidebar = document.getElementById('plugin-sidebar');
                    if (existingSidebar) {
                      existingSidebar.remove();
                    }
                    
                    localStorage.setItem('sidebarOpen', 'false');
                    
                    if (window.innerWidth <= 996) {
                      const loadEvent = new Event('load');
                      window.dispatchEvent(loadEvent);
                    }
                  }, 500);
                }
              });
              
              navigationObserver.observe(document.body, {
                childList: true,
                subtree: true
              });
              console.log('Navigation observer successfully attached to document.body');
            } catch (error) {
              console.error('Error setting up navigation observer:', error);
            }
          } else {
            console.warn('Document body not available yet for navigation observer, retrying in 100ms');
            setTimeout(setupNavigationObserver, 100);
          }
        }
        
        // Wait for document to be ready before setting up observer
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setupNavigationObserver();
        } else {
          document.addEventListener('DOMContentLoaded', setupNavigationObserver);
        }
        
        window.addEventListener('popstate', function() {
          console.log('Navigation detected via popstate event');
          
          if (window.innerWidth <= 996) {
            setTimeout(() => {
              const existingSidebar = document.getElementById('plugin-sidebar');
              if (existingSidebar) {
                existingSidebar.remove();
              }
              
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }, 500);
          }
        });
      `,
    },
  ],

  url: "https://TuPhung369.github.io",
  baseUrl: "/Haaga_Backend_Programming/",

  organizationName: "TuPhung369",
  projectName: "Haaga_Backend_Programming",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  customFields: {
    webpackConfig: {
      cssModules: true,
    },
  },

  clientModules: [path.resolve(__dirname, "./src/client-modules.js")],

  markdown: {
    mermaid: true,
  },

  themes: ["@docusaurus/theme-mermaid"],

  plugins: [
    path.resolve(__dirname, "./src/plugins/bookmark-plugin.js"),
    path.resolve(__dirname, "./src/plugins/category-css-plugin.js"),
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: path.resolve(__dirname, "./sidebars.js"),
          remarkPlugins: [
            [require("@docusaurus/remark-plugin-npm2yarn"), { sync: true }],
          ],
        },
        blog: false,
        theme: {
          customCss: [
            path.resolve(__dirname, "./src/css/custom.css"),
            path.resolve(__dirname, "./src/css/sidebar-fix.css"),
          ],
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/logo.svg",
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 2,
    },
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: "🏠 Enterprise Nexus",
      logo: {
        alt: "Enterprise Nexus Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "dropdown",
          label: "📚 Documentation",
          position: "left",
          items: [
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/intro" class="dropdown__link">📝 Introduction</a>',
            },
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/tech-stack" class="dropdown__link">🔧 Tech Stack</a>',
            },
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/architecture" class="dropdown__link">🏗️ Architecture</a>',
            },
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/deployment" class="dropdown__link">🚀 Deployment</a>',
            },
            {
              type: "html",
              value:
                '<div class="dropdown-section-header">Main Categories</div>',
              className: "dropdown-section",
            },
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/category/frontend" class="dropdown__link">🖥️ Frontend</a>',
            },
            {
              type: "html",
              value:
                '<a href="/Haaga_Backend_Programming/docs/category/backend" class="dropdown__link">⚙️ Backend</a>',
            },
          ],
        },
        {
          href: "/Haaga_Backend_Programming/docs/video/project-video",
          label: "🎬 Videos",
          position: "left",
        },
        {
          href: "https://tuphung369.github.io/professional-cv/",
          label: "📄 My CV",
          position: "left",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          type: "html",
          position: "left",
          value:
            '<a href="https://www.linkedin.com/in/tuphung010787/" target="_blank" rel="noopener noreferrer" class="navbar-linkedin-link"><svg width="25" height="25" viewBox="0 0 24 24" style="margin-right: 8px; fill: #0A66C2;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>LinkedIn</a>',
        },
        {
          type: "html",
          position: "right",
          value:
            '<button class="toggle-theme-button" aria-label="Toggle"><svg class="light-theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zm0-10c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0-4a1 1 0 0 1-1-1V1a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm0 20a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zm10-10h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zM4 12H2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm16.95-9.364l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414zm-18.486 18.5l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm18.486 0a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM5.05 5.05a1 1 0 0 1-1.414 0L2.222 3.636a1 1 0 0 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414z"/></svg><svg class="dark-theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"/></svg></button>',
        },
        {
          href: "https://github.com/TuPhung369/Haaga_Backend_Programming",
          className: "header-github-link",
          position: "right",
          "aria-label": "GitHub repository",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "📚 Documentation",
          items: [
            {
              label: "📝 Introduction",
              to: "/docs/intro",
            },
            {
              label: "🏗️ Architecture",
              to: "/docs/architecture",
            },
            {
              label: "🔧 Tech Stack",
              to: "/docs/tech-stack",
            },
          ],
        },
        {
          title: "🔍 Technical Guides",
          items: [
            {
              label: "🖥️ Frontend",
              to: "/docs/category/frontend",
            },
            {
              label: "⚙️ Backend",
              to: "/docs/category/backend",
            },
            {
              label: "🚀 Deployment Guide",
              to: "/docs/deployment",
            },
          ],
        },
        {
          title: "🎯 Project Resources",
          items: [
            {
              label: "🎬 Video",
              to: "/docs/video/project-video",
            },
            {
              html: '<a href="https://github.com/TuPhung369/Haaga_Backend_Programming" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; color: var(--ifm-font-color-base);"><svg width="25" height="25" viewBox="0 0 24 24" style="margin-right: 3px; fill: var(--ifm-font-color-base);"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub</a>',
            },
          ],
        },
        {
          title: "👋 Connect With Me",
          items: [
            {
              label: "📄 My CV",
              href: "https://tuphung369.github.io/professional-cv/",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            {
              html: '<a href="https://www.linkedin.com/in/tuphung010787/" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center;"><svg width="25" height="25" viewBox="0 0 24 24" style="margin-right: 3px; fill: #0A66C2;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>LinkedIn</a>',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tu Phung`,
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
      options: {
        flowchart: {
          curve: "linear",
        },
      },
    },
  },
};

module.exports = config;

