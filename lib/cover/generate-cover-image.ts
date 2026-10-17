import sharp, { type Sharp } from 'sharp';
import { CoverStyleConfig } from '@/lib/types';

export interface GenerateCoverJpgOptions {
  mode?: 'front' | 'wrap';
  title: string;
  subtitle?: string | null;
  authorName?: string;
  coreThesis?: string;
  bgUrl?: string | null;
  styleConfig?: Partial<CoverStyleConfig>;
}

/**
 * Escapes characters for safe inclusion in SVG markup.
 */
function escapeXml(unsafe?: string | null): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Word-wraps a text string based on a maximum character count per line.
 */
function wrapText(text?: string | null, maxCharsPerLine: number = 24): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Fetches an image buffer from a URL or Data URL with a resilient timeout.
 */
async function fetchImageBuffer(url: string, timeoutMs: number = 8000): Promise<Buffer | null> {
  try {
    if (url.startsWith('data:image/')) {
      const b64 = url.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(b64, 'base64');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Failed to fetch cover background image: HTTP ${res.status}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.warn('Error fetching cover background image:', err?.message || err);
    return null;
  }
}

/**
 * Generates a high-resolution, print-ready JPEG (300 DPI) for a book's front cover or full KDP wrap.
 */
export async function generateCoverJpg(options: GenerateCoverJpgOptions): Promise<Buffer> {
  const {
    mode = 'front',
    title,
    subtitle,
    authorName = 'OpusCraft Author',
    coreThesis = 'The definitive authority guide for modern operators and practitioners.',
    bgUrl,
    styleConfig = {},
  } = options;

  const titleColor = styleConfig.title_color || '#F8FAFC';
  const subtitleColor = styleConfig.subtitle_color || '#94A3B8';
  const accentColor = styleConfig.accent_color || '#38BDF8';
  const fontFamily = styleConfig.font_family || 'Space Grotesk';
  const titlePosition = styleConfig.title_position || 'center';
  const titleAlign = styleConfig.title_align || 'center';
  const titleOffsetY = styleConfig.title_offset_y ?? 0;
  const showBadge = styleConfig.show_badge ?? true;
  const overlayOpacity = styleConfig.overlay_opacity ?? 45;

  let fontStack = `'${fontFamily}', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
  if (fontFamily.toLowerCase().includes('playfair') || fontFamily.toLowerCase().includes('classic')) {
    fontStack = `'Playfair Display', Georgia, 'Times New Roman', serif`;
  }

  if (mode === 'wrap') {
    return generateWrapJpg({
      title,
      subtitle,
      authorName,
      coreThesis,
      bgUrl,
      titleColor,
      subtitleColor,
      accentColor,
      fontStack,
      titlePosition,
      titleAlign,
      titleOffsetY,
      showBadge,
      overlayOpacity,
    });
  }

  return generateFrontCoverJpg({
    title,
    subtitle,
    authorName,
    bgUrl,
    titleColor,
    subtitleColor,
    accentColor,
    fontStack,
    titlePosition,
    titleAlign,
    titleOffsetY,
    showBadge,
    overlayOpacity,
  });
}

/**
 * Generates the Front Cover JPEG (1600 x 2560 pixels - 1:1.6 Amazon KDP Aspect Ratio).
 */
async function generateFrontCoverJpg(params: {
  title: string;
  subtitle?: string | null;
  authorName: string;
  bgUrl?: string | null;
  titleColor: string;
  subtitleColor: string;
  accentColor: string;
  fontStack: string;
  titlePosition: 'top' | 'center' | 'bottom';
  titleAlign: 'left' | 'center' | 'right';
  titleOffsetY: number;
  showBadge: boolean;
  overlayOpacity: number;
}): Promise<Buffer> {
  const width = 1600;
  const height = 2560;

  let baseBuffer: Buffer | null = null;
  if (params.bgUrl) {
    baseBuffer = await fetchImageBuffer(params.bgUrl);
  }

  let baseSharp: Sharp;
  if (baseBuffer) {
    baseSharp = sharp(baseBuffer).resize(width, height, { fit: 'cover', position: 'center' });
  } else {
    // Elegant dark fallback background
    baseSharp = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 10, g: 15, b: 29, alpha: 1 },
      },
    });
  }

  const textAnchor = params.titleAlign === 'left' ? 'start' : params.titleAlign === 'right' ? 'end' : 'middle';
  const contentX = params.titleAlign === 'left' ? 160 : params.titleAlign === 'right' ? 1440 : 800;

  // Title sizing & wrapping
  const titleLen = params.title.length;
  const titleFontSize = titleLen > 40 ? 82 : titleLen > 25 ? 94 : 106;
  const titleLineHeight = titleFontSize * 1.25;
  const maxTitleChars = titleFontSize <= 82 ? 26 : 22;
  const titleLines = wrapText(params.title, maxTitleChars);

  // Subtitle sizing & wrapping
  const subFontSize = 42;
  const subLineHeight = 56;
  const subtitleLines = params.subtitle ? wrapText(params.subtitle, 36) : [];

  // Vertical placement calculations
  const scaledOffsetY = params.titleOffsetY * 3.5;
  const titleBlockHeight =
    titleLines.length * titleLineHeight + (subtitleLines.length ? 40 + subtitleLines.length * subLineHeight : 0);

  let badgeY = 240;
  let titleStartY: number;
  let authorY = 2360;

  if (params.titlePosition === 'top') {
    badgeY = 220;
    titleStartY = (params.showBadge ? 370 : 270) + scaledOffsetY;
    authorY = 2360;
  } else if (params.titlePosition === 'bottom') {
    badgeY = 220;
    titleStartY = Math.max(900, 2180 - titleBlockHeight - 160 + scaledOffsetY);
    authorY = 2380;
  } else {
    // Center position default
    badgeY = 240;
    const centerY = height / 2 - titleBlockHeight / 2;
    titleStartY = centerY + scaledOffsetY;
    authorY = 2360;
  }

  // Divider geometry
  const dividerW = 140;
  const dividerH = 6;
  const dividerY = titleStartY + titleLines.length * titleLineHeight + 15;
  let dividerX = contentX - dividerW / 2;
  if (params.titleAlign === 'left') dividerX = 160;
  if (params.titleAlign === 'right') dividerX = 1440 - dividerW;

  const subtitleStartY = dividerY + dividerH + 45;

  // Build SVG tspans
  const titleTspans = titleLines
    .map(
      (line, idx) =>
        `<tspan x="${contentX}" dy="${idx === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const subtitleTspans = subtitleLines
    .map(
      (line, idx) =>
        `<tspan x="${contentX}" dy="${idx === 0 ? 0 : subLineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  // Badge layout
  const badgeWidth = 440;
  const badgeHeight = 52;
  let badgeBoxX = contentX - badgeWidth / 2;
  if (params.titleAlign === 'left') badgeBoxX = 160;
  if (params.titleAlign === 'right') badgeBoxX = 1440 - badgeWidth;
  const badgeTextX = badgeBoxX + badgeWidth / 2;
  const badgeTextY = badgeY + 34;

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Spine shadow on left edge -->
        <linearGradient id="spineShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>

        <!-- Top scrim gradient -->
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.88" />
          <stop offset="50%" stop-color="#000000" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>

        <!-- Bottom scrim gradient -->
        <linearGradient id="bottomScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="50%" stop-color="#000000" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.92" />
        </linearGradient>

        <filter id="textDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.75" />
        </filter>
      </defs>

      <!-- 1. Darkening tint overlay -->
      <rect width="${width}" height="${height}" fill="#000000" fill-opacity="${params.overlayOpacity / 100}" />

      <!-- 2. Positional directional scrims -->
      ${params.titlePosition === 'top' ? `<rect width="${width}" height="1300" fill="url(#topScrim)" />` : ''}
      ${params.titlePosition === 'bottom' ? `<rect y="1200" width="${width}" height="1360" fill="url(#bottomScrim)" />` : ''}

      <!-- 3. Left spine shadow -->
      <rect x="0" y="0" width="60" height="${height}" fill="url(#spineShadow)" />

      <!-- 4. Authority Blueprint Badge -->
      ${
        params.showBadge
          ? `
        <g>
          <rect x="${badgeBoxX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="10" ry="10" 
                fill="${params.accentColor}" fill-opacity="0.18" stroke="${params.accentColor}" stroke-opacity="0.45" stroke-width="2" />
          <text x="${badgeTextX}" y="${badgeTextY}" font-family="${params.fontStack}" font-size="20" font-weight="bold" 
                fill="${params.accentColor}" text-anchor="middle" letter-spacing="5">
            AN AUTHORITY BLUEPRINT
          </text>
        </g>
      `
          : ''
      }

      <!-- 5. Title -->
      <g filter="url(#textDropShadow)">
        <text x="${contentX}" y="${titleStartY}" font-family="${params.fontStack}" font-size="${titleFontSize}" font-weight="900" 
              fill="${params.titleColor}" text-anchor="${textAnchor}" letter-spacing="-1">
          ${titleTspans}
        </text>
      </g>

      <!-- 6. Minimalist Divider -->
      <rect x="${dividerX}" y="${dividerY}" width="${dividerW}" height="${dividerH}" rx="3" fill="${params.accentColor}" />

      <!-- 7. Subtitle -->
      ${
        subtitleLines.length
          ? `
        <g filter="url(#textDropShadow)">
          <text x="${contentX}" y="${subtitleStartY}" font-family="${params.fontStack}" font-size="${subFontSize}" font-weight="500" 
                fill="${params.subtitleColor}" text-anchor="${textAnchor}" fill-opacity="0.95">
            ${subtitleTspans}
          </text>
        </g>
      `
          : ''
      }

      <!-- 8. Footer Author Section -->
      <g>
        <line x1="${contentX === 800 ? 500 : contentX === 160 ? 160 : 1000}" y1="${authorY - 90}" 
              x2="${contentX === 800 ? 1100 : contentX === 160 ? 760 : 1440}" y2="${authorY - 90}" 
              stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" />
        <text x="${contentX}" y="${authorY - 50}" font-family="${params.fontStack}" font-size="22" font-weight="bold" 
              fill="#94A3B8" text-anchor="${textAnchor}" letter-spacing="4">
          AUTHORED BY
        </text>
        <text x="${contentX}" y="${authorY}" font-family="${params.fontStack}" font-size="44" font-weight="bold" 
              fill="${params.titleColor}" text-anchor="${textAnchor}" letter-spacing="1">
          ${escapeXml(params.authorName)}
        </text>
      </g>
    </svg>
  `;

  return baseSharp
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .withMetadata({ density: 300 })
    .toBuffer();
}

/**
 * Generates the Full KDP Wrap JPEG (3600 x 2400 pixels - Back Cover + Spine + Front Cover).
 */
async function generateWrapJpg(params: {
  title: string;
  subtitle?: string | null;
  authorName: string;
  coreThesis: string;
  bgUrl?: string | null;
  titleColor: string;
  subtitleColor: string;
  accentColor: string;
  fontStack: string;
  titlePosition: 'top' | 'center' | 'bottom';
  titleAlign: 'left' | 'center' | 'right';
  titleOffsetY: number;
  showBadge: boolean;
  overlayOpacity: number;
}): Promise<Buffer> {
  const width = 3600;
  const height = 2400;
  const spineWidth = 240;
  const coverWidth = (width - spineWidth) / 2; // 1680px

  let baseBuffer: Buffer | null = null;
  if (params.bgUrl) {
    baseBuffer = await fetchImageBuffer(params.bgUrl);
  }

  let baseSharp: Sharp;
  if (baseBuffer) {
    baseSharp = sharp(baseBuffer).resize(width, height, { fit: 'cover', position: 'center' });
  } else {
    baseSharp = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 10, g: 15, b: 29, alpha: 1 },
      },
    });
  }

  // Front cover origin & text positions
  const frontOriginX = coverWidth + spineWidth;
  const frontContentX =
    frontOriginX + (params.titleAlign === 'left' ? 160 : params.titleAlign === 'right' ? coverWidth - 160 : coverWidth / 2);
  const textAnchor = params.titleAlign === 'left' ? 'start' : params.titleAlign === 'right' ? 'end' : 'middle';

  const titleFontSize = params.title.length > 35 ? 76 : params.title.length > 25 ? 88 : 96;
  const titleLineHeight = titleFontSize * 1.25;
  const titleLines = wrapText(params.title, 22);

  const subFontSize = 38;
  const subLineHeight = 50;
  const subtitleLines = params.subtitle ? wrapText(params.subtitle, 34) : [];

  const scaledOffsetY = params.titleOffsetY * 3;
  let titleStartY = height / 2 - 150 + scaledOffsetY;
  let authorY = 2220;

  if (params.titlePosition === 'top') {
    titleStartY = 380 + scaledOffsetY;
  } else if (params.titlePosition === 'bottom') {
    titleStartY = 1600 + scaledOffsetY;
  }

  const dividerW = 140;
  const dividerH = 6;
  const dividerY = titleStartY + titleLines.length * titleLineHeight + 15;
  let dividerX = frontContentX - dividerW / 2;
  if (params.titleAlign === 'left') dividerX = frontOriginX + 160;
  if (params.titleAlign === 'right') dividerX = frontOriginX + coverWidth - 160 - dividerW;

  const subtitleStartY = dividerY + dividerH + 40;

  const titleTspans = titleLines
    .map(
      (line, idx) =>
        `<tspan x="${frontContentX}" dy="${idx === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const subtitleTspans = subtitleLines
    .map(
      (line, idx) =>
        `<tspan x="${frontContentX}" dy="${idx === 0 ? 0 : subLineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const spineCenterX = coverWidth + spineWidth / 2;
  const thesisLines = wrapText(params.coreThesis, 46);
  const thesisTspans = thesisLines
    .map((line, idx) => `<tspan x="180" dy="${idx === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`)
    .join('');

  const svgWrap = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spineShadowLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="spineShadowRight" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
        </filter>
      </defs>

      <!-- Overall darkening tint -->
      <rect width="${width}" height="${height}" fill="#000000" fill-opacity="${Math.max(0.55, params.overlayOpacity / 100)}" />

      <!-- Back cover left border shadow -->
      <rect x="${coverWidth - 20}" y="0" width="20" height="${height}" fill="url(#spineShadowRight)" />

      <!-- ================= 1. BACK COVER ================= -->
      <g>
        <text x="180" y="240" font-family="${params.fontStack}" font-size="24" font-weight="bold" fill="#F59E0B" letter-spacing="4">
          ADVANCE PRAISE FOR THE SOVEREIGN OPERATOR
        </text>

        <text x="180" y="340" font-family="${params.fontStack}" font-size="34" font-style="italic" fill="#E2E8F0">
          "The definitive playbook for any consultant who wants to escape the
        </text>
        <text x="180" y="388" font-family="${params.fontStack}" font-size="34" font-style="italic" fill="#E2E8F0">
          billable hour trap and build an autonomous enterprise."
        </text>
        <text x="180" y="450" font-family="${params.fontStack}" font-size="26" font-weight="600" fill="#94A3B8">
          — Enterprise Strategy Review
        </text>

        <!-- Core Thesis -->
        <text x="180" y="600" font-family="${params.fontStack}" font-size="30" fill="#CBD5E1">
          ${thesisTspans}
        </text>

        <!-- Barcode Box -->
        <g transform="translate(180, 2040)">
          <text x="0" y="50" font-family="${params.fontStack}" font-size="24" fill="#94A3B8">OpusCraft Press</text>
          <text x="0" y="90" font-family="${params.fontStack}" font-size="20" fill="#64748B">Category: Business / Systems</text>
        </g>
        <g transform="translate(1160, 2020)">
          <rect width="360" height="180" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
          <text x="180" y="80" font-family="monospace" font-size="36" font-weight="bold" fill="#0F172A" text-anchor="middle" letter-spacing="4">
            ||| | |||| || |
          </text>
          <text x="180" y="140" font-family="monospace" font-size="20" font-weight="bold" fill="#475569" text-anchor="middle">
            ISBN RESERVED
          </text>
        </g>
      </g>

      <!-- ================= 2. SPINE ================= -->
      <rect x="${coverWidth}" y="0" width="${spineWidth}" height="${height}" fill="#000000" fill-opacity="0.4" />
      <line x1="${coverWidth}" y1="0" x2="${coverWidth}" y2="${height}" stroke="#000000" stroke-opacity="0.5" stroke-width="2" />
      <line x1="${coverWidth + spineWidth}" y1="0" x2="${coverWidth + spineWidth}" y2="${height}" stroke="#000000" stroke-opacity="0.5" stroke-width="2" />

      <!-- Vertical Spine Text -->
      <g transform="translate(${spineCenterX}, 1200) rotate(90)">
        <text x="0" y="12" font-family="${params.fontStack}" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">
          ${escapeXml(params.title).toUpperCase()}
        </text>
      </g>
      <g transform="translate(${spineCenterX}, 2200) rotate(90)">
        <text x="0" y="8" font-family="${params.fontStack}" font-size="30" font-weight="bold" fill="#F59E0B" text-anchor="middle" letter-spacing="3">
          OPUSCRAFT
        </text>
      </g>
      <g transform="translate(${spineCenterX}, 260) rotate(90)">
        <text x="0" y="8" font-family="${params.fontStack}" font-size="32" font-weight="500" fill="#CBD5E1" text-anchor="middle" letter-spacing="2">
          ${escapeXml(params.authorName)}
        </text>
      </g>

      <!-- ================= 3. FRONT COVER ================= -->
      <rect x="${frontOriginX}" y="0" width="40" height="${height}" fill="url(#spineShadowLeft)" />

      <!-- Title -->
      <g filter="url(#shadow)">
        <text x="${frontContentX}" y="${titleStartY}" font-family="${params.fontStack}" font-size="${titleFontSize}" font-weight="900" 
              fill="${params.titleColor}" text-anchor="${textAnchor}">
          ${titleTspans}
        </text>
      </g>

      <!-- Divider -->
      <rect x="${dividerX}" y="${dividerY}" width="${dividerW}" height="${dividerH}" rx="3" fill="${params.accentColor}" />

      <!-- Subtitle -->
      ${
        subtitleLines.length
          ? `
        <g filter="url(#shadow)">
          <text x="${frontContentX}" y="${subtitleStartY}" font-family="${params.fontStack}" font-size="${subFontSize}" font-weight="500" 
                fill="${params.subtitleColor}" text-anchor="${textAnchor}">
            ${subtitleTspans}
          </text>
        </g>
      `
          : ''
      }

      <!-- Author -->
      <g>
        <line x1="${frontContentX === frontOriginX + coverWidth / 2 ? frontOriginX + 300 : frontContentX === frontOriginX + 160 ? frontOriginX + 160 : frontOriginX + coverWidth - 500}" y1="${authorY - 70}" 
              x2="${frontContentX === frontOriginX + coverWidth / 2 ? frontOriginX + coverWidth - 300 : frontContentX === frontOriginX + 160 ? frontOriginX + 600 : frontOriginX + coverWidth - 160}" y2="${authorY - 70}" 
              stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" />
        <text x="${frontContentX}" y="${authorY}" font-family="${params.fontStack}" font-size="44" font-weight="bold" 
              fill="${params.titleColor}" text-anchor="${textAnchor}">
          ${escapeXml(params.authorName)}
        </text>
      </g>
    </svg>
  `;

  return baseSharp
    .composite([{ input: Buffer.from(svgWrap), top: 0, left: 0 }])
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .withMetadata({ density: 300 })
    .toBuffer();
}
