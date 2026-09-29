'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  BookOpen, 
  Sparkles, 
  Save, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  FileText, 
  Mic, 
  CheckCircle2, 
  History, 
  Image as ImageIcon, 
  Wand2,
  PlusCircle,
  Loader2,
  Eye,
  Edit3
} from 'lucide-react';
import { Book, Chapter } from '@/lib/types';
import { cleanHumanProse } from '@/lib/utils';
import SourceMaterialsVault from '@/components/book/SourceMaterialsVault';

interface ChapterStudioProps {
  initialBook: Book;
  initialChapters: Chapter[];
  initialChapterId: string;
}

export default function ChapterStudio({
  initialBook,
  initialChapters,
  initialChapterId,
}: ChapterStudioProps) {
  const router = useRouter();
  const [book, setBook] = useState<Book>(initialBook);
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [viewMode, setViewMode] = useState<'clean' | 'edit'>('clean');

  // Locate the target chapter with fallback to chapter 1
  const resolvedChapter = 
    initialChapters.find((c) => c.id === initialChapterId || String(c.chapter_number) === initialChapterId) ||
    initialChapters[0] ||
    null;

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(resolvedChapter);
  const [markdownContent, setMarkdownContent] = useState<string>(resolvedChapter?.content_markdown || '');
  const [wordCount, setWordCount] = useState<number>(
    resolvedChapter?.word_count || 
    (resolvedChapter?.content_markdown ? resolvedChapter.content_markdown.trim().split(/\s+/).filter(Boolean).length : 0)
  );

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<'outline' | 'memory' | 'sources'>('outline');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<Array<{ version: number; time: string; text: string }>>(
    resolvedChapter
      ? [{ version: resolvedChapter.version || 1, time: 'Initial Load', text: resolvedChapter.content_markdown || '' }]
      : []
  );
  const [showRevisions, setShowRevisions] = useState<boolean>(false);
  const [isAddingChapter, setIsAddingChapter] = useState<boolean>(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1-Click clean up unnecessary '#' and '*' symbols, convert excessive em dashes, and humanize
  const handleCleanAndHumanize = () => {
    const cleaned = cleanHumanProse(markdownContent);
    setMarkdownContent(cleaned);
    const count = cleaned.trim() === '' ? 0 : cleaned.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(count);
    handleSaveChapter(cleaned);
    setStatusMessage('Cleaned chapter! Removed unnecessary "#" and "*", reduced em dashes, and humanized formatting.');
  };

  // Update state when initialChapterId changes (e.g. browser navigation)
  useEffect(() => {
    const matched = chapters.find((c) => c.id === initialChapterId || String(c.chapter_number) === initialChapterId);
    if (matched && matched.id !== currentChapter?.id) {
      setCurrentChapter(matched);
      setMarkdownContent(matched.content_markdown || '');
      const count = matched.word_count || (matched.content_markdown ? matched.content_markdown.trim().split(/\s+/).filter(Boolean).length : 0);
      setWordCount(count);
      setRevisionHistory([
        { version: matched.version || 1, time: 'Initial Load', text: matched.content_markdown || '' },
      ]);
      setSelectedText('');
    }
  }, [initialChapterId, chapters]);

  // Save chapter content to the database
  const handleSaveChapter = useCallback(async (content: string, silent = false) => {
    if (!currentChapter || !book) return;
    if (!silent) setIsSaving(true);
    try {
      const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).filter(Boolean).length;
      const res = await fetch(`/api/books/${book.id}/chapters/${currentChapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_markdown: content,
          status: content.trim().length > 100 ? 'completed' : currentChapter.status,
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
        if (!silent) setStatusMessage('Chapter saved successfully.');
        
        // Update chapter word count and status in local chapters list
        setChapters((prev) =>
          prev.map((c) =>
            c.id === currentChapter.id
              ? { ...c, content_markdown: content, word_count: words, status: content.trim().length > 100 ? 'completed' : c.status }
              : c
          )
        );
      } else {
        const d = await res.json().catch(() => ({ error: 'Network response was not JSON' }));
        if (!silent) setStatusMessage(`Save failed: ${d.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      if (!silent) setStatusMessage(`Save error: ${err.message}`);
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [currentChapter, book]);

  // Keyboard shortcut Ctrl+S / Cmd+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveChapter(markdownContent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveChapter, markdownContent]);

  // Track word count on text changes + trigger auto-save debounce
  const handleContentChange = (newText: string) => {
    setMarkdownContent(newText);
    const words = newText.trim() === '' ? 0 : newText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);

    // Auto-save after 3 seconds of inactivity
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSaveChapter(newText, true);
    }, 3000);
  };

  // Switch to another chapter smoothly
  const handleSelectChapter = (ch: Chapter) => {
    if (ch.id === currentChapter?.id) return;
    // Auto-save current work first
    if (markdownContent !== currentChapter?.content_markdown) {
      handleSaveChapter(markdownContent, true);
    }

    setCurrentChapter(ch);
    setMarkdownContent(ch.content_markdown || '');
    const count = ch.word_count || (ch.content_markdown ? ch.content_markdown.trim().split(/\s+/).filter(Boolean).length : 0);
    setWordCount(count);
    setSelectedText('');
    setRevisionHistory([
      { version: ch.version || 1, time: 'Initial Load', text: ch.content_markdown || '' },
    ]);
    router.push(`/dashboard/books/${book.id}/chapter/${ch.id}`);
  };

  // Track user text selection in the editor
  const handleSelectText = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      if (start !== end) {
        setSelectedText(markdownContent.substring(start, end));
      } else {
        setSelectedText('');
      }
    }
  };

  // Add new chapter directly from studio
  const handleAddNewChapter = async () => {
    if (!book || isAddingChapter) return;
    setIsAddingChapter(true);
    try {
      const nextNum = chapters.length + 1;
      const res = await fetch(`/api/books/${book.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chapter ${nextNum}: New Horizons & Strategy`,
          autoGenerateContent: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chapter) {
          setChapters((prev) => [...prev, data.chapter]);
          handleSelectChapter(data.chapter);
        }
      }
    } catch (err) {
      console.error('Failed to add chapter:', err);
    } finally {
      setIsAddingChapter(false);
    }
  };

  // Stream Chapter via Server-Sent Events (SSE)
  const handleStreamChapter = async () => {
    if (!book || !currentChapter) return;
    setIsStreaming(true);
    setStatusMessage('Streaming chapter draft with Global Context injection...');
    setMarkdownContent('');

    try {
      const response = await fetch('/api/ai/chapter/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentChapter.id,
          bookId: book.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Streaming response was not JSON' }));
        throw new Error(errData.error || 'Streaming error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.replace('data: ', ''));
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMarkdownContent(accumulated);
                  setWordCount(accumulated.trim().split(/\s+/).filter(Boolean).length);
                }
                if (parsed.done) {
                  setStatusMessage('Chapter generation complete! 5 Credits deducted.');
                  setRevisionHistory((prev) => [
                    { version: (currentChapter.version || 1) + 1, time: 'Generated Draft', text: accumulated },
                    ...prev,
                  ]);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsStreaming(false);
    }
  };

  // Iterative AI Refinement Bar Handler (2 Credits)
  const handleRefine = async (instructionType: string, promptText?: string) => {
    if (!currentChapter) return;
    setIsRefining(true);
    setStatusMessage(`Applying refinement: ${instructionType}...`);

    try {
      const res = await fetch('/api/ai/chapter/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentChapter.id,
          instructionType,
          selectedText: selectedText || undefined,
          customPrompt: promptText || undefined,
          currentContent: markdownContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refinement failed');

      setMarkdownContent(data.refinedContent);
      setWordCount(data.refinedContent.trim().split(/\s+/).filter(Boolean).length);
      setSelectedText('');
      setCustomPrompt('');
      setStatusMessage('Refinement applied successfully! 2 Credits deducted.');

      // Save revision snapshot for 1-click rollback
      setRevisionHistory((prev) => [
        { version: data.newVersion, time: `Refined: ${instructionType}`, text: data.refinedContent },
        ...prev,
      ]);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  // In-Chapter Illustration Generator (2 Credits)
  const handleGenerateIllustration = async () => {
    if (!currentChapter) return;
    setIsGeneratingIllustration(true);
    setStatusMessage('Generating in-chapter editorial diagram...');

    try {
      const res = await fetch('/api/ai/illustration/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentChapter.id,
          sectionText: selectedText || currentChapter.title,
          caption: `Figure ${currentChapter.chapter_number}.1: Architectural blueprint for ${currentChapter.title}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Illustration generation failed');

      if (data.updatedContent) {
        setMarkdownContent(data.updatedContent);
        setWordCount(data.updatedContent.trim().split(/\s+/).filter(Boolean).length);
      }
      setStatusMessage('Illustration embedded into editor! 2 Credits deducted.');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  // Rollback to specific version snapshot
  const handleRestoreRevision = (revText: string) => {
    setMarkdownContent(revText);
    setWordCount(revText.trim().split(/\s+/).filter(Boolean).length);
    setStatusMessage('Restored previous revision snapshot.');
    setShowRevisions(false);
  };

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 space-y-4">
          <BookOpen className="h-10 w-10 text-amber-500/60" />
          <h2 className="text-lg font-bold text-white">No Chapters Found</h2>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            This book does not have any chapters created yet.
          </p>
          <button
            onClick={handleAddNewChapter}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all"
          >
            Create Chapter 1
          </button>
        </div>
      </div>
    );
  }

  const prevChapter = chapters.find((c) => c.chapter_number === currentChapter.chapter_number - 1);
  const nextChapter = chapters.find((c) => c.chapter_number === currentChapter.chapter_number + 1);

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col">
      <Navbar />

      {/* Chapter Studio Subheader */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/books/${book.id}`}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Book Overview
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                CH {currentChapter.chapter_number}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {currentChapter.title}
              </h1>
            </div>
          </div>

          {/* Right Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Clean View vs Direct Editor */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => setViewMode('clean')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === 'clean'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Clean human reading view without raw markdown symbols"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clean View</span>
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === 'edit'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Direct text editor"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
            </div>

            {/* Clean & Humanize 1-Click Button */}
            <button
              onClick={handleCleanAndHumanize}
              disabled={isSaving || isStreaming}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all disabled:opacity-50"
              title="Clean formatting: strips unnecessary '#' and '*', reduces em dashes, and humanizes prose"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Clean & Humanize</span>
            </button>

            {/* Word Count Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              <span className="text-amber-400 font-mono font-bold">{wordCount}</span>
              <span className="text-slate-500">words</span>
            </div>

            {/* Last-saved indicator */}
            {lastSaved && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}

            {/* Manual Save Button */}
            <button
              onClick={() => handleSaveChapter(markdownContent)}
              disabled={isSaving || isStreaming}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-600/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-600 transition-all disabled:opacity-50"
              title="Save chapter (Ctrl+S)"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Revisions Drawer Trigger */}
            <button
              onClick={() => setShowRevisions(!showRevisions)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <History className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Versions ({revisionHistory.length})</span>
            </button>

            {/* Prev / Next Navigation */}
            <div className="flex items-center gap-1">
              {prevChapter && (
                <button
                  onClick={() => handleSelectChapter(prevChapter)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  title={`Previous: Chapter ${prevChapter.chapter_number}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {nextChapter && (
                <button
                  onClick={() => handleSelectChapter(nextChapter)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  title={`Next: Chapter ${nextChapter.chapter_number}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col md:flex-row mx-auto w-full max-w-7xl p-4 gap-4 overflow-hidden">
        {/* ==================================================================== */}
        {/* LEFT PANE: Outline, Global Memory Context & Source Materials         */}
        {/* ==================================================================== */}
        <div className="w-full md:w-80 shrink-0 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveLeftTab('outline')}
              className={`py-2.5 text-center transition-colors ${
                activeLeftTab === 'outline'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Outline
            </button>
            <button
              onClick={() => setActiveLeftTab('memory')}
              className={`py-2.5 text-center transition-colors ${
                activeLeftTab === 'memory'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Memory
            </button>
            <button
              onClick={() => setActiveLeftTab('sources')}
              className={`py-2.5 text-center transition-colors ${
                activeLeftTab === 'sources'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sources
            </button>
          </div>

          {/* Left Pane Content Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* TAB 1: CHAPTER OUTLINE */}
            {activeLeftTab === 'outline' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Chapters</span>
                  <span>{chapters.length} Total</span>
                </div>
                {chapters.map((ch) => {
                  const isCurrent = ch.id === currentChapter.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChapter(ch)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-mono text-[10px] font-bold ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                          CH {ch.chapter_number}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          ch.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : ch.status === 'review'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ch.status}
                        </span>
                      </div>
                      <div className="font-semibold truncate">{ch.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>{ch.word_count || 0} words</span>
                        <span>v{ch.version || 1}</span>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={handleAddNewChapter}
                  disabled={isAddingChapter}
                  className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/50 text-slate-400 hover:text-amber-400 text-xs font-semibold transition-all mt-2 disabled:opacity-50"
                >
                  {isAddingChapter ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating Next Chapter...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add Chapter {chapters.length + 1}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: GLOBAL MEMORY CONTEXT */}
            {activeLeftTab === 'memory' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                  <span className="font-bold text-amber-400 block text-[11px]">Strict Context Memory</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This global context is injected into every chapter generation call to eliminate LLM context drift and conflicting definitions.
                  </p>
                </div>

                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                    Target Persona
                  </span>
                  <p className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 text-slate-300 text-[11px] leading-relaxed">
                    {book.global_context?.target_persona || book.target_audience}
                  </p>
                </div>

                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                    Core Thesis
                  </span>
                  <p className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 text-slate-300 text-[11px] leading-relaxed">
                    {book.global_context?.core_thesis || book.core_thesis}
                  </p>
                </div>

                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                    Terminology Lexicon
                  </span>
                  <div className="space-y-1.5">
                    {book.global_context?.terminology && Object.keys(book.global_context.terminology).length > 0 ? (
                      Object.entries(book.global_context.terminology).map(([term, def]) => (
                        <div key={term} className="rounded-lg bg-slate-950/80 border border-slate-800 p-2">
                          <span className="font-bold text-amber-300 block">{term}</span>
                          <span className="text-[10px] text-slate-400">{def}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic p-2">No terminology defined yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOURCE MATERIALS VAULT */}
            {activeLeftTab === 'sources' && (
              <div className="space-y-3">
                <SourceMaterialsVault
                  bookId={book.id}
                  initialSources={book.source_materials || []}
                  onSourcesUpdated={(updatedSources) => {
                    setBook((prev) => ({ ...prev, source_materials: updatedSources }));
                  }}
                />
              </div>
            )}
          </div>

          {/* Left Pane Footer: Full Stream Action */}
          <div className="border-t border-slate-800 p-3 bg-slate-950/60">
            <button
              onClick={handleStreamChapter}
              disabled={isStreaming}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isStreaming ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Streaming Chapter (SSE)...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Stream Draft (5 Credits)
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT PANE: Iterative AI Refinement Bar & Rich Markdown Block Editor  */}
        {/* ==================================================================== */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">
          {/* Status Alert Bar if Active */}
          {statusMessage && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                {statusMessage}
              </span>
              <button onClick={() => setStatusMessage(null)} className="text-amber-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Iterative AI Refinement Bar */}
          <div className="border-b border-slate-800/80 bg-slate-950/80 p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 pr-1">
                <Wand2 className="h-3.5 w-3.5 text-amber-400" /> Refine (2 Cr):
              </span>

              {/* 1-Click Refinement Presets */}
              <button
                onClick={() => handleRefine('conversational_tone')}
                disabled={isRefining || isStreaming}
                className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
                title="Rewrites with natural, human, conversational cadence, zero corporate fluff, and sparing em dashes"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                Humanize Voice
              </button>

              <button
                onClick={() => handleRefine('case_study')}
                disabled={isRefining || isStreaming}
                className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-400/60 hover:text-amber-300 transition-all disabled:opacity-50"
              >
                + Case Study
              </button>

              <button
                onClick={() => handleRefine('checklist')}
                disabled={isRefining || isStreaming}
                className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-400/60 hover:text-amber-300 transition-all disabled:opacity-50"
              >
                + Step Checklist
              </button>

              <button
                onClick={handleGenerateIllustration}
                disabled={isGeneratingIllustration || isStreaming}
                className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
              >
                <ImageIcon className="h-3 w-3" />
                In-Chapter Diagram
              </button>
            </div>

            {/* Custom Prompt Input */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                placeholder={selectedText ? `Refine selected text (${selectedText.length} chars)...` : 'Custom instruction prompt...'}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    handleRefine('custom', customPrompt);
                  }
                }}
                className="rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
              />
              <button
                onClick={() => customPrompt.trim() && handleRefine('custom', customPrompt)}
                disabled={!customPrompt.trim() || isRefining}
                className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Highlight indicator if text is selected */}
          {selectedText && (
            <div className="bg-slate-800/60 px-4 py-1.5 text-[11px] text-amber-300 flex items-center justify-between border-b border-slate-800">
              <span className="truncate max-w-md">
                🎯 Target selection: <span className="italic">"{selectedText.substring(0, 60)}..."</span>
              </span>
              <button onClick={() => setSelectedText('')} className="text-slate-400 hover:text-white">
                Clear selection
              </button>
            </div>
          )}

          {/* Main Workspace Area (Clean Reader View or Direct Text Editor) */}
          <div className="flex-1 p-6 relative overflow-y-auto">
            {viewMode === 'clean' ? (
              <div className="max-w-3xl mx-auto space-y-5 py-4 font-sans select-text">
                {markdownContent.trim() === '' ? (
                  <div className="text-center py-20 text-slate-500 space-y-3">
                    <p className="text-sm">This chapter manuscript is currently empty.</p>
                    <p className="text-xs text-slate-600">Click "Stream Draft" on the left, or switch to Editor mode to write.</p>
                  </div>
                ) : (
                  markdownContent.split(/\n\n+/).map((para, idx) => {
                    const trimmed = para.trim();
                    if (!trimmed) return null;

                    // Clean quote / epigraph block
                    if (trimmed.startsWith('"') && (trimmed.includes('—') || trimmed.includes('-') || trimmed.endsWith('"'))) {
                      return (
                        <blockquote
                          key={idx}
                          className="my-5 border-l-2 border-amber-500/70 bg-amber-500/5 px-5 py-3 rounded-r-xl italic text-slate-200 text-sm sm:text-base leading-relaxed"
                        >
                          {trimmed}
                        </blockquote>
                      );
                    }

                    // Section Heading (short line, no ending period)
                    if (trimmed.length < 65 && !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.includes('\n')) {
                      return (
                        <h3
                          key={idx}
                          className="pt-4 text-base sm:text-lg font-bold text-amber-300/90 tracking-tight"
                        >
                          {trimmed}
                        </h3>
                      );
                    }

                    // Standard narrative paragraph
                    return (
                      <p
                        key={idx}
                        className="text-slate-200 text-sm sm:text-base leading-relaxed text-justify sm:text-left font-sans"
                      >
                        {trimmed}
                      </p>
                    );
                  })
                )}

                <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Reading Clean View (Formatting clutter hidden)</span>
                  <button
                    onClick={() => setViewMode('edit')}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Switch to Editor
                  </button>
                </div>
              </div>
            ) : (
              <textarea
                ref={editorRef}
                value={markdownContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleSelectText}
                placeholder="Write your chapter manuscript here in natural, conversational prose..."
                className="w-full h-full min-h-[500px] resize-none bg-transparent font-sans text-sm sm:text-base leading-relaxed text-slate-100 placeholder-slate-600 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Revision History Drawer / Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <History className="h-5 w-5" />
                <h3 className="font-bold text-white text-base">Revision Snapshot History</h3>
              </div>
              <button onClick={() => setShowRevisions(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Every iterative refinement creates an immutable snapshot. Restore any previous draft with 1 click.
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {revisionHistory.map((rev, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">Version {rev.version}</div>
                    <div className="text-[11px] text-slate-400">{rev.time} • {rev.text.split(/\s+/).filter(Boolean).length} words</div>
                  </div>
                  <button
                    onClick={() => handleRestoreRevision(rev.text)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-slate-700"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRevisions(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
