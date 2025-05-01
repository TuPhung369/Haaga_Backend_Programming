/**
 * Custom Layout component that wraps the default Layout
 */
import React from "react";
import Layout from "@theme-original/Layout";
import Head from "@docusaurus/Head";

export default function LayoutWrapper(props) {
  return (
    <>
      <Head>
        <style>
          {`
          /* Inline styles to ensure 2 items per row in category pages */
          .col.col--6,
          div[class*="col--6"],
          [class*="col--6"] {
            --ifm-col-width: 50% !important;
            flex-basis: 50% !important;
            max-width: 50% !important;
            width: 50% !important;
            padding: 0.5rem !important;
            box-sizing: border-box !important;
          }
          
          /* Ensure the row displays correctly */
          .row,
          div[class*="row"],
          [class*="row"] {
            display: flex !important;
            flex-wrap: wrap !important;
            margin: 0 -0.5rem !important;
            width: 100% !important;
          }
          
          /* Target all cards */
          .card,
          div[class*="card"],
          [class*="card"] {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
          }
          
          /* Responsive adjustments */
          @media (max-width: 996px) {
            .col.col--6,
            div[class*="col--6"],
            [class*="col--6"] {
              --ifm-col-width: 50% !important;
              flex-basis: 50% !important;
              max-width: 50% !important;
              width: 50% !important;
            }
          }
          
          @media (max-width: 576px) {
            .col.col--6,
            div[class*="col--6"],
            [class*="col--6"] {
              --ifm-col-width: 100% !important;
              flex-basis: 100% !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
          `}
        </style>
      </Head>
      {/* Add a full-page background overlay */}
      <div className="full-page-background-overlay" />
      <Layout {...props} />
    </>
  );
}
