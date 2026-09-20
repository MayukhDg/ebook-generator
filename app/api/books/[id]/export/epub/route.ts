import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { store } from '@/lib/data/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const chapters = await store.getChapters(book.id);
    const author = book.cover_style_config?.author_name || 'FolioCraft Author';
    const bookId = `urn:uuid:${book.id}`;
    const zip = new JSZip();

    // 1. mimetype file (Must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.folder('META-INF')?.file(
      'container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const oebps = zip.folder('OEBPS');

    // 3. Stylesheet
    oebps?.file(
      'styles.css',
      `body {
  font-family: Georgia, 'Times New Roman', serif;
  margin: 5%;
  line-height: 1.6;
  color: #1a1a1a;
}
h1 {
  font-size: 1.8em;
  text-align: center;
  margin-bottom: 0.5em;
  color: #0f172a;
}
h2 {
  font-size: 1.3em;
  margin-top: 1.2em;
  color: #1e293b;
}
p {
  margin-bottom: 0.8em;
  text-indent: 1.2em;
  text-align: justify;
}
.author {
  text-align: center;
  font-style: italic;
  margin-top: 2em;
  color: #475569;
}
.subtitle {
  text-align: center;
  font-size: 1.1em;
  color: #64748b;
  margin-bottom: 3em;
}`
    );

    // Fetch cover image if available
    let coverBuffer: Buffer | null = null;
    let coverMediaType = 'image/jpeg';
    const coverUrl = book.cover_bg_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

    if (coverUrl) {
      try {
        if (coverUrl.startsWith('data:')) {
          const match = coverUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            coverMediaType = match[1];
            coverBuffer = Buffer.from(match[2], 'base64');
          }
        } else {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const imgRes = await fetch(coverUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          });
          clearTimeout(timeoutId);
          if (imgRes.ok) {
            const arr = await imgRes.arrayBuffer();
            coverBuffer = Buffer.from(arr);
            coverMediaType = imgRes.headers.get('content-type') || 'image/jpeg';
          }
        }
      } catch (err) {
        console.warn('Failed to fetch cover image for EPUB:', err);
      }
    }

    if (coverBuffer) {
      const coverExt = coverMediaType.includes('png') ? 'png' : 'jpg';
      const coverFilename = `cover.${coverExt}`;
      oebps?.file(coverFilename, coverBuffer);

      oebps?.file(
        'cover.xhtml',
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <style type="text/css">
    body { margin: 0; padding: 0; text-align: center; background-color: #0a0f1d; }
    img { max-width: 100%; height: auto; margin: 0 auto; display: block; }
  </style>
</head>
<body>
  <div style="text-align: center; page-break-after: always;">
    <img src="${coverFilename}" alt="Cover" />
  </div>
</body>
</html>`
      );
    }

    // 4. Title Page XHTML (Only when no cover image is provided)
    if (!coverBuffer) {
      oebps?.file(
        'titlepage.xhtml',
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(book.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div style="margin-top: 20%; text-align: center;">
    <h1>${escapeXml(book.title)}</h1>
    ${book.subtitle ? `<p class="subtitle">${escapeXml(book.subtitle)}</p>` : ''}
    <p class="author">By ${escapeXml(author)}</p>
  </div>
</body>
</html>`
      );
    }

    // 5. Chapters XHTML
    const chapterManifestItems: string[] = [];
    const chapterSpineItems: string[] = [];

    chapters.forEach((ch, idx) => {
      const filename = `chapter_${ch.chapter_number}.xhtml`;
      const paragraphs = (ch.content_markdown || '')
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => {
          if (l.startsWith('## ')) {
            return `<h2>${escapeXml(l.replace('## ', ''))}</h2>`;
          } else if (l.startsWith('# ')) {
            return '';
          }
          return `<p>${escapeXml(l.replace(/\*\*/g, '').replace(/\*/g, ''))}</p>`;
        })
        .join('\n    ');

      oebps?.file(
        filename,
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter ${ch.chapter_number}: ${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Chapter ${ch.chapter_number}</h1>
  <h2 style="text-align:center; margin-bottom: 1.5em;">${escapeXml(ch.title)}</h2>
  <div class="chapter-content">
    ${paragraphs}
  </div>
</body>
</html>`
      );

      chapterManifestItems.push(
        `<item id="ch${ch.chapter_number}" href="${filename}" media-type="application/xhtml+xml"/>`
      );
      chapterSpineItems.push(`<itemref idref="ch${ch.chapter_number}"/>`);
    });

    // 6. content.opf
    const coverExt = coverMediaType.includes('png') ? 'png' : 'jpg';
    const coverFilename = `cover.${coverExt}`;

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:description>${escapeXml(book.core_thesis)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
    ${coverBuffer ? `<meta name="cover" content="cover-image"/>` : ''}
  </metadata>
  <manifest>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${coverBuffer ? `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>` : ''}
    ${coverBuffer ? `<item id="cover-image" href="${coverFilename}" media-type="${coverMediaType}" properties="cover-image"/>` : ''}
    ${!coverBuffer ? `<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>` : ''}
    ${chapterManifestItems.join('\n    ')}
  </manifest>
  <spine>
    ${coverBuffer ? `<itemref idref="cover"/>` : ''}
    ${!coverBuffer ? `<itemref idref="titlepage"/>` : ''}
    ${chapterSpineItems.join('\n    ')}
  </spine>
</package>`;

    oebps?.file('content.opf', contentOpf);

    // Generate EPUB binary
    const epubBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    return new Response(epubBuffer as any, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${book.share_slug || 'book'}.epub"`,
      },
    });
  } catch (error: any) {
    console.error('EPUB export generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
