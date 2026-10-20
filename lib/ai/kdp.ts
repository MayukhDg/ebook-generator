/**
 * OpusCraft - Amazon KDP Metadata Generator
 * Generates conversion-optimized sales descriptions (Amazon KDP HTML tags),
 * 7 backend long-tail search keywords (max 50 chars each), and category recommendations.
 */

import OpenAI from 'openai';

export interface GenerateKdpMetadataParams {
  title: string;
  subtitle?: string | null;
  targetAudience: string;
  coreThesis: string;
  toneVoice?: string;
  chapters?: Array<{ chapter_number: number; title: string; summary?: string | null }>;
}

export interface KdpMetadataResult {
  kdp_description: string;
  kdp_keywords: string[];
  kdp_categories: string[];
}

export async function generateKdpMetadata(
  params: GenerateKdpMetadataParams
): Promise<KdpMetadataResult> {
  const {
    title,
    subtitle,
    targetAudience,
    coreThesis,
    toneVoice = 'Authoritative & Practical',
    chapters = [],
  } = params;

  const apiKey = process.env.OPENAI_API_KEY;
  const isRealKey = apiKey && !apiKey.includes('mock') && apiKey.startsWith('sk-');

  if (isRealKey) {
    try {
      const openai = new OpenAI({ apiKey, timeout: 25000 });

      const chaptersContext = chapters.length > 0
        ? chapters
            .slice(0, 15)
            .map((c) => `Chapter ${c.chapter_number}: ${c.title}${c.summary ? ` - ${c.summary}` : ''}`)
            .join('\n')
        : 'Detailed multi-chapter breakdown tailored to the thesis.';

      const systemPrompt = `You are an elite Amazon KDP publishing strategist and direct-response copywriter.
Your mission is to produce the highest-converting Amazon Kindle Direct Publishing (KDP) listing metadata for an executive authority book.

CRITICAL AMAZON KDP SPECIFICATIONS:
1. BOOK DESCRIPTION (kdp_description):
   - Must use ONLY Amazon KDP-supported HTML tags: <h3>, <h4>, <p>, <b>, <i>, <ul>, <li>. (Do NOT use forbidden tags like <h1>, <h2>, <div>, <span>, <style>, <script>, <a>).
   - Hook headline: Bold, high-urgency headline inside <h3>.
   - Opening: 1-2 captivating paragraphs highlighting the core dilemma or stakes.
   - Core Value: Clearly articulate the book's thesis and why this book is indispensable.
   - Bullet Points: An <ul> list introduced by <h4>Inside this book, you will discover:</h4>. Each <li> must start with <b>Bold Benefit:</b> followed by compelling specifics.
   - Social Proof / Authority: Why the author's framework matters for the target reader.
   - Closing Call to Action: Bold closing call to action: <p><b>Scroll up and click "Buy Now" to take command today.</b></p>
   - Max 3,800 characters (Amazon strictly caps description at 4,000 characters).

2. 7 BACKEND SEARCH KEYWORDS (kdp_keywords):
   - Amazon provides exactly 7 backend keyword boxes.
   - Return EXACTLY 7 keyword phrases.
   - Each phrase MUST be 50 characters or fewer.
   - Focus on high-intent, long-tail search phrases that real buyers enter in Amazon's search bar.
   - Do NOT simply repeat the exact book title. Include buyer-intent terms, pain-point queries, and genre equivalents.

3. KDP CATEGORIES (kdp_categories):
   - Provide 2 to 3 precise Amazon / BISAC category paths where this book will rank most effectively (e.g. "Business & Money > Management & Leadership > Decision-Making").

Respond ONLY with a valid JSON object matching this schema:
{
  "kdp_description": "<h3>...</h3><p>...</p><h4>Inside this book, you will discover:</h4><ul><li><b>...</b>...</li></ul><p><b>Scroll up and click \\"Buy Now\\"...</b></p>",
  "kdp_keywords": [
    "keyword phrase 1",
    "keyword phrase 2",
    "keyword phrase 3",
    "keyword phrase 4",
    "keyword phrase 5",
    "keyword phrase 6",
    "keyword phrase 7"
  ],
  "kdp_categories": [
    "Main Category > Subcategory 1",
    "Main Category > Subcategory 2"
  ]
}`;

      const userPrompt = `BOOK DETAILS:
Title: ${title}
Subtitle: ${subtitle || 'None'}
Target Audience: ${targetAudience}
Core Thesis: ${coreThesis}
Tone & Voice: ${toneVoice}

TABLE OF CONTENTS:
${chaptersContext}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      if (parsed.kdp_description && Array.isArray(parsed.kdp_keywords)) {
        // Enforce KDP 50-character limit per keyword and ensure exactly 7
        const cleanedKeywords = parsed.kdp_keywords
          .map((k: string) => String(k).trim().slice(0, 50))
          .filter((k: string) => k.length > 0)
          .slice(0, 7);

        while (cleanedKeywords.length < 7) {
          cleanedKeywords.push(`${title.slice(0, 30).toLowerCase()} guide`);
        }

        return {
          kdp_description: String(parsed.kdp_description).trim(),
          kdp_keywords: cleanedKeywords,
          kdp_categories: Array.isArray(parsed.kdp_categories) && parsed.kdp_categories.length > 0
            ? parsed.kdp_categories.map((c: string) => String(c).trim())
            : ['Business & Money > Management & Leadership', 'Reference > Publishing'],
        };
      }
    } catch (err) {
      console.warn('[OpusCraft KDP AI] Fallback to deterministic generator due to API error:', err);
    }
  }

  // Deterministic fallback if offline or no API key
  return generateDeterministicKdp({
    title,
    subtitle,
    targetAudience,
    coreThesis,
    chapters,
  });
}

function generateDeterministicKdp(params: {
  title: string;
  subtitle?: string | null;
  targetAudience: string;
  coreThesis: string;
  chapters?: Array<{ chapter_number: number; title: string; summary?: string | null }>;
}): KdpMetadataResult {
  const { title, subtitle, targetAudience, coreThesis, chapters = [] } = params;
  const combined = `${title} ${subtitle || ''} ${coreThesis} ${targetAudience}`.toLowerCase();
  const isBiography = /trump|president|biograph|memoir|life|polit|history|leader|career/i.test(combined);

  if (isBiography) {
    return {
      kdp_description: `<h3>The Definitive, Unfiltered Chronicle.</h3>
<p>Few figures in modern history have evoked such passionate debate, reshaped political landscapes, and defied institutional expectations like the subject of <i>${title}</i>.</p>
<p>${coreThesis}</p>
<h4>Inside this definitive biographical account, you will discover:</h4>
<ul>
  <li><b>The Formative Crucible:</b> The pivotal early battles and personal dynamics that forged an uncompromising drive for dominance.</li>
  <li><b>Mastering Public Attention:</b> How unconventional communication strategies dismantled media playbooks and built an unbreakable grassroots movement.</li>
  <li><b>Governing Through Institutional Friction:</b> Behind-the-scenes insights into executive decisions, foreign negotiations, and relentless opposition.</li>
  <li><b>The Resilience Doctrine:</b> How unprecedented legal onslaughts and political adversity were systematically converted into cultural momentum.</li>
</ul>
<p>Written specifically for ${targetAudience}, this book offers an objective, high-stakes examination of power, legacy, and historical transformation.</p>
<p><b>Scroll up and click "Buy Now" to explore the complete chronicle today.</b></p>`,
      kdp_keywords: [
        `${title.slice(0, 30).toLowerCase()} biography`,
        'presidential leadership history',
        'political campaign strategy',
        'american political biography',
        'populist movement politics',
        'modern political memoirs',
        'executive authority history',
      ],
      kdp_categories: [
        'Biographies & Memoirs > Historical',
        'Politics & Social Sciences > Politics & Government',
        'History > United States',
      ],
    };
  }

  const chapterBullets = chapters.length >= 3
    ? chapters.slice(0, 4).map((ch) => `<li><b>${ch.title}:</b> ${ch.summary || 'Essential operating principles and strategic breakthroughs.'}</li>`).join('\n  ')
    : `<li><b>The Strategic Foundation:</b> Why conventional wisdom fails and how to avoid costly missteps early on.</li>
  <li><b>Core Execution Pillars:</b> Systematic frameworks designed specifically for ${targetAudience}.</li>
  <li><b>Tactical Leverage:</b> Actionable playbooks that transform theory into immediate measurable results.</li>
  <li><b>Compounding Mastery:</b> How to sustain performance, navigate volatile environments, and build enduring impact.</li>`;

  return {
    kdp_description: `<h3>Master the Principles of ${title}.</h3>
<p>Most books in this field offer high-level theories that crumble when confronted with real-world complexity. You don't need more generic advice—you need an authoritative, tactical operating manual.</p>
<p>${coreThesis}</p>
<h4>Inside this definitive guide, you will discover:</h4>
<ul>
  ${chapterBullets}
</ul>
<p>Written for high-performing practitioners, this book provides the exact methodology required to command your field with authority.</p>
<p><b>Scroll up and click "Buy Now" to take immediate command of your domain today.</b></p>`,
    kdp_keywords: [
      `${title.slice(0, 30).toLowerCase()} guide`,
      `${targetAudience.slice(0, 35).toLowerCase()} handbook`,
      'practical execution playbook',
      'systematic operating framework',
      'proven mastery roadmap',
      'professional authority guide',
      'actionable strategy manual',
    ],
    kdp_categories: [
      'Business & Money > Management & Leadership',
      'Self-Help > Personal Transformation',
      'Business & Money > Skills',
    ],
  };
}
