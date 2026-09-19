import { Book, Chapter, BlogPost, Profile, CreditTransaction } from '@/lib/types';

export const MOCK_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'author@foliocraft.ai',
  full_name: 'Marcus Vance',
  credits_balance: 185,
  subscription_tier: 'authority',
  stripe_customer_id: 'cus_mock_author123',
  stripe_subscription_id: 'sub_mock_authority456',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'The Sovereign Operator',
    subtitle: 'How to Build a 7-Figure Advisory Firm on Autonomous Systems',
    target_audience: 'B2B Consultants, Agency Founders, and Enterprise Architects looking to decouple revenue from billable hours',
    core_thesis: 'Traditional professional services firms are doomed to margin compression unless they productize tacit knowledge into autonomous software workflows and proprietary IP.',
    tone_voice: 'Authoritative, Practical & High-Leverage',
    status: 'completed',
    cover_bg_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    cover_style_config: {
      template: 'bold_founder',
      font_family: 'Space Grotesk',
      title_color: '#F8FAFC',
      subtitle_color: '#94A3B8',
      accent_color: '#38BDF8',
      layout: 'center',
      show_barcode_box: true,
      author_name: 'Marcus Vance',
    },
    cover_full_wrap_url: null,
    source_materials: [
      {
        id: 'mat-1',
        title: 'Advisory Productization Masterclass Audio',
        type: 'audio_transcript',
        snippet: 'If you bill by the hour, you are penalizing yourself for being fast. The entire economic model of 20th century advisory is inverted. We must shift from selling labor to licensing automated diagnostics.',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'mat-2',
        title: 'System Architecture Napkin Notes',
        type: 'text_note',
        snippet: 'Three pillars: 1. Knowledge Ingestion Engine. 2. Autonomous Delivery Loops. 3. High-Ticket Value Anchor Pricing.',
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
    ],
    global_context: {
      target_persona: 'Seasoned consultants currently trading hours for dollars ($200k-$600k/yr)',
      core_thesis: 'Knowledge assets compounded via autonomous systems outperform labor-leveraged agencies by 10x net margins.',
      terminology: {
        'Sovereign Asset': 'A codified framework that generates recurring enterprise value without synchronous human delivery.',
        'Zero-Labor Loop': 'An automated diagnostic sequence that replaces 15 hours of manual client discovery.',
        'Value Anchor': 'Pricing tied to catastrophe avoidance rather than cost of production.',
      },
      rolling_abstracts: [
        'Chapter 1 breaks down the billable hour trap, proving that increased competence decreases revenue under time-and-materials contracts.',
        'Chapter 2 introduces the Sovereign Operating Stack, dividing client delivery into Diagnostic, Prescriptive, and Execution layers.',
        'Chapter 3 covers autonomous packaging, providing pricing frameworks for charging $50k fixed outcomes backed by algorithmic guarantees.',
      ],
    },
    is_public_preview: true,
    share_slug: 'the-sovereign-operator',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Zero-Click Authority',
    subtitle: 'Dominating AI Search Overviews and Algorithmic Distribution',
    target_audience: 'CMOs, Tech Founders, and Growth Engineers navigating the post-Google search landscape',
    core_thesis: 'Traditional SEO based on keyword stuffing is dead. Brands must become verifiable Knowledge Entities cited directly in LLM latent spaces.',
    tone_voice: 'Analytical, Visionary & Tactical',
    status: 'draft',
    cover_bg_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    cover_style_config: {
      template: 'tech_horizon',
      font_family: 'Inter',
      title_color: '#FFFFFF',
      subtitle_color: '#CBD5E1',
      accent_color: '#10B981',
      layout: 'editorial',
      show_barcode_box: true,
      author_name: 'Marcus Vance',
    },
    cover_full_wrap_url: null,
    source_materials: [],
    global_context: {
      target_persona: 'Enterprise marketing leaders and founders losing organic traffic to Google AI Overviews and Perplexity',
      core_thesis: 'Optimize for entity authority and citation density rather than blue-link click-through rates.',
      terminology: {
        'Answer Engine Optimization': 'Formatting knowledge graphs to ensure LLMs select your thesis as the consensus answer.',
      },
      rolling_abstracts: [
        'Chapter 1 explores the collapse of the 10 blue links and the emergence of Perplexity and ChatGPT Search as the primary discovery layer.',
      ],
    },
    is_public_preview: false,
    share_slug: 'zero-click-authority',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    book_id: 'b1000000-0000-0000-0000-000000000001',
    chapter_number: 1,
    title: 'The Billable Hour Fallacy',
    summary: 'Why high-performing consultants hit an invisible revenue ceiling and how hourly billing misaligns client outcomes.',
    content_markdown: `# Chapter 1: The Billable Hour Fallacy

The most dangerous lie in professional services is that your time has value.

Your time does not have value. Your client does not care how many hours you spent sweating over a spreadsheet or sitting in traffic to attend an emergency steering committee. 

The client cares about exactly one thing: **the deterministic realization of an outcome with minimal variance and zero friction.**

Yet, for nearly a century, the advisory industry has operated on a perverse mathematical model:

$$\\text{Revenue} = \\text{Hours Logged} \\times \\text{Hourly Rate}$$

Under this equation, every operational efficiency you discover is an economic penalty. If you spend ten years honing your expertise to diagnose a systemic supply chain bottleneck in fifteen minutes, you are rewarded with 0.25 billable hours. If an inexperienced junior associate takes three weeks of bumbling trial-and-error to arrive at the same diagnosis, the firm bills 120 hours.

Hourly billing does not reward competence. It subsidizes inefficiency.

---

## The Ceiling of Synchronous Delivery

Every solo practitioner or boutique firm owner eventually collides with the hard physics of human biology:

1. There are only 168 hours in a week.
2. Cognitive performance deteriorates precipitously after 45 focused hours.
3. Increasing rates from $250/hour to $500/hour only buys temporary breathing room before the calendar is packed again.

You end up building what I call a **Glorified High-Stress Job** masquerading as an equity asset. When you take a vacation, revenue stops. When you get sick, deliveries stall. When you attempt to sell the practice, acquirers run for the hills because the firm possesses no enterprise value without your personal nervous system.

\`\`\`
Synchronous Labor Model:
[Your Time] ---> [Manual Delivery] ---> [Client Outcome] ---> ($/hour)

Autonomous Sovereign Model:
[Codified IP] ---> [Automated System] ---> [Continuous Outcome] ---> ($ Fixed Value)
\`\`\`

To become a Sovereign Operator, you must make a foundational psychological shift: **You must stop selling the labor of building the bridge, and start licensing the toll booth.**

---

## The Case Study: The 15-Minute Breakthrough
Consider a real-world engagement with a Fortune 500 fintech client. Their fraud risk modeling team spent 4 months debating why anomaly false positives were spiking 32% quarter-over-quarter. They had burned through $350,000 in retainers with legacy management consulting firms.

Within 45 minutes of analyzing their raw log telemetry against our proprietary heuristic engine, we identified the defect: a missing timezone normalization timestamp in their batch ingest cluster.

Under the billable model, 45 minutes of analysis at $500/hour equals $375. 

Under the Sovereign Asset model, this intervention was packaged as a **Fixed $65,000 Forensic Diagnostic**. The client signed the agreement in 24 hours without batting an eye. Why? Because resolving that single bug prevented an estimated $2.4M in fraudulent chargebacks over the subsequent quarter.

**Rule to Remember:** Never confuse the time it takes to deliver an insight with the decades of scar tissue required to know where to look.`,
    word_count: 1840,
    status: 'completed',
    version: 2,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    book_id: 'b1000000-0000-0000-0000-000000000001',
    chapter_number: 2,
    title: 'The Tri-Layer Sovereign Stack',
    summary: 'Deconstructing professional services into Diagnostic, Prescriptive, and Execution layers to isolate high-leverage IP.',
    content_markdown: `# Chapter 2: The Tri-Layer Sovereign Stack

To dismantle the billable hour, we must first dissect what actually happens during a client engagement.

Every advisory intervention, regardless of domain—whether restructuring debt, redesigning cloud infrastructure, or optimizing talent acquisition—consists of three distinct layers:

1. **The Diagnostic Layer (Data Ingestion & Root-Cause Detection)**
2. **The Prescriptive Layer (Strategic Synthesis & Roadmap Formulation)**
3. **The Execution Layer (Change Management & Implementation)**

Traditional firms blend all three layers into an undifferentiated soup of meetings, slide decks, and email chains. This is why projects drag on for quarters and burn out both sides.

---

## Layer 1: The Diagnostic Engine

In traditional consulting, discovery takes four to six weeks. Consultants interview fifteen department heads, collect spreadsheets, and manually transcribe notes.

A Sovereign Operator turns this into an automated, deterministic sequence:
- A standardized ingestion pipeline pulls operational telemetry directly from the client's existing tools.
- Algorithmic benchmarks evaluate the dataset against 500 past cohorts.
- A comprehensive 24-page Diagnostic Report generates automatically before the kickoff call.

What previously required 80 billable hours is now completed in 12 minutes of computation. The client is stunned by the velocity, and you have expended zero marginal energy.

---

## Layer 2: The Co-Authored Strategic Directive

Clients do not buy strategy; they buy certainty. 

When you decouple diagnosis from execution, your strategic recommendations carry 10x greater perceived authority because you have no financial incentive to recommend bloated execution phases.

---

## Layer 3: Autonomous Orchestration
Instead of deploying junior analysts to sit in conference rooms, you license automated workflow sequences that monitor KPIs, trigger alerts, and enforce organizational compliance automatically.`,
    word_count: 2150,
    status: 'completed',
    version: 1,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    book_id: 'b1000000-0000-0000-0000-000000000001',
    chapter_number: 3,
    title: 'Pricing the Impossibility: Value Anchoring',
    summary: 'How to price fixed-outcome intellectual property at $50,000 to $150,000 without client pushback.',
    content_markdown: `# Chapter 3: Pricing the Impossibility: Value Anchoring

Once you have decoupled your knowledge from your calendar, the question invariably arises: *"Marcus, how do I price an automated diagnostic that took 15 minutes to run?"*

If you tell the client: *"That report took my software 15 minutes to generate, so that will be $500,"* they will feel cheated. 

If you understand **Value Anchoring**, you price the diagnostic at $35,000, and the client thanks you for saving their business.

---

## The Economics of Avoided Catastrophe

Let us examine an actual case study from an enterprise data architect:

- **Client Problem:** A global logistics firm was losing $420,000 per month due to intermittent data synchronization errors between their warehouse management system and ERP.
- **Traditional Proposal:** A Big Four consultancy proposed an 8-month team deployment with 4 senior engineers at $280/hour. Total estimated cost: $650,000.
- **The Sovereign Solution:** The solo architect deployed a proprietary diagnostic script that pinpointed the schema deadlock in 48 hours.
- **The Price Charged:** $85,000 fixed fee.

Did the client care that the architect only worked for 6 hours? Absolutely not. The client resolved a $5,000,000 annual hemorrhage within 48 hours for $85,000. That is a 58x ROI in year one alone.

---

## The Rule of One-Tenth
When anchoring high-ticket IP:
1. Quantify the verifiable downside risk (catastrophe cost).
2. Price your asset at approximately 10% of that figure.
3. Offer an unambiguous performance benchmark.`,
    word_count: 1920,
    status: 'completed',
    version: 1,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    book_id: 'b1000000-0000-0000-0000-000000000001',
    chapter_number: 4,
    title: 'The Codification Protocol',
    summary: 'Extracting tacit mental models from Loom recordings and customer emails into repeatable algorithmic assets.',
    content_markdown: `# Chapter 4: The Codification Protocol

How do you take the intuitive "gut feelings" developed over 15 years of consulting and turn them into structured software rules?

In this chapter, we explore the step-by-step methodology to transcribe spoken client advice, map decision trees, and construct proprietary scorecards.`,
    word_count: 980,
    status: 'drafting',
    version: 1,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    book_id: 'b1000000-0000-0000-0000-000000000001',
    chapter_number: 5,
    title: 'Building the Autonomous Delivery Engine',
    summary: 'Integrating webhook triggers, synthetic reports, and automated client alerts into a hands-off operating cadence.',
    content_markdown: `# Chapter 5: Building the Autonomous Delivery Engine

This chapter covers the technical orchestration of your intellectual property into production workflows.`,
    word_count: 0,
    status: 'pending',
    version: 1,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    slug: 'why-chatgpt-fails-at-writing-books',
    title: 'Why 90% of ChatGPT eBooks Fail: Context Drift, AI Slop, and Amazon KDP Flags',
    meta_description: 'Discover why 1-click ChatGPT book prompts result in shallow repetitive content, context drift by Chapter 4, and Amazon KDP quality bans—and how authority authoring engines solve it.',
    content_markdown: `# Why 90% of ChatGPT eBooks Fail: Context Drift, AI Slop, and Amazon KDP Flags

Every week, hundreds of aspiring authors paste the prompt: *"Write me a 10-chapter book on B2B sales"* into ChatGPT. 

Within 45 seconds, the LLM outputs a 3,000-word outline. The creator smiles, clicks download, bundles it into a PDF, and uploads it to Amazon KDP. Two weeks later, one of three things happens:

1. **Zero Organic Read-Throughs**: The Kindle Unlimited completion rate is under 4%.
2. **Brutal 1-Star Reviews**: Readers immediately identify the telltale hallmarks of generic AI prose—buzzword soup, recycled platitudes, and zero proprietary case studies.
3. **Account Termination**: Amazon KDP flags the book for violating content quality guidelines or repetitive bot patterns.

Here is an architectural deep dive into why raw ChatGPT fails at book-length long-form synthesis, and what authoritative operators do instead.

---

## 1. The Context Drift Crisis

LLMs operate within fixed sliding context windows. Even with 128k token context windows, LLM attention degrades non-linearly across extended sequence generation (the "Lost in the Middle" phenomenon).

When you ask ChatGPT to write Chapter 7 after generating Chapters 1 through 6, it has already lost precision over:
- The exact frameworks introduced in Chapter 2.
- The nomenclature and coined terminology defined in Chapter 3.
- The narrative arc and pacing of your thesis.

**The Result:** By Chapter 5, the model begins repeating introductory concepts, introducing conflicting definitions, or hallucinating analogies that contradict earlier chapters.

### The Solution: Global Context Rolling Memory
In FolioCraft AI, book generation does not happen in an untethered chat window. Every book initializes an immutable **Global Context Memory Object** containing:
- Target Reader Archetype & Frustrations
- Core Central Thesis
- Coined Vocabulary & Framework Lexicon
- Rolling Abstract Summaries (a 100-word deterministic digest of every finalized chapter)

When Chapter 8 generates, the prompt compiler injects the exact delta of previous chapters, ensuring surgical thematic continuity.

---

## 2. Decoupling AI Art from Vector Typography

Have you ever tried to generate a book cover using DALL-E or Midjourney? You invariably get pseudo-Latin hieroglyphics, misaligned lettering, and distorted author names.

Raw image models are probabilistic pixel predictors, not graphic designers. They do not understand kerning, baseline grids, or print-ready CMYK color spaces.

FolioCraft AI implements a **Two-Layer Decoupled Studio**:
1. **DALL-E 3 Background Engine:** Commands generative AI to render *strictly negative-space editorial textures and background art* with zero typography.
2. **SVG Vector Typography Overlay:** Renders crisp, misspell-free fonts (Inter, Playfair Display, Space Grotesk) with dynamic Amazon KDP spine calculations ($Spine = Pages \\times 0.002252"$).

---

## Key Takeaways for High-Leverage Operators

If your goal is building authority, your book cannot read like a regurgitated Wikipedia article. It must capture your authentic voice notes, client war stories, and proprietary frameworks.

Co-writing chapter-by-chapter with structured memory and surgical editorial prompts produces Amazon KDP-grade books in an afternoon—without compromising your reputation.`,
    funnel_stage: 'awareness',
    canonical_url: 'https://foliocraft.ai/blog/why-chatgpt-fails-at-writing-books',
    target_keywords: ['chatgpt book writing', 'amazon kdp ai ban', 'ai context drift', 'ai book generator', 'write non-fiction book ai'],
    schema_json: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Does Amazon KDP ban AI-written books?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Amazon KDP requires authors to disclose AI-generated content and strictly enforces quality standards against low-effort, repetitive, or misleading content. Disclosed books crafted with human oversight and original frameworks remain fully compliant.',
          },
        },
        {
          '@type': 'Question',
          name: 'What causes context drift in AI book writing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Context drift occurs when large language models lose retention of earlier character developments, frameworks, and terminology across sequential chapter generation without a global outline memory state.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does FolioCraft AI prevent AI hallucinations in books?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'FolioCraft AI grounds chapter generation in user-uploaded voice notes, client transcripts, and an immutable Global Context memory layer that tracks rolling abstracts of previous chapters.',
          },
        },
      ],
    },
    is_published: true,
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    slug: 'turn-voice-notes-and-client-frameworks-into-an-ebook',
    title: 'The Voice-to-Book Framework: How Consultants Publish in 4 Hours',
    meta_description: 'Step-by-step methodology for turning Loom transcripts, client onboarding voice memos, and napkin diagrams into a 150-page published authority paperback.',
    content_markdown: `# The Voice-to-Book Framework: How Consultants Publish in 4 Hours

As a consultant, founder, or specialized operator, you talk about your craft every single day. 

You explain your methodology on client Zoom calls. You leave 7-minute voice notes to team members breaking down systems. You sketch diagrams on iPads during sales pitches.

You already have 10 books inside your head. You just lack 6 months to sit in an isolated cabin typing 60,000 words.

Here is the exact 4-hour workflow used by 7-figure operators to transform existing voice recordings into an Amazon KDP-ready authority book using FolioCraft AI.

---

## The 4-Hour System Breakdown

### Step 1: Voice Dump & Framework Ingestion (45 Minutes)
Instead of starting with a blank Google Doc, pull 3 to 5 audio assets:
- A recorded masterclass or client workshop.
- Two voice memos recorded during your morning walk explaining your core thesis.
- A bulleted list of 5 common objections your clients raise.

Upload these directly into the FolioCraft AI Ingestion Studio. OpenAI Whisper processes the audio files and indexes them into the book's **Source Materials Vault**.

### Step 2: Global Memory & Blueprint Synthesis (20 Minutes)
The Blueprint Engine synthesizes your unstructured thoughts into an authoritative 8-to-10 chapter narrative arc. It extracts:
- Your core counter-intuitive belief.
- The specific archetype of your ideal reader.
- A coined methodology name.

### Step 3: Chapter-by-Chapter Iterative Drafting (90 Minutes)
Rather than a "generate all" button that creates generic fluff, you co-author one chapter at a time:
- **Streaming Generation:** Watch 1,800 words stream in seconds, grounded directly in your uploaded voice transcripts.
- **Targeted AI Refinement Bar:** Highlight a paragraph and click *"Inject real-world case study"* or *"Cut corporate fluff"*.
- **Editorial Illustration Studio:** Turn concepts into clean architectural sketches in 2 clicks.

### Step 4: Decoupled Cover Design & 1-Click KDP Export (45 Minutes)
- Choose from 6 typographic layouts (Harvard Business Review, Penguin Classic, Modern Minimalist).
- DALL-E 3 renders pristine, text-free background art.
- The engine calculates spine width automatically based on page count ($0.002252" \\times \\text{pages}$).
- Download your 300 DPI CMYK PDF paperback wrap and reflowable EPUB.

---

## Summary Checklist

1. Record or gather 45 minutes of audio.
2. Let Whisper transcribe and index source frameworks.
3. Review and fine-tune the 10-chapter Blueprint.
4. Co-write and polish chapter drafts with revision diffs.
5. Export to Amazon KDP Print and Kindle EPUB.`,
    funnel_stage: 'consideration',
    canonical_url: 'https://foliocraft.ai/blog/turn-voice-notes-and-client-frameworks-into-an-ebook',
    target_keywords: ['voice to book', 'consultant book publishing', 'how to write book fast', 'speech to text book', 'turn notes into ebook'],
    schema_json: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Turn Voice Notes Into an Amazon KDP-Grade Book',
      description: 'A 4-step framework for founders and consultants to publish an authority book using speech transcripts and AI co-authoring.',
      totalTime: 'PT4H',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Record and Ingest Voice Notes',
          text: 'Record spoken frameworks or gather client call recordings and upload them to Whisper for automatic transcription and source material indexing.',
        },
        {
          '@type': 'HowToStep',
          name: 'Synthesize the Global Context Blueprint',
          text: 'Generate a structured 10-chapter outline with a core thesis, reader archetype, and terminology lexicon.',
        },
        {
          '@type': 'HowToStep',
          name: 'Draft and Refine Chapter by Chapter',
          text: 'Stream chapters individually with rolling context memory and apply targeted micro-prompts to inject case studies and eliminate filler.',
        },
        {
          '@type': 'HowToStep',
          name: 'Design Cover and Export to KDP',
          text: 'Overlay crisp vector typography over AI background art and export KDP-compliant 6x9 PDFs and reflowable EPUB files.',
        },
      ],
    },
    is_published: true,
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    slug: 'best-ai-ebook-creators-reviewed',
    title: '2026 Breakdown: FolioCraft AI vs. GetEbook.ai vs. Designrr',
    meta_description: 'A candid, technical review of leading AI book creation tools in 2026. Compare context retention, typography quality, KDP compliance, and pricing.',
    content_markdown: `# 2026 Breakdown: FolioCraft AI vs. GetEbook.ai vs. Designrr

The market for AI book software exploded over the past 24 months. But as any discerning author knows, most tools are thin wrappers around ChatGPT that churn out shallow, spammy PDFs.

If you are writing a book to land $25k consulting engagements, keynote speaking slots, or high-tier enterprise clients, publishing a sub-par book is worse than publishing nothing at all.

Here is an objective technical comparison between **FolioCraft AI**, **GetEbook.ai**, and **Designrr**.

---

## Comparison Matrix

| Feature / Dimension | FolioCraft AI | GetEbook.ai | Designrr |
| :--- | :--- | :--- | :--- |
| **Target User** | Founders, Consultants, Operators | Affiliate Marketers | Lead Magnet Creators |
| **Context Architecture** | Rolling Global Memory + Source Ingestion | Single prompt stateless | PDF blog-to-ebook scraper |
| **Voice & Audio Ingestion** | Whisper Audio (MP3, WAV, M4A) | None | Audio transcription add-on |
| **Cover Creation** | Decoupled 2-Layer (AI Art + Vector Typography) | AI image with hallucinated text | Template-based 2D canvas |
| **Print-Ready KDP Export** | 6x9 Trim, 0.75" Gutter, Spine Math | Basic PDF | Standard PDF |
| **Reflowable EPUB** | Full EPUB3 (Apple Books / Kindle) | Raw text only | EPUB / Kindle Mobi |
| **Editorial Refinement** | In-line AI Bar (Case Studies, Checklists) | Full re-run only | Manual text edit |

---

## The Verdict

- **Choose Designrr** if you have 40 blog posts from 2021 that you want to re-bundle into an opt-in lead magnet PDF.
- **Choose GetEbook.ai** if you want to churn out short 15-page generic guides for low-ticket affiliate offers.
- **Choose FolioCraft AI** if you are a domain expert who wants to synthesize proprietary frameworks, voice notes, and methodology into a genuine Amazon KDP-grade paperback book with clean vector typography and zero hallucinated fluff.`,
    funnel_stage: 'purchase',
    canonical_url: 'https://foliocraft.ai/blog/best-ai-ebook-creators-reviewed',
    target_keywords: ['best ai ebook creator', 'designrr alternative', 'ai book software 2026', 'foliocraft review', 'kdp print ai software'],
    schema_json: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'FolioCraft AI',
      applicationCategory: 'AuthoringApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '29.00',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '342',
      },
    },
    is_published: true,
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const MOCK_CREDIT_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-1',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: 150,
    action_type: 'subscription_grant',
    metadata: { tier: 'authority', note: 'Monthly credit allocation' },
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'tx-2',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: -3,
    action_type: 'blueprint_generation',
    metadata: { book_title: 'The Sovereign Operator' },
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'tx-3',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: -5,
    action_type: 'chapter_generation',
    metadata: { book_title: 'The Sovereign Operator', chapter_number: 1 },
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'tx-4',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: -4,
    action_type: 'cover_generation',
    metadata: { book_title: 'The Sovereign Operator', prompt: 'Obsidian architectural geometry' },
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    id: 'tx-5',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: -2,
    action_type: 'chapter_revision',
    metadata: { chapter_id: 'c1', prompt: 'Injected real-world fintech case study' },
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    id: 'tx-6',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: 50,
    action_type: 'credit_purchase',
    metadata: { pack: 'topup_50', stripe_payment_id: 'pi_mock_123' },
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];
