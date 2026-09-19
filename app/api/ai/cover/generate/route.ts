import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, themePrompt, stylePreset } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const book = await store.getBookById(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 1. Atomic Credit Deduction (4 Credits for DALL-E 3 Cover Background Generation)
    const deduction = await store.deductCredits(
      book.user_id,
      4,
      'cover_generation',
      { bookId, themePrompt, stylePreset }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || 'Insufficient credits (4 required)' },
        { status: 402 }
      );
    }

    // 2. Specialized Prompt Architecture: Zero Hallucinated Typography
    const baseNegativeSpacePrompt = `Professional book cover background texture and art, minimalist editorial composition, STRICTLY NO TEXT, NO TYPOGRAPHY, NO LETTERS, NO NUMBERS, NO TITLE, NO WORDS. Generous negative space at the upper third and lower third specifically engineered for vector typographic overlay. High-end modern publishing aesthetic matching a prestige non-fiction hardcover.`;

    let styleDescriptor = '';
    switch (stylePreset) {
      case 'minimal_authority':
        styleDescriptor = 'Subtle dark graphite paper texture with minimalist gold leaf geometric lines, sleek matte finish.';
        break;
      case 'blueprint_sketch':
        styleDescriptor = 'Architectural dark blueprint grid texture, deep Prussian blue, faint chalk isometric vectors.';
        break;
      case 'abstract_geometry':
        styleDescriptor = 'Monochrome obsidian geometric facets, dramatic chiaroscuro studio lighting, subtle cyan edge glow.';
        break;
      case 'dark_editorial':
      default:
        styleDescriptor = 'Deep charcoal slate background with organic fluid metallic smoke, elegant fine-art non-fiction cover art.';
        break;
    }

    const fullDallePrompt = `${baseNegativeSpacePrompt} Subject and aesthetic: ${themePrompt || book.title}. Style: ${styleDescriptor}`;

    let imageUrl = '';
    const apiKey = process.env.OPENAI_API_KEY;
    const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

    if (isRealKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: fullDallePrompt,
          n: 1,
          size: '1024x1792', // Portrait orientation for 6x9 trade paperback
          quality: 'hd',
          style: 'vivid',
        });

        const ephemeralUrl = response.data?.[0]?.url;
        if (ephemeralUrl) {
          // In production with real Supabase Storage:
          // Fetch image buffer and pipe to Supabase bucket 'book-covers/{userId}/{bookId}-bg.png'
          imageUrl = ephemeralUrl;
        }
      } catch (dalleErr: any) {
        console.warn('DALL-E 3 generation failed, using curated editorial background:', dalleErr);
        imageUrl = getCuratedBackground(stylePreset);
      }
    } else {
      imageUrl = getCuratedBackground(stylePreset);
    }

    // 3. Update Book's cover_bg_url in database
    await store.updateBook(bookId, {
      cover_bg_url: imageUrl,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      remainingCredits: deduction.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error generating cover:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getCuratedBackground(stylePreset?: string): string {
  const backgrounds: Record<string, string> = {
    minimal_authority: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    blueprint_sketch: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    abstract_geometry: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    dark_editorial: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
  };

  return backgrounds[stylePreset || 'minimal_authority'] || backgrounds.minimal_authority;
}
