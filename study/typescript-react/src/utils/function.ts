// src/utils/function.ts

export const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};

// Brightness (luminance)
export const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

// Calculation the ratio of contrast
export const getContrastRatio = (
  bgRgb: { r: number; g: number; b: number },
  textRgb: { r: number; g: number; b: number }
): number => {
  const L1 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const L2 = getLuminance(textRgb.r, textRgb.g, textRgb.b);
  const brighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (brighter + 0.05) / (darker + 0.05);
};

export const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToRgb = (
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

export const invertColorWithContrast = (
  backgroundColor: string,
  minContrast = 7
): string => {
  const bgRgb = hexToRgb(backgroundColor);
  const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
  const newHue = (bgHsl.h + 180) % 360;
  const newSaturation = Math.min(100, bgHsl.s + 30);
  let newLightness = bgHsl.l;
  const initialTextRgb = hslToRgb(newHue, newSaturation, newLightness);
  let contrast = getContrastRatio(bgRgb, initialTextRgb);
  while (contrast < minContrast) {
    newLightness = bgHsl.l > 50 ? newLightness - 10 : newLightness + 10;
    newLightness = Math.max(0, Math.min(100, newLightness));
    const adjustedRgb = hslToRgb(newHue, newSaturation, newLightness);
    contrast = getContrastRatio(bgRgb, adjustedRgb);
    if (newLightness === 0 || newLightness === 100) break;
  }
  const finalRgb = hslToRgb(newHue, newSaturation, newLightness);
  return `#${finalRgb.r.toString(16).padStart(2, "0")}${finalRgb.g
    .toString(16)
    .padStart(2, "0")}${finalRgb.b
      .toString(16)
      .padStart(2, "0")}`.toUpperCase();
};

export const hexToRgba = (hex: string, alpha = 1): string => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


