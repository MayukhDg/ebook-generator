const fs = require('fs');

// Read environment from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
});

const post1Content = `The most valuable asset in non-fiction publishing is not literary prose; it is deep, first-hand domain expertise. However, most founders, agency operators, and consultants lack the 100+ open hours required to manually type out a full manuscript.

The Voice-to-Book Framework solves this bottleneck by decoupling idea capture from manuscript typesetting, transforming raw spoken audio into an Amazon KDP-grade book in four distinct steps.

---

## The Core Concept: Why Speaking Beats Typing

When experts sit down at a blank keyboard, their analytical brain creates friction. They self-edit sentence structure before developing the core argument.

Conversely, when explaining a complex framework to a client on a call, experts communicate with natural cadence, vivid metaphors, and zero fluff. Capturing this audio preserves your authentic voice while eliminating writer's block.

[4 Hours of Spoken Audio] -> [Whisper AI Transcription] -> [Global Outline Structuring] -> [Iterative Chapter Polishing]

---

## Step 1: The Chapter-Question Audio Sprint

Never record an open-ended brain dump. Instead, divide your book into 8 to 10 specific chapters, and assign 3 provocative questions to each:

The Catalyst: "What costly mistake is the industry making right now?"

The Framework: "What is the exact 4-part process I use to fix this for clients?"

The Proof: "What happened when a client implemented this? (The case study)"

Record a 15-minute voice memo answering these three questions per chapter. Ten chapters at 15 minutes each yields 2.5 to 3 hours of concentrated, high-signal audio.

---

## Step 2: Semantic Audio Transcription

Process the raw audio through a high-fidelity speech-to-text pipeline. This converts audio into conversational, unedited transcripts while retaining industry terminology and specific client metrics.

---

## Step 3: Rolling Context Synthesis

Do not pass raw transcripts into a prompt asking for a finished book. Instead, use an engine that maintains an active Global Context Ledger:

Audience Anchor: Who is reading this, and what is their baseline knowledge?

Thesis Anchor: What central argument must this chapter advance?

Rolling Abstract: A 100-word factual summary of what was covered in prior chapters to eliminate circular arguments.

The system uses the transcript as the factual foundation, transforming conversational speech into clear, authoritative prose without adding artificial filler.

---

## Step 4: Block-Level Refinements and Typesetting

Once the draft is compiled, refine your manuscript with focused block edits rather than full-document regenerations:

- **Targeted Revisions:** Select weak sections and trigger focused prompts (e.g., "Inject a concrete numerical example here" or "Convert this paragraph into an actionable checklist").
- **KDP-Grade Typesetting:** Export directly into a verified 6x9 trade paperback layout with 0.75" inside gutter margins and valid reflowable .epub files for digital distributors.`;

const post2Content = `Can ChatGPT write a full-length book? While a raw large language model (LLM) can generate 2,000 words of generic prose in under a minute, it cannot write a publishable 20,000-to-50,000-word book when prompted in isolation. Without a dedicated memory architecture, raw AI outputs suffer from context drift, repetitive sentence loops, and hallucinated data that trigger Amazon KDP quality strikes.

To publish a book that builds professional authority and passes marketplace quality audits, authors must understand the architectural limitations of standalone AI prompting.

---

## 1. The Context Drift Dilemma (Why Chapters 5 and 1 Contradict Each Other)

Large language models process text within a rolling window of attention tokens. When prompted to write consecutive chapters, standalone models encounter two critical points of failure:

### Context Eviction
As you prompt Chapter 4, the specifics of Chapter 1 (character definitions, thesis arguments, data points) get compressed or pushed outside the active reasoning window.

### Semantic Loops
Without a persistent database tracking previously made arguments, the model begins every new chapter with predictable transition clichés:
- *"In today's fast-paced digital landscape..."*
- *"It is important to remember that balance is key..."*
- *"In conclusion, mastering this step requires diligence..."*

The result is a disjointed manuscript where every chapter reads like an introductory blog post rather than a progressive, compounding argument.

---

## 2. The Amazon KDP Quality Sweep: What Gets Flagged

Amazon Kindle Direct Publishing enforces strict policies regarding AI-assisted content. While AI drafting is permitted, Amazon actively removes manuscripts that trigger negative reader experiences under its Content Quality Guidelines:

| Failure Mode | How Readers Notice | Amazon KDP Enforcement Risk |
| :--- | :--- | :--- |
| **Repetitive Formatting** | Every chapter has identical 5-point bullet lists and predictable transition tropes. | Flagged as poor customer experience or low-effort AI slop. |
| **Context Contradictions** | Chapter 5 contradicts frameworks or thesis definitions introduced in Chapter 1. | 1-star reviews and elevated Kindle return rates. |
| **Hallucinated Citations** | Made-up statistics, ghost case studies, or non-existent URLs. | Immediate copyright/content quality strike or listing suspension. |
| **Empty Conversational Fluff** | Unsubstantiated filler, lack of actionable takeaways, and generic summaries. | Account review under Amazon KDP quality audit sweeps. |

---

## 3. The Three Technical Differences Between Raw ChatGPT and Publishing Engines

Producing a market-ready book requires moving from an isolated text generator to a multi-stage publishing architecture:

- **Global Document State:** Instead of hoping the model remembers previous prompts, an authority authoring system maintains a dedicated database record of your core thesis, outline state, target persona, and running chapter summaries.
- **Source Material Grounding:** Rather than generating claims from thin air, the engine extracts your original ideas from voice notes, case studies, and messy outlines via retrieval pipelines.
- **Press-Ready Typography:** Raw LLMs spit out flat text blocks. Real books require 6x9 trade trim sizes, gutter margins, running headers, and reflowable .epub container formatting.

---

## The Solution: Grounded, Chapter-by-Chapter Co-Authoring

If you want to publish a book that establishes real industry authority, stop prompting AI to "write me a chapter on X." Instead, feed the system your real-world insights, enforce global document context across chapters, and maintain editorial oversight over every block.`;

async function updatePosts() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/blog_posts';
  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const r1 = await fetch(url + '?slug=eq.voice-to-book-framework-for-experts', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ content_markdown: post1Content })
  });
  console.log('Post 1 update status:', r1.status);

  const r2 = await fetch(url + '?slug=eq.why-chatgpt-fails-at-writing-books', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ content_markdown: post2Content })
  });
  console.log('Post 2 update status:', r2.status);
}

updatePosts().catch(console.error);
