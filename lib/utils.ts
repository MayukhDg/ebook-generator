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

/**
 * Cleans manuscript prose to be human-like, conversational, and free of unnecessary markdown clutter:
 * - Strips redundant leading "# Chapter X..." headings
 * - Strips unnecessary "#" and "##" markdown hash symbols
 * - Strips annoying asterisks around quotes (*"..."*) and bold/italic asterisks (**)
 * - Limits em dashes (—) very sparingly, converting AI overuse to natural commas or periods
 * - Cleans up punctuation glitches
 */
export function cleanHumanProse(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove leading '# Chapter X...' title lines and duplicate titles at the top
  cleaned = cleaned.replace(/^#\s+Chapter\s+\d+[:\s\w\d'’"–—-]*\n+/i, '');
  cleaned = cleaned.replace(/^#\s+[^\n]+\n+/, '');

  // 2. Remove all markdown headings: '## Heading', '### Heading', etc. Convert to clean title on its own line
  cleaned = cleaned.replace(/^#{1,6}\s+([^\n]+)$/gm, '\n$1\n');

  // 3. Remove annoying asterisks around quotes like *"..."*, "**...**", "*...", "...*"
  cleaned = cleaned.replace(/\*+"([^"]+)"\*+/g, '"$1"');
  cleaned = cleaned.replace(/"+(\*+[^*"]+\*+)"/g, '"$1"');
  cleaned = cleaned.replace(/\*+"([^"]+)"/g, '"$1"');
  cleaned = cleaned.replace(/"([^"]+)"\*+/g, '"$1"');

  // 4. Remove standalone bold/italic asterisks: **word** or *word*
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
  // Remove any remaining stray asterisks
  cleaned = cleaned.replace(/\*/g, '');

  // 5. Remove standalone horizontal rules (---)
  cleaned = cleaned.replace(/\n\s*---\s*\n/g, '\n\n');

  // 6. Remove blockquote markers (> )
  cleaned = cleaned.replace(/^>\s*/gm, '');

  // 7. Make em dashes very sparing:
  // Convert paired em dashes (—phrase—) into natural commas
  cleaned = cleaned.replace(/—([^—\n]+)—/g, ', $1, ');

  // Convert remaining em dashes in prose to natural commas
  cleaned = cleaned.replace(/(\w)\s*—\s*(\w)/g, '$1, $2');
  cleaned = cleaned.replace(/(\w)\s*--\s*(\w)/g, '$1, $2');

  // Clean double commas or comma punctuation glitches
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/,\s*\./g, '.');
  cleaned = cleaned.replace(/,\s*\?/g, '?');
  cleaned = cleaned.replace(/,\s*!/g, '!');
  cleaned = cleaned.replace(/^[ \t]*,[ \t]*/gm, '');

  // 8. Clean trailing whitespace and extra blank lines
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
