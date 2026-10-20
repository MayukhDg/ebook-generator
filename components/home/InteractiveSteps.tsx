'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic, PenTool, Palette, Sparkles, ArrowRight } from 'lucide-react';

export default function InteractiveSteps() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="space-y-8">
      {/* Interactive Steps Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, title: '1. Ingest Frameworks', desc: 'Whisper audio & notes', icon: Mic },
          { num: 2, title: '2. Co-Write & Illustrate', desc: 'Chapter streaming + micro-refine', icon: PenTool },
          { num: 3, title: '3. Vector Cover & Publish', desc: 'KDP print PDF & EPUB', icon: Palette },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeStep === s.num
                  ? 'border-orange-300 bg-white shadow-warm'
                  : 'border-gray-200/60 bg-white/50 hover:border-gray-300 hover:bg-white/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${activeStep === s.num ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold ${activeStep === s.num ? 'text-orange-600' : 'text-gray-600'}`}>
                  {s.title}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 hidden sm:block">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-card min-h-[300px] flex flex-col justify-between">
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
              <Mic className="h-5 w-5" /> Step 1: Voice & Knowledge Ingestion
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Speak Your Masterclass or Drop Recorded Client Calls
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
              You already explain your methodology every week on Zoom calls. OpusCraft ingests audio files (MP3, WAV, M4A) via OpenAI Whisper, indexing your frameworks directly into an immutable Source Materials Vault. The engine synthesizes your insights into an 8-to-10 chapter blueprint with coined nomenclature.
            </p>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 font-mono text-xs text-emerald-700">
              ✓ Whisper Transcription Completed: "The Sovereign Operating Stack" (3 Credits Deducted)
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
              <Sparkles className="h-5 w-5" /> Step 2: Split-Screen Chapter Studio
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Co-Author Chapter-by-Chapter With Zero Serverless Timeouts
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
              Watch rich 2,000-word chapters stream in real time via Server-Sent Events. Highlight any paragraph and click "Inject Real-World Case Study", "Cut Corporate Fluff", or "Generate Editorial Diagram". Every edit creates a timestamped version snapshot for 1-click rollbacks.
            </p>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 font-mono text-xs text-blue-700">
              ✓ SSE Streaming: 1,840 Words Generated • Global Memory Context Anchored • 2 Revision Diffs Saved
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
              <Palette className="h-5 w-5" /> Step 3: Decoupled Vector Cover & 1-Click KDP Export
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Design Crisp Vector Covers & Export Press-Ready 6x9 Paperbacks
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
              Combine pure DALL-E 3 background art with vector typography overlays. The platform computes your Amazon KDP paperback spine width dynamically (Spine = Pages × 0.002252") and formats interior PDFs with 0.75" inside gutter margins and running headers.
            </p>
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 font-mono text-xs text-violet-700">
              ✓ KDP PDF Export: 6x9 Trim • 0.75" Gutter • Spine 0.324" • Barcode Box Positioned • Valid EPUB3
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-500"
          >
            Experience Studio in Action <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
