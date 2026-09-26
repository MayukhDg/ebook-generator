import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      chapterId, 
      instructionType, 
      selectedText, 
      customPrompt, 
      currentContent 
    } = body;

    if (!chapterId || !currentContent) {
      return NextResponse.json({ error: 'Chapter ID and currentContent are required' }, { status: 400 });
    }

    const chapter = await store.getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    // 1. Atomic Credit Deduction (2 Credits for iterative refinement)
    const deduction = await store.deductCredits(
      userId,
      2,
      'chapter_revision',
      { chapterId, instructionType, prompt: customPrompt || instructionType }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || 'Insufficient credits (2 required)' },
        { status: 402 }
      );
    }

    // 2. Map refinement instruction
    let instruction = '';
    switch (instructionType) {
      case 'case_study':
        instruction = 'Inject a vivid, concrete real-world case study with specific client metrics, conflict, breakthrough realization, and bottom-line dollar impact.';
        break;
      case 'conversational_tone':
        instruction = 'Cut corporate fluff, passive voice, and academic jargon. Make the prose direct, authoritative, engaging, and conversational like an experienced mentor speaking over coffee.';
        break;
      case 'checklist':
        instruction = 'Synthesize the key frameworks into an actionable, step-by-step diagnostic checklist with markdown checkboxes [ ] and implementation tips.';
        break;
      case 'custom':
      default:
        instruction = customPrompt || 'Improve clarity, authority, and tactical depth.';
        break;
    }

    let refinedContent = '';
    const apiKey = process.env.OPENAI_API_KEY;
    const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

    if (isRealKey) {
      const openai = new OpenAI({ apiKey });
      const prompt = selectedText
        ? `Here is the full chapter:\n\n${currentContent}\n\nApply this targeted editorial revision strictly to this highlighted excerpt:\n"${selectedText}"\n\nInstruction: ${instruction}\n\nReturn the complete updated chapter in clean markdown.`
        : `Here is the full chapter:\n\n${currentContent}\n\nApply this editorial refinement to the chapter:\nInstruction: ${instruction}\n\nReturn the complete updated chapter in clean markdown.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an elite publishing editor. Refine the provided chapter text according to instructions while preserving overall structure, tone, and markdown formatting. Ensure the revision is 100% faithful to the chapter topic and avoids any unrelated business consulting jargon.',
          },
          { role: 'user', content: prompt },
        ],
      });

      refinedContent = response.choices[0]?.message.content || currentContent;
    } else {
      // Deterministic topic-aware refinement simulation
      if (instructionType === 'case_study') {
        refinedContent = `${currentContent}\n\n---\n\n### In-Depth Case Study: Key Turning Point in ${chapter.title}\n\nTo observe this dynamic in sharp focus, consider the high-stakes turning point that crystallized this phase. Facing immense pressure and mounting skepticism from outside observers, the pivotal breakthrough emerged not from caution, but from doubling down on core objectives.\n\nKey takeaways from this inflection point:\n- Decisive action altered the momentum before critics could consolidate opposition.\n- Direct communication shifted public attention back to the central message.\n- The outcome established a precedent that redefined the trajectory of future developments.`;
      } else if (instructionType === 'checklist') {
        refinedContent = `${currentContent}\n\n---\n\n### Strategic Takeaways & Key Milestones\n\n- [ ] **Establish Clarity of Objective**: Define the non-negotiable goals before entering high-stakes arenas.\n- [ ] **Analyze Counter-Moves**: Anticipate opposition tactics and prepare preemptive narratives.\n- [ ] **Control Communication Channels**: Deliver messages directly to core audiences without dilution.\n- [ ] **Turn Crises into Momentum**: Leverage external scrutiny as an opportunity to reinforce authority.`;
      } else if (instructionType === 'conversational_tone') {
        refinedContent = currentContent
          .replace(/In order to facilitate/gi, 'To make')
          .replace(/utilize/gi, 'use')
          .replace(/it is imperative that/gi, 'you must')
          .replace(/synergistic paradigms/gi, 'clear momentum');
      } else {
        refinedContent = `${currentContent}\n\n> **Editorial Note (${customPrompt || 'Refinement'}):** Refined for maximum narrative clarity and engagement.`;
      }
    }

    // 3. Update Chapter Version & Content in Store
    const updatedChapter = await store.updateChapter(chapterId, {
      content_markdown: refinedContent,
      version: (chapter.version || 1) + 1,
    });

    return NextResponse.json({
      success: true,
      refinedContent,
      newVersion: updatedChapter?.version || 2,
      remainingCredits: deduction.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error refining chapter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
