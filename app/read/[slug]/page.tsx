import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import { BookOpen, Sparkles, ChevronLeft, ChevronRight, Layers, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default async function PublicWebReaderPage({
  params,
}: {
  params: { slug: string };
}) {
  const book = await store.getBookBySlug(params.slug);
  if (!book) {
    notFound();
  }

  const chapters = await store.getChapters(book.id);

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col justify-between">
      {/* Reader Minimal Navigation */}
      <header className="border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                F
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline">FolioCraft AI Reader</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-amber-400 font-semibold truncate max-w-xs">{book.title}</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start Your Book Free
          </Link>
        </div>
      </header>

      {/* Main Reader Document */}
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        {/* Cover & Front Matter Preview */}
        <div className="text-center space-y-4 border-b border-slate-800/80 pb-12">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20">
            PUBLIC READ PREVIEW
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto font-medium">
              {book.subtitle}
            </p>
          )}
          <p className="text-xs text-slate-400 uppercase tracking-widest pt-2">
            By {book.cover_style_config?.author_name || 'Marcus Vance'}
          </p>
        </div>

        {/* Chapters Reading Stream */}
        <div className="space-y-16 py-12">
          {chapters.map((ch) => (
            <article key={ch.id} className="space-y-6">
              <div className="border-b border-slate-800/60 pb-3">
                <span className="text-xs font-bold tracking-widest text-amber-500 uppercase block font-mono">
                  CHAPTER {ch.chapter_number}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                  {ch.title}
                </h2>
              </div>

              {/* Prose Content */}
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-4 font-serif">
                {(ch.content_markdown || '').split('\n\n').map((para, pIdx) => {
                  if (para.startsWith('# ')) return null;
                  if (para.startsWith('## ')) {
                    return (
                      <h3 key={pIdx} className="text-lg sm:text-xl font-bold text-white pt-4 font-sans">
                        {para.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (para.startsWith('![')) {
                    // Render embedded illustration
                    const match = para.match(/!\[(.*?)\]\((.*?)\)/);
                    if (match) {
                      return (
                        <div key={pIdx} className="my-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 text-center">
                          <img src={match[2]} alt={match[1]} className="rounded-xl mx-auto max-h-96 object-contain" />
                          <p className="text-xs text-slate-400 mt-2 italic font-sans">{match[1]}</p>
                        </div>
                      );
                    }
                  }
                  return (
                    <p key={pIdx} className="text-justify indent-4 leading-relaxed">
                      {para.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Subtle Viral Conversion Footer */}
      <footer className="border-t border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 py-8 px-4 text-center">
        <div className="mx-auto max-w-xl space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
            <Sparkles className="h-4 w-4" /> Authored with FolioCraft AI
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Turn your real-world expertise into a published, press-ready book in an afternoon.
          </h3>
          <p className="text-xs text-slate-400">
            Zero hallucinated text. Strict context memory. 1-click Amazon KDP trade paperback & reflowable EPUB export.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
            >
              Start Writing Free (20 Credits)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
