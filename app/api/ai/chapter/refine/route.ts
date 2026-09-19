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
            content: 'You are an elite publishing editor. Refine the provided chapter text according to instructions while preserving overall structure, tone, and markdown formatting.',
          },
          { role: 'user', content: prompt },
        ],
      });

      refinedContent = response.choices[0]?.message.content || currentContent;
    } else {
      // Deterministic authority refinement simulation
      if (instructionType === 'case_study') {
        refinedContent = `${currentContent}\n\n---\n\n### Practical Case Study: The 48-Hour Overhaul\n\nTo illustrate this principle in practice, consider an advisory partner who implemented this exact framework in Q3. Prior to the intervention, their team spent 35 hours per client onboarding cycle with an average sales cycle of 74 days.\n\nWithin 48 hours of deploying the standardized Diagnostic Protocol:\n- Discovery hours plummeted by 78%.\n- Prospect conversion velocity doubled.\n- Average deal size increased from $18,000 to $48,000 fixed-fee without a single scope negotiation.\n\n*Key Takeaway: The client was not purchasing time; they were purchasing the certainty of avoiding a multi-month implementation quagmire.*`;
      } else if (instructionType === 'checklist') {
        refinedContent = `${currentContent}\n\n---\n\n### Sovereign Operator Action Checklist\n\n- [ ] **Inventory Current Bottlenecks**: Identify every repeated manual task taking over 2 hours/week.\n- [ ] **Establish Value Benchmarks**: Calculate the downside catastrophe cost your framework avoids.\n- [ ] **Decouple Billing**: Transition your primary offer from hourly retainers to guaranteed milestone outcomes.\n- [ ] **Deploy Autonomous Telemetry**: Implement self-serve diagnostic reporting for client onboarding.`;
      } else if (instructionType === 'conversational_tone') {
        refinedContent = currentContent
          .replace(/In order to facilitate/gi, 'To make')
          .replace(/utilize/gi, 'use')
          .replace(/it is imperative that/gi, 'you must')
          .replace(/synergistic paradigms/gi, 'practical leverage');
        if (!refinedContent.includes('**The Bottom Line:**')) {
          refinedContent += `\n\n**The Bottom Line:** Stop over-complicating the delivery. Your clients want direct, deterministic outcomes. Give them the clarity they cannot find anywhere else.`;
        }
      } else {
        refinedContent = `${currentContent}\n\n> **Editorial Note (${customPrompt || 'Refinement'}):** Refined for maximum practitioner clarity and immediate execution.`;
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
