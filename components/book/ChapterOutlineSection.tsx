'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chapter } from '@/lib/types';
import { 
  BookOpen, 
  PlusCircle, 
  ChevronRight, 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';

interface ChapterOutlineSectionProps {
  bookId: string;
  bookTitle: string;
  initialChapters: Chapter[];
}

export default function ChapterOutlineSection({
  bookId,
  bookTitle,
  initialChapters,
}: ChapterOutlineSectionProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextChapterNumber = chapters.length + 1;

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/books/${bookId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || `Chapter ${nextChapterNumber}: Expanding the Core Framework`,
          summary: summary.trim() || `Advanced operational insights and tactical applications continuing from Chapter ${chapters.length}.`,
          autoGenerateContent: autoGenerate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add chapter');
      }

      if (data.chapter) {
        setChapters((prev) => [...prev, data.chapter]);
      }

      // Reset form
      setTitle('');
      setSummary('');
      setShowAddModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Section Header with Add Chapter CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            Chapter Outline ({chapters.length} Chapters)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            All chapter manuscripts are auto-generated. Select any chapter to review or refine.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all shadow-sm"
        >
          <PlusCircle className="h-3.5 w-3.5 text-amber-400" />
          Add More Chapters
        </button>
      </div>

      {/* Chapter Cards List */}
      <div className="space-y-3">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/dashboard/books/${bookId}/chapter/${ch.id}`}
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

            <div className="flex items-center gap-2 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-4">
              <span className="text-xs font-medium hidden sm:inline">Review & Edit</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="h-4 w-4" />
                  Add Chapter {nextChapterNumber}
                </div>
                <h3 className="text-lg font-bold text-white">Expand Your Book Blueprint</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddChapter} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  placeholder={`e.g., Chapter ${nextChapterNumber}: Scaling The Sovereign Moat`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Chapter Intent / Core Focus (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what tactical frameworks or case studies this chapter will address..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
                  />
                  <span className="font-semibold text-slate-200">
                    Auto-generate complete manuscript immediately (1 Credit)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  Synthesizes full ~1,500 words with field war stories and checklists grounded in your global book memory.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Adding Chapter...
                    </>
                  ) : (
                    <>Add Chapter {nextChapterNumber} {autoGenerate ? '(1 Credit)' : ''}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
