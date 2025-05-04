/**
 * Plugin to inject CSS directly into the head of category pages
 */
module.exports = function (context, options) {
  return {
    name: 'category-css-plugin',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'style',
            attributes: {
              type: 'text/css',
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
              
              /* Force all cards to have the same height */
              body article .card,
              #__docusaurus article .card,
              body div[class*="generatedIndexPage"] article .card,
              #__docusaurus div[class*="generatedIndexPage"] article .card,
              body div[class*="docCategoryGeneratedIndex"] article .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article .card {
                height: 138.196px !important;
                max-height: 138.196px !important;
                overflow: hidden !important;
              }
              
              /* Force card containers to have consistent height */
              body article .card div[class*="cardContainer"],
              #__docusaurus article .card div[class*="cardContainer"] {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
              }
              
              /* Force card descriptions to be limited */
              body article .card div[class*="cardContainer"] p,
              #__docusaurus article .card div[class*="cardContainer"] p {
                flex-grow: 1;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                max-height: 3em !important;
                line-height: 1.5 !important;
                margin-bottom: 0 !important;
              }
              
              /* Special fix for language-ai card */
              body article a[href*="language-ai"] .card,
              #__docusaurus article a[href*="language-ai"] .card,
              body div[class*="generatedIndexPage"] article a[href*="language-ai"] .card,
              #__docusaurus div[class*="generatedIndexPage"] article a[href*="language-ai"] .card,
              body div[class*="docCategoryGeneratedIndex"] article a[href*="language-ai"] .card,
              #__docusaurus div[class*="docCategoryGeneratedIndex"] article a[href*="language-ai"] .card {
                height: 138.196px !important;
                max-height: 138.196px !important;
                overflow: hidden !important;
              }
              
              /* Special fix for language-ai card description */
              body article a[href*="language-ai"] .card div[class*="cardContainer"] p,
              #__docusaurus article a[href*="language-ai"] .card div[class*="cardContainer"] p {
                -webkit-line-clamp: 2 !important;
                max-height: 3em !important;
                overflow: hidden !important;
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

              @media (max-width: 576px) {
                body div[class^="col_"][class*="--4"],
                body div[class^="col_"][class*="--6"],
                #__docusaurus div[class^="col_"][class*="--4"],
                #__docusaurus div[class^="col_"][class*="--6"] {
                  flex: 0 0 100% !important;
                  max-width: 100% !important;
                  width: 100% !important;
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