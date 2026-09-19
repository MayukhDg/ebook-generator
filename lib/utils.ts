import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates Amazon KDP paperback spine width in inches.
 * Standard formula for 50lb white paper: Spine Width (in) = Total Page Count * 0.002252
 */
export function calculateSpineWidthInches(pageCount: number): number {
  if (pageCount <= 0) return 0.2;
  const width = pageCount * 0.002252;
  // KDP minimum spine width for text on spine is usually 79-80 pages (~0.18"), min wrap spine is ~0.06"
  return Math.max(0.1, Number(width.toFixed(4)));
}

/**
 * Converts inches to points (1 inch = 72 points, standard PDF unit)
 */
export function inchesToPoints(inches: number): number {
  return inches * 72;
}

/**
 * Calculates words to estimated printed 6x9 book pages.
 * Standard KDP 6x9 trade paperback averages ~275 words per page with standard typography.
 */
export function calculateEstimatedPages(wordCount: number): number {
  const bodyPages = Math.max(1, Math.ceil(wordCount / 275));
  // Add front matter (Half title, Title, Copyright, Dedication, TOC) ~ 6 pages + back matter ~ 2 pages
  return bodyPages + 8;
}

/**
 * Formats a number with comma separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Generates a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formats date to human readable string
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}
