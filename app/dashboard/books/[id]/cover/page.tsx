import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CoverDesigner from '@/components/studio/CoverDesigner';
import { ChevronLeft, BookOpen, Layers, Printer, FileDown } from 'lucide-react';

export default async function BookCoverPage({ params }: { params: { id: string } }) {
  const book = await store.getBookById(params.id);
  if (!book) {
    notFound();
  }

  const chapters = await store.getChapters(book.id);
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Layers className="h-3.5 w-3.5" /> Workspace
            </Link>
            <span className="text-slate-600">/</span>
            <Link
              href={`/dashboard/books/${book.id}`}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" /> {book.title}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-medium">Cover Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/books/${book.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Outline
            </Link>
            <a
              href={`/api/books/${book.id}/export/pdf`}
              download
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
            >
              <Printer className="h-3.5 w-3.5" /> Export KDP PDF
            </a>
          </div>
        </div>

        {/* Cover Designer Studio Component */}
        <CoverDesigner book={book} totalWords={totalWords || 12000} />
      </main>

      <Footer />
    </div>
  );
}
