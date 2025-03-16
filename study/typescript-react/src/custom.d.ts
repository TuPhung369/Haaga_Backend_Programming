// src/custom.d.ts

declare module "antd" {
  // Add any missing types or override existing ones
  export * from "@types/antd";
}

// Declare CSS module to suppress Tailwind CSS warnings
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// Add support for Tailwind directives
interface CSSRules {
  '@tailwind': string;
}

