import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chapterId, sectionText, caption, stylePrompt } = body;

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const chapter = await store.getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    // 1. Atomic Credit Deduction (2 Credits for In-Chapter Editorial Graphic)
    const deduction = await store.deductCredits(
      userId,
      2,
      'illustration_generation',
      { chapterId, caption }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || 'Insufficient credits (2 required)' },
        { status: 402 }
      );
    }

    const illustrationPrompt = `High-end editorial vector diagram, minimal architectural line-art sketch for a prestigious non-fiction book. Clean lines, monochrome with subtle amber/gold accent, white background, no chaotic text, clear visual hierarchy. Concept: ${sectionText || chapter.title}. ${stylePrompt || ''}`;

    let imageUrl = '';
    const apiKey = process.env.OPENAI_API_KEY;
    const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

    if (isRealKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.images.generate({
          model: 'gpt-image-1-mini',
          prompt: illustrationPrompt,
          n: 1,
          size: '1024x1024',
        });

        const b64 = response.data?.[0]?.b64_json;
        const ephemeralUrl = response.data?.[0]?.url;

        if (b64) {
          try {
            const adminSupabase = createAdminSupabaseClient();
            const buffer = Buffer.from(b64, 'base64');
            const filePath = `${userId}/${chapterId}-ill-${Date.now()}.png`;

            const { error: uploadErr } = await adminSupabase.storage
              .from('chapter-illustrations')
              .upload(filePath, buffer, {
                contentType: 'image/png',
                upsert: true,
              });

            if (!uploadErr) {
              const { data: { publicUrl } } = adminSupabase.storage
                .from('chapter-illustrations')
                .getPublicUrl(filePath);
              imageUrl = publicUrl;
            } else {
              imageUrl = `data:image/png;base64,${b64}`;
            }
          } catch {
            imageUrl = `data:image/png;base64,${b64}`;
          }
        } else if (ephemeralUrl) {
          imageUrl = ephemeralUrl;
        } else {
          imageUrl = getFallbackIllustration();
        }
      } catch (err: any) {
        console.warn('Illustration generation failed, using fallback:', err);
        imageUrl = getFallbackIllustration();
      }
    } else {
      imageUrl = getFallbackIllustration();
    }

    // 2. Append markdown image syntax to the chapter content
    const imageMarkdown = `\n\n![${caption || 'Editorial Illustration'}](${imageUrl})\n*Figure: ${caption || 'Conceptual framework illustration'}*\n\n`;
    const updatedContent = chapter.content_markdown + imageMarkdown;

    await store.updateChapter(chapterId, {
      content_markdown: updatedContent,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      caption: caption || 'Conceptual framework illustration',
      updatedContent,
      remainingCredits: deduction.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error generating illustration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getFallbackIllustration(): string {
  const illustrations = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
  ];
  return illustrations[Math.floor(Math.random() * illustrations.length)];
}
