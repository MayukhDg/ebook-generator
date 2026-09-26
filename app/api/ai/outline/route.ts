export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateChapterManuscript } from '@/lib/ai/manuscript';
import OpenAI from 'openai';

async function batchProcess<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      bookId, 
      title, 
      subtitle, 
      targetAudience, 
      coreThesis, 
      toneVoice, 
      sourceMaterials,
      chapterCount: rawChapterCount
    } = body;

    if (!title || !coreThesis || !targetAudience) {
      return NextResponse.json(
        { error: 'Title, core thesis, and target audience are required' },
        { status: 400 }
      );
    }

    // Default to 10 chapters if not specified, bounded between 1 and 50
    const targetChapterCount = Math.max(1, Math.min(50, parseInt(rawChapterCount || '10', 10) || 10));

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    // 1. Credit Deduction: 3 credits for Blueprint + 1 credit per chapter generated
    const totalCost = 3 + targetChapterCount * 1;
    const deduction = await store.deductCredits(
      userId,
      totalCost,
      'blueprint_generation',
      { 
        bookId, 
        title, 
        targetChapterCount, 
        baseBlueprintCost: 3, 
        perChapterCost: 1, 
        totalCost 
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || `Insufficient credits (${totalCost} required for blueprint + ${targetChapterCount} chapters)` },
        { status: 402 }
      );
    }

    let generatedOutline: {
      chapters: Array<{ chapter_number: number; title: string; summary: string }>;
      terminology: Record<string, string>;
      rolling_abstracts: string[];
    };

    const apiKey = process.env.OPENAI_API_KEY;
    const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

    if (isRealKey) {
      try {
        const openai = new OpenAI({ apiKey, timeout: 25000 });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an elite ghostwriter, biographer, and publishing strategist across all genres (biography, memoir, history, politics, business, technology, self-help, philosophy, and creative non-fiction).
Your goal is to build an authoritative, engaging, and deeply coherent chapter-by-chapter book blueprint designed for publication success.
Analyze the user's title, subtitle, target audience, and core thesis carefully.
Structure the book into EXACTLY ${targetChapterCount} high-impact, sequential chapters tailored precisely to the subject matter.

CRITICAL RULES:
- The chapters must be 100% relevant and coherent to the requested topic.
- If the book is a biography, political history, or personal journey (e.g., about Donald Trump), structure the chapters chronologically and thematically around real events, life stages, conflicts, and milestones as requested in the core thesis.
- NEVER force corporate consulting jargon, billing frameworks, or client deliverable models unless the book is explicitly about consulting.
- The 'terminology' field should contain 3-5 pivotal concepts, themes, key terms, or recurring motifs specific to this book topic and their meaningful definitions in this context.

Respond ONLY with a JSON object matching this schema:
{
  "chapters": [
    {"chapter_number": 1, "title": "...", "summary": "..."}
  ],
  "terminology": {
    "Key Concept / Theme 1": "Definition and significance in the context of this book...",
    "Key Concept / Theme 2": "Definition..."
  },
  "rolling_abstracts": [
    "Abstract of Chapter 1 arc...",
    "Abstract of Chapter 2 arc..."
  ]
}`,
            },
            {
              role: 'user',
              content: `Title: ${title}
Subtitle: ${subtitle || 'None'}
Target Audience: ${targetAudience}
Core Thesis / Narrative Arc: ${coreThesis}
Tone & Voice: ${toneVoice || 'Authoritative & Practical'}
Exact Number of Chapters Required: ${targetChapterCount}
Source Materials Count: ${Array.isArray(sourceMaterials) ? sourceMaterials.length : 0}`,
            },
          ],
        });

        const content = response.choices[0].message.content;
        generatedOutline = JSON.parse(content || '{}');

        // Verify chapters length
        if (!generatedOutline.chapters || generatedOutline.chapters.length < 1) {
          generatedOutline = generateDeterministicOutline(title, targetAudience, coreThesis, targetChapterCount);
        }
      } catch (aiErr) {
        console.warn('OpenAI API call failed, falling back to deterministic authority compiler:', aiErr);
        generatedOutline = generateDeterministicOutline(title, targetAudience, coreThesis, targetChapterCount);
      }
    } else {
      generatedOutline = generateDeterministicOutline(title, targetAudience, coreThesis, targetChapterCount);
    }

    // 2. Persist Global Context and Chapters in Store/DB
    const globalContext = {
      target_persona: targetAudience,
      core_thesis: coreThesis,
      terminology: generatedOutline.terminology || {},
      rolling_abstracts: generatedOutline.rolling_abstracts || [],
    };

    if (bookId) {
      await store.updateBook(bookId, {
        title,
        subtitle,
        target_audience: targetAudience,
        core_thesis: coreThesis,
        tone_voice: toneVoice || 'Authoritative & Practical',
        global_context: globalContext,
      });

      // Clear pending chapters and insert newly generated outline WITH full initial manuscripts!
      // Process manuscripts in parallel chunks of 5 for optimal speed and reliability
      const chapterDataList = await batchProcess(
        generatedOutline.chapters,
        5,
        async (ch) => {
          const contentMarkdown = await generateChapterManuscript({
            chapterNumber: ch.chapter_number,
            chapterTitle: ch.title,
            chapterSummary: ch.summary,
            bookTitle: title,
            subtitle: subtitle || null,
            targetAudience,
            coreThesis,
            toneVoice,
            terminology: generatedOutline.terminology,
          });

          const words = contentMarkdown.trim().split(/\s+/).length;
          return {
            ch,
            contentMarkdown,
            words,
          };
        }
      );

      const createdChapters = [];
      for (const item of chapterDataList) {
        const chapter = await store.createChapter({
          book_id: bookId,
          chapter_number: item.ch.chapter_number,
          title: item.ch.title,
          summary: item.ch.summary,
          status: 'completed',
          word_count: item.words,
          content_markdown: item.contentMarkdown,
        });
        createdChapters.push(chapter);
      }

      return NextResponse.json({
        success: true,
        remainingCredits: deduction.remainingCredits,
        totalCost,
        targetChapterCount,
        globalContext,
        chapters: createdChapters,
      });
    }

    return NextResponse.json({
      success: true,
      remainingCredits: deduction.remainingCredits,
      totalCost,
      targetChapterCount,
      globalContext,
      chapters: generatedOutline.chapters,
    });
  } catch (error: any) {
    console.error('Error generating blueprint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateDeterministicOutline(
  title: string, 
  audience: string, 
  thesis: string, 
  count: number = 10
): {
  chapters: Array<{ chapter_number: number; title: string; summary: string }>;
  terminology: Record<string, string>;
  rolling_abstracts: string[];
} {
  const combined = `${title} ${thesis} ${audience}`.toLowerCase();
  const isBiography = /trump|president|biograph|memoir|life|polit|history|leader|career/i.test(combined);

  if (isBiography) {
    const bioThemes = [
      {
        title: `Origins and Foundations: The Early Years`,
        summary: `Traces the early influences, familial heritage, and formative experiences that established the core drive for ${title}.`,
      },
      {
        title: `Forging the Identity: Stepping into the Arena`,
        summary: `Explores early ventures, aggressive maneuvers, and the development of a distinct public persona.`,
      },
      {
        title: `Ascending the Cultural Stage: Media, Celebrity, and Reach`,
        summary: `How television, brand licensing, and relentless public relations transformed a private figure into a household name.`,
      },
      {
        title: `The Political Incursion: Defying the Establishment`,
        summary: `The unexpected entry into national politics, examining campaign strategy, grassroots resonance, and institutional shock.`,
      },
      {
        title: `Governing in the Crosshairs: The Presidential Term`,
        summary: `A forensic review of key executive actions, policy battles, foreign negotiations, and the polarization of power.`,
      },
      {
        title: `The Storm of 2020: Contested Elections and Defeat`,
        summary: `The dramatic climax of the election, the aftermath of defeat, and the initial fallout for supporters and critics alike.`,
      },
      {
        title: `The Crucible of Persecution: Legal Battles and Indictments`,
        summary: `Examining the unprecedented legal onslaught, criminal trials, and the political narrative of institutional warfare.`,
      },
      {
        title: `The Resilience Doctrine: Refusing to Concede`,
        summary: `How adversity was reframed as a rallying cry, solidifying loyalty among followers and redefining the political landscape.`,
      },
      {
        title: `The Counter-Attack: Orchestrating the Return`,
        summary: `The strategic campaign for resurgence, coalition rebuilding, and navigating unprecedented headwinds back to the summit.`,
      },
      {
        title: `The Sovereign Legacy: Historical Reckoning and the Future`,
        summary: `Synthesizing the enduring impact on governance, global diplomacy, media dynamics, and future generations.`,
      },
    ];

    const chapters = [];
    for (let i = 1; i <= count; i++) {
      const theme = bioThemes[(i - 1) % bioThemes.length];
      chapters.push({
        chapter_number: i,
        title: i <= bioThemes.length ? theme.title : `Chapter ${i}: The Ongoing Influence and Historical Reckoning`,
        summary: theme.summary,
      });
    }

    return {
      chapters,
      terminology: {
        'Narrative Primacy': 'The ability to dominate public attention and shape the news cycle regardless of external resistance.',
        'Institutional Friction': 'The fierce clash between disruptive political leadership and established governing norms.',
        'Resilience Dynamic': 'Reframing legal and political attacks into mobilizing fuel for the broader movement.',
      },
      rolling_abstracts: [
        'Chapter 1 examines early upbringing and foundational character traits.',
        'Chapter 2 traces the rise through high-stakes arenas and public notoriety.',
        'Chapter 3 explores the dramatic ascent to national and global leadership.',
      ],
    };
  }

  // General non-fiction fallback
  const generalThemes = [
    {
      title: `The Foundational Landscape: Understanding the Realities of ${title}`,
      summary: `Examines the background and core challenges affecting ${audience} while establishing the key premise of ${thesis}.`,
    },
    {
      title: `Core Principles: Deconstructing What Really Works`,
      summary: `Breaks down the fundamental insights required to navigate this domain with clarity and authority.`,
    },
    {
      title: `Overcoming Systemic Friction: Identifying Critical Roadblocks`,
      summary: `A thorough analysis of common failure modes, misconceptions, and strategic blind spots.`,
    },
    {
      title: `Tactical Execution: Putting the Framework into Motion`,
      summary: `Actionable steps, strategies, and real-world mechanisms to drive tangible results.`,
    },
    {
      title: `Advanced Dynamics: Navigating High-Stakes Complexity`,
      summary: `Diving into sophisticated nuances, stress-testing approaches, and managing volatile environments.`,
    },
    {
      title: `Case Studies in Mastery: What Sets Leaders Apart`,
      summary: `Examining real-world examples and decisive choices that yielded disproportionate success.`,
    },
    {
      title: `The Compounding Advantage: Building Enduring Impact`,
      summary: `How to transition from short-term momentum to long-term sustainability and lasting influence.`,
    },
    {
      title: `Future Horizons: Sustaining Leadership in Changing Times`,
      summary: `Synthesizing key lessons and future-proofing the core doctrine for ongoing success.`,
    },
  ];

  const chapters = [];
  for (let i = 1; i <= count; i++) {
    const theme = generalThemes[(i - 1) % generalThemes.length];
    chapters.push({
      chapter_number: i,
      title: i <= generalThemes.length ? theme.title : `Chapter ${i}: Advanced Principles and Continued Execution`,
      summary: theme.summary,
    });
  }

  return {
    chapters,
    terminology: {
      'Core Doctrine': 'The foundational methodology that guides all strategic decisions.',
      'Execution Leverage': 'Aligning deliberate focus with high-impact outcomes.',
      'Sustained Mastery': 'Continuous refinement that withstands shifting conditions.',
    },
    rolling_abstracts: [
      'Chapter 1 establishes the fundamental context and core necessity.',
      'Chapter 2 details the primary operating principles.',
      'Chapter 3 diagnoses key obstacles and how to overcome them.',
    ],
  };
}
