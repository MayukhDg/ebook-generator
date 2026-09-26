import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { generateChapterManuscript } from '@/lib/ai/manuscript';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chapters = await store.getChapters(params.id);
    return NextResponse.json({ chapters });
  } catch (error: any) {
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

    const body = await req.json();
    const { title, summary, autoGenerateContent = true } = body;

    const existingChapters = await store.getChapters(book.id);
    const nextChapterNumber = existingChapters.length + 1;

    const chapterTitle = title?.trim() || `Chapter ${nextChapterNumber}: Continuing the Journey of ${book.title}`;
    const chapterSummary = summary?.trim() || `Deepening the insights, pivotal events, and progression extending from Chapter ${existingChapters.length}.`;

    let contentMarkdown = '';
    let wordCount = 0;
    let status: 'pending' | 'completed' = 'pending';

    if (autoGenerateContent) {
      // Deduct 1 credit for auto-generating the new chapter content
      const deduction = await store.deductCredits(
        book.user_id,
        1,
        'chapter_generation',
        { 
          bookId: book.id, 
          chapterNumber: nextChapterNumber, 
          title: chapterTitle 
        }
      );

      if (!deduction.success) {
        return NextResponse.json(
          { error: deduction.error || 'Insufficient credits (1 credit required to generate chapter content)' },
          { status: 402 }
        );
      }

      contentMarkdown = await generateChapterManuscript({
        chapterNumber: nextChapterNumber,
        chapterTitle,
        chapterSummary,
        bookTitle: book.title,
        subtitle: book.subtitle,
        targetAudience: book.target_audience,
        coreThesis: book.core_thesis,
        toneVoice: book.tone_voice,
        terminology: book.global_context?.terminology || {},
      });

      wordCount = contentMarkdown.trim().split(/\s+/).length;
      status = 'completed';
    }

    const newChapter = await store.createChapter({
      book_id: book.id,
      chapter_number: nextChapterNumber,
      title: chapterTitle,
      summary: chapterSummary,
      content_markdown: contentMarkdown,
      word_count: wordCount,
      status,
    });

    return NextResponse.json({ 
      success: true, 
      chapter: newChapter,
      totalChapters: existingChapters.length + 1
    });
  } catch (error: any) {
    console.error('Error adding chapter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
