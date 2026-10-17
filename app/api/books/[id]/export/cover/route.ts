import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { generateCoverJpg } from '@/lib/cover/generate-cover-image';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const mode = searchParams.get('mode') === 'wrap' ? 'wrap' : 'front';
    const isAttachment = searchParams.get('download') !== 'false';

    const jpegBuffer = await generateCoverJpg({
      mode,
      title: book.title,
      subtitle: book.subtitle,
      authorName: book.cover_style_config?.author_name || 'OpusCraft Author',
      coreThesis: book.core_thesis,
      bgUrl: book.cover_bg_url,
      styleConfig: book.cover_style_config,
    });

    const slug = sanitizeFilename(book.share_slug || book.title || 'book');
    const filename = `${slug}-${mode === 'wrap' ? 'kdp-full-wrap' : 'front-cover'}.jpg`;

    return new Response(jpegBuffer as any, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `${isAttachment ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'public, max-age=60, s-maxage=120',
      },
    });
  } catch (error: any) {
    console.error('Error generating cover JPG export:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate cover JPG' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    const body = await req.json().catch(() => ({}));

    const title = body.title || book?.title || 'The Sovereign Operator';
    const subtitle = body.subtitle !== undefined ? body.subtitle : book?.subtitle;
    const authorName = body.authorName || body.author_name || book?.cover_style_config?.author_name || 'OpusCraft Author';
    const coreThesis = body.coreThesis || book?.core_thesis || '';
    const bgUrl = body.bgUrl !== undefined ? body.bgUrl : book?.cover_bg_url;
    const mode = body.mode === 'wrap' ? 'wrap' : 'front';

    const mergedStyleConfig = {
      ...(book?.cover_style_config || {}),
      ...(body.styleConfig || {}),
      ...(body.cover_style_config || {}),
      ...(body.title_color ? { title_color: body.title_color } : {}),
      ...(body.subtitle_color ? { subtitle_color: body.subtitle_color } : {}),
      ...(body.accent_color ? { accent_color: body.accent_color } : {}),
      ...(body.font_family ? { font_family: body.font_family } : {}),
      ...(body.title_position ? { title_position: body.title_position } : {}),
      ...(body.title_align ? { title_align: body.title_align } : {}),
      ...(body.title_offset_y !== undefined ? { title_offset_y: body.title_offset_y } : {}),
      ...(body.show_badge !== undefined ? { show_badge: body.show_badge } : {}),
      ...(body.overlay_opacity !== undefined ? { overlay_opacity: body.overlay_opacity } : {}),
    };

    const jpegBuffer = await generateCoverJpg({
      mode,
      title,
      subtitle,
      authorName,
      coreThesis,
      bgUrl,
      styleConfig: mergedStyleConfig,
    });

    const slug = sanitizeFilename(title || 'book');
    const filename = `${slug}-${mode === 'wrap' ? 'kdp-full-wrap' : 'front-cover'}.jpg`;

    return new Response(jpegBuffer as any, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error in POST cover JPG export:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate cover JPG' },
      { status: 500 }
    );
  }
}
