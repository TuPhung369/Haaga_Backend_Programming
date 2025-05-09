// Plugin to add bookmark script directly to HTML
module.exports = function (context, options) {
  return {
    name: "bookmark-plugin",
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: "style",
            innerHTML: `
              /* Reset styles for plugin-bookmark to prevent overlap */
              #plugin-bookmark {
                background: rgba(78, 87, 185, 0.0) !important;
                background-color: rgba(78, 87, 185, 0.0) !important;
                background-image: none !important;
                border: 1px solid rgba(78, 87, 185, 1) !important;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;
                margin: 0 !important;
                padding: 0 !important;
                position: fixed !important;
                right: 15px !important;
                top: 75px !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                transition: all 0.3s ease !important;
                z-index: 99999 !important; /* Increased z-index to ensure visibility */
                text-align: center !important;
                cursor: pointer !important;
              }
              
              /* Style for bookmark icon to ensure it's centered */
              .bookmark-icon {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                font-size: 35px !important;
                text-align: center !important;
                width: 40px !important;
                height: 40px !important;
                margin: 0 auto !important;
                padding-bottom: 5px !important; /* Reduced padding for all screen sizes */
                color: rgba(78, 87, 185, 1) !important; /* Black color for initial state */
                transition: color 0.3s ease !important;
              }
              
              /* Hover effect for bookmark icon */
              #plugin-bookmark:hover .bookmark-icon {
                color: rgba(78, 87, 185, 1) !important; /* Change to theme color on hover */
              }
              
              /* Override styles when active */
              #plugin-bookmark.active {
                background: linear-gradient(to bottom, white, rgba(78, 87, 185, 0.8)) !important;
                background-color: transparent !important;
                border: 1px solid rgba(78, 87, 185, 0.5) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                right: 15px !important;
                top: 75px !important;
                width: 350px !important;
                height: auto !important;
                border-radius: 8px !important;
                z-index: 99999 !important;
                display: block !important;
              }
              
              /* Responsive styles for different screen sizes */
              @media (max-width: 1200px) and (min-width: 769px) {
                #plugin-bookmark {
                  right: 10px !important;
                }
                #plugin-bookmark.active {
                  right: 10px !important;
                  width: 300px !important;
                }
              }
              
              @media (max-width: 768px) {
                #plugin-bookmark {
                  right: 3px !important;
                }
                #plugin-bookmark.active {
                  right: 3px !important;
                  width: 300px !important;
                }
              }
              
              @media (max-width: 480px) {
                #plugin-bookmark {
                  right: 3px !important;
                }
                #plugin-bookmark.active {
                  right: 3px !important;
                  width: 250px !important;
                }
              }
              
              /* Style for bookmark title when active */
              #plugin-bookmark.active .bookmark-title-content {
                background: linear-gradient(135deg, rgba(78, 87, 185, 0.9), rgba(78, 87, 185, 1)) !important;
                background-color: rgba(78, 87, 185, 1) !important;
                color: white !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                border-radius: 8px 8px 0 0 !important;
                padding: 10px 0 !important;
                text-align: center !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                position: relative !important;
                overflow: hidden !important;
                transition: all 0.3s ease !important;
              }
              
              /* Add subtle gradient animation to title */
              @keyframes gradientShift {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
              
              #plugin-bookmark.active .bookmark-title-content:hover {
                background: linear-gradient(135deg, rgba(78, 87, 185, 0.8), rgba(78, 87, 185, 1), rgba(60, 70, 170, 1)) !important;
                background-size: 200% 200% !important;
                animation: gradientShift 3s ease infinite !important;
              }
              
              /* Add subtle shine effect on hover */
              #plugin-bookmark.active .bookmark-title-content::after {
                content: "" !important;
                position: absolute !important;
                top: -50% !important;
                left: -50% !important;
                width: 200% !important;
                height: 200% !important;
                background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%) !important;
                transform: rotate(30deg) !important;
                opacity: 0 !important;
                transition: opacity 0.6s !important;
              }
              
              #plugin-bookmark.active .bookmark-title-content:hover::after {
                opacity: 1 !important;
                transition: opacity 0.6s, transform 1s !important;
                transform: rotate(30deg) translate(100%, -100%) !important;
              }
              
              #plugin-bookmark.active .bookmark-icon {
                color: white !important;
                display: inline-block !important;
                vertical-align: middle !important;
                font-size: 20px !important;
                width: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding-bottom: 0 !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
                transition: transform 0.3s ease !important;
              }
              
              #plugin-bookmark.active .bookmark-title-content:hover .bookmark-icon {
                transform: rotate(360deg) scale(1.1) !important;
              }
              
              #plugin-bookmark.active .bookmark-text {
                color: white !important;
                display: inline-block !important;
                vertical-align: middle !important;
                font-size: 16px !important;
                line-height: 16px !important;
                margin-left: 8px !important;
                font-weight: 500 !important;
                letter-spacing: 0.5px !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
              }
              
              #plugin-bookmark.active ul {
                background: transparent !important;
                background-color: transparent !important;
              }
              
              #plugin-bookmark.active a {
                background: transparent !important;
                background-color: transparent !important;
              }
              
              #plugin-bookmark.active a:hover {
                background: rgba(78, 87, 185, 0.5) !important;
                background-color: rgba(78, 87, 185, 0.5) !important;
                color: white !important;
              }
              
              /* Style for bookmark content when active - with stable positioning */
              #plugin-bookmark.active .bookmark-content {
                background: white !important;
                border-radius: 0 0 8px 8px !important;
                padding: 8px 0 !important;
                max-height: calc(90vh - 100px) !important; /* Limit to 90% of viewport height minus some space for header */
                overflow-y: auto !important;
                box-shadow: inset 0 -5px 5px -5px rgba(0,0,0,0.1) !important;
                border-left: 1px solid rgba(78, 87, 185, 0.2) !important;
                border-right: 1px solid rgba(78, 87, 185, 0.2) !important;
                border-bottom: 1px solid rgba(78, 87, 185, 0.2) !important;
                position: relative !important;
                transform: translateZ(0) !important; /* Force GPU acceleration for smoother rendering */
                backface-visibility: hidden !important; /* Prevent flickering in some browsers */
              }
              
              /* Simplified content appearance without transform animations */
              @keyframes fadeInContent {
                from {
                  opacity: 0.8;
                }
                to {
                  opacity: 1;
                }
              }
              
              #plugin-bookmark.active .bookmark-content {
                animation: fadeInContent 0.2s ease-out !important;
              }
              
              /* Removed animation for list items to prevent flickering */
              #plugin-bookmark.active .bookmark-content li {
                opacity: 1 !important; /* Make items visible immediately */
                transition: background-color 0.2s ease !important; /* Smooth transition for hover only */
              }
              
              /* Scrollbar styling for bookmark content */
              #plugin-bookmark.active .bookmark-content::-webkit-scrollbar {
                width: 6px !important;
              }
              
              #plugin-bookmark.active .bookmark-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.05) !important;
                border-radius: 0 0 8px 0 !important;
              }
              
              #plugin-bookmark.active .bookmark-content::-webkit-scrollbar-thumb {
                background: rgba(78, 87, 185, 0.5) !important;
                border-radius: 3px !important;
              }
              
              #plugin-bookmark.active .bookmark-content::-webkit-scrollbar-thumb:hover {
                background: rgba(78, 87, 185, 0.7) !important;
              }
              
              /* Style for headings in bookmark content */
              #plugin-bookmark.active .bookmark-content li {
                text-align: left !important;
                margin: 0 !important;
                padding: 0 !important;
                position: relative !important;
                transition: all 0.2s ease !important;
              }
              
              #plugin-bookmark.active .bookmark-content a {
                text-align: left !important;
                font-weight: normal !important;
                transition: all 0.3s ease !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
              }
              
              /* Add a custom attribute to links for styling based on heading level */
              #plugin-bookmark.active .bookmark-content li a {
                position: relative !important;
                display: block !important;
                text-align: left !important;
                padding: 6px 10px !important;
                border-left: 3px solid transparent !important;
                transition: all 0.2s ease !important;
                margin: 2px 0 !important;
                border-radius: 0 4px 4px 0 !important;
              }
              
              /* Basic style for all links to ensure visibility */
              #plugin-bookmark.active .bookmark-content li a {
                display: block !important;
                padding: 8px 10px !important;
                margin: 2px 0 !important;
                color: #000 !important;
                font-weight: normal !important;
                background-color: white !important;
                border-left: 3px solid transparent !important;
                text-decoration: none !important;
                z-index: 100000 !important;
                position: relative !important;
              }
              
              /* We're not showing h1 headings anymore */
              
              /* Style for h2 headings - primary heading now */
              #plugin-bookmark.active .bookmark-content li a.bookmark-heading-h2,
              #plugin-bookmark.active .bookmark-content li a[data-heading-level="2"] {
                font-weight: bold !important;
                font-size: 15px !important;
                color: #222 !important;
                padding-left: 15px !important;
                border-left: 4px solid rgba(78, 87, 185, 0.8) !important;
                background-color: rgba(78, 87, 185, 0.08) !important;
                margin-top: 4px !important;
                padding-top: 8px !important;
                padding-bottom: 8px !important;
                border-radius: 0 4px 4px 0 !important;
              }
              
              /* Style for h3 headings - secondary heading */
              #plugin-bookmark.active .bookmark-content li a.bookmark-heading-h3,
              #plugin-bookmark.active .bookmark-content li a[data-heading-level="3"] {
                font-weight: 500 !important;
                font-size: 13px !important;
                color: #444 !important;
                padding-left: 25px !important;
                border-left: 2px solid rgba(78, 87, 185, 0.4) !important;
                font-style: normal !important;
                margin-top: 2px !important;
                padding-top: 6px !important;
                padding-bottom: 6px !important;
              }
              
              /* We're not showing h4+ headings anymore */
              
              /* Base style for all links - with smoother transition */
              #plugin-bookmark.active .bookmark-content li a {
                transition: all 0.2s ease-in-out !important;
                transform: translateY(0) !important; /* Prevent any transform on normal state */
              }
              
              /* Hover effects that preserve the distinct styling */
              #plugin-bookmark.active .bookmark-content li a:hover {
                background-color: rgba(78, 87, 185, 0.1) !important;
                color: #4e57b9 !important;
                border-left-width: 4px !important;
                transform: translateY(0) !important; /* Prevent any transform on hover */
              }
              
              /* Specific hover effects for h2 - primary heading */
              #plugin-bookmark.active .bookmark-content li a.bookmark-heading-h2:hover,
              #plugin-bookmark.active .bookmark-content li a[data-heading-level="2"]:hover {
                background-color: rgba(78, 87, 185, 0.15) !important;
                border-left-color: rgba(78, 87, 185, 1) !important;
                color: rgba(78, 87, 185, 1) !important;
              }
              
              /* Specific hover effects for h3 - secondary heading */
              #plugin-bookmark.active .bookmark-content li a.bookmark-heading-h3:hover,
              #plugin-bookmark.active .bookmark-content li a[data-heading-level="3"]:hover {
                background-color: rgba(78, 87, 185, 0.1) !important;
                border-left-color: rgba(78, 87, 185, 0.7) !important;
                color: rgba(78, 87, 185, 0.9) !important;
              }
              
              /* We're not showing h4+ headings anymore */
              
              /* Active state for all links */
              #plugin-bookmark.active .bookmark-content li a:active {
                background-color: rgba(78, 87, 185, 0.2) !important;
                color: #4e57b9 !important;
                transform: translateY(0) !important; /* Prevent any transform on active */
              }
              
              /* Add ellipsis for long text */
              #plugin-bookmark.active .bookmark-content li a {
                max-width: 100% !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                will-change: auto !important; /* Prevent browser optimization that might cause flickering */
              }
              
              /* We'll handle spacing between heading groups in JavaScript instead */
              
              /* Style for empty list message */
              .bookmark-empty-message {
                text-align: center !important;
                padding: 20px 15px !important;
                color: #666 !important;
                font-style: italic !important;
                font-size: 14px !important;
                border-top: 1px dashed rgba(78, 87, 185, 0.2) !important;
                border-bottom: 1px dashed rgba(78, 87, 185, 0.2) !important;
                margin: 10px 15px !important;
                background-color: rgba(78, 87, 185, 0.03) !important;
                border-radius: 4px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                animation: fadeInContent 0.5s ease-out !important;
                min-height: 100px !important;
              }
              
              .bookmark-empty-icon {
                font-size: 24px !important;
                color: rgba(78, 87, 185, 0.5) !important;
                margin-bottom: 10px !important;
                animation: pulseIcon 1.5s ease-in-out infinite !important;
              }
              
              @keyframes pulseIcon {
                0% {
                  transform: scale(1);
                  opacity: 0.7;
                }
                50% {
                  transform: scale(1.1);
                  opacity: 1;
                }
                100% {
                  transform: scale(1);
                  opacity: 0.7;
                }
              }
              
              /* Ripple effect animation */
              @keyframes rippleEffect {
                0% {
                  transform: scale(0);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.5);
                  opacity: 0.5;
                }
                100% {
                  transform: scale(2);
                  opacity: 0;
                }
              }
              
              /* Hide default bookmark on all pages */
              .table-of-contents,
              .theme-doc-toc,
              .theme-doc-toc-desktop,
              .table-of-contents-container,
              [class*="tableOfContents"]:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp),
              [class*="tocCollapsible"]:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp),
              .toc-wrapper,
              .toc-container,
              .toc:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp),
              .on-this-page,
              .on-this-page-navigation,
              nav[aria-label="Table of contents"],
              nav[aria-label="On this page"],
              aside[class*="toc"],
              div[class*="toc"]:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp),
              div[class*="TableOfContents"]:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp),
              div[role="complementary"]:not(body):not(#__docusaurus):not(.main-wrapper):not(.docsWrapper_hBAB):not(.docRoot_UBD9):not(.container):not(.row):not(.col):not(.docItemContainer_Djhp) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
            `,
          },
          {
            tagName: "script",
            innerHTML: `
              document.addEventListener('DOMContentLoaded', function() {
                // Track last bookmark creation time to prevent too frequent updates
                let lastBookmarkCreationTime = 0;
                
                // Function to hide default TOC elements
                function hideDefaultTOC() {
                  const selectors = [
                    '.table-of-contents',
                    '.theme-doc-toc',
                    '.theme-doc-toc-desktop',
                    '.table-of-contents-container',
                    '[class*="tableOfContents"]',
                    '[class*="tocCollapsible"]',
                    '.toc-wrapper',
                    '.toc-container',
                    '.toc',
                    '.on-this-page',
                    '.on-this-page-navigation',
                    'nav[aria-label="Table of contents"]',
                    'nav[aria-label="On this page"]',
                    'aside[class*="toc"]',
                    'div[class*="toc"]',
                    'div[class*="TableOfContents"]',
                    'div[role="complementary"]'
                  ];
                  
                  selectors.forEach(selector => {
                    try {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                      });
                    } catch (e) {
                      console.error('Error hiding TOC:', e);
                    }
                  });
                }
                
                // Function to check if current page is a documentation page
                function isDocPage() {
                  // Homepage
                  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    return true;
                  }
                  
                  // Docs pages
                  if (window.location.pathname.includes('/docs/')) {
                    if (window.location.pathname.includes('/docs/video/')) {
                      return false;
                    }
                    return true;
                  }
                  
                  // Check for doc elements
                  const docElements = document.querySelectorAll('.theme-doc-markdown, .docs-doc-page');
                  return docElements.length > 0;
                }
                
                // Function to create bookmark
                function createBookmark() {
                  // Prevent too frequent updates (at most once every 500ms)
                  const now = Date.now();
                  if (now - lastBookmarkCreationTime < 500) {
                    return;
                  }
                  lastBookmarkCreationTime = now;
                  
                  // Check if there are any h2 or h3 headings on the page first
                  const headings = document.querySelectorAll('h2, h3');
                  
                  // Count valid headings (with IDs)
                  let validHeadingsCount = 0;
                  headings.forEach(heading => {
                    if (heading.id) validHeadingsCount++;
                  });
                  
                  // Debug: Log the headings found
                  console.log('Headings found:', headings.length, 'Valid h2/h3 headings with IDs:', validHeadingsCount);
                  
                  // Only proceed if there are valid h2 or h3 headings with IDs
                  if (validHeadingsCount === 0) {
                    console.log('No valid h2 or h3 headings with IDs found, skipping bookmark creation');
                    return;
                  }
                  
                  // Remove existing bookmark if any
                  let wasOpen = false;
                  const existingBookmark = document.getElementById('plugin-bookmark');
                  if (existingBookmark) {
                    // If bookmark is already open, remember this state
                    wasOpen = existingBookmark.classList.contains('active');
                    existingBookmark.remove();
                  }
                  
                  // Create bookmark container
                  const bookmark = document.createElement('div');
                  bookmark.id = 'plugin-bookmark';
                  
                  // Create title
                  const title = document.createElement('div');
                  title.className = 'bookmark-title';
                  title.style.padding = '0';
                  title.style.margin = '0';
                  title.style.textAlign = 'center';
                  title.style.cursor = 'pointer';
                  
                  // Create title content
                  const titleContent = document.createElement('div');
                  titleContent.className = 'bookmark-title-content';
                  titleContent.style.textAlign = 'center';
                  
                  // Create icon - using star icon (&#9733;) instead of bookmark emoji
                  const icon = document.createElement('span');
                  icon.className = 'bookmark-icon';
                  icon.innerHTML = '&#9733;'; // Star icon
                  
                  // Create text
                  const text = document.createElement('span');
                  text.className = 'bookmark-text';
                  text.textContent = 'Bookmark';
                  text.style.display = 'none';
                  
                  // Create content
                  const content = document.createElement('div');
                  content.className = 'bookmark-content';
                  content.style.maxHeight = '0';
                  content.style.overflow = 'hidden';
                  content.style.transition = 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out';
                  content.style.background = 'white';
                  content.style.opacity = '0';
                  
                  // Create list
                  const list = document.createElement('ul');
                  list.style.listStyle = 'none';
                  list.style.padding = '0';
                  list.style.margin = '0';
                  list.style.backgroundColor = 'white';
                  
                  // Assemble elements
                  titleContent.appendChild(icon);
                  titleContent.appendChild(text);
                  title.appendChild(titleContent);
                  content.appendChild(list);
                  bookmark.appendChild(title);
                  bookmark.appendChild(content);
                  
                  // Add to document
                  document.body.appendChild(bookmark);
                  
                  // Check if bookmark should be visible initially
                  populateBookmark();
                  
                  // Track state
                  let isOpen = wasOpen;
                  
                  // If it was open before, reopen it
                  if (wasOpen) {
                    openBookmark();
                  }
                  
                  // Function to populate bookmark with headings
                  function populateBookmark() {
                    list.innerHTML = '';
                    
                    const headings = document.querySelectorAll('h2, h3');
                    
                    // Count valid headings (with IDs)
                    let validHeadingsCount = 0;
                    headings.forEach(heading => {
                      if (heading.id) validHeadingsCount++;
                    });
                    
                    // If no valid h2 or h3 headings, hide the bookmark completely
                    if (validHeadingsCount === 0) {
                      bookmark.style.display = 'none';
                      console.log('No h2 or h3 headings found, hiding bookmark');
                      return;
                    }
                    
                    // Show bookmark only if there are headings
                    bookmark.style.display = 'block';
                    
                    // Track the previous heading level to add spacing between groups
                    let prevLevel = 0;
                    let visibleIndex = 0;
                    
                    headings.forEach((heading, index) => {
                      // Skip headings without IDs
                      if (!heading.id) return;
                      
                      // Get heading level
                      const level = parseInt(heading.tagName.substring(1));
                      
                      const item = document.createElement('li');
                      const link = document.createElement('a');
                      link.href = '#' + heading.id;
                      link.textContent = heading.textContent;
                      link.style.display = 'block';
                      link.style.padding = '5px 8px';
                      
                      // Add data attribute for heading level
                      link.setAttribute('data-heading-level', level);
                      
                      // Add class for heading level
                      link.classList.add('bookmark-heading-h' + level);
                      
                      // Add indentation based on heading level
                      const paddingLeft = (level - 1) * 10;
                      link.style.paddingLeft = (8 + paddingLeft) + 'px';
                      
                      // Add spacing between different heading groups
                      if (visibleIndex > 0 && level === 2) {
                        // Add more space before h2 headings
                        item.style.marginTop = '12px';
                        item.style.borderTop = '1px solid rgba(78, 87, 185, 0.1)';
                        item.style.paddingTop = '8px';
                      } else if (visibleIndex > 0 && level === 3 && prevLevel === 2) {
                        // Add a small space after the first h3 under an h2
                        item.style.marginTop = '4px';
                      }
                      
                      // Increment visible index counter
                      visibleIndex++;
                      
                      // Remember this level for the next iteration
                      prevLevel = level;
                      
                      link.style.color = '#4e57b9';
                      link.style.textDecoration = 'none';
                      link.style.borderRadius = '4px';
                      
                      // Simple click handler
                      link.addEventListener('click', function(e) {
                        // Close bookmark after a delay
                        setTimeout(closeBookmark, 300);
                      });
                      
                      item.appendChild(link);
                      list.appendChild(item);
                    });
                  }
                  
                  // Function to open bookmark
                  function openBookmark() {
                    // Always open the bookmark, even if empty
                    // We'll show a message if there are no headings
                    
                    isOpen = true;
                    bookmark.classList.add('active');
                    
                    text.style.display = 'inline-block';
                    
                    titleContent.style.background = 'rgba(78, 87, 185, 1)';
                    titleContent.style.color = 'white';
                    titleContent.style.borderRadius = '8px 8px 0 0';
                    titleContent.style.padding = '8px 0';
                    
                    // Set max-height to a large value to allow content to expand naturally
                    // The CSS will limit it to 90vh - 100px if needed
                    content.style.maxHeight = '2000px';
                    content.style.opacity = '1';
                    content.style.borderTop = '1px solid #eee';
                    content.style.borderRadius = '0 0 8px 8px';
                    
                    populateBookmark();
                  }
                  
                  // Function to close bookmark
                  function closeBookmark() {
                    isOpen = false;
                    bookmark.classList.remove('active');
                    
                    titleContent.style.background = 'transparent';
                    titleContent.style.color = '#4e57b9';
                    titleContent.style.borderRadius = '0';
                    titleContent.style.padding = '0';
                    
                    text.style.display = 'none';
                    
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                  }
                  
                  // Open bookmark on hover (desktop) or click (mobile)
                  bookmark.addEventListener('mouseenter', function() {
                    if (!isOpen) {
                      openBookmark();
                    }
                    // Cancel any pending close timer
                    if (leaveTimer) {
                      clearTimeout(leaveTimer);
                    }
                  });
                  
                  // Toggle bookmark on click (especially for mobile)
                  title.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent document click from immediately closing it
                    if (isOpen) {
                      closeBookmark();
                    } else {
                      openBookmark();
                    }
                  });
                  
                  // Close bookmark when mouse leaves (with a small delay)
                  let leaveTimer;
                  bookmark.addEventListener('mouseleave', function() {
                    if (isOpen) {
                      leaveTimer = setTimeout(function() {
                        closeBookmark();
                      }, 300); // 300ms delay before closing
                    }
                  });
                  
                  // Add document-wide click event handler to close bookmark when clicking outside
                  document.addEventListener('click', function(e) {
                    // If bookmark exists and is open
                    const bookmarkElement = document.getElementById('plugin-bookmark');
                    if (bookmarkElement && bookmarkElement.classList.contains('active')) {
                      // Check if the click was outside the bookmark
                      if (!bookmarkElement.contains(e.target)) {
                        closeBookmark();
                      }
                    }
                  });
                  
                  // Add touchstart event for mobile devices
                  document.addEventListener('touchstart', function(e) {
                    // If bookmark exists and is open
                    const bookmarkElement = document.getElementById('plugin-bookmark');
                    if (bookmarkElement && bookmarkElement.classList.contains('active')) {
                      // Check if the touch was outside the bookmark and not on a link inside the bookmark
                      if (!bookmarkElement.contains(e.target) && !e.target.closest('#plugin-bookmark a')) {
                        closeBookmark();
                      }
                    }
                  });
                  
                  // Prevent clicks inside the bookmark content from closing it
                  content.addEventListener('click', function(e) {
                    e.stopPropagation();
                  });
                  
                  // Prevent touches inside the bookmark content from closing it
                  content.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                  });
                }
                
                // Only create bookmark on documentation pages
                if (isDocPage()) {
                  hideDefaultTOC();
                  createBookmark();
                }
                
                // Handle page changes (for SPAs)
                window.addEventListener('popstate', function() {
                  setTimeout(function() {
                    if (isDocPage()) {
                      hideDefaultTOC();
                      createBookmark();
                    }
                  }, 300);
                });
                
                // Track URL changes for client-side routing (like sidebar navigation)
                let lastUrl = location.href;
                let urlCheckTimer = null;
                let headingsCheckTimer = null;
                
                // Function to check URL changes with debouncing
                function checkUrlChange() {
                  if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    console.log('URL changed to:', lastUrl);
                    
                    // Wait a bit for the content to update
                    clearTimeout(urlCheckTimer);
                    urlCheckTimer = setTimeout(function() {
                      if (isDocPage()) {
                        hideDefaultTOC();
                        createBookmark();
                      }
                    }, 300);
                  }
                }
                
                // Function to check headings with debouncing
                function checkHeadings() {
                  clearTimeout(headingsCheckTimer);
                  headingsCheckTimer = setTimeout(function() {
                    // Check if there are any valid h2 or h3 headings first
                    const headings = document.querySelectorAll('h2, h3');
                    let validHeadingsCount = 0;
                    headings.forEach(heading => {
                      if (heading.id) validHeadingsCount++;
                    });
                    
                    // Log the headings count for debugging
                    console.log('H2/H3 headings found in checkHeadings:', validHeadingsCount);
                    
                    const existingBookmark = document.getElementById('plugin-bookmark');
                    
                    // If no valid h2 or h3 headings, hide the bookmark if it exists
                    if (validHeadingsCount === 0 && existingBookmark) {
                      existingBookmark.style.display = 'none';
                      return;
                    }
                    
                    // If there are headings and we're on a doc page, create or update the bookmark
                    if (validHeadingsCount > 0 && isDocPage()) {
                      createBookmark();
                    }
                  }, 200);
                }
                
                // Create a new MutationObserver to watch for DOM changes
                // Make sure document is fully loaded before creating observer
                function setupMutationObserver() {
                  if (document && document.body) {
                    try {
                      const observer = new MutationObserver(function(mutations) {
                        // Check for URL changes and heading changes
                        checkUrlChange();
                        checkHeadings();
                      });
                      
                      // Start observing the document with the configured parameters
                      observer.observe(document.body, { childList: true, subtree: true });
                      console.log('MutationObserver successfully attached to document.body');
                    } catch (error) {
                      console.error('Error setting up MutationObserver:', error);
                    }
                  } else {
                    console.warn('Document body not available yet, retrying in 100ms');
                    setTimeout(setupMutationObserver, 100);
                  }
                }
                
                // Wait for document to be ready before setting up observer
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  setupMutationObserver();
                } else {
                  document.addEventListener('DOMContentLoaded', setupMutationObserver);
                }
                
                // Also check for URL changes on click events (for sidebar navigation)
                document.addEventListener('click', function(e) {
                  // Check if the click was on a link
                  if (e.target.tagName === 'A' || e.target.closest('a')) {
                    // Wait a bit for the navigation to happen
                    setTimeout(checkUrlChange, 100);
                    setTimeout(checkHeadings, 300);
                  }
                });
                
                // Additional check for dynamic content loading
                // This helps with pages where content might be loaded after initial page load
                setTimeout(checkHeadings, 1000);
                
                // Set up periodic checks for the first few seconds after page load
                // This helps catch late-loading content in SPAs
                for (let i = 1; i <= 5; i++) {
                  setTimeout(checkHeadings, i * 1000);
                }
                
                // For Docusaurus specifically, try to detect route changes
                // by monitoring for specific events or DOM elements
                function setupDocusaurusRouteChangeDetection() {
                  // Make sure document is available
                  if (!document || !document.body) {
                    console.warn('Document not ready for Docusaurus route detection, retrying in 200ms');
                    setTimeout(setupDocusaurusRouteChangeDetection, 200);
                    return;
                  }
                  
                  // Check for Docusaurus-specific elements that might indicate a route change
                  const docusaurusContentContainer = document.querySelector('.main-wrapper');
                  if (docusaurusContentContainer) {
                    try {
                      const contentObserver = new MutationObserver(function(mutations) {
                        // When main content changes, check headings
                        checkHeadings();
                        // Also recreate bookmark after a short delay
                        setTimeout(function() {
                          if (isDocPage()) {
                            createBookmark();
                          }
                        }, 300);
                      });
                      
                      try {
                        contentObserver.observe(docusaurusContentContainer, { 
                          childList: true, 
                          subtree: true,
                          attributes: false,
                          characterData: false
                        });
                        console.log('Docusaurus content observer successfully attached');
                      } catch (observeError) {
                        console.error('Error attaching observer to Docusaurus content:', observeError);
                      }
                      
                      console.log('Docusaurus route detection set up successfully');
                    } catch (error) {
                      console.error('Error setting up Docusaurus route detection:', error);
                    }
                  } else {
                    console.warn('Docusaurus content container not found');
                  }
                }
                
                // Set up Docusaurus-specific detection after a short delay
                setTimeout(setupDocusaurusRouteChangeDetection, 1000);
              });
            `,
          },
        ],
      };
    },
  };
};

