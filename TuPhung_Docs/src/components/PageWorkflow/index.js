import React from "react";
import styles from "./styles.module.css";
import MermaidDiagram from "../MermaidDiagram";

/**
 * PageWorkflow component for displaying workflow diagrams at the top of pages
 *
 * @param {Object} props Component properties
 * @param {string} props.title The title of the workflow diagram
 * @param {string} props.description A brief description of the workflow
 * @param {string} props.mermaidDiagram The Mermaid diagram code
 * @returns {JSX.Element} The workflow component
 */
export default function PageWorkflow({ title, description, mermaidDiagram }) {
  return (
    <div className={styles.workflowContainer}>
      <div className={styles.workflowHeader}>
        <div className={styles.workflowTitle}>{title || "Page Workflow"}</div>
        {description && (
          <div className={styles.workflowDescription}>{description}</div>
        )}
      </div>
      <MermaidDiagram chart={mermaidDiagram} />
    </div>
  );
}