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

    // 4. Title Page XHTML
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
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:description>${escapeXml(book.core_thesis)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    ${chapterManifestItems.join('\n    ')}
  </manifest>
  <spine>
    <itemref idref="titlepage"/>
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
