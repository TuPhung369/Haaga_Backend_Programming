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
                /* Ensure bookmark is always at the edge of the viewport, not affected by scrollbar */
              }
              
              /* Ensure bookmark is responsive on all screens */
              @media (max-width: 768px) {
                #plugin-bookmark {
                  right: 15px !important;
                }
              }
              
              @media (max-width: 480px) {
                #plugin-bookmark {
                  right: 15px !important;
                }
              }
              
              /* Reset for all children of plugin-bookmark */
              #plugin-bookmark > div {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
              }
              
              /* Override styles when active */
              #plugin-bookmark.active {
                background: linear-gradient(to bottom, white, rgba(78, 87, 185, 0.8)) !important;
                background-color: transparent !important;
                border: 1px solid rgba(78, 87, 185, 0.5) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                right: 15px !important; /* Always at the edge of the viewport */
                top: 75px !important;
                width: 350px !important;
                height: auto !important;
                border-radius: 8px !important;
                z-index: 99999 !important; /* Increased z-index to ensure visibility */
              }
              
              /* Ensure active bookmark is responsive on all screens */
              @media (max-width: 768px) {
                #plugin-bookmark.active {
                  right: 15px !important; /* Always at the edge of the viewport */
                  width: 300px !important;
                }
              }
              
              @media (max-width: 480px) {
                #plugin-bookmark.active {
                  right: 15px !important; /* Always at the edge of the viewport */
                  width: 250px !important;
                }
              }
              
              #plugin-bookmark.active > div {
                background: transparent !important;
                background-color: transparent !important;
              }
              
              /* Style for bookmark title when active */
              #plugin-bookmark.active .bookmark-title-content {
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
              
              #plugin-bookmark.active .bookmark-icon,
              #plugin-bookmark.active .bookmark-text {
                color: white !important;
                display: inline-block !important;
                vertical-align: middle !important;
                font-size: 16px !important;
                line-height: 16px !important;
              }
              
              #plugin-bookmark.active .bookmark-text {
                display: inline-block !important;
                margin-left: 5px !important;
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
              // Define global functions that can be called from anywhere
              let createBookmark;
              let isDocumentationPage;
              let hideDefaultBookmark;
              
              // Create bookmark when the page has loaded
              document.addEventListener('DOMContentLoaded', function() {
                console.log('Creating plugin bookmark');
                
                // Remove old bookmark if it exists to avoid duplication
                const existingBookmark = document.getElementById('plugin-bookmark');
                if (existingBookmark) {
                  existingBookmark.remove();
                }
                
                // Define function to check documentation page
                isDocumentationPage = function() {
                  // Check if URL contains '/docs/'
                  if (window.location.pathname.includes('/docs/')) {
                    // Exclude video pages
                    if (window.location.pathname.includes('/docs/video/')) {
                      console.log('This is a video page, not showing bookmark');
                      return false;
                    }
                    console.log('This is a documentation page');
                    return true;
                  }
                  
                  // Check for characteristic elements of documentation pages
                  const docElements = document.querySelectorAll('.theme-doc-markdown, .docs-doc-page');
                  if (docElements.length > 0) {
                    // Exclude video pages
                    if (window.location.pathname.includes('/docs/video/')) {
                      console.log('This is a video page, not showing bookmark');
                      return false;
                    }
                    console.log('Documentation elements found');
                    return true;
                  }
                  
                  console.log('This is not a documentation page');
                  return false;
                };
                
                // Define function to hide default bookmark
                hideDefaultBookmark = function() {
                  // List of selectors that could be default bookmark/TOC
                  const defaultBookmarkSelectors = [
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
                  
                  // Try each selector
                  defaultBookmarkSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      // Hide all elements that could be TOC, not just elements with links
                      console.log('Hiding default bookmark:', selector);
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                      el.style.opacity = '0';
                      el.style.pointerEvents = 'none';
                      
                      // Add attribute to ensure element is not displayed
                      el.setAttribute('aria-hidden', 'true');
                      
                      // Add class to easily identify hidden elements
                      el.classList.add('plugin-bookmark-hidden');
                    });
                  });
                  
                  // Search and hide elements that could be TOC based on content, but only hide small elements
                  const allElements = document.querySelectorAll('nav, aside, div.toc, div.table-of-contents, div[class*="tableOfContents"], div[class*="tocCollapsible"]');
                  allElements.forEach(el => {
                    // Check if the element contains text "Table of Contents" or "On this page"
                    const text = el.textContent.toLowerCase();
                    // Only hide small elements containing these keywords, avoid hiding the entire page
                    if ((text.includes('table of contents') || text.includes('on this page') || text.includes('in this article')) 
                        && el.textContent.length < 1000) { // Only hide small elements
                      console.log('Hiding element with TOC-like content:', el);
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                    }
                  });
                };
                
                // Define function to create bookmark
                createBookmark = function() {
                  // Hide default bookmark first
                  hideDefaultBookmark();
                  
                  // Remove old bookmark if it exists
                  const oldBookmark = document.getElementById('plugin-bookmark');
                  if (oldBookmark) {
                    oldBookmark.remove();
                  }
                  
                  // Create bookmark element with direct HTML to ensure cleanliness
                  const bookmarkContainer = document.createElement('div');
                  bookmarkContainer.innerHTML = 
                    '<div id="plugin-bookmark" style="' +
                      'position: fixed;' +
                      'right: 15pxpx;' +
                      'top: 75px;' +
                      'width: 350px;' +
                      'background: transparent;' +
                      'border: none;' +
                      'border-radius: 8px;' +
                      'z-index: 99999;' + /* Increased z-index to ensure visibility */
                      'overflow: hidden;' +
                      'font-family: Arial, sans-serif;' +
                      'display: flex;' +
                      'flex-direction: column;' +
                    '"></div>';
                  
                  // Get bookmark element from container
                  const bookmark = bookmarkContainer.firstElementChild;
                  
                  // Create title with direct HTML
                  const titleContainer = document.createElement('div');
                  titleContainer.innerHTML = 
                    '<div style="' +
                      'background: transparent;' +
                      'padding: 0;' +
                      'font-weight: bold;' +
                      'text-align: center;' +
                      'cursor: pointer;' +
                      'border: none;' +
                      'border-radius: 50%;' +
                      'width: 40px;' +
                      'height: 40px;' +
                      'display: flex;' +
                      'align-items: center;' +
                      'justify-content: center;' +
                    '">' +
                      '<div class="bookmark-title-content" style="' +
                        'display: flex;' +
                        'align-items: center;' +
                        'justify-content: center;' +
                        'color: #4e57b9;' +
                        'font-weight: bold;' +
                        'font-size: 16px;' +
                        'width: 100%;' +
                      '"><span class="bookmark-icon" style="font-size: 30px; line-height: 30px; display: inline-block; vertical-align: middle;">&#9733;</span><span class="bookmark-text" style="margin-left: 5px; display: none; vertical-align: middle;">Bookmark</span></div>' +
                    '</div>';
                  
                  const title = titleContainer.firstElementChild;
                  const titleContent = title.firstElementChild;
                  
                  // Tạo nội dung với HTML trực tiếp
                  const contentContainer = document.createElement('div');
                  contentContainer.innerHTML = 
                    '<div style="' +
                      'padding: 0;' +
                      'margin: 0;' +
                      'max-height: 0;' +
                      'height: 0;' +
                      'min-height: 0;' +
                      'overflow: hidden;' +
                      'transition: all 0.3s ease;' +
                      'background-color: transparent;' +
                      'background: transparent;' +
                      'background-image: none;' +
                      'border: none;' +
                      'border-top: 0;' +
                      'border-radius: 0 0 8px 8px;' +
                      'flex: 0;' +
                      'display: none;' +
                    '"></div>';
                  
                  const content = contentContainer.firstElementChild;
                  
                  // Tạo danh sách liên kết
                  const list = document.createElement('ul');
                  list.style.listStyle = 'none';
                  list.style.padding = '0';
                  list.style.margin = '0';
                  list.style.backgroundColor = 'white';
                  list.style.background = 'white';
                  
                  // Hàm mở bookmark - sử dụng HTML trực tiếp để đảm bảo sạch sẽ
                  const openBookmark = function() {
                    // Thêm class active để áp dụng CSS
                    bookmark.classList.add('active');
                    
                    // Cập nhật bookmark
                    bookmark.setAttribute('style', 
                      'position: fixed !important;' +
                      'right: 15pxpx !important;' +
                      'top: 75px !important;' +
                      'width: 350px !important;' +
                      'height: auto !important;' +
                      'background: linear-gradient(135deg, white, rgba(78, 87, 185, 0.8)) !important;' +
                      'background-color: transparent !important;' +
                      'border: 1px solid rgba(78, 87, 185, 0.5) !important;' +
                      'border-radius: 8px !important;' +
                      'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;' +
                      'z-index: 99999 !important;' + /* Increased z-index to ensure visibility */
                      'overflow: hidden !important;' +
                      'font-family: Arial, sans-serif !important;' +
                      'display: flex !important;' +
                      'flex-direction: column !important;' +
                      'opacity: 1 !important;' +
                      'transition: all 0.3s ease !important;'
                    );
                    
                    // Cập nhật tiêu đề
                    title.setAttribute('style', 
                      'background: transparent !important;' +
                      'background-color: transparent !important;' +
                      'padding: 8px 12px !important;' +
                      'font-weight: bold !important;' +
                      'text-align: left !important;' +
                      'cursor: pointer !important;' +
                      'border: none !important;' +
                      'border-radius: 8px 8px 0 0 !important;' +
                      'opacity: 1 !important;' +
                      'width: auto !important;' +
                      'height: auto !important;' +
                      'display: block !important;'
                    );
                    
                    // Hiển thị text "Bookmark" khi mở
                    const bookmarkText = title.querySelector('.bookmark-text');
                    if (bookmarkText) {
                      bookmarkText.style.display = 'inline-block';
                      bookmarkText.style.verticalAlign = 'middle';
                    }
                    
                    // Điều chỉnh kích thước icon khi active
                    const bookmarkIcon = title.querySelector('.bookmark-icon');
                    if (bookmarkIcon) {
                      bookmarkIcon.style.fontSize = '16px';
                      bookmarkIcon.style.lineHeight = '16px';
                    }
                    
                    // Đảm bảo title content được căn giữa
                    const titleContent = title.querySelector('.bookmark-title-content');
                    if (titleContent) {
                      titleContent.style.display = 'flex';
                      titleContent.style.alignItems = 'center';
                      titleContent.style.justifyContent = 'center';
                      titleContent.style.padding = '8px 0';
                    }
                    
                    // Cập nhật nội dung tiêu đề
                    titleContent.setAttribute('style',
                      'display: flex !important;' +
                      'align-items: center !important;' +
                      'justify-content: center !important;' +
                      'color: white !important;' +
                      'font-weight: bold !important;' +
                      'font-size: 16px !important;' +
                      'width: 100% !important;' +
                      'background: rgba(78, 87, 185, 1) !important;' +
                      'border-radius: 8px 8px 0 0 !important;' +
                      'padding: 8px 0 !important;' +
                      'text-align: center !important;'
                    );
                    
                    // Cập nhật nội dung
                    content.setAttribute('style', 
                      'display: block;' +
                      'padding: 10px;' +
                      'max-height: 500px;' +
                      'height: auto;' +
                      'overflow-y: auto;' +
                      'background-color: transparent !important;' +
                      'background: transparent !important;' +
                      'border-top: 1px solid #eee;' +
                      'border-radius: 0 0 8px 8px;' +
                      'flex: 1;' +
                      'opacity: 1 !important;'
                    );
                  };
                  
                  // Hàm đóng bookmark - sử dụng HTML trực tiếp để đảm bảo sạch sẽ
                  const closeBookmark = function() {
                    // Xóa class active
                    bookmark.classList.remove('active');
                    
                    // Đặt các thuộc tính trước khi ẩn
                    content.setAttribute('style', 
                      'padding: 0 !important;' +
                      'max-height: 0 !important;' +
                      'height: 0 !important;' +
                      'min-height: 0 !important;' +
                      'overflow: hidden !important;' +
                      'transition: all 0.3s ease !important;' +
                      'background-color: transparent !important;' +
                      'background: transparent !important;' +
                      'background-image: none !important;' +
                      'border: none !important;' +
                      'border-top: 0 !important;' +
                      'border-radius: 0 0 8px 8px !important;' +
                      'flex: 0 !important;' +
                      'display: none !important;'
                    );
                    
                    // Ẩn text "Bookmark" khi đóng
                    const bookmarkText = title.querySelector('.bookmark-text');
                    if (bookmarkText) {
                      bookmarkText.style.display = 'none';
                    }
                    
                    // Khôi phục kích thước icon khi không active
                    const bookmarkIcon = title.querySelector('.bookmark-icon');
                    if (bookmarkIcon) {
                      bookmarkIcon.style.fontSize = '30px';
                      bookmarkIcon.style.lineHeight = '30px';
                    }
                    
                    // Cập nhật nội dung tiêu đề để đảm bảo icon ở giữa
                    titleContent.setAttribute('style',
                      'display: flex !important;' +
                      'align-items: center !important;' +
                      'justify-content: center !important;' +
                      'color: #4e57b9 !important;' +
                      'font-weight: bold !important;' +
                      'font-size: 16px !important;' +
                      'width: 100% !important;' +
                      'padding-left: 0 !important;'
                    );
                    
                    // Ẩn hoàn toàn sau một khoảng thời gian ngắn
                    setTimeout(function() {
                      // Cập nhật bookmark - chỉ hiển thị icon hình tròn
                      bookmark.setAttribute('style', 
                        'position: fixed !important;' +
                        'right: 15px !important;' +
                        'top: 75px !important;' +
                        'width: 40px !important;' +
                        'height: 40px !important;' +
                        'background: rgba(78, 87, 185, 0.0) !important;' +
                        'background-color: rgba(78, 87, 185, 0.0) !important;' +
                        'border: 1px solid rgba(78, 87, 185, 1) !important;' +
                        'box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;' +
                        'border-radius: 50% !important;' +
                        'z-index: 99999 !important;' + /* Increased z-index to ensure visibility */
                        'overflow: hidden !important;' +
                        'font-family: Arial, sans-serif !important;' +
                        'display: flex !important;' +
                        'flex-direction: column !important;' +
                        'transition: all 0.3s ease !important;'
                      );
                      
                      // Cập nhật tiêu đề - chỉ hiển thị icon
                      title.setAttribute('style', 
                        'background: transparent !important;' +
                        'padding: 0 !important;' +
                        'font-weight: bold !important;' +
                        'text-align: center !important;' +
                        'cursor: pointer !important;' +
                        'border: none !important;' +
                        'border-radius: 50% !important;' +
                        'width: 40px !important;' +
                        'height: 40px !important;' +
                        'display: flex !important;' +
                        'align-items: center !important;' +
                        'justify-content: center !important;'
                      );
                    }, 300);
                  };
                  
                  // Tìm các tiêu đề trong trang
                  setTimeout(function() {
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    headings.forEach(heading => {
                      if (heading.id) {
                        const item = document.createElement('li');
                        item.style.margin = '5px 0';
                        
                        // Thêm padding dựa vào cấp độ heading để tạo hiệu ứng phân cấp
                        const headingLevel = parseInt(heading.tagName.substring(1));
                        const paddingLeft = (headingLevel - 1) * 10;
                        
                        // Điều chỉnh font size dựa vào cấp độ heading
                        let fontSize;
                        switch(headingLevel) {
                          case 1:
                            fontSize = '18px';
                            break;
                          case 2:
                            fontSize = '16px';
                            break;
                          case 3:
                            fontSize = '14px';
                            break;
                          case 4:
                            fontSize = '13px';
                            break;
                          default:
                            fontSize = '12px';
                        }
                        
                        const link = document.createElement('a');
                        link.href = '#' + heading.id;
                        link.textContent = heading.textContent;
                        link.style.display = 'block';
                        link.style.padding = '5px 8px';
                        link.style.paddingLeft = (8 + paddingLeft) + 'px';
                        link.style.color = '#4e57b9';
                        link.style.textDecoration = 'none';
                        link.style.borderRadius = '4px';
                        link.style.fontSize = fontSize;
                        link.style.transition = 'background-color 0.2s ease';
                        link.style.backgroundColor = 'white';
                        link.style.background = 'white';
                        link.style.opacity = '1';
                        
                        // Thêm hiệu ứng hover với background opacity 0.5
                        link.addEventListener('mouseover', function() {
                          this.style.backgroundColor = 'rgba(78, 87, 185, 0.6)';
                          this.style.background = 'rgba(78, 87, 185, 0.6)';
                          this.style.color = '#ffffff';
                          this.style.opacity = '1';
                        });
                        
                        link.addEventListener('mouseout', function() {
                          this.style.backgroundColor = 'white';
                          this.style.background = 'white';
                          this.style.color = '#4e57b9';
                          this.style.opacity = '1';
                        });
                        
                        // Thêm sự kiện click để đóng bookmark khi click vào link
                        link.addEventListener('click', function(e) {
                          // Ngăn chặn sự kiện click lan ra document để tránh đóng bookmark ngay lập tức
                          e.stopPropagation();
                          
                          // Đóng bookmark sau khi click vào link
                          setTimeout(function() {
                            closeBookmark();
                            isOpen = false;
                          }, 100);
                        });
                        
                        item.appendChild(link);
                        list.appendChild(item);
                      }
                    });
                  }, 500);
                  
                  // Add elements to bookmark
                  content.appendChild(list);
                  bookmark.appendChild(title);
                  bookmark.appendChild(content);
                  
                  // Biến để theo dõi trạng thái bookmark
                  let isOpen = false;
                  let hoverTimer = null;
                  let leaveTimer = null;
                  let isHovering = false;
                  
                  // Sử dụng hover để mở bookmark với độ trễ để tránh mở/đóng liên tục
                  bookmark.addEventListener('mouseenter', function() {
                    isHovering = true;
                    
                    // Xóa timer đóng nếu đang có
                    if (leaveTimer) {
                      clearTimeout(leaveTimer);
                      leaveTimer = null;
                    }
                    
                    // Đặt timer để mở bookmark sau một khoảng thời gian
                    if (!isOpen && !hoverTimer) {
                      hoverTimer = setTimeout(function() {
                        if (isHovering) {
                          openBookmark();
                          isOpen = true;
                        }
                        hoverTimer = null;
                      }, 300); // Độ trễ dài hơn để tránh mở khi di chuột qua nhanh
                    }
                  });
                  
                  // Sự kiện mouseleave để đóng bookmark
                  bookmark.addEventListener('mouseleave', function() {
                    isHovering = false;
                    
                    // Xóa timer mở nếu đang có
                    if (hoverTimer) {
                      clearTimeout(hoverTimer);
                      hoverTimer = null;
                    }
                    
                    // Đặt timer để đóng bookmark sau một khoảng thời gian
                    if (isOpen && !leaveTimer) {
                      leaveTimer = setTimeout(function() {
                        if (!isHovering) {
                          closeBookmark();
                          isOpen = false;
                        }
                        leaveTimer = null;
                      }, 500); // Độ trễ dài hơn để tránh đóng quá nhanh
                    }
                  });
                  
                  // Thêm sự kiện click cho bookmark để toggle trạng thái
                  bookmark.addEventListener('click', function(e) {
                    // Chỉ xử lý click trên bookmark hoặc title, không xử lý click trên nội dung
                    if (e.target === bookmark || e.target === title || e.target.closest('#plugin-bookmark > div:first-child') !== null) {
                      if (!isOpen) {
                        openBookmark();
                        isOpen = true;
                      } else {
                        closeBookmark();
                        isOpen = false;
                      }
                      
                      // Xóa các timer nếu đang có
                      if (hoverTimer) {
                        clearTimeout(hoverTimer);
                        hoverTimer = null;
                      }
                      if (leaveTimer) {
                        clearTimeout(leaveTimer);
                        leaveTimer = null;
                      }
                    }
                  });
                  
                  // Không cần thêm sự kiện click cho tiêu đề vì đã xử lý ở bookmark click
                  
                  // Đảm bảo trạng thái ban đầu là sạch - sử dụng setAttribute để đặt lại hoàn toàn
                  bookmark.setAttribute('style', 
                    'position: fixed !important;' +
                    'right: 15px !important;' +
                    'top: 75px !important;' +
                    'width: 40px !important;' +
                    'height: 40px !important;' +
                    'background: rgba(78, 87, 185, 0.0) !important;' +
                    'background-color: rgba(78, 87, 185, 0.0) !important;' +
                    'border: 1px solid rgba(78, 87, 185, 1) !important;' +
                    'box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;' +
                    'border-radius: 50% !important;' +
                    'z-index: 99999 !important;' + /* Increased z-index to ensure visibility */
                    'overflow: hidden !important;' +
                    'font-family: Arial, sans-serif !important;' +
                    'display: flex !important;' +
                    'flex-direction: column !important;' +
                    'transition: all 0.3s ease !important;' +
                    'cursor: pointer !important;'
                  );
                  
                  // Đảm bảo tiêu đề hiển thị đúng ở trạng thái ban đầu
                  title.setAttribute('style', 
                    'background: transparent !important;' +
                    'padding: 0 !important;' +
                    'font-weight: bold !important;' +
                    'text-align: center !important;' +
                    'cursor: pointer !important;' +
                    'border: none !important;' +
                    'border-radius: 50% !important;' +
                    'width: 40px !important;' +
                    'height: 40px !important;' +
                    'display: flex !important;' +
                    'align-items: center !important;' +
                    'justify-content: center !important;'
                  );
                  
                  // Ẩn text "Bookmark" ở trạng thái ban đầu
                  const bookmarkText = title.querySelector('.bookmark-text');
                  if (bookmarkText) {
                    bookmarkText.style.display = 'none';
                  }
                  
                  // Đảm bảo icon ở giữa ở trạng thái ban đầu
                  titleContent.setAttribute('style',
                    'display: flex !important;' +
                    'align-items: center !important;' +
                    'justify-content: center !important;' +
                    'color: #4e57b9 !important;' +
                    'font-weight: bold !important;' +
                    'font-size: 16px !important;' +
                    'width: 100% !important;' +
                    'padding-left: 0 !important;'
                  );
                  
                  content.setAttribute('style', 
                    'padding: 0;' +
                    'margin: 0;' +
                    'max-height: 0;' +
                    'height: 0;' +
                    'min-height: 0;' +
                    'overflow: hidden;' +
                    'background-color: transparent;' +
                    'background: transparent;' +
                    'background-image: none;' +
                    'border: none;' +
                    'border-top: 0;' +
                    'border-radius: 0 0 8px 8px;' +
                    'flex: 0;' +
                    'display: none;'
                  );
                  
                  // Thêm bookmark vào body
                  document.body.appendChild(bookmark);
                  
                  // Không cần kích hoạt sự kiện hover tự động nữa
                  // Để người dùng tự hover vào bookmark khi cần
                  
                  console.log('Plugin bookmark created');
                };
                
                // Theo dõi thay đổi URL để cập nhật bookmark khi chuyển trang
                let lastUrl = location.href; 
                
                // Tạo một MutationObserver để theo dõi thay đổi trong DOM
                const navigationObserver = new MutationObserver(() => {
                  if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    console.log('URL changed to', location.href);
                    
                    // Đợi một chút để trang mới tải xong nội dung
                    setTimeout(() => {
                      console.log('Updating bookmark for new page');
                      updateBookmark();
                    }, 1000);
                  }
                });
                
                // Cấu hình và bắt đầu observer
                navigationObserver.observe(document, {childList: true, subtree: true});
                
                // Hàm cập nhật bookmark
                function updateBookmark() {
                  const existingBookmark = document.getElementById('plugin-bookmark');
                  if (existingBookmark) {
                    // Xóa bookmark cũ
                    existingBookmark.remove();
                    console.log('Removed old bookmark');
                  }
                  
                  // Kiểm tra xem có phải trang documentation không
                  if (isDocumentationPage()) {
                    // Tạo lại bookmark
                    createBookmark();
                    console.log('Created new bookmark for page:', location.href);
                  }
                }
                
                // Nếu không phải trang documentation, không hiển thị bookmark
                if (!isDocumentationPage()) {
                  console.log('Skipping bookmark creation on non-documentation page');
                  return;
                }
                
                // Wait a bit to ensure DOM is ready before creating bookmark
                setTimeout(function() {
                  // Create bookmark
                  createBookmark();
                  console.log('Bookmark created on initial page load');
                }, 300);
                
                // Hide default bookmark immediately and after a time interval
                hideDefaultBookmark();
                setTimeout(hideDefaultBookmark, 500);
                setTimeout(hideDefaultBookmark, 1000);
                setTimeout(hideDefaultBookmark, 2000);
                setTimeout(hideDefaultBookmark, 3000);
                setTimeout(hideDefaultBookmark, 5000);
                
                // Thiết lập một interval để liên tục kiểm tra và ẩn bookmark mặc định
                const hideInterval = setInterval(hideDefaultBookmark, 2000);
                // Dừng interval sau 20 giây để tránh tốn tài nguyên
                setTimeout(() => clearInterval(hideInterval), 20000);
                
                // Sử dụng MutationObserver để phát hiện và ẩn các phần tử TOC mới được thêm vào DOM
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                      // Chỉ kiểm tra các phần tử mới thêm vào, không chạy lại toàn bộ hideDefaultBookmark
                      mutation.addedNodes.forEach(node => {
                        // Chỉ xử lý các phần tử DOM
                        if (node.nodeType === 1) {
                          // Kiểm tra xem phần tử có phải là TOC không
                          const isToc = node.classList && (
                            node.classList.contains('table-of-contents') ||
                            node.classList.contains('theme-doc-toc') ||
                            node.classList.contains('theme-doc-toc-desktop') ||
                            node.classList.contains('toc') ||
                            node.classList.contains('on-this-page') ||
                            /tableOfContents/i.test(node.className) ||
                            /tocCollapsible/i.test(node.className)
                          );
                          
                          if (isToc) {
                            console.log('Found new TOC element, hiding:', node);
                            node.style.display = 'none';
                            node.style.visibility = 'hidden';
                            node.style.opacity = '0';
                            node.style.pointerEvents = 'none';
                            node.setAttribute('aria-hidden', 'true');
                          }
                          
                          // Kiểm tra các phần tử con
                          const tocElements = node.querySelectorAll('.table-of-contents, .theme-doc-toc, .theme-doc-toc-desktop, .toc, .on-this-page, [class*="tableOfContents"], [class*="tocCollapsible"]');
                          if (tocElements.length > 0) {
                            tocElements.forEach(el => {
                              console.log('Found new TOC child element, hiding:', el);
                              el.style.display = 'none';
                              el.style.visibility = 'hidden';
                              el.style.opacity = '0';
                              el.style.pointerEvents = 'none';
                              el.setAttribute('aria-hidden', 'true');
                            });
                          }
                        }
                      });
                    }
                  });
                });
                
                // Cấu hình và bắt đầu observer
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
                
                // Dừng observer sau 30 giây để tránh tốn tài nguyên
                setTimeout(() => observer.disconnect(), 30000);
                
                // Tạo phần tử bookmark
                const bookmark = document.createElement('div');
                bookmark.id = 'plugin-bookmark';
                bookmark.style.position = 'fixed';
                bookmark.style.right = '15px';
                bookmark.style.top = '80px';
                bookmark.style.width = '350px';
                bookmark.style.backgroundColor = 'white';
                bookmark.style.border = '1px solid #4e57b9';
                bookmark.style.borderRadius = '8px';
                bookmark.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                bookmark.style.zIndex = '9999';
                bookmark.style.overflow = 'hidden';
                bookmark.style.fontFamily = 'Arial, sans-serif';
                
                // Create title
                const title = document.createElement('div');
                title.style.backgroundColor = '#4e57b9';
                title.style.color = 'white';
                title.style.padding = '8px 12px';
                title.style.fontWeight = 'bold';
                title.style.textAlign = 'center';
                title.style.cursor = 'pointer';
                title.innerHTML = '<span style="margin-right: 5px; font-size: 1.1em;">&#9733;</span> Bookmark';
                
                // Tạo nội dung
                const content = document.createElement('div');
                content.style.padding = '10px';
                content.style.maxHeight = '0px';
                content.style.overflow = 'hidden';
                content.style.transition = 'max-height 0.3s ease';
                
                // Tạo danh sách liên kết
                const list = document.createElement('ul');
                list.style.listStyle = 'none';
                list.style.padding = '0';
                list.style.margin = '0';
                
                // Tìm các tiêu đề trong trang
                setTimeout(function() {
                  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                  headings.forEach(heading => {
                    if (heading.id) {
                      const item = document.createElement('li');
                      item.style.margin = '5px 0';
                      
                      // Thêm padding dựa vào cấp độ heading để tạo hiệu ứng phân cấp
                      const headingLevel = parseInt(heading.tagName.substring(1));
                      const paddingLeft = (headingLevel - 1) * 10;
                      
                      const link = document.createElement('a');
                      link.href = '#' + heading.id;
                      link.textContent = heading.textContent;
                      link.style.display = 'block';
                      link.style.padding = '5px 8px';
                      link.style.paddingLeft = (8 + paddingLeft) + 'px';
                      link.style.color = '#4e57b9';
                      link.style.textDecoration = 'none';
                      link.style.borderRadius = '4px';
                      
                      // Thêm hiệu ứng hover
                      link.addEventListener('mouseover', function() {
                        this.style.backgroundColor = 'rgba(78, 87, 185, 0.1)';
                      });
                      
                      link.addEventListener('mouseout', function() {
                        this.style.backgroundColor = 'transparent';
                      });
                      
                      item.appendChild(link);
                      list.appendChild(item);
                    }
                  });
                }, 1000);
                
                // Add elements to bookmark
                content.appendChild(list);
                bookmark.appendChild(title);
                bookmark.appendChild(content);
                
                // Thêm sự kiện click cho tiêu đề để mở/đóng nội dung
                title.addEventListener('click', function() {
                  if (content.style.maxHeight === '0px' || content.style.maxHeight === '') {
                    content.style.maxHeight = '500px'; // Tăng chiều cao tối đa để hiển thị nhiều heading hơn
                    content.style.overflowY = 'auto'; // Thêm thanh cuộn nếu nội dung quá dài
                  } else {
                    content.style.maxHeight = '0px';
                  }
                });
                
                // Thêm bookmark vào body
                document.body.appendChild(bookmark);
                
                console.log('Plugin bookmark created');
              });
              
              // Chạy lại sau khi trang đã tải hoàn toàn
              window.addEventListener('load', function() {
                console.log('Window loaded, checking for bookmark');
                
                // Theo dõi thay đổi URL để cập nhật bookmark khi chuyển trang
                let lastUrl = location.href; 
                
                // Tạo một MutationObserver để theo dõi thay đổi trong DOM
                const navigationObserver = new MutationObserver(() => {
                  if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    console.log('URL changed to', location.href);
                    
                    // Đợi một chút để trang mới tải xong nội dung
                    setTimeout(() => {
                      console.log('Updating bookmark for new page');
                      updateBookmark();
                    }, 1000);
                  }
                });
                
                // Cấu hình và bắt đầu observer
                navigationObserver.observe(document, {childList: true, subtree: true});
                
                // Hàm cập nhật bookmark
                function updateBookmark() {
                  const existingBookmark = document.getElementById('plugin-bookmark');
                  if (existingBookmark) {
                    // Xóa bookmark cũ
                    existingBookmark.remove();
                    console.log('Removed old bookmark');
                  }
                  
                  // Kiểm tra xem có phải trang documentation không
                  if (isDocumentationPage()) {
                    // Tạo lại bookmark
                    createBookmark();
                    console.log('Created new bookmark for page:', location.href);
                  }
                }
                
                // Kiểm tra xem có phải trang documentation không
                function isDocumentationPage() {
                  // Kiểm tra URL có chứa '/docs/' không
                  if (window.location.pathname.includes('/docs/')) {
                    // Loại trừ trang video
                    if (window.location.pathname.includes('/docs/video/')) {
                      console.log('This is a video page, not showing bookmark (load)');
                      return false;
                    }
                    console.log('This is a documentation page (load)');
                    return true;
                  }
                  
                  // Kiểm tra các phần tử đặc trưng của trang documentation
                  const docElements = document.querySelectorAll('.theme-doc-markdown, .docs-doc-page');
                  if (docElements.length > 0) {
                    // Loại trừ trang video
                    if (window.location.pathname.includes('/docs/video/')) {
                      console.log('This is a video page, not showing bookmark (load)');
                      return false;
                    }
                    console.log('Documentation elements found (load)');
                    return true;
                  }
                  
                  console.log('This is not a documentation page (load)');
                  return false;
                }
                
                // Nếu không phải trang documentation, không hiển thị bookmark
                if (!isDocumentationPage()) {
                  console.log('Skipping bookmark check on non-documentation page');
                  return;
                }
                
                // Hide default bookmark
                function hideDefaultBookmark() {
                  // List of selectors that could be default bookmark/TOC
                  const defaultBookmarkSelectors = [
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
                  
                  // Try each selector
                  defaultBookmarkSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      // Hide all elements that could be TOC, not just elements with links
                      console.log('Hiding default bookmark on load:', selector);
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                      el.style.opacity = '0';
                      el.style.pointerEvents = 'none';
                      
                      // Add attribute to ensure element is not displayed
                      el.setAttribute('aria-hidden', 'true');
                      
                      // Add class to easily identify hidden elements
                      el.classList.add('plugin-bookmark-hidden');
                    });
                  });
                  
                  // Search and hide elements that could be TOC based on content, but only hide small elements
                  const allElements = document.querySelectorAll('nav, aside, div.toc, div.table-of-contents, div[class*="tableOfContents"], div[class*="tocCollapsible"]');
                  allElements.forEach(el => {
                    // Check if the element contains text "Table of Contents" or "On this page"
                    const text = el.textContent.toLowerCase();
                    // Only hide small elements containing these keywords, avoid hiding the entire page
                    if ((text.includes('table of contents') || text.includes('on this page') || text.includes('in this article')) 
                        && el.textContent.length < 1000) { // Only hide small elements
                      console.log('Hiding element with TOC-like content on load:', el);
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                    }
                  });
                }
                
                // Hide default bookmark immediately and after a time interval
                hideDefaultBookmark();
                setTimeout(hideDefaultBookmark, 500);
                setTimeout(hideDefaultBookmark, 1000);
                setTimeout(hideDefaultBookmark, 2000);
                setTimeout(hideDefaultBookmark, 3000);
                setTimeout(hideDefaultBookmark, 5000);
                
                // Thiết lập một interval để liên tục kiểm tra và ẩn bookmark mặc định
                const hideInterval = setInterval(hideDefaultBookmark, 2000);
                // Dừng interval sau 20 giây để tránh tốn tài nguyên
                setTimeout(() => clearInterval(hideInterval), 20000);
                
                // Sử dụng MutationObserver để phát hiện và ẩn các phần tử TOC mới được thêm vào DOM
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                      // Chỉ kiểm tra các phần tử mới thêm vào, không chạy lại toàn bộ hideDefaultBookmark
                      mutation.addedNodes.forEach(node => {
                        // Chỉ xử lý các phần tử DOM
                        if (node.nodeType === 1) {
                          // Kiểm tra xem phần tử có phải là TOC không
                          const isToc = node.classList && (
                            node.classList.contains('table-of-contents') ||
                            node.classList.contains('theme-doc-toc') ||
                            node.classList.contains('theme-doc-toc-desktop') ||
                            node.classList.contains('toc') ||
                            node.classList.contains('on-this-page') ||
                            /tableOfContents/i.test(node.className) ||
                            /tocCollapsible/i.test(node.className)
                          );
                          
                          if (isToc) {
                            console.log('Found new TOC element on load, hiding:', node);
                            node.style.display = 'none';
                            node.style.visibility = 'hidden';
                            node.style.opacity = '0';
                            node.style.pointerEvents = 'none';
                            node.setAttribute('aria-hidden', 'true');
                          }
                          
                          // Kiểm tra các phần tử con
                          const tocElements = node.querySelectorAll('.table-of-contents, .theme-doc-toc, .theme-doc-toc-desktop, .toc, .on-this-page, [class*="tableOfContents"], [class*="tocCollapsible"]');
                          if (tocElements.length > 0) {
                            tocElements.forEach(el => {
                              console.log('Found new TOC child element on load, hiding:', el);
                              el.style.display = 'none';
                              el.style.visibility = 'hidden';
                              el.style.opacity = '0';
                              el.style.pointerEvents = 'none';
                              el.setAttribute('aria-hidden', 'true');
                            });
                          }
                        }
                      });
                    }
                  });
                });
                
                // Cấu hình và bắt đầu observer
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
                
                // Dừng observer sau 30 giây để tránh tốn tài nguyên
                setTimeout(() => observer.disconnect(), 30000);
                
                // Kiểm tra và tạo lại bookmark nếu cần
                if (!document.getElementById('plugin-bookmark')) {
                  console.log('Bookmark not found, creating again');
                  // Chạy lại script tạo bookmark
                  setTimeout(function() {
                    // Kiểm tra xem có phải trang documentation không
                    if (isDocumentationPage()) {
                      // Tạo lại bookmark
                      createBookmark();
                      console.log('Plugin bookmark recreated on load');
                      
                      // Không cần kích hoạt sự kiện hover tự động nữa
                      console.log('Bookmark recreated successfully');
                    }
                  }, 500);
                }
                
                // Thêm sự kiện lắng nghe cho popstate (khi người dùng sử dụng nút back/forward của trình duyệt)
                window.addEventListener('popstate', function() {
                  console.log('Navigation detected via popstate event');
                  setTimeout(() => {
                    // Xóa bookmark cũ nếu có
                    const existingBookmark = document.getElementById('plugin-bookmark');
                    if (existingBookmark) {
                      existingBookmark.remove();
                    }
                    
                    // Tạo lại bookmark nếu đang ở trang documentation
                    if (isDocumentationPage && isDocumentationPage()) {
                      if (typeof createBookmark === 'function') {
                        createBookmark();
                        console.log('Bookmark updated after popstate event');
                      } else {
                        console.error('createBookmark function is not defined');
                      }
                    }
                  }, 500);
                });
                
                // Lắng nghe sự kiện hashchange (khi URL thay đổi chỉ ở phần hash)
                window.addEventListener('hashchange', function() {
                  console.log('Hash changed in URL');
                  setTimeout(() => {
                    // Xóa bookmark cũ nếu có
                    const existingBookmark = document.getElementById('plugin-bookmark');
                    if (existingBookmark) {
                      existingBookmark.remove();
                    }
                    
                    // Tạo lại bookmark nếu đang ở trang documentation
                    if (isDocumentationPage && isDocumentationPage()) {
                      if (typeof createBookmark === 'function') {
                        createBookmark();
                        console.log('Bookmark updated after hashchange event');
                      } else {
                        console.error('createBookmark function is not defined');
                      }
                    }
                  }, 500);
                });
                
                // Theo dõi click vào các liên kết trong sidebar của Docusaurus
                document.addEventListener('click', function(e) {
                  // Kiểm tra xem có phải click vào liên kết trong sidebar không
                  if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) {
                    const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
                    const href = link.getAttribute('href');
                    
                    // Kiểm tra xem liên kết có dẫn đến trang documentation không
                    if (href && href.includes('/docs/') && !href.startsWith('#')) {
                      console.log('Clicked on a documentation link:', href);
                      
                      // Đợi một chút để trang mới tải
                      setTimeout(() => {
                        // Xóa bookmark cũ nếu có
                        const existingBookmark = document.getElementById('plugin-bookmark');
                        if (existingBookmark) {
                          existingBookmark.remove();
                        }
                        
                        // Tạo lại bookmark
                        if (isDocumentationPage && isDocumentationPage()) {
                          if (typeof createBookmark === 'function') {
                            createBookmark();
                            console.log('Bookmark updated after sidebar navigation');
                          } else {
                            console.error('createBookmark function is not defined');
                          }
                        }
                      }, 1000);
                    }
                  }
                });
              });
            `,
          },
        ],
      };
    },
  };
};

