/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Manually defined sidebar with specific order
  tutorialSidebar: [
    "intro",
    "tech-stack",
    "architecture",
    {
      type: "category",
      label: "Frontend",
      link: {
        type: "generated-index",
        description:
          "Documentation for the Frontend part of the TuPhung Project",
      },
      items: [
        "frontend/structure",
        "frontend/state-management",
        "frontend/authentication",
        "frontend/user-management",
        "frontend/chat",
        "frontend/calendar",
        "frontend/calendar-revised",
        "frontend/kanban",
        "frontend/kanban-revised",
        "frontend/ai-assistants",
        "frontend/language-ai",
      ],
    },
    {
      type: "category",
      label: "Backend",
      link: {
        type: "generated-index",
        description:
          "Documentation for the Backend part of the TuPhung Project",
      },
      items: [
        "backend/structure",
        "backend/api",
        "backend/auth",
        "backend/database",
        "backend/user-management",
        "backend/websockets",
        "backend/speech-processing",
        "backend/exception-handling",
      ],
    },
    "deployment",
  ],
};

export default sidebars;
