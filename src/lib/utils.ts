import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
  if (!hex) return null;
  
  // Remove the hash at the start if it's there
  let r_hex = hex.startsWith('#') ? hex.slice(1) : hex;

  // If the hex is short (e.g. "FFF"), expand it
  if (r_hex.length === 3) {
    r_hex = r_hex.split('').map(char => char + char).join('');
  }

  // Parse the r, g, b values
  let r = parseInt(r_hex.substring(0, 2), 16);
  let g = parseInt(r_hex.substring(2, 4), 16);
  let b = parseInt(r_hex.substring(4, 6), 16);

  // Convert RGB to a value between 0 and 1
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
