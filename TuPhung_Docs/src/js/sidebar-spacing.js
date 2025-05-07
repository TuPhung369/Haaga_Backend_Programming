/**
 * This script adds extra spacing to Frontend and Backend categories in the sidebar
 */
document.addEventListener('DOMContentLoaded', function() {
  // Function to add spacing to Frontend and Backend categories
  function addSpacingToCategories() {
    // Find all category links
    const categoryLinks = document.querySelectorAll('.menu__link--sublist');
    
    // Loop through all category links
    categoryLinks.forEach(link => {
      // Check if the link is for Frontend or Backend
      if (link.getAttribute('aria-label') === 'Frontend' || link.getAttribute('aria-label') === 'Backend') {
        // Find the parent menu__list-item
        const parentItem = link.closest('.menu__list-item');
        
        // Add extra spacing
        if (parentItem) {
          parentItem.style.marginTop = '1.5rem';
          parentItem.style.marginBottom = '1.5rem';
          parentItem.style.paddingTop = '0.5rem';
          parentItem.style.paddingBottom = '0.5rem';
        }
      }
    });
  }
  
  // Call the function when the page loads
  addSpacingToCategories();
  
  // Also call the function when the sidebar is updated (for SPA navigation)
  const sidebarContainer = document.querySelector('.theme-doc-sidebar-container');
  if (sidebarContainer) {
    const observer = new MutationObserver(addSpacingToCategories);
    observer.observe(sidebarContainer, { childList: true, subtree: true });
  }
});