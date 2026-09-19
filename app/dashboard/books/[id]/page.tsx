import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  Layers, 
  Sparkles, 
  Palette, 
  Printer, 
  FileDown, 
  ExternalLink, 
  Mic, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  PlusCircle,
  Eye
} from 'lucide-react';
import { calculateEstimatedPages, formatNumber } from '@/lib/utils';

export default async function BookOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const book = await store.getBookById(params.id);
  if (!book) {
    notFound();
  }

  const chapters = await store.getChapters(book.id);
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);
  const estimatedPages = calculateEstimatedPages(totalWords);
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;
  const progressPercent = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Workspace
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-amber-400 font-medium">{book.title}</span>
        </div>

        {/* Book Header Banner */}
        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row gap-6 items-start justify-between relative z-10">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  {book.tone_voice}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300">
                  Target: {book.target_audience}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-base sm:text-lg text-slate-300 font-medium">
                  {book.subtitle}
                </p>
              )}

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                <strong className="text-slate-300">Core Thesis:</strong> {book.core_thesis}
              </p>
            </div>

            {/* Quick Action Matrix */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 w-full lg:w-56 shrink-0">
              {chapters.length > 0 && (
                <Link
                  href={`/dashboard/books/${book.id}/chapter/${chapters[0].id}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Open Chapter Studio
                </Link>
              )}

              <Link
                href={`/dashboard/books/${book.id}/cover`}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
              >
                <Palette className="h-4 w-4 text-amber-400" />
                Cover Studio (2-Layer)
              </Link>

              <a
                href={`/api/books/${book.id}/export/pdf`}
                download
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-400" />
                Export KDP Print PDF
              </a>

              <a
                href={`/api/books/${book.id}/export/epub`}
                download
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <FileDown className="h-3.5 w-3.5 text-cyan-400" />
                Export Reflowable EPUB
              </a>

              {book.share_slug && (
                <Link
                  href={`/read/${book.share_slug}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  Public Web Reader
                </Link>
              )}
            </div>
          </div>

          {/* Telemetry Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Words</span>
              <span className="text-xl font-bold font-mono text-white">{formatNumber(totalWords)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">KDP Print Pages</span>
              <span className="text-xl font-bold font-mono text-amber-400">{estimatedPages} pgs</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Spine Width</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {(estimatedPages * 0.002252).toFixed(3)}"
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Progress</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {progressPercent}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Chapter Outline + Global Context & Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chapter Outline List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                Chapter Outline ({chapters.length} Chapters)
              </h2>
              <span className="text-xs text-slate-400">
                Select any chapter to launch split-screen co-authoring
              </span>
            </div>

            <div className="space-y-3">
              {chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/books/${book.id}/chapter/${ch.id}`}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all shadow-md"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        Chapter {ch.chapter_number}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        ch.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ch.status === 'review'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ch.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {ch.word_count || 0} words
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {ch.title}
                    </h3>
                    {ch.summary && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {ch.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 group-hover:text-amber-400 transition-colors">
                    <span className="text-xs font-medium hidden sm:inline">Write & Refine</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Global Context Memory & Source Ingestion */}
          <div className="space-y-6">
            {/* Global Context Memory Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Global Context Memory
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Strict memory rules injected into every chapter to prevent context drift and hallucination.
              </p>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Coined Terminology
                </span>
                <div className="space-y-1.5">
                  {Object.entries(book.global_context?.terminology || {}).map(([term, def]) => (
                    <div key={term} className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2 text-xs">
                      <span className="font-bold text-amber-300 block">{term}</span>
                      <span className="text-[11px] text-slate-400">{def}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Materials Ingestion Box */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Mic className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Source Materials ({book.source_materials.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {book.source_materials.map((mat) => (
                  <div key={mat.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      {mat.type === 'audio_transcript' ? (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] text-amber-400">Audio</span>
                      ) : (
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">Note</span>
                      )}
                      <span className="truncate">{mat.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic line-clamp-3">
                      "{mat.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
