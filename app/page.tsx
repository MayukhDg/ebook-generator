import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Check,
  X as CloseIcon,
  ShieldCheck,
  Printer,
  FileCheck,
} from 'lucide-react';
import InteractiveSteps from '@/components/home/InteractiveSteps';
import PricingSection from '@/components/home/PricingSection';
import FaqAccordion, { FaqItem } from '@/components/home/FaqAccordion';

export const metadata = {
  title: 'OpusCraft | The Executive Publishing Studio — Turn Your Expertise Into An Authoritative Book',
  description: 'The AI Authority Engine for founders, consultants, and operators. Synthesize voice transcripts and frameworks into Amazon KDP-grade books through chapter-by-chapter co-writing with strict context memory and decoupled vector cover design.',
};

const faqs: FaqItem[] = [
  {
    q: 'Do I own 100% of the copyright and commercial rights to my book?',
    a: 'Yes, absolutely. Unlike predatory publishers, OpusCraft claims zero equity, royalties, or copyright ownership over your work. Everything you create—from the manuscript and cover art to the KDP print wraps and EPUB packages—is 100% your proprietary intellectual property.',
  },
  {
    q: 'Will Amazon KDP flag or ban books written with OpusCraft?',
    a: 'No. Amazon KDP allows AI-assisted books provided authors disclose AI usage and adhere to quality guidelines. The reason raw ChatGPT books get banned is low-effort copy-pasting, repetitive hallucinations, and unformatted PDFs. OpusCraft enforces human co-authorship, grounds synthesis in your authentic voice transcripts, and produces professional 6x9 trade paperbacks passing all KDP print specifications.',
  },
  {
    q: 'How does the Two-Layer Cover Studio solve the "AI spelling hallucination" defect?',
    a: 'Image generation models (like DALL-E and Midjourney) are probabilistic pixel predictors, meaning they invariably hallucinate garbled pseudo-letters. OpusCraft decouples the process: DALL-E 3 renders pristine, negative-space background textures, and our vector typography engine composites crisp, crisp fonts (Inter, Playfair Display, Space Grotesk) on top with mathematical spine precision.',
  },
  {
    q: 'How does Global Outline Memory prevent context drift by Chapter 5?',
    a: 'When you generate a book outline, OpusCraft initializes an immutable Global Context Object containing your target reader persona, central thesis, coined terminology, and rolling 100-word abstracts of every previous chapter. When Chapter 5 streams, it already knows exactly what was established in Chapters 1 through 4.',
  },
  {
    q: 'How do credits work, and can I top-up without a subscription?',
    a: 'Every user receives 20 free welcome credits on signup. Drafting an outline costs 3 credits, generating a full 2,000-word chapter costs 1 credit, iterative refinements cost 1 credit, and DALL-E 3 covers cost 4 credits. If you need extra credits, you can purchase instant top-up packs anytime (50 credits for $19).',
  },
];

export default async function HomePage() {
  // Safe FAQ Page Schema for Landing Page AEO
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FEFCF9] text-gray-900">
      {/* Dynamic Landing Page FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema).replace(/</g, '\\u003c') }}
      />

      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-warm-hero">
        {/* Warm Gradient Orbs */}
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-200/30 to-pink-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-violet-200/25 to-blue-200/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center space-y-8 relative z-10">
          {/* Authority Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-orange-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="font-bold">OpusCraft</span>
            <span className="text-orange-400">•</span>
            <span>The Executive Publishing Studio</span>
          </div>

          {/* Master Headline (Strictly Exactly 1 H1 per page) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Turn Your Real-World{' '}
            <br className="hidden sm:block" />
            Expertise Into An{' '}
            <span className="text-gradient-coral">Authoritative Digital Asset.</span>
            <br />
          </h1>

          {/* Subheadline */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-gray-500 leading-relaxed">
            Stop fighting ChatGPT's memory limits and unreadable AI slop. Ingest messy voice notes, co-write chapter-by-chapter with{' '}
            <strong className="text-gray-700">strict global memory</strong>, design crisp vector covers, and export 1-click Amazon KDP paperbacks.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-400 hover:to-rose-400 transition-all hover:scale-105 active:scale-95"
            >
              Start Writing Free (20 Credits)
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
            >
              <BookOpen className="h-4 w-4 text-orange-500" />
              Open Authoring Workspace
            </Link>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Printer className="h-4 w-4 text-emerald-500" />
              Amazon KDP 6x9 Trade Paperback Print-Ready
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <FileCheck className="h-4 w-4 text-violet-500" />
              Reflowable EPUB3 for Apple Books & Kindle
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              100% Retained Intellectual Property
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEMANTIC "WHY NOT JUST CHATGPT?" COMPARISON MATRIX */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white/40">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
              The Architecture Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Why Raw ChatGPT Fails at Book Publishing
            </h2>
            {/* BLUF Paragraph immediately following H2 */}
            <p className="text-sm sm:text-base text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              Raw ChatGPT fails at book publishing because consumer LLMs suffer from severe context window amnesia by Chapter 4, produce repetitive pseudo-intellectual clichés, and cannot calculate physical print geometry. OpusCraft replaces raw prompting with an immutable Global Context Memory, OpenAI Whisper voice ingestion, and decoupled vector cover design engineered to pass strict Amazon KDP specifications.
            </p>
          </div>

          {/* Native Semantic Comparison Table */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card">
            <table className="w-full text-left border-collapse" summary="Architectural comparison between raw ChatGPT and OpusCraft Executive Publishing Studio">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th scope="col" className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/4">
                    Dimension
                  </th>
                  <th scope="col" className="py-4 px-6 text-xs font-bold text-red-400 uppercase tracking-wider w-3/8">
                    Raw ChatGPT / 1-Click Spam
                  </th>
                  <th scope="col" className="py-4 px-6 text-xs font-bold text-orange-600 uppercase tracking-wider w-3/8 bg-orange-50/40">
                    OpusCraft Authority Engine
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <th scope="row" className="py-4 px-6 font-semibold text-gray-700 font-sans text-left">
                    Context Memory
                  </th>
                  <td className="py-4 px-6 text-gray-500">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Severe Context Drift
                    </span>
                    Forgets definitions by Chapter 4. Contradicts earlier frameworks and repeats introductory fluff.
                  </td>
                  <td className="py-4 px-6 text-gray-600 bg-orange-50/40">
                    <span className="flex items-center gap-1.5 text-orange-600 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Global Context Layer
                    </span>
                    Compiles rolling 100-word abstracts and coined terminology injected into every chapter prompt.
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <th scope="row" className="py-4 px-6 font-semibold text-gray-700 font-sans text-left">
                    Cover Design
                  </th>
                  <td className="py-4 px-6 text-gray-500">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Hallucinated Pseudo-Letters
                    </span>
                    Garbled typography, misspelled author names, and zero spine thickness calculation.
                  </td>
                  <td className="py-4 px-6 text-gray-600 bg-orange-50/40">
                    <span className="flex items-center gap-1.5 text-orange-600 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Decoupled 2-Layer Studio
                    </span>
                    Negative-space AI background combined with crisp vector SVG typography + dynamic KDP spine math.
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <th scope="row" className="py-4 px-6 font-semibold text-gray-700 font-sans text-left">
                    Source Ingestion
                  </th>
                  <td className="py-4 px-6 text-gray-500">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Generic Platitudes
                    </span>
                    Recycled internet generalities with zero proprietary war stories or practitioner frameworks.
                  </td>
                  <td className="py-4 px-6 text-gray-600 bg-orange-50/40">
                    <span className="flex items-center gap-1.5 text-orange-600 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Voice Notes & Transcripts
                    </span>
                    Ingests Loom audios and client voice notes via Whisper, anchoring prose in your actual voice.
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <th scope="row" className="py-4 px-6 font-semibold text-gray-700 font-sans text-left">
                    KDP Print Compliance
                  </th>
                  <td className="py-4 px-6 text-gray-500">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Rejected by Amazon KDP
                    </span>
                    Raw markdown copy-paste missing 0.75" inside gutters, verso/recto headers, and dynamic TOC.
                  </td>
                  <td className="py-4 px-6 text-gray-600 bg-orange-50/40">
                    <span className="flex items-center gap-1.5 text-orange-600 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> 1-Click 6x9 Print Engine
                    </span>
                    Uses @react-pdf/renderer for print-perfect layout determinism and valid reflowable EPUB3.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. 3-STEP DEMONSTRATION SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-warm">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
              The 4-Hour Publishing Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              From Raw Thought to Published Paperback
            </h2>
            {/* BLUF Paragraph immediately following H2 */}
            <p className="text-sm sm:text-base text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              The 4-Hour Publishing Protocol condenses months of manual ghostwriting into a structured, step-by-step executive workflow. By transcribing your authentic spoken frameworks, co-authoring chapter-by-chapter with strict outline memory, and generating print-ready 6x9 trade paperbacks, OpusCraft turns tacit knowledge into high-margin intellectual property.
            </p>
          </div>

          {/* Interactive Steps Subcomponent */}
          <InteractiveSteps />
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white/60">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Transparent Credit Economics
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Invest in Authority, Not Hourly Retainers
            </h2>
            {/* BLUF Paragraph immediately following H2 */}
            <p className="text-sm sm:text-base text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              Publishing an authoritative non-fiction book traditionally requires hiring $15,000+ ghostwriters who struggle to capture your practitioner voice. OpusCraft offers transparent, credit-based economics starting with 20 complimentary credits, scalable monthly subscriptions, and never-expiring top-up packs.
            </p>
          </div>

          {/* Interactive Pricing Cards Subcomponent */}
          <PricingSection />
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-gradient-warm">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
            {/* BLUF Paragraph immediately following H2 */}
            <p className="text-sm sm:text-base text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about copyright ownership, Amazon KDP print acceptance, and AI context memory. All manuscripts, vector cover designs, and PDF interiors generated in OpusCraft remain 100% your proprietary intellectual property.
            </p>
          </div>

          {/* Interactive FAQ Accordion Subcomponent */}
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
