export const stripMarkdown = (text: string): string => {
  if (!text) return "";

  return text
    // Remove code blocks and diagrams first
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    // Convert headers to plain text
    .replace(/^#{1,6}\s*(\d+\.?)?\s*/gm, "$1")
    // Remove table formatting and separators
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/^[|\-* ]+$/gm, "")
    // Remove emphasis formatting
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Clean lists and bullets
    .replace(/^\s*[\d•*\-+]\s*\.?/gm, "")
    .replace(/(\s)-(\s)/g, "$1$2")
    // Normalize whitespace and special characters
    .replace(/&[a-z]+;/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};