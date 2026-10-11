'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chapter, Book } from '@/lib/types';
import { 
  BookOpen, 
  PlusCircle, 
  ChevronRight, 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  FileText,
  Pencil,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  Check,
  Trash2
} from 'lucide-react';

interface ChapterOutlineSectionProps {
  bookId: string;
  bookTitle: string;
  initialChapters: Chapter[];
  initialBook?: Book;
}

export default function ChapterOutlineSection({
  bookId,
  bookTitle,
  initialChapters,
  initialBook,
}: ChapterOutlineSectionProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTocModal, setShowTocModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline rename state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Delete chapter state
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Table of Contents manual overrides state
  const [tocOverrides, setTocOverrides] = useState<Record<number, number>>(
    initialBook?.cover_style_config?.toc_page_overrides || {}
  );
  const [isSavingToc, setIsSavingToc] = useState(false);
  const [tocStatusMessage, setTocStatusMessage] = useState<string | null>(null);

  const nextChapterNumber = chapters.length + 1;

  // Calculate dynamic start page and page range for each chapter in 6x9 trade paperback
  const getChapterPageInfo = (chapterIdx: number) => {
    let page = 4;
    for (let i = 0; i < chapterIdx; i++) {
      const wc = chapters[i]?.word_count || 0;
      page += Math.max(1, Math.ceil(Math.max(0, wc - 200) / 290) + 1);
    }
    const currentWc = chapters[chapterIdx]?.word_count || 0;
    const pgs = Math.max(1, Math.ceil(Math.max(0, currentWc - 200) / 290) + 1);
    const endPage = page + pgs - 1;

    // Check if user set a manual override
    const chNum = chapters[chapterIdx]?.chapter_number;
    const overriddenStart = tocOverrides[chNum];

    return {
      autoStartPage: page,
      startPage: overriddenStart || page,
      endPage: overriddenStart ? overriddenStart + pgs - 1 : endPage,
      pageCount: pgs,
      isOverridden: !!overriddenStart,
    };
  };

  // Add chapter handler
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

  // Inline rename chapter handler
  const handleRenameChapter = async (chapterId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setEditingChapterId(null);
      return;
    }

    const currentCh = chapters.find((c) => c.id === chapterId);
    if (currentCh && currentCh.title === trimmed) {
      setEditingChapterId(null);
      return;
    }

    try {
      const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });

      if (res.ok) {
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, title: trimmed } : c))
        );
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to rename chapter:', err);
    } finally {
      setEditingChapterId(null);
    }
  };

  // Delete chapter handler
  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/books/${bookId}/chapters/${chapterToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete chapter' }));
        throw new Error(data.error || 'Failed to delete chapter');
      }

      const deletedTitle = chapterToDelete.title;
      const deletedNumber = chapterToDelete.chapter_number;

      // Update chapters list locally with consecutive numbers
      setChapters((prev) => {
        const remaining = prev.filter((c) => c.id !== chapterToDelete.id);
        return remaining.map((ch, idx) => ({
          ...ch,
          chapter_number: idx + 1,
        }));
      });

      setChapterToDelete(null);
      setDeleteSuccess(`Chapter ${deletedNumber} ("${deletedTitle}") was deleted successfully.`);
      setTimeout(() => setDeleteSuccess(null), 4000);

      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting chapter');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save manual TOC overrides
  const handleSaveTocOverrides = async () => {
    setIsSavingToc(true);
    setTocStatusMessage(null);

    try {
      const currentConfig = initialBook?.cover_style_config || ({} as any);
      const updatedConfig = {
        ...currentConfig,
        toc_page_overrides: tocOverrides,
      };

      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_style_config: updatedConfig,
        }),
      });

      if (res.ok) {
        setTocStatusMessage('Table of Contents overrides saved successfully.');
        setTimeout(() => setTocStatusMessage(null), 3000);
      } else {
        const d = await res.json().catch(() => ({ error: 'Failed to save' }));
        setTocStatusMessage(`Save error: ${d.error || 'Unknown'}`);
      }
    } catch (err: any) {
      setTocStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSavingToc(false);
    }
  };

  // Reset TOC overrides back to 100% dynamic auto-detection
  const handleResetTocOverrides = async () => {
    setIsSavingToc(true);
    setTocStatusMessage(null);

    try {
      const currentConfig = initialBook?.cover_style_config || ({} as any);
      const updatedConfig = {
        ...currentConfig,
        toc_page_overrides: {},
      };

      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_style_config: updatedConfig,
        }),
      });

      if (res.ok) {
        setTocOverrides({});
        setTocStatusMessage('Reset to dynamic auto-detection.');
        setTimeout(() => setTocStatusMessage(null), 3000);
      }
    } catch (err: any) {
      setTocStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSavingToc(false);
    }
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Table of Contents & Dynamic Pagination Info Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <FileText className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                Dynamic Table of Contents
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Auto-Aligned
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              PDF exports dynamically compute and synchronize starting page numbers based on actual content layout. You can also customize chapter titles and page overrides.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTocModal(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Edit Table of Contents
        </button>
      </div>

      {deleteSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{deleteSuccess}</span>
          </div>
          <button
            onClick={() => setDeleteSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Section Header with Add Chapter CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            Chapter Outline ({chapters.length} Chapters)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hover over any title to rename, or select a chapter to edit its full manuscript.
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
        {chapters.map((ch, idx) => {
          const pageInfo = getChapterPageInfo(idx);
          const isEditing = editingChapterId === ch.id;

          return (
            <div
              key={ch.id}
              className="group relative flex items-center justify-between p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all shadow-md"
            >
              <div className="space-y-1.5 max-w-xl flex-1 pr-3">
                <div className="flex flex-wrap items-center gap-2">
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

                  {/* Dynamic Page Number Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      pageInfo.isOverridden
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/80 text-amber-400/90 border border-slate-700/60'
                    }`}
                    title={pageInfo.isOverridden ? 'Manual override page' : 'Dynamically calculated 6x9 print page range'}
                  >
                    Pages {pageInfo.startPage}–{pageInfo.endPage}
                    {pageInfo.isOverridden ? ' (Custom)' : ''}
                  </span>

                  <span className="text-xs text-slate-500 font-mono">
                    {ch.word_count || 0} words
                  </span>
                </div>

                {/* Chapter Title (Editable Inline) */}
                {isEditing ? (
                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameChapter(ch.id, editingTitle);
                        else if (e.key === 'Escape') setEditingChapterId(null);
                      }}
                      onBlur={() => handleRenameChapter(ch.id, editingTitle)}
                      className="w-full rounded-lg bg-slate-950 border border-amber-500/50 px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group/title">
                    <Link
                      href={`/dashboard/books/${bookId}/chapter/${ch.id}`}
                      className="text-sm font-bold text-white hover:text-amber-400 transition-colors"
                    >
                      {ch.title}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingChapterId(ch.id);
                        setEditingTitle(ch.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
                      title="Rename chapter"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {ch.summary && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {ch.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteError(null);
                    setChapterToDelete(ch);
                  }}
                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title={`Delete Chapter ${ch.chapter_number}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/dashboard/books/${bookId}/chapter/${ch.id}`}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-slate-800/80"
                >
                  <span className="text-xs font-semibold hidden sm:inline">Review & Edit</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {chapters.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-3 bg-slate-950/30">
            <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No chapters in this outline yet</p>
            <p className="text-xs text-slate-500">Click &quot;Add More Chapters&quot; above to start building your manuscript.</p>
          </div>
        )}
      </div>

      {/* Edit Table of Contents Modal */}
      {showTocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  Table of Contents Inspector
                </div>
                <h3 className="text-base font-bold text-white">
                  Table of Contents & Pagination
                </h3>
              </div>
              <button
                onClick={() => setShowTocModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning & Instructions */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" />
                Dynamic Page Alignment Notice
              </div>
              <p className="text-[11px] leading-relaxed">
                FolioCraft AI automatically verifies exact starting pages by analyzing rendered 6x9 trade paperback typesetting. If you leave page numbers on <strong>Auto</strong>, they will dynamically adjust whenever you edit or expand content. You may also specify manual page number overrides below.
              </p>
            </div>

            {tocStatusMessage && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                {tocStatusMessage}
              </div>
            )}

            {/* Chapters TOC Rows */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {chapters.map((ch, idx) => {
                const info = getChapterPageInfo(idx);
                const currentOverride = tocOverrides[ch.chapter_number];

                return (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono font-bold text-amber-400 text-[11px] shrink-0">
                        CH {ch.chapter_number}
                      </span>
                      <span className="font-medium text-slate-200 truncate">
                        {ch.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        Auto: pg. {info.autoStartPage}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Page:</span>
                        <input
                          type="number"
                          min={1}
                          placeholder={String(info.autoStartPage)}
                          value={currentOverride || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setTocOverrides((prev) => {
                              const next = { ...prev };
                              if (val && val > 0) {
                                next[ch.chapter_number] = val;
                              } else {
                                delete next[ch.chapter_number];
                              }
                              return next;
                            });
                          }}
                          className="w-14 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetTocOverrides}
                disabled={isSavingToc || Object.keys(tocOverrides).length === 0}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-40"
              >
                <RefreshCw className="h-3 w-3" />
                Reset to Auto-Detection
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTocModal(false)}
                  className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveTocOverrides}
                  disabled={isSavingToc}
                  className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSavingToc ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Overrides'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Chapter Confirmation Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Delete Chapter {chapterToDelete.chapter_number}?
                  </h3>
                  <p className="text-xs text-rose-400/90 font-medium">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setChapterToDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <p className="text-xs text-slate-300">
                You are about to delete <span className="font-semibold text-white">&quot;{chapterToDelete.title}&quot;</span> ({chapterToDelete.word_count || 0} words).
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All written drafts, notes, and manuscript content for this chapter will be permanently removed. Remaining chapters will be automatically renumbered.
              </p>
            </div>

            {deleteError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChapterToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChapter}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all disabled:opacity-50 shadow-lg shadow-rose-950"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Chapter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
