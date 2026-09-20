import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  Image,
  StyleSheet, 
  renderToBuffer 
} from '@react-pdf/renderer';
import { store } from '@/lib/data/store';

// Define 6x9 Trade Paperback Dimensions (72 points = 1 inch)
// 6" x 9" = 432pt x 648pt
// Gutter margin (inside) = 0.75" = 54pt
// Outer margin = 0.5" = 36pt
const styles = StyleSheet.create({
  page: {
    width: 432,
    height: 648,
    paddingTop: 45,
    paddingBottom: 45,
    paddingLeft: 54, // Inside gutter
    paddingRight: 36, // Outside margin
    fontSize: 10.5,
    lineHeight: 1.55,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  coverPage: {
    width: 432,
    height: 648,
    padding: 0,
    position: 'relative',
    backgroundColor: '#0a0f1d',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 432,
    height: 648,
    objectFit: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 432,
    height: 648,
    backgroundColor: '#050811',
    opacity: 0.42,
  },
  coverSpineShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 14,
    backgroundColor: '#000000',
    opacity: 0.35,
  },
  coverContainer: {
    position: 'relative',
    width: 432,
    height: 648,
    paddingTop: 54,
    paddingBottom: 48,
    paddingHorizontal: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'center',
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  badgeText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  centerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 330,
  },
  coverTitle: {
    fontSize: 27,
    textAlign: 'center',
    lineHeight: 1.25,
    marginBottom: 14,
  },
  coverDivider: {
    width: 48,
    height: 2.5,
    borderRadius: 1,
    marginBottom: 14,
    alignSelf: 'center',
  },
  coverSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 1.45,
    maxWidth: 290,
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 14,
  },
  authorPrefix: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  coverAuthorName: {
    fontSize: 13.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titlePage: {
    width: 432,
    height: 648,
    padding: 54,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  bookTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#0f172a',
    textAlign: 'center',
  },
  bookSubtitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Oblique',
    color: '#475569',
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: 300,
  },
  authorName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginTop: 60,
  },
  runningHeader: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 18,
    textAlign: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chapterNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  chapterTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
    textIndent: 14,
  },
  heading2: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1e293b',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
  copyrightText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  tocTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  tocRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const interiorOnly = searchParams.get('interiorOnly') === 'true' || searchParams.get('includeCover') === 'false';

    const chapters = await store.getChapters(book.id);

    // Resolve typography & color styling from cover config
    const isSerif = book.cover_style_config?.font_family === 'Playfair Display' || book.cover_style_config?.font_family === 'Merriweather';
    const coverTitleFont = isSerif ? 'Times-Bold' : 'Helvetica-Bold';
    const coverSubtitleFont = isSerif ? 'Times-Italic' : 'Helvetica';
    const titleColor = book.cover_style_config?.title_color || '#F8FAFC';
    const subtitleColor = book.cover_style_config?.subtitle_color || '#94A3B8';
    const accentColor = book.cover_style_config?.accent_color || '#38BDF8';
    const authorName = book.cover_style_config?.author_name || 'Author';

    // Pre-fetch background image as base64 data URI for high-res resilience in Node
    const coverUrl = book.cover_bg_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    let coverImageSrc: string = coverUrl;

    if (coverUrl && !interiorOnly) {
      if (coverUrl.startsWith('data:')) {
        coverImageSrc = coverUrl;
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(coverUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const mimeType = res.headers.get('content-type') || 'image/jpeg';
            coverImageSrc = `data:${mimeType};base64,${Buffer.from(arrayBuf).toString('base64')}`;
          }
        } catch (fetchErr) {
          console.warn('Could not pre-fetch cover image into base64, using raw URL:', fetchErr);
          coverImageSrc = coverUrl;
        }
      }
    }

    // Build the React-PDF Document Component in TSX
    const MyDocument = (
      <Document
        title={book.title}
        author={authorName}
        subject={book.core_thesis}
        keywords="Amazon KDP, Trade Paperback, FolioCraft AI"
      >
        {/* Page 1: Full-color Cover Page (Matches In-App Cover Studio) */}
        {!interiorOnly && (
          <Page size={[432, 648]} style={styles.coverPage}>
            {coverImageSrc ? (
              <Image src={coverImageSrc} style={styles.coverImage} />
            ) : null}
            <View style={styles.coverOverlay} />
            <View style={styles.coverSpineShadow} />

            <View style={styles.coverContainer}>
              <View style={[styles.badgeContainer, { borderColor: accentColor }]}>
                <Text style={[styles.badgeText, { color: accentColor }]}>
                  AN AUTHORITY BLUEPRINT
                </Text>
              </View>

              <View style={styles.centerSection}>
                <Text style={[styles.coverTitle, { color: titleColor, fontFamily: coverTitleFont }]}>
                  {book.title}
                </Text>
                <View style={[styles.coverDivider, { backgroundColor: accentColor }]} />
                {book.subtitle && (
                  <Text style={[styles.coverSubtitle, { color: subtitleColor, fontFamily: coverSubtitleFont }]}>
                    {book.subtitle}
                  </Text>
                )}
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.authorPrefix}>AUTHORED BY</Text>
                <Text style={[styles.coverAuthorName, { color: titleColor }]}>
                  {authorName}
                </Text>
              </View>
            </View>
          </Page>
        )}

        {/* Copyright Page */}
        <Page size={[432, 648]} style={[styles.page, { justifyContent: 'flex-end', paddingBottom: 60 }]}>
          <Text style={styles.copyrightText}>
            Copyright © {new Date().getFullYear()} by {authorName}.
          </Text>
          <Text style={styles.copyrightText}>
            All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without prior written permission.
          </Text>
          <Text style={styles.copyrightText}>
            First Trade Paperback Edition: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.copyrightText}>
            Published by FolioCraft AI Press.
          </Text>
          <Text style={[styles.copyrightText, { marginTop: 12 }]}>
            ISBN-13: 979-8-00000-000-0 (Trade Paperback 6x9)
          </Text>
        </Page>

        {/* Page 3: Table of Contents */}
        <Page size={[432, 648]} style={styles.page}>
          <Text style={styles.tocTitle}>Table of Contents</Text>
          {chapters.map((ch, idx) => (
            <View key={ch.id} style={styles.tocRow}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>
                Chapter {ch.chapter_number}: {ch.title}
              </Text>
              <Text style={{ fontSize: 10, color: '#64748b' }}>
                {idx * 8 + 5}
              </Text>
            </View>
          ))}
          <Text style={styles.pageNumber}>v</Text>
        </Page>

        {/* Chapters */}
        {chapters.map((ch) => {
          // Parse markdown lines into simple paragraphs and headings
          const lines = (ch.content_markdown || '').split('\n').filter((l) => l.trim().length > 0);

          return (
            <Page key={ch.id} size={[432, 648]} style={styles.page}>
              {/* Running Header */}
              <Text style={styles.runningHeader}>
                {book.title} • Chapter {ch.chapter_number}
              </Text>

              <Text style={styles.chapterNumber}>Chapter {ch.chapter_number}</Text>
              <Text style={styles.chapterTitle}>{ch.title}</Text>

              {lines.slice(0, 15).map((line, lIdx) => {
                if (line.startsWith('## ')) {
                  return (
                    <Text key={lIdx} style={styles.heading2}>
                      {line.replace('## ', '')}
                    </Text>
                  );
                } else if (line.startsWith('# ')) {
                  return null;
                } else if (line.startsWith('---')) {
                  return null;
                }
                return (
                  <Text key={lIdx} style={styles.paragraph}>
                    {line.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </Text>
                );
              })}

              <Text style={styles.pageNumber}>
                {ch.chapter_number * 8 - 3}
              </Text>
            </Page>
          );
        })}
      </Document>
    );

    const pdfBuffer = await renderToBuffer(MyDocument);

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${book.share_slug || 'book'}-kdp-print.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF export generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
