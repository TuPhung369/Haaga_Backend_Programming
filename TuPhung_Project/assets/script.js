// TuPhung Project Documentation Scripts

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
  }
  
  // Handle active link highlighting
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop();
  const links = document.querySelectorAll('.sidebar-nav-link, .sidebar-subnav-link');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    // Check if the href matches the current path or if the current page matches the href
    if (href === currentPath || (currentPage && href && href.endsWith(currentPage))) {
      link.classList.add('active');
      
      // If it's a sublink, expand its parent section
      const parentItem = link.closest('.sidebar-subnav-item');
      if (parentItem) {
        parentItem.classList.add('active');
        const parentSection = parentItem.closest('.sidebar-section');
        if (parentSection) {
          parentSection.classList.add('active');
          const parentLink = parentSection.querySelector('.sidebar-nav-link');
          if (parentLink) {
            parentLink.classList.add('active');
          }
        }
      }
    }
  });
  
  // Add copy button to code blocks
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    
    const pre = block.parentNode;
    pre.style.position = 'relative';
    pre.appendChild(copyButton);
    
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });
  });
  
  // Initialize mermaid for flowcharts if available
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }
});