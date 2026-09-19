'use client';

import React, { useState } from 'react';
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
  Mic, 
  Layers, 
  Palette, 
  Printer, 
  FileCheck, 
  Cpu, 
  HelpCircle,
  Coins,
  ChevronDown,
  Star,
  ExternalLink
} from 'lucide-react';
import { PRICING_PLANS, CREDIT_PACKS } from '@/lib/stripe/config';

export default function HomePage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setIsCheckoutLoading(planId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const faqs = [
    {
      q: 'Do I own 100% of the copyright and commercial rights to my book?',
      a: 'Yes, absolutely. Unlike predatory publishers, FolioCraft AI claims zero equity, royalties, or copyright ownership over your work. Everything you create—from the manuscript and cover art to the KDP print wraps and EPUB packages—is 100% your proprietary intellectual property.',
    },
    {
      q: 'Will Amazon KDP flag or ban books written with FolioCraft AI?',
      a: 'No. Amazon KDP allows AI-assisted books provided authors disclose AI usage and adhere to quality guidelines. The reason raw ChatGPT books get banned is low-effort copy-pasting, repetitive hallucinations, and unformatted PDFs. FolioCraft AI enforces human co-authorship, grounds synthesis in your authentic voice transcripts, and produces professional 6x9 trade paperbacks passing all KDP print specifications.',
    },
    {
      q: 'How does the Two-Layer Cover Studio solve the "AI spelling hallucination" defect?',
      a: 'Image generation models (like DALL-E and Midjourney) are probabilistic pixel predictors, meaning they invariably hallucinate garbled pseudo-letters. FolioCraft AI decouples the process: DALL-E 3 renders pristine, negative-space background textures, and our vector typography engine composites crisp, crisp fonts (Inter, Playfair Display, Space Grotesk) on top with mathematical spine precision.',
    },
    {
      q: 'How does Global Outline Memory prevent context drift by Chapter 5?',
      a: 'When you generate a book outline, FolioCraft AI initializes an immutable Global Context Object containing your target reader persona, central thesis, coined terminology, and rolling 100-word abstracts of every previous chapter. When Chapter 5 streams, it already knows exactly what was established in Chapters 1 through 4.',
    },
    {
      q: 'How do credits work, and can I top-up without a subscription?',
      a: 'Every user receives 20 free welcome credits on signup. Drafting an outline costs 3 credits, generating a full 2,000-word chapter costs 5 credits, iterative refinements cost 2 credits, and DALL-E 3 covers cost 4 credits. If you need extra credits, you can purchase instant top-up packs anytime (50 credits for $19).',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center space-y-8 relative z-10">
          {/* Authority Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-inner">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>The Anti-Slop Authority Engine for Founders & Consultants</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Turn Your Real-World Expertise Into An{' '}
            <span className="text-gradient-gold">Authoritative Book.</span>
            <br />
            In An Afternoon.
          </h1>

          {/* Subheadline */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed">
            Stop fighting ChatGPT's memory limits and unreadable AI slop. Ingest messy voice notes, co-write chapter-by-chapter with <strong className="text-white">strict global memory</strong>, design crisp vector covers, and export 1-click Amazon KDP paperbacks.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-105 active:scale-95"
            >
              Start Writing Free (20 Credits)
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-7 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <BookOpen className="h-4 w-4 text-amber-400" />
              Open Authoring Workspace
            </Link>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Printer className="h-4 w-4 text-emerald-400" />
              Amazon KDP 6x9 Trade Paperback Print-Ready
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <FileCheck className="h-4 w-4 text-cyan-400" />
              Reflowable EPUB3 for Apple Books & Kindle
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              100% Retained Intellectual Property
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE "WHY NOT JUST CHATGPT?" COMPARISON MATRIX */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              The Architecture Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Raw ChatGPT Fails at Book Publishing
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              LLMs in raw chat windows degrade non-linearly over long sequences. Here is how FolioCraft AI's Authority Engine replaces context drift with surgical memory.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">
                    Dimension
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-red-400/90 uppercase tracking-wider w-3/8">
                    Raw ChatGPT / 1-Click Spam
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-amber-400 uppercase tracking-wider w-3/8 bg-amber-500/5">
                    FolioCraft AI Authority Engine
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                <tr className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    Context Memory
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Severe Context Drift
                    </span>
                    Forgets definitions by Chapter 4. Contradicts earlier frameworks and repeats introductory fluff.
                  </td>
                  <td className="py-4 px-6 text-slate-300 bg-amber-500/5">
                    <span className="flex items-center gap-1.5 text-amber-400 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Global Context Layer
                    </span>
                    Compiles rolling 100-word abstracts and coined terminology injected into every chapter prompt.
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    Cover Design
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Hallucinated Pseudo-Letters
                    </span>
                    Garbled typography, misspelled author names, and zero spine thickness calculation.
                  </td>
                  <td className="py-4 px-6 text-slate-300 bg-amber-500/5">
                    <span className="flex items-center gap-1.5 text-amber-400 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Decoupled 2-Layer Studio
                    </span>
                    Negative-space AI background combined with crisp vector SVG typography + dynamic KDP spine math.
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    Source Ingestion
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Generic Platitudes
                    </span>
                    Recycled internet generalities with zero proprietary war stories or practitioner frameworks.
                  </td>
                  <td className="py-4 px-6 text-slate-300 bg-amber-500/5">
                    <span className="flex items-center gap-1.5 text-amber-400 mb-1 font-semibold">
                      <Check className="h-4 w-4" /> Voice Notes & Transcripts
                    </span>
                    Ingests Loom audios and client voice notes via Whisper, anchoring prose in your actual voice.
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    KDP Print Compliance
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <span className="flex items-center gap-1.5 text-red-400 mb-1 font-semibold">
                      <CloseIcon className="h-4 w-4" /> Rejected by Amazon KDP
                    </span>
                    Raw markdown copy-paste missing 0.75" inside gutters, verso/recto headers, and dynamic TOC.
                  </td>
                  <td className="py-4 px-6 text-slate-300 bg-amber-500/5">
                    <span className="flex items-center gap-1.5 text-amber-400 mb-1 font-semibold">
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

      {/* 3. INTERACTIVE 3-STEP DEMONSTRATION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              The 4-Hour Publishing Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              From Raw Thought to Published Paperback
            </h2>
          </div>

          {/* Interactive Steps Bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: 1, title: '1. Ingest Frameworks', desc: 'Whisper audio & notes' },
              { num: 2, title: '2. Co-Write & Illustrate', desc: 'Chapter streaming + micro-refine' },
              { num: 3, title: '3. Vector Cover & Publish', desc: 'KDP print PDF & EPUB' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  activeStep === s.num
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/15'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-amber-400 mb-1">{s.title}</div>
                <div className="text-[11px] text-slate-400 hidden sm:block">{s.desc}</div>
              </button>
            ))}
          </div>

          {/* Step Detail Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl min-h-[300px] flex flex-col justify-between">
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Mic className="h-5 w-5" /> Step 1: Voice & Knowledge Ingestion
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Speak Your Masterclass or Drop Recorded Client Calls
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                  You already explain your methodology every week on Zoom calls. FolioCraft AI ingests audio files (MP3, WAV, M4A) via OpenAI Whisper, indexing your frameworks directly into an immutable Source Materials Vault. The engine synthesizes your insights into an 8-to-10 chapter blueprint with coined nomenclature.
                </p>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-amber-300/90">
                  ✓ Whisper Transcription Completed: "The Sovereign Operating Stack" (3 Credits Deducted)
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="h-5 w-5" /> Step 2: Split-Screen Chapter Studio
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Co-Author Chapter-by-Chapter With Zero Serverless Timeouts
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                  Watch rich 2,000-word chapters stream in real time via Server-Sent Events. Highlight any paragraph and click "Inject Real-World Case Study", "Cut Corporate Fluff", or "Generate Editorial Diagram". Every edit creates a timestamped version snapshot for 1-click rollbacks.
                </p>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-cyan-300/90">
                  ✓ SSE Streaming: 1,840 Words Generated • Global Memory Context Anchored • 2 Revision Diffs Saved
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Palette className="h-5 w-5" /> Step 3: Decoupled Vector Cover & 1-Click KDP Export
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Design Crisp Vector Covers & Export Press-Ready 6x9 Paperbacks
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                  Combine pure DALL-E 3 background art with vector typography overlays. The platform computes your Amazon KDP paperback spine width dynamically ($Spine = Pages \times 0.002252"$) and formats interior PDFs with 0.75" inside gutter margins and running headers.
                </p>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-300/90">
                  ✓ KDP PDF Export: 6x9 Trim • 0.75" Gutter • Spine 0.324" • Barcode Box Positioned • Valid EPUB3
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                Experience Studio in Action <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Transparent Credit Economics
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Invest in Authority, Not Hourly Retainers
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Start free with 20 welcome credits. Upgrade to priority tiers or buy top-up packs with zero monthly lock-in.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? 'border-2 border-amber-500 bg-slate-900 shadow-2xl shadow-amber-500/20 md:-translate-y-2'
                    : 'border border-slate-800 bg-slate-900/60'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-950 shadow-md">
                    Most Popular for Authors
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-4xl font-extrabold text-white">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                    <div className="font-bold text-amber-300">
                      {plan.creditsPerMonth} Credits / Month
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {plan.id === 'free' ? 'Included on free signup' : `Yields ~${Math.floor(plan.creditsPerMonth / 70)} full books + revisions`}
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isCheckoutLoading === plan.id}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                      plan.isPopular
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/25'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {isCheckoutLoading === plan.id ? 'Connecting...' : plan.priceMonthly === 0 ? 'Start Writing Free' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Credit Top-Up Pack Banner */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Instant Credit Top-Up
              </span>
              <h3 className="text-xl font-bold text-white">Need Additional Generation Firepower?</h3>
              <p className="text-xs text-slate-400 max-w-lg">
                Top-up 50 credits for $19 or 150 credits for $49 without recurring subscriptions. Credits never expire.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCheckout('topup_50')}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                50 Credits ($19)
              </button>
              <button
                onClick={() => handleCheckout('topup_150')}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                150 Credits ($49)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ ACCORDION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-amber-400 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
