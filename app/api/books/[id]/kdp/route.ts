import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { generateKdpMetadata } from '@/lib/ai/kdp';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // If metadata was never generated, provide high-converting fallback
    let description = book.kdp_description;
    let keywords = book.kdp_keywords;
    let categories = book.kdp_categories;

    if (!description || !keywords || keywords.length === 0) {
      const chapters = await store.getChapters(book.id);
      const generated = await generateKdpMetadata({
        title: book.title,
        subtitle: book.subtitle,
        targetAudience: book.target_audience,
        coreThesis: book.core_thesis,
        toneVoice: book.tone_voice,
        chapters,
      });

      description = description || generated.kdp_description;
      keywords = (keywords && keywords.length > 0) ? keywords : generated.kdp_keywords;
      categories = (categories && categories.length > 0) ? categories : generated.kdp_categories;

      // Save the generated kit to the book
      await store.updateBook(book.id, {
        kdp_description: description,
        kdp_keywords: keywords,
        kdp_categories: categories,
      });
    }

    return NextResponse.json({
      kdp_description: description,
      kdp_keywords: keywords,
      kdp_categories: categories,
    });
  } catch (error: any) {
    console.error('Error fetching KDP metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'regenerate' } = body;

    if (action === 'regenerate') {
      const chapters = await store.getChapters(book.id);
      const generated = await generateKdpMetadata({
        title: book.title,
        subtitle: book.subtitle,
        targetAudience: book.target_audience,
        coreThesis: book.core_thesis,
        toneVoice: book.tone_voice,
        chapters,
      });

      const updatedBook = await store.updateBook(book.id, {
        kdp_description: generated.kdp_description,
        kdp_keywords: generated.kdp_keywords,
        kdp_categories: generated.kdp_categories,
      });

      return NextResponse.json({
        success: true,
        book: updatedBook,
        kdp_description: generated.kdp_description,
        kdp_keywords: generated.kdp_keywords,
        kdp_categories: generated.kdp_categories,
      });
    }

    // Manual update
    const { kdp_description, kdp_keywords, kdp_categories } = body;
    const cleanKeywords = Array.isArray(kdp_keywords)
      ? kdp_keywords.map((k: string) => String(k).trim().slice(0, 50)).filter(Boolean).slice(0, 7)
      : undefined;

    const updatedBook = await store.updateBook(book.id, {
      ...(kdp_description !== undefined ? { kdp_description } : {}),
      ...(cleanKeywords !== undefined ? { kdp_keywords: cleanKeywords } : {}),
      ...(kdp_categories !== undefined ? { kdp_categories } : {}),
    });

    return NextResponse.json({
      success: true,
      book: updatedBook,
      kdp_description: updatedBook?.kdp_description,
      kdp_keywords: updatedBook?.kdp_keywords,
      kdp_categories: updatedBook?.kdp_categories,
    });
  } catch (error: any) {
    console.error('Error updating KDP metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
