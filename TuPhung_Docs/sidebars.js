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
          "Documentation for the Frontend part of the Enterprise Nexus Project",
      },
      items: [
        {
          type: "doc",
          id: "frontend/structure",
          label: "Project Structure",
        },
        {
          type: "doc",
          id: "frontend/state-management",
          label: "State Management",
        },
        {
          type: "doc",
          id: "frontend/authentication",
          label: "Authentication",
        },
        {
          type: "doc",
          id: "frontend/user-management",
          label: "User Management",
        },
        {
          type: "doc",
          id: "frontend/calendar",
          label: "Calendar",
        },
        {
          type: "doc",
          id: "frontend/kanban",
          label: "Kanban Board",
        },
        {
          type: "doc",
          id: "frontend/ai-assistants",
          label: "AI Assistants",
        },
        {
          type: "doc",
          id: "frontend/language-ai",
          label: "Language AI",
        },
        {
          type: "doc",
          id: "frontend/chat",
          label: "Chat System",
        },
      ],
    },
    {
      type: "category",
      label: "Backend",
      link: {
        type: "generated-index",
        description:
          "Documentation for the Backend part of the Enterprise Nexus Project",
      },
      items: [
        {
          type: "doc",
          id: "backend/structure",
          label: "Project Structure",
        },
        {
          type: "doc",
          id: "backend/api",
          label: "API",
        },
        {
          type: "doc",
          id: "backend/auth",
          label: "Authentication",
        },
        {
          type: "doc",
          id: "backend/database",
          label: "Database",
        },
        {
          type: "doc",
          id: "backend/user-management",
          label: "User Management",
        },
        {
          type: "doc",
          id: "backend/websockets",
          label: "WebSockets",
        },
        {
          type: "doc",
          id: "backend/speech-processing",
          label: "Speech Processing",
        },
        {
          type: "doc",
          id: "backend/exception-handling",
          label: "Exception Handling",
        },
      ],
    },
    "deployment",
  ],
};

export default sidebars;


