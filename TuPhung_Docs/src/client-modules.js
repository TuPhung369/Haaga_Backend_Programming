// Client modules file using CommonJS syntax
module.exports = [
  // These imports will be processed by Webpack
  "infima/dist/css/default/default.css",
  "@docusaurus/theme-classic/lib/prism-include-languages",
  "@docusaurus/theme-classic/lib/nprogress",
  "./css/global.css", // Global CSS styles
  "./css/custom.css",
  "./css/mermaid-gantt-fixes.css", // Fixes for Mermaid Gantt charts
  "./js/dropdown-closer.js", // Dropdown menu closer script
  "./js/frontend-category-enhancer.js", // Frontend category page enhancer
  "./js/mermaid-gantt-enhancer.js", // Mermaid Gantt chart enhancer
];

