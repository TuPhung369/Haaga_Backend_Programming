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
          top: 15px !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          overflow: visible !important;
          transition: all 0.3s ease !important;
          z-index: 999999 !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        
        /* Move logo and project name to accommodate sidebar button */
        @media (max-width: 996px) {
          .navbar__brand, 
          .navbar__title, 
          .navbar__logo, 
          [class*="navbarTitle"],
          [class*="navbarBrand"] {
            margin-left: 55px !important; /* Width of sidebar button (40px) + left margin (15px) */
          }
          
          /* Ensure header doesn't cover the sidebar button */
          .navbar,
          header,
          [class*="navbarContainer"],
          [class*="navbarWrapper"],
          [class*="navbar"],
          [class*="header"],
          .fixedHeaderContainer,
          div[role="banner"],
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
          .container,
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
          top: 15px !important;
          width: 170px !important;
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
            width: 150px !important;
          }
        }
        
        @media (max-width: 480px) {
          #plugin-sidebar.active {
            left: 15px !important;
            top: 10px !important;
            width: 150px !important;
          }
        }
        
        /* Style for sidebar title when active */
        #plugin-sidebar.active .sidebar-title-content {
          background: rgba(78, 87, 185, 1) !important;
          background-color: rgba(78, 87, 185, 1) !important;
          color: white !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          border-radius: 8px 8px 0 0 !important;
          padding: 8px 0 !important;
          text-align: center !important;
        }
        
        #plugin-sidebar.active .sidebar-icon,
        #plugin-sidebar.active .sidebar-text {
          color: white !important;
          display: inline-block !important;
          vertical-align: middle !important;
          font-size: 16px !important;
          line-height: 16px !important;
          font-weight: bold !important;
        }
        
        #plugin-sidebar.active .sidebar-text {
          display: inline-block !important;
          margin-left: 5px !important;
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
        
        // Create sidebar when the page has loaded
        window.addEventListener('load', function() {
          console.log('Creating custom sidebar - window load event');
          
          // Remove old sidebar if it exists to avoid duplication
          const existingSidebar = document.getElementById('plugin-sidebar');
          if (existingSidebar) {
            existingSidebar.remove();
          }
          
          // Create sidebar element
          const sidebar = document.createElement('div');
          sidebar.id = 'plugin-sidebar';
          
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
          
          // Create title content
          const titleContent = document.createElement('div');
          titleContent.className = 'sidebar-title-content';
          titleContent.style.display = 'flex';
          titleContent.style.alignItems = 'center';
          titleContent.style.justifyContent = 'center';
          titleContent.style.color = 'white';
          titleContent.style.fontWeight = 'bold';
          titleContent.style.fontSize = '16px';
          titleContent.style.width = '100%';
          titleContent.style.backgroundColor = 'rgba(78, 87, 185, 0.9)';
          
          // Create icon and text
          const icon = document.createElement('span');
          icon.className = 'sidebar-icon';
          icon.style.fontSize = '30px';
          icon.style.lineHeight = '30px';
          icon.style.display = 'inline-block';
          icon.style.verticalAlign = 'middle';
          icon.style.color = 'white';
          icon.style.fontWeight = 'bold';
          icon.textContent = '☰';
          
          const text = document.createElement('span');
          text.className = 'sidebar-text';
          text.style.marginLeft = '5px';
          text.style.display = 'none';
          text.style.verticalAlign = 'middle';
          text.style.color = 'white';
          text.style.fontWeight = 'bold';
          text.textContent = 'Menu';
          
          // Add icon and text to title content
          titleContent.appendChild(icon);
          titleContent.appendChild(text);
          
          // Add title content to title
          title.appendChild(titleContent);
          
          // Create content element
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
          
          // Create list for menu items
          const list = document.createElement('ul');
          list.style.listStyle = 'none';
          list.style.padding = '0';
          list.style.margin = '0';
          list.style.backgroundColor = 'white';
          list.style.background = 'white';
          
          // Wait a bit to ensure all navigation links are loaded
          setTimeout(() => {
            // Get navigation links
            const navLinks = document.querySelectorAll('.navbar__items a, .menu__link, .navbar-sidebar__items a, .navbar__item a');
            console.log('Found navigation links:', navLinks.length);
            
            // Create a Set to track URLs we've already added
            const addedUrls = new Set();
            
            // Add some default links if no navigation links are found
            if (navLinks.length === 0) {
              console.log('No navigation links found, adding default links');
              
              // Add Home link
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
              
              // Add Docs link
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
              // Process found navigation links
              navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent.trim();
                
                // Skip empty links, hash links, or already added URLs
                if (!href || href === '#' || addedUrls.has(href)) {
                  return;
                }
                
                console.log('Adding link:', text, href);
                
                // Add URL to our tracking Set
                addedUrls.add(href);
                
                const item = document.createElement('li');
                item.style.margin = '5px 0';
                
                const newLink = document.createElement('a');
                newLink.href = href;
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
                
                // Add hover effect
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
            
            // Add a message if no links were added
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
          }, 500);
          
          // Add list to content
          content.appendChild(list);
          
          // Add title and content to sidebar
          sidebar.appendChild(title);
          sidebar.appendChild(content);
          
          // Variable to track sidebar state - check localStorage first
          // Always start with collapsed state after page navigation
          let isOpen = false;
          
          // Save collapsed state to localStorage
          localStorage.setItem('sidebarOpen', 'false');
          
          // Function to open sidebar
          function openSidebar() {
            // Only open on mobile screens
            if (window.innerWidth >= 997) {
              return;
            }
            
            // Add active class to apply CSS
            sidebar.classList.add('active');
            
            // Save state to localStorage
            localStorage.setItem('sidebarOpen', 'true');
            
            // Update sidebar styles
            sidebar.style.width = '170px';
            sidebar.style.height = 'auto';
            sidebar.style.background = 'linear-gradient(135deg, white, rgba(78, 87, 185, 0.8))';
            sidebar.style.backgroundColor = 'transparent';
            sidebar.style.border = '1px solid rgba(78, 87, 185, 0.5)';
            sidebar.style.borderRadius = '8px';
            
            // Update title styles
            title.style.borderRadius = '8px 8px 0 0';
            title.style.width = 'auto';
            title.style.height = 'auto';
            title.style.display = 'block';
            
            // Show text "Menu"
            text.style.display = 'inline-block';
            
            // Adjust icon size and color
            icon.style.fontSize = '16px';
            icon.style.lineHeight = '16px';
            icon.style.color = 'white';
            icon.style.fontWeight = 'bold';
            
            // Update title content styles
            titleContent.style.background = 'rgba(78, 87, 185, 1)';
            titleContent.style.borderRadius = '8px 8px 0 0';
            titleContent.style.padding = '8px 0';
            
            // Show content
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
          
          // Function to close sidebar
          function closeSidebar() {
            // Remove active class
            sidebar.classList.remove('active');
            
            // Save state to localStorage
            localStorage.setItem('sidebarOpen', 'false');
            
            // Hide content
            content.style.display = 'none';
            content.style.padding = '0';
            content.style.maxHeight = '0';
            content.style.height = '0';
            content.style.minHeight = '0';
            content.style.overflow = 'hidden';
            
            // Hide text "Menu"
            text.style.display = 'none';
            
            // Restore icon size
            icon.style.fontSize = '30px';
            icon.style.lineHeight = '30px';
            
            // Update sidebar styles
            sidebar.style.width = '40px';
            sidebar.style.height = '40px';
            sidebar.style.background = 'rgba(78, 87, 185, 0.9)';
            sidebar.style.backgroundColor = 'rgba(78, 87, 185, 0.9)';
            sidebar.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            sidebar.style.borderRadius = '50%';
            
            // Update title styles
            title.style.borderRadius = '50%';
            title.style.width = '40px';
            title.style.height = '40px';
            title.style.display = 'flex';
            
            // Update title content styles
            titleContent.style.background = 'transparent';
            titleContent.style.borderRadius = '0';
            titleContent.style.padding = '0';
          }
          
          // Add click event to toggle sidebar
          sidebar.addEventListener('click', function(e) {
            console.log('Sidebar clicked', e.target);
            
            // Only handle clicks on sidebar or title, not on content
            if (e.target === sidebar || e.target === title || e.target === titleContent || e.target === icon || e.target === text) {
              console.log('Toggle sidebar', isOpen);
              
              if (!isOpen) {
                openSidebar();
                isOpen = true;
              } else {
                closeSidebar();
                isOpen = false;
              }
              
              // Prevent event from bubbling
              e.stopPropagation();
            }
          });
          
          // Add click event to close sidebar when clicking outside
          document.addEventListener('click', function(e) {
            if (isOpen && !sidebar.contains(e.target)) {
              console.log('Clicked outside sidebar, closing');
              closeSidebar();
              isOpen = false;
            }
          });
          
          // Add click event to close sidebar when clicking a link
          // Use event delegation for dynamically added links
          content.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
              console.log('Link clicked, closing sidebar');
              
              // Close after a short delay to allow the click to process
              setTimeout(function() {
                closeSidebar();
                isOpen = false;
              }, 100);
            }
          });
          
          // Add sidebar to body
          document.body.appendChild(sidebar);
          console.log('Custom sidebar added to body');
        });
        
        // Listen for window resize events
        window.addEventListener('resize', function() {
          // Check if we're on mobile or desktop
          if (window.innerWidth <= 996) {
            // On mobile - show custom sidebar if it doesn't exist
            const customSidebar = document.getElementById('plugin-sidebar');
            if (!customSidebar) {
              console.log('Window resized to mobile, creating sidebar');
              
              // Create a new load event to trigger sidebar creation
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }
          } else {
            // On desktop - hide custom sidebar if it exists
            const customSidebar = document.getElementById('plugin-sidebar');
            if (customSidebar) {
              customSidebar.style.display = 'none';
              customSidebar.classList.remove('active');
              
              // Update isOpen variable if it's accessible in this scope
              if (typeof isOpen !== 'undefined') {
                isOpen = false;
              }
              
              // Save state to localStorage
              localStorage.setItem('sidebarOpen', 'false');
            }
          }
        });
        
        // Listen for page changes and recreate sidebar
        document.addEventListener('DOMContentLoaded', function() {
          console.log('DOMContentLoaded event - checking for sidebar');
          
          // Wait a bit to ensure DOM is ready
          setTimeout(function() {
            // Check if sidebar exists
            if (!document.getElementById('plugin-sidebar') && window.innerWidth <= 996) {
              console.log('Sidebar not found on DOMContentLoaded, creating again');
              
              // Create a new load event to trigger sidebar creation
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }
          }, 500);
        });
        
        // Track URL changes to update sidebar when navigating
        let lastUrl = location.href;
        
        // Create a MutationObserver to track DOM changes
        const navigationObserver = new MutationObserver(() => {
          if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL changed to', location.href);
            
            // Wait a bit for new page to load content
            setTimeout(() => {
              console.log('Updating sidebar for new page');
              
              // Remove old sidebar if exists
              const existingSidebar = document.getElementById('plugin-sidebar');
              if (existingSidebar) {
                existingSidebar.remove();
              }
              
              // Reset sidebar state in localStorage to ensure it starts collapsed
              localStorage.setItem('sidebarOpen', 'false');
              
              // Create a new load event to trigger sidebar creation
              if (window.innerWidth <= 996) {
                const loadEvent = new Event('load');
                window.dispatchEvent(loadEvent);
              }
            }, 500);
          }
        });
        
        // Start observing the document body for changes
        navigationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Listen for popstate event (when user uses browser back/forward buttons)
        window.addEventListener('popstate', function() {
          console.log('Navigation detected via popstate event');
          
          // Only update sidebar on mobile
          if (window.innerWidth <= 996) {
            setTimeout(() => {
              // Remove old sidebar if exists
              const existingSidebar = document.getElementById('plugin-sidebar');
              if (existingSidebar) {
                existingSidebar.remove();
              }
              
              // Create a new load event to trigger sidebar creation
              const loadEvent = new Event('load');
              window.dispatchEvent(loadEvent);
            }, 500);
          }
        });
      `,
    },
  ],

  // Set the production url of your site here
  url: "https://TuPhung369.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/Haaga_Backend_Programming/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "TuPhung369", // Usually your GitHub org/user name.
  projectName: "Haaga_Backend_Programming", // Usually your repo name.

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  // Custom fields for webpack configuration
  customFields: {
    webpackConfig: {
      // This is just for documentation, actual config is handled by clientModules
      cssModules: true,
    },
  },

  // Use custom client modules file with ES modules
  clientModules: [path.resolve(__dirname, "./src/client-modules.js")],

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },

  themes: ["@docusaurus/theme-mermaid"],

  // Custom plugins
  plugins: [
    path.resolve(__dirname, "./src/plugins/bookmark-plugin.js"),
    path.resolve(__dirname, "./src/plugins/category-css-plugin.js"),
  ],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: path.resolve(__dirname, "./sidebars.js"),
          // "Edit this page" links have been removed
          // editUrl:
          //   "https://github.com/TuPhung369/Haaga_Backend_Programming/tree/main/TuPhung_Docs/",
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
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/logo.svg",
      // Configure Table of Contents to only show h2 headers
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
        title: "Enterprise Nexus",
        logo: {
          alt: "Enterprise Nexus Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "dropdown",
            label: "Documentation",
            position: "left",
            items: [
              {
                type: "html",
                value:
                  '<a href="/Haaga_Backend_Programming/docs/intro" class="dropdown__link">Introduction</a>',
              },
              {
                type: "html",
                value:
                  '<a href="/Haaga_Backend_Programming/docs/tech-stack" class="dropdown__link">Tech Stack</a>',
              },
              {
                type: "html",
                value:
                  '<a href="/Haaga_Backend_Programming/docs/architecture" class="dropdown__link">Architecture</a>',
              },
              {
                type: "html",
                value:
                  '<a href="/Haaga_Backend_Programming/docs/deployment" class="dropdown__link">Deployment</a>',
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
                  '<a href="/Haaga_Backend_Programming/docs/category/frontend" class="dropdown__link">Frontend</a>',
              },
              {
                type: "html",
                value:
                  '<a href="/Haaga_Backend_Programming/docs/category/backend" class="dropdown__link">Backend</a>',
              },
            ],
          },
          {
            href: "/Haaga_Backend_Programming/docs/video/project-video",
            label: "Videos",
            position: "left",
          },
          {
            href: "https://tuphung369.github.io/professional-cv/",
            label: "My CV",
            position: "left",
          },
          {
            href: "https://www.linkedin.com/in/tuphung010787/",
            label: "LinkedIn",
            position: "left",
          },
          {
            href: "https://github.com/TuPhung369/Haaga_Backend_Programming",
            className: "header-github-link",
            position: "right",
            "aria-label": "GitHub repository",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Documentation",
            items: [
              {
                label: "Introduction",
                to: "/docs/intro",
              },
              {
                label: "Architecture",
                to: "/docs/architecture",
              },
              {
                label: "Tech Stack",
                to: "/docs/tech-stack",
              },
            ],
          },
          {
            title: "Technical Guides",
            items: [
              {
                label: "Frontend",
                to: "/docs/category/frontend",
              },
              {
                label: "Backend",
                to: "/docs/category/backend",
              },
              {
                label: "Deployment Guide",
                to: "/docs/deployment",
              },
            ],
          },
          {
            title: "Project Resources",
            items: [
              {
                label: "Video",
                to: "/docs/video/project-video",
              },
              {
                label: "GitHub",
                href: "https://github.com/TuPhung369/Haaga_Backend_Programming",
              },
            ],
          },
          {
            title: "Connect With Me",
            items: [
              {
                label: "My CV",
                href: "https://tuphung369.github.io/professional-cv/",
              },
              {
                label: "LinkedIn",
                href: "https://www.linkedin.com/in/tuphung010787/",
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
      // Mermaid configuration
      mermaid: {
        theme: { light: "neutral", dark: "dark" },
        options: {
          flowchart: {
            curve: "linear",
          },
        },
      },
    }),
};

module.exports = config;

