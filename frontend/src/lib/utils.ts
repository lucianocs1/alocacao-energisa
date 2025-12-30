import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a random color in HSL format
export function generateColorForProject(): string {
  const hues = [
    200, // Blue
    220, // Blue-green
    240, // Cyan
    30,  // Orange
    10,  // Red
    350, // Pink
    280, // Purple
    140, // Green
  ];

  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  const saturation = Math.floor(Math.random() * 20) + 60; // 60-80%
  const lightness = Math.floor(Math.random() * 10) + 45; // 45-55%

  return `hsl(${randomHue}, ${saturation}%, ${lightness}%)`;
}
