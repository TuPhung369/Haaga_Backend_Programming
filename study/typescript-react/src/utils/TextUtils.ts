export const stripMarkdown = (text: string): string => {
  if (!text) return "";

  let cleanText = text;

  // Convert markdown headers to numbered list format
  cleanText = cleanText
    .replace(/^#{1,6}\s+(\d+\.)\s*(.*)/gm, "$1 $2") // Convert headers with numbers
    .replace(/^#{1,6}\s+(.*)/gm, "• $1")            // Convert other headers to bullet points
    .replace(/(\d+)\./g, "$1") // Convert "1." to "1" for better speech pronunciation
    .replace(/\s-\s/g, ", ")  // Convert hyphens to pauses
    .replace(/\*\*([^*]+)\*\*/g, "$1")              // Remove bold
    .replace(/\*([^*]+)\*/g, "$1")                  // Remove italic
    .replace(/__([^_]+)__/g, "$1")                  // Remove bold (alternative)
    .replace(/_([^_]+)_/g, "$1")                    // Remove italic (alternative)
    .replace(/```[\s\S]*?```/g, "")                 // Remove code blocks
    .replace(/`([^`]+)`/g, "$1")                    // Remove inline code
    .replace(/^\s*[*-]\s+/gm, "")                   // Remove bullet points
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ");

  console.log(`STEP CHECKING: Cleaned text: ${cleanText}`);
  return cleanText.trim();
};