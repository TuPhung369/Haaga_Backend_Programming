/**
 * Plugin to inject CSS directly into the head of category pages
 */
module.exports = function (context, options) {
  return {
    name: "category-css-plugin",
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: "style",
            attributes: {
              type: "text/css",
            },
            innerHTML: `
              /* Force main wrapper to center content */
              body .main-wrapper,
              html body .main-wrapper,
              #__docusaurus .main-wrapper {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Force container to be centered with max-width */
              body .docCategoryGeneratedIndex,
              body .generatedIndexPage_vN6x,
              body [class*="docCategoryGeneratedIndex"],
              body [class*="generatedIndexPage"],
              body div[class*="docCategoryGeneratedIndex"],
              body div[class*="generatedIndexPage"],
              #__docusaurus .docCategoryGeneratedIndex,
              #__docusaurus .generatedIndexPage_vN6x,
              #__docusaurus [class*="docCategoryGeneratedIndex"],
              #__docusaurus [class*="generatedIndexPage"],
              #__docusaurus div[class*="docCategoryGeneratedIndex"],
              #__docusaurus div[class*="generatedIndexPage"] {
                width: 100% !important;
                max-width: 1200px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                padding-left: 1rem !important;
                padding-right: 1rem !important;
                box-sizing: border-box !important;
              }

              /* Force container padding */
              body .container.padding-top--md.padding-bottom--lg,
              #__docusaurus .container.padding-top--md.padding-bottom--lg,
              body div.container.padding-top--md.padding-bottom--lg,
              #__docusaurus div.container.padding-top--md.padding-bottom--lg {
                width: 100% !important;
                max-width: 1200px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                padding: 2rem 1rem !important;
                box-sizing: border-box !important;
              }

              /* Force row layout */
              body .row,
              body div[class*="row"],
              #__docusaurus .row,
              #__docusaurus div[class*="row"] {
                display: flex !important;
                flex-wrap: wrap !important;
                width: 100% !important;
                margin-left: -0.5rem !important;
                margin-right: -0.5rem !important;
                box-sizing: border-box !important;
              }

              /* Force column layout - 2 items per row */
              body .col.col--4,
              body .col.col--6,
              body [class*="col--4"],
              body [class*="col--6"],
              body div[class*="col--4"],
              body div[class*="col--6"],
              #__docusaurus .col.col--4,
              #__docusaurus .col.col--6,
              #__docusaurus [class*="col--4"],
              #__docusaurus [class*="col--6"],
              #__docusaurus div[class*="col--4"],
              #__docusaurus div[class*="col--6"] {
                flex: 0 0 50% !important;
                max-width: 50% !important;
                width: 50% !important;
                padding: 0.5rem !important;
                box-sizing: border-box !important;
                display: flex !important;
                align-items: stretch !important;
              }
              
              /* Force all cards to have the same height but allow for responsive behavior */
              body article .card,
              #__docusaurus article .card,
              body div[class*="generatedIndexPage"] article .card,
              #__docusaurus div[class*="generatedIndexPage"] article .card,
              body div[class*="docCategoryGeneratedIndex"] article .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                min-height: 138.196px !important;
                min-width: 420px !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
              }
              
              /* Force card containers to have consistent height but allow content to display properly */
              body article .card div[class*="cardContainer"],
              #__docusaurus article .card div[class*="cardContainer"] {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                overflow: visible !important;
                width: 100% !important;
                padding: 1rem !important;
              }
              
              /* Style card titles to ensure consistent alignment */
              body article .card div[class*="cardContainer"] h2,
              #__docusaurus article .card div[class*="cardContainer"] h2,
              body article .card div[class*="cardContainer"] [class*="cardTitle"],
              #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                width: 100% !important;
                text-align: center !important;
                margin-top: 0 !important;
                margin-bottom: 0.5rem !important;
              }
              
              /* Force card descriptions to be limited but ensure content is visible */
              body article .card div[class*="cardContainer"] p,
              #__docusaurus article .card div[class*="cardContainer"] p {
                flex-grow: 1;
                overflow: visible !important;
                text-overflow: ellipsis !important;
                display: block !important;
                line-height: 1.5 !important;
                margin-bottom: 0.5rem !important;
                width: 100% !important;
                text-align: center !important;
              }
              
              /* Special fix for language-ai card */
              body article a[href*="language-ai"] .card,
              #__docusaurus article a[href*="language-ai"] .card,
              body div[class*="generatedIndexPage"] article a[href*="language-ai"] .card,
              #__docusaurus div[class*="generatedIndexPage"] article a[href*="language-ai"] .card,
              body div[class*="docCategoryGeneratedIndex"] article a[href*="language-ai"] .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article a[href*="language-ai"] .card {
                min-height: 138.196px !important;
                min-width: 420px !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
              }
              
              /* Special fix for language-ai card description */
              body article a[href*="language-ai"] .card div[class*="cardContainer"] p,
              #__docusaurus article a[href*="language-ai"] .card div[class*="cardContainer"] p {
                overflow: visible !important;
                width: 100% !important;
                margin-bottom: 0.5rem !important;
                text-align: center !important;
              }
              
              /* Special fix for Backend category cards that only show titles */
              body article a[href*="api"] .card,
              body article a[href*="user-management"] .card,
              body article a[href*="speech-processing"] .card,
              #__docusaurus article a[href*="api"] .card,
              #__docusaurus article a[href*="user-management"] .card,
              #__docusaurus article a[href*="speech-processing"] .card,
              body div[class*="generatedIndexPage"] article a[href*="api"] .card,
              body div[class*="generatedIndexPage"] article a[href*="user-management"] .card,
              body div[class*="generatedIndexPage"] article a[href*="speech-processing"] .card,
              #__docusaurus div[class*="generatedIndexPage"] article a[href*="api"] .card,
              #__docusaurus div[class*="generatedIndexPage"] article a[href*="user-management"] .card,
              #__docusaurus div[class*="generatedIndexPage"] article a[href*="speech-processing"] .card,
              body div[class*="docCategoryGeneratedIndex"] article a[href*="api"] .card,
              body div[class*="docCategoryGeneratedIndex"] article a[href*="user-management"] .card,
              body div[class*="docCategoryGeneratedIndex"] article a[href*="speech-processing"] .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article a[href*="api"] .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article a[href*="user-management"] .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article a[href*="speech-processing"] .card {
                min-height: 138.196px !important;
                min-width: 420px !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              
              /* Special fix for Backend category cards that only show titles - container */
              body article a[href*="api"] .card div[class*="cardContainer"],
              body article a[href*="user-management"] .card div[class*="cardContainer"],
              body article a[href*="speech-processing"] .card div[class*="cardContainer"],
              #__docusaurus article a[href*="api"] .card div[class*="cardContainer"],
              #__docusaurus article a[href*="user-management"] .card div[class*="cardContainer"],
              #__docusaurus article a[href*="speech-processing"] .card div[class*="cardContainer"] {
                width: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                text-align: center !important;
              }

              /* Force specific container issues */
              body div[class^="docCategoryGeneratedIndex_"],
              #__docusaurus div[class^="docCategoryGeneratedIndex_"] {
                width: 100% !important;
                max-width: 1200px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                padding-left: 1rem !important;
                padding-right: 1rem !important;
                box-sizing: border-box !important;
              }

              /* Force specific row issues */
              body div[class^="row_"],
              #__docusaurus div[class^="row_"] {
                display: flex !important;
                flex-wrap: wrap !important;
                width: 100% !important;
                margin-left: -0.5rem !important;
                margin-right: -0.5rem !important;
                box-sizing: border-box !important;
              }

              /* Force specific column issues */
              body div[class^="col_"],
              #__docusaurus div[class^="col_"] {
                padding: 0.5rem !important;
                box-sizing: border-box !important;
              }

              body div[class^="col_"][class*="--4"],
              body div[class^="col_"][class*="--6"],
              #__docusaurus div[class^="col_"][class*="--4"],
              #__docusaurus div[class^="col_"][class*="--6"] {
                flex: 0 0 50% !important;
                max-width: 50% !important;
                width: 50% !important;
              }

              /* Responsive styles for different screen sizes */
              
              /* XL screens (1200px and up) */
              @media (min-width: 1200px) {
                /* Ensure cards maintain proper width and centering */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  width: 100% !important;
                  min-width: 420px !important;
                  min-height: 150px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                
                /* Ensure card containers maintain proper centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  text-align: center !important;
                  padding: 1rem !important;
                }
                
                /* Ensure card titles are centered */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Ensure card descriptions are centered */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  text-align: center !important;
                  width: 100% !important;
                  margin-bottom: 0.5rem !important;
                  flex-grow: 0 !important;
                }
                
                /* Ensure columns can fit the minimum card width */
                body .col.col--4,
                body .col.col--6,
                body [class*="col--4"],
                body [class*="col--6"],
                body div[class*="col--4"],
                body div[class*="col--6"],
                #__docusaurus .col.col--4,
                #__docusaurus .col.col--6,
                #__docusaurus [class*="col--4"],
                #__docusaurus [class*="col--6"],
                #__docusaurus div[class*="col--4"],
                #__docusaurus div[class*="col--6"],
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"] {
                  flex: 0 0 50% !important;
                  max-width: 50% !important;
                  width: 50% !important;
                  min-width: 420px !important;
                  padding: 0.5rem !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                
                /* Ensure the row can accommodate the minimum card width */
                body .row,
                body div[class*="row"],
                #__docusaurus .row,
                #__docusaurus div[class*="row"],
                body div[class^="row_"],
                #__docusaurus div[class^="row_"] {
                  justify-content: center !important;
                  align-items: center !important;
                }
              }
              
              /* Large screens (992px to 1199px) */
              @media (min-width: 992px) and (max-width: 1199px) {
                /* Ensure cards maintain proper width and centering */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  width: 100% !important;
                  min-width: 420px !important;
                  min-height: 150px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                
                /* Ensure card containers maintain proper centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  text-align: center !important;
                  padding: 1rem !important;
                }
                
                /* Ensure card titles are centered */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Ensure card descriptions are centered */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  text-align: center !important;
                  width: 100% !important;
                  margin-bottom: 0.5rem !important;
                  flex-grow: 0 !important;
                }
                
                /* Ensure columns can fit the minimum card width */
                body .col.col--4,
                body .col.col--6,
                body [class*="col--4"],
                body [class*="col--6"],
                body div[class*="col--4"],
                body div[class*="col--6"],
                #__docusaurus .col.col--4,
                #__docusaurus .col.col--6,
                #__docusaurus [class*="col--4"],
                #__docusaurus [class*="col--6"],
                #__docusaurus div[class*="col--4"],
                #__docusaurus div[class*="col--6"],
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"] {
                  flex: 0 0 50% !important;
                  max-width: 50% !important;
                  width: 50% !important;
                  min-width: 420px !important;
                  padding: 0.5rem !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                
                /* Ensure the row can accommodate the minimum card width */
                body .row,
                body div[class*="row"],
                #__docusaurus .row,
                #__docusaurus div[class*="row"],
                body div[class^="row_"],
                #__docusaurus div[class^="row_"] {
                  justify-content: center !important;
                  align-items: center !important;
                }
              }
              
              /* Medium screens (768px to 991px) */
              @media (min-width: 768px) and (max-width: 991px) {
                /* Ensure cards maintain proper width and centering */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  width: 100% !important;
                  min-width: 420px !important;
                  min-height: 150px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                
                /* Ensure card containers maintain proper centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  text-align: center !important;
                  padding: 1rem !important;
                }
                
                /* Ensure card titles are centered */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Ensure card descriptions are centered */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  text-align: center !important;
                  width: 100% !important;
                  margin-bottom: 0.5rem !important;
                  flex-grow: 0 !important;
                }
                
                /* Ensure columns can fit the minimum card width */
                body .col.col--4,
                body .col.col--6,
                body [class*="col--4"],
                body [class*="col--6"],
                body div[class*="col--4"],
                body div[class*="col--6"],
                #__docusaurus .col.col--4,
                #__docusaurus .col.col--6,
                #__docusaurus [class*="col--4"],
                #__docusaurus [class*="col--6"],
                #__docusaurus div[class*="col--4"],
                #__docusaurus div[class*="col--6"],
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"] {
                  flex: 0 0 50% !important;
                  max-width: 50% !important;
                  width: 50% !important;
                  min-width: 420px !important;
                  padding: 0.5rem !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                
                /* Ensure the row can accommodate the minimum card width */
                body .row,
                body div[class*="row"],
                #__docusaurus .row,
                #__docusaurus div[class*="row"],
                body div[class^="row_"],
                #__docusaurus div[class^="row_"] {
                  justify-content: center !important;
                  align-items: center !important;
                }
              }
              
              /* Small screens (576px to 767px) */
              @media (min-width: 576px) and (max-width: 767px) {
                /* Ensure cards maintain proper width and centering */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  width: 100% !important;
                  min-width: 420px !important;
                  min-height: 150px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                
                /* Ensure card containers maintain proper centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  text-align: center !important;
                  padding: 1rem !important;
                }
                
                /* Ensure card titles are centered */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Ensure card descriptions are centered */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  text-align: center !important;
                  width: 100% !important;
                  margin-bottom: 0.5rem !important;
                  flex-grow: 0 !important;
                }
                
                /* Adjust column layout for small screens */
                body .col.col--4,
                body .col.col--6,
                body [class*="col--4"],
                body [class*="col--6"],
                body div[class*="col--4"],
                body div[class*="col--6"],
                #__docusaurus .col.col--4,
                #__docusaurus .col.col--6,
                #__docusaurus [class*="col--4"],
                #__docusaurus [class*="col--6"],
                #__docusaurus div[class*="col--4"],
                #__docusaurus div[class*="col--6"],
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"] {
                  flex: 0 0 100% !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  min-width: 420px !important;
                  padding: 0.75rem !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                
                /* Ensure the row can accommodate the minimum card width */
                body .row,
                body div[class*="row"],
                #__docusaurus .row,
                #__docusaurus div[class*="row"],
                body div[class^="row_"],
                #__docusaurus div[class^="row_"] {
                  min-width: 420px !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
              }
              
              /* Extra small screens (less than 576px) */
              @media (max-width: 575px) {
                /* Ensure cards maintain proper width and centering */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  width: 100% !important;
                  min-width: 420px !important;
                  min-height: auto !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                
                /* Ensure card containers maintain proper centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  text-align: center !important;
                  padding: 1rem !important;
                }
                
                /* Ensure card titles are centered */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                  margin-top: 0 !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Ensure card descriptions are centered */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  text-align: center !important;
                  width: 100% !important;
                  margin-bottom: 0.5rem !important;
                  flex-grow: 0 !important;
                  word-wrap: break-word !important;
                  white-space: normal !important;
                }
                /* Adjust column layout for small screens */
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"],
                body .col.col--4,
                body .col.col--6,
                body [class*="col--4"],
                body [class*="col--6"],
                body div[class*="col--4"],
                body div[class*="col--6"],
                #__docusaurus .col.col--4,
                #__docusaurus .col.col--6,
                #__docusaurus [class*="col--4"],
                #__docusaurus [class*="col--6"],
                #__docusaurus div[class*="col--4"],
                #__docusaurus div[class*="col--6"] {
                  flex: 0 0 100% !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  min-width: 420px !important;
                  padding: 0.5rem !important;
                }
                
                /* Ensure the container can accommodate the minimum card width */
                body .docCategoryGeneratedIndex,
                body .generatedIndexPage_vN6x,
                body [class*="docCategoryGeneratedIndex"],
                body [class*="generatedIndexPage"],
                body div[class*="docCategoryGeneratedIndex"],
                body div[class*="generatedIndexPage"],
                #__docusaurus .docCategoryGeneratedIndex,
                #__docusaurus .generatedIndexPage_vN6x,
                #__docusaurus [class*="docCategoryGeneratedIndex"],
                #__docusaurus [class*="generatedIndexPage"],
                #__docusaurus div[class*="docCategoryGeneratedIndex"],
                #__docusaurus div[class*="generatedIndexPage"],
                body div[class^="docCategoryGeneratedIndex_"],
                #__docusaurus div[class^="docCategoryGeneratedIndex_"] {
                  min-width: 420px !important;
                  overflow-x: auto !important;
                }
                
                /* Ensure the row can accommodate the minimum card width */
                body .row,
                body div[class*="row"],
                #__docusaurus .row,
                #__docusaurus div[class*="row"],
                body div[class^="row_"],
                #__docusaurus div[class^="row_"] {
                  min-width: 420px !important;
                  justify-content: center !important;
                }
                
                /* Ensure cards display properly on small screens */
                body article .card,
                #__docusaurus article .card,
                body div[class*="generatedIndexPage"] article .card,
                #__docusaurus div[class*="generatedIndexPage"] article .card,
                body div[class*="docCategoryGeneratedIndex"] article .card,
                #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                  min-height: auto !important;
                  min-width: 420px !important;
                  width: 100% !important;
                }
                
                /* Ensure card descriptions wrap properly */
                body article .card div[class*="cardContainer"] p,
                #__docusaurus article .card div[class*="cardContainer"] p {
                  word-wrap: break-word !important;
                  white-space: normal !important;
                  width: 100% !important;
                  text-align: center !important;
                }
                
                /* Ensure card titles are centered on small screens */
                body article .card div[class*="cardContainer"] h2,
                #__docusaurus article .card div[class*="cardContainer"] h2,
                body article .card div[class*="cardContainer"] [class*="cardTitle"],
                #__docusaurus article .card div[class*="cardContainer"] [class*="cardTitle"] {
                  text-align: center !important;
                  width: 100% !important;
                }
                
                /* Ensure card containers maintain vertical centering */
                body article .card div[class*="cardContainer"],
                #__docusaurus article .card div[class*="cardContainer"] {
                  justify-content: center !important;
                  align-items: center !important;
                  padding: 1rem !important;
                }
              }

              /* Force any direct children of generatedIndexPage to not have margin */
              body .generatedIndexPage_vN6x > *,
              body [class*="generatedIndexPage"] > *,
              #__docusaurus .generatedIndexPage_vN6x > *,
              #__docusaurus [class*="generatedIndexPage"] > * {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }

              /* Force any direct children of docCategoryGeneratedIndex to not have margin */
              body .docCategoryGeneratedIndex > *,
              body [class*="docCategoryGeneratedIndex"] > *,
              #__docusaurus .docCategoryGeneratedIndex > *,
              #__docusaurus [class*="docCategoryGeneratedIndex"] > * {
                margin-left: 0 !important;
                margin-right: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            `,
          },
        ],
      };
    },
  };
};

