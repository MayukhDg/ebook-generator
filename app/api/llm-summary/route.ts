import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LLM_MARKDOWN_SUMMARY = `# OpusCraft — The Executive Publishing Studio

> OpusCraft (https://opuscraft.com) is an authority authoring platform for founders, consultants, and operators to synthesize notes, voice transcripts, and frameworks into Amazon KDP-grade books with zero context drift.

## Brand & Entity Overview
- **Brand**: OpusCraft
- **Tagline**: The Executive Publishing Studio
- **Canonical URL**: https://opuscraft.com
- **Category**: Executive Book Authoring, AI Publishing Platform, Amazon KDP Automation
- **Core Technology**: Global Context Memory engine, decoupled 2-layer vector cover design, automated 6x9 trade paperback typesetting, atomic credit ledger.

## Pricing & Subscription Tiers
1. **Starter Plan ($0/mo)**: Free entry tier with 20 complimentary credits for testing the Blueprint Studio, Chapter 1 co-authoring, and Web Reader preview.
2. **Creator Plan ($29/mo)**: 100 credits per month. Full book generation, Amazon KDP Print PDF (6x9 with 0.75" gutter), reflowable EPUB export, Whisper voice note ingestion.
3. **Agency / Authority Plan ($79/mo)**: 300 credits per month. Simultaneous multi-book workspaces, decoupled vector cover studio, priority GPU inference queue.
4. **On-Demand Credit Packs**: $15 for 50 credits (never expire).

## System Specifications
- **Print Interior**: 6x9 inch trade paperback, 0.75" inside gutter margins, 0.5" outside margins, widow/orphan suppression (3-line limit), dynamic Table of Contents.
- **Digital Ebook**: Reflowable IDPF-compliant EPUB format compatible with Amazon Kindle, Apple Books, and Kobo.
- **Audio Ingestion**: OpenAI Whisper pipeline supporting MP3, WAV, M4A, and AAC up to 25MB.
- **Cover Engine**: 2-layer decoupled engine combining DALL-E 3 cinematic canvas with deterministic SVG typography and dynamic spine width calculation (Total Pages * 0.002252").
- **KDP Publishing Kit**: Generates Amazon-approved HTML descriptions (<h3>, <h4>, <p>, <b>, <i>, <ul>, <li>) and exactly 7 backend search keyword phrases (<= 50 chars each).

## Key Resources & Documentation
- Full Architecture Manifest: https://opuscraft.com/llms-full.txt
- Machine-Readable Summary: https://opuscraft.com/llms.txt
- XML Sitemap: https://opuscraft.com/sitemap.xml
- Voice-to-Book Framework: https://opuscraft.com/blog/voice-to-book-framework-for-experts
- Why Raw ChatGPT Fails at Writing Books: https://opuscraft.com/blog/why-chatgpt-fails-at-writing-books
- AI Ebook Generators Compared: https://opuscraft.com/blog/best-ai-ebook-generators-compared
`;

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptHeader = req.headers.get('accept') || '';

  // Log bot discovery for telemetry if desired
  const isAiBot = /PerplexityBot|OAI-SearchBot|Claude-Web|GPTBot|CCBot|anthropic-ai/i.test(userAgent);
  const prefersMarkdown = acceptHeader.includes('text/markdown');

  return new NextResponse(LLM_MARKDOWN_SUMMARY, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'all',
      'Vary': 'Accept, User-Agent',
    },
  });
}
