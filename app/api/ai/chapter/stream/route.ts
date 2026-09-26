import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { generateTopicAwareFallbackManuscript } from '@/lib/ai/manuscript';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chapterId, bookId, customPrompt } = body;

    if (!chapterId || !bookId) {
      return NextResponse.json({ error: 'Chapter ID and Book ID are required' }, { status: 400 });
    }

    const book = await store.getBookById(bookId);
    const chapter = await store.getChapterById(chapterId);

    if (!book || !chapter) {
      return NextResponse.json({ error: 'Book or Chapter not found' }, { status: 404 });
    }

    // 1. Atomic Credit Deduction (5 Credits for full chapter generation)
    const deduction = await store.deductCredits(
      book.user_id,
      5,
      'chapter_generation',
      { chapterId, chapterNumber: chapter.chapter_number, title: chapter.title }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || 'Insufficient credits (5 required)' },
        { status: 402 }
      );
    }

    // 2. Compile Global Context & Memory Injection
    const previousChapters = (await store.getChapters(bookId))
      .filter((c) => c.chapter_number < chapter.chapter_number)
      .map((c) => `Chapter ${c.chapter_number}: "${c.title}" - Summary: ${c.summary || 'Drafted'}`)
      .join('\n');

    const sourceSnippets = book.source_materials
      .map((s, i) => `[Source Material #${i + 1} - ${s.title}]: ${s.snippet}`)
      .join('\n\n');

    const terminologyStr = Object.entries(book.global_context.terminology || {})
      .map(([term, def]) => `- **${term}**: ${def}`)
      .join('\n');

    const rollingAbstractsStr = (book.global_context.rolling_abstracts || [])
      .map((abs, i) => `Chapter ${i + 1} Abstract: ${abs}`)
      .join('\n');

    const isBiographyOrNarrative = /biograph|memoir|life|history|story|president|trump|politic|war|leader/i.test(
      `${book.title} ${book.core_thesis} ${book.target_audience}`
    );

    const systemPrompt = `You are a world-class author, biographer, and editorial director crafting an Amazon KDP-grade book.
The book is: "${book.title}${book.subtitle ? `: ${book.subtitle}` : ''}"
Tone & Voice: ${book.tone_voice}
Target Audience: ${book.target_audience}
Core Thesis / Narrative Arc: ${book.core_thesis}

GLOBAL MEMORY CONTEXT:
Key Themes & Lexicon:
${terminologyStr || 'None defined yet.'}

Rolling Abstracts of Preceding Chapters:
${rollingAbstractsStr || previousChapters || 'This is Chapter 1.'}

SOURCE MATERIALS & TRANSCRIPTS:
${sourceSnippets || 'No direct transcripts uploaded yet. Write authoritatively and richly.'}

STRICT EDITORIAL RULES:
1. Write in clear, compelling, professional markdown format starting with: # Chapter ${chapter.chapter_number}: ${chapter.title}
2. 100% TOPIC RELEVANCE: The entire chapter must strictly focus on this specific chapter topic and the book's core premise.
${isBiographyOrNarrative ? `3. NARRATIVE & HISTORICAL DEPTH: Write vivid narrative prose, detailed historical context, key figures, dramatic tensions, and reflective analysis.
4. DO NOT use corporate business consulting frameworks, billing jargon, or client deliverable rubrics.
5. Structure with 3-4 deep subsections (## Subheadings) detailing pivotal moments and analyses.` : `3. SUBSTANTIVE STRUCTURE: Structure with an engaging opening hook, 3-4 deep thematic subsections (## Subheadings), concrete examples, and clear takeaways.
4. Avoid generic filler, corporate clichés, or hollow platitudes.`}
5. Maintain strict continuity with previously established chapters.
6. Write thoroughly (1,200 - 2,000 words of rich, substantive prose).`;

    const userPrompt = `Write the complete, in-depth text for Chapter ${chapter.chapter_number}: "${chapter.title}".
Chapter Intent / Summary: ${chapter.summary || 'Comprehensive breakdown of this topic.'}
${customPrompt ? `Special author instruction: ${customPrompt}` : ''}`;

    const apiKey = process.env.OPENAI_API_KEY;
    const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

    if (isRealKey) {
      const openai = new OpenAI({ apiKey });
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const encoder = new TextEncoder();
      let accumulatedText = '';

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                accumulatedText += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }

            // Update chapter content and status in DB
            await store.updateChapter(chapterId, {
              content_markdown: accumulatedText,
              status: 'review',
            });

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, remainingCredits: deduction.remainingCredits })}\n\n`));
            controller.close();
          } catch (err: any) {
            controller.error(err);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Deterministic SSE simulation for fast, offline preview & instant testing
      const simulatedText = generateTopicAwareFallbackManuscript({
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
        chapterSummary: chapter.summary,
        bookTitle: book.title,
        subtitle: book.subtitle,
        targetAudience: book.target_audience,
        coreThesis: book.core_thesis,
        toneVoice: book.tone_voice,
        terminology: book.global_context?.terminology || {},
      });
      const encoder = new TextEncoder();
      const chunks = simulatedText.match(/.{1,45}/g) || [simulatedText];

      let accumulated = '';
      const readableStream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < chunks.length; i++) {
            accumulated += chunks[i];
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunks[i] })}\n\n`));
            await new Promise((r) => setTimeout(r, 25)); // Smooth streaming effect
          }

          await store.updateChapter(chapterId, {
            content_markdown: accumulated,
            status: 'review',
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, remainingCredits: deduction.remainingCredits })}\n\n`));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error: any) {
    console.error('Error streaming chapter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
