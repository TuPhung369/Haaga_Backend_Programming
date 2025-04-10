/**
 * Utility functions for language handling
 */

/**
 * Normalizes a language code to ensure consistent format
 * Handles variations like "fi-FI", "fi", "FI", etc.
 * 
 * @param languageCode The language code to normalize
 * @returns Normalized language code in format "xx-XX"
 */
export const normalizeLanguageCode = (languageCode: string): string => {
  if (!languageCode) return "en-US"; // Default to English if no language code provided
  
  // If it's already in the format xx-XX, return it as is
  if (/^[a-z]{2}-[A-Z]{2}$/.test(languageCode)) {
    return languageCode;
  }
  
  // Handle different formats
  if (languageCode.includes("-")) {
    // Split by hyphen and normalize each part
    const [lang, region] = languageCode.split("-");
    return `${lang.toLowerCase()}-${region.toUpperCase()}`;
  } else if (languageCode.length === 2) {
    // If it's just a 2-letter code like "fi" or "en"
    if (languageCode.toLowerCase() === "fi") {
      return "fi-FI";
    } else if (languageCode.toLowerCase() === "en") {
      return "en-US";
    } else {
      // For other 2-letter codes, use the same code for region
      return `${languageCode.toLowerCase()}-${languageCode.toUpperCase()}`;
    }
  } else {
    // If it's something else, default to English
    console.warn(`Unrecognized language code format: ${languageCode}, defaulting to en-US`);
    return "en-US";
  }
};

/**
 * Gets the language part from a language code (e.g., "en" from "en-US")
 */
export const getLanguagePart = (languageCode: string): string => {
  const normalized = normalizeLanguageCode(languageCode);
  return normalized.split("-")[0];
};

/**
 * Gets the region part from a language code (e.g., "US" from "en-US")
 */
export const getRegionPart = (languageCode: string): string => {
  const normalized = normalizeLanguageCode(languageCode);
  return normalized.split("-")[1];
};

/**
 * Checks if two language codes are equivalent (e.g., "fi" and "fi-FI")
 */
export const areLanguageCodesEquivalent = (code1: string, code2: string): boolean => {
  const normalized1 = normalizeLanguageCode(code1);
  const normalized2 = normalizeLanguageCode(code2);
  
  return normalized1 === normalized2;
};
