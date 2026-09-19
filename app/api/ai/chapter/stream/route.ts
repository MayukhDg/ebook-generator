import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
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

    const systemPrompt = `You are a world-class non-fiction author and editorial director co-writing an Amazon KDP-grade book.
The book is: "${book.title}: ${book.subtitle || ''}"
Tone & Voice: ${book.tone_voice}
Target Audience: ${book.target_audience}
Core Thesis: ${book.core_thesis}

GLOBAL MEMORY CONTEXT:
Terminology Lexicon:
${terminologyStr || 'None defined yet.'}

Rolling Abstracts of Preceding Chapters:
${rollingAbstractsStr || previousChapters || 'This is Chapter 1.'}

SOURCE MATERIALS & VOICE TRANSCRIPTS (Ground your chapter in these authentic ideas):
${sourceSnippets || 'No direct transcripts uploaded yet. Write authoritatively.'}

STRICT EDITORIAL RULES:
1. Write in clear, compelling, professional markdown format.
2. Structure with an engaging hook (# Chapter ${chapter.chapter_number}: ${chapter.title}), 3-4 deep tactical subsections (## Subheadings), real-world analogies, concrete operational examples, and a concluding summary checklist.
3. DO NOT write generic AI fluff, repetitive corporate jargon, or shallow platitudes.
4. Maintain strict continuity with previously established chapters.
5. Write thoroughly (1,500 - 2,200 words of rich substance).`;

    const userPrompt = `Write the complete text for Chapter ${chapter.chapter_number}: "${chapter.title}".
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
      const simulatedText = getSimulatedChapterContent(chapter.chapter_number, chapter.title, book.title, book.tone_voice);
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

function getSimulatedChapterContent(num: number, title: string, bookTitle: string, tone: string): string {
  return `# Chapter ${num}: ${title}

In high-stakes professional environments, true authority is never claimed through volume—it is demonstrated through precision.

When we examine why most conventional methodologies fail, the root flaw is almost always structural: practitioners attempt to solve systemic architecture problems using brute-force manual labor.

---

## 1. The Anatomy of Systemic Leverage

Every operational workflow contains friction points that consume an inordinate percentage of cognitive bandwidth. In the context of *${bookTitle}*, these friction points create an invisible barrier between intention and execution.

Consider the fundamental distinction:
- **Linear Execution:** Output scales strictly in proportion to inputs (time, personnel, meetings).
- **Asymmetric Systems:** A single codified framework compounds across hundreds of client cohorts without human latency.

When you transition from linear delivery to sovereign asset architecture, your perspective shifts entirely. You are no longer managing calendar blocks; you are optimizing an engine.

---

## 2. Field War Story: The Diagnostic Shift

Let us examine an actual engagement with a mid-market advisory firm generating $3.2M in annual revenue. Despite stellar client reviews, the three founding partners were working 75 hours per week and facing severe talent retention crises.

During our forensic audit, we observed that:
1. Discovery calls were unstructured, requiring 14 hours of partner prep time per prospective client.
2. Strategic recommendations were rewritten from scratch for every single client, despite 80% overlap in core root causes.
3. Pricing was quoted as a blended hourly rate of $450/hr, actively punishing the team whenever they developed automated scripts.

By packaging their proprietary discovery methodology into a structured 3-phase Diagnostic Engine, the firm reduced partner involvement in discovery from 14 hours to 45 minutes of review. 

More importantly, they ceased quoting hours and began selling the **Fixed $45,000 Forensic Roadmap**. Closing velocity increased by 40%, and net profit margins surged from 28% to 62%.

---

## 3. Tactical Implementation Checklist

To operationalize the principles of this chapter:

- [ ] **Audit Your Time Inventory:** Categorize every client-facing action into Diagnostic, Prescriptive, or Execution.
- [ ] **Codify One Tactical Asset:** Select the single diagnostic question or rubric you find yourself repeating on every client Zoom call, and document it as a permanent checklist.
- [ ] **Establish Value Anchors:** Discontinue time-and-materials quotes for new cohorts; anchor pricing strictly to downside risk mitigation.
- [ ] **Review Telemetry Weekly:** Track your ratio of synchronous client hours to recurring IP asset revenue.

In the next chapter, we will build upon this foundation to construct the autonomous delivery orchestration layer.`;
}
