// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require("prism-react-renderer");
const path = require("path");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Haaga Backend Programming",
  tagline: "Comprehensive documentation for the Haaga Backend Programming Project",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://TuPhung369.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/Haaga_Backend_Programming/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "TuPhung369", // Usually your GitHub org/user name.
  projectName: "Haaga_Backend_Programming", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  // Custom fields for webpack configuration
  customFields: {
    webpackConfig: {
      // This is just for documentation, actual config is handled by clientModules
      cssModules: true,
    },
  },

  // Use custom client modules file with ES modules
  clientModules: [path.resolve(__dirname, "./src/client-modules.js")],

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: path.resolve(__dirname, "./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/TuPhung369/Haaga_Backend_Programming/tree/main/TuPhung_Docs/",
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), {sync: true}],
          ],
        },
        blog: false,
        theme: {
          customCss: path.resolve(__dirname, "./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/logo.svg",
      navbar: {
        title: "Haaga Backend Programming",
        logo: {
          alt: "Haaga Backend Programming Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Documentation",
          },
          {
            href: "https://github.com/TuPhung369/Haaga_Backend_Programming",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Introduction",
                to: "/docs/intro",
              },
              {
                label: "Architecture",
                to: "/docs/architecture",
              },
              {
                label: "Frontend",
                to: "/docs/category/frontend",
              },
              {
                label: "Backend",
                to: "/docs/category/backend",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "GitHub Discussions",
                href: "https://github.com/TuPhung369/Haaga_Backend_Programming/discussions",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/TuPhung369/Haaga_Backend_Programming",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Haaga Backend Programming. Built with Docusaurus.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
      },
      // Mermaid configuration
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
        options: {
          flowchart: {
            curve: 'linear',
          },
        },
      },
    }),
};

module.exports = config;

