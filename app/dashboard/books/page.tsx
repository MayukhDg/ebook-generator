'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  Sparkles, 
  PlusCircle, 
  Search, 
  SlidersHorizontal, 
  Filter, 
  Clock, 
  ArrowLeft, 
  Layers, 
  Palette, 
  Trash2, 
  X, 
  ChevronRight,
  BookMarked,
  Tag,
  Target,
  Mic,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Book, Profile } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function BooksLibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTone, setSelectedTone] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_desc');

  // Book Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newThesis, setNewThesis] = useState('');
  const [newTone, setNewTone] = useState('Authoritative & Practical');
  const [newChapterCount, setNewChapterCount] = useState<number | string>(10);
  const [newCoverVision, setNewCoverVision] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch initial books & profile
  useEffect(() => {
    async function loadLibraryData() {
      try {
        const [booksRes, profileRes] = await Promise.all([
          fetch('/api/books'),
          fetch('/api/profile'),
        ]);

        if (booksRes.ok) {
          const booksData = await booksRes.json();
          setBooks(Array.isArray(booksData) ? booksData : []);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching library data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLibraryData();
  }, []);

  // Filter & Search Logic
  const filteredAndSortedBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Search query filter (title, subtitle, core_thesis, target_audience, tone_voice)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = book.title?.toLowerCase().includes(query) ?? false;
          const matchSubtitle = book.subtitle?.toLowerCase().includes(query) ?? false;
          const matchThesis = book.core_thesis?.toLowerCase().includes(query) ?? false;
          const matchAudience = book.target_audience?.toLowerCase().includes(query) ?? false;
          const matchTone = book.tone_voice?.toLowerCase().includes(query) ?? false;

          if (!matchTitle && !matchSubtitle && !matchThesis && !matchAudience && !matchTone) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== 'all' && book.status !== selectedStatus) {
          return false;
        }

        // Tone filter
        if (selectedTone !== 'all' && book.tone_voice !== selectedTone) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'updated_desc':
            return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
          case 'updated_asc':
            return new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
          case 'created_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'created_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'title_asc':
            return (a.title || '').localeCompare(b.title || '');
          case 'title_desc':
            return (b.title || '').localeCompare(a.title || '');
          default:
            return 0;
        }
      });
  }, [books, searchQuery, selectedStatus, selectedTone, sortBy]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedTone('all');
    setSortBy('updated_desc');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatus !== 'all' || selectedTone !== 'all';

  // Handle Book Creation
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAudience || !newThesis) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const parsedChapterCount = Math.max(1, Math.min(50, parseInt(String(newChapterCount), 10) || 10));

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          subtitle: newSubtitle || null,
          target_audience: newAudience,
          core_thesis: newThesis,
          tone_voice: newTone,
          share_slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });

      const book = await res.json();
      if (!res.ok) {
        throw new Error(book.error || 'Failed to create book draft');
      }

      // Generate Blueprint
      const outlineRes = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          title: newTitle,
          subtitle: newSubtitle,
          targetAudience: newAudience,
          coreThesis: newThesis,
          toneVoice: newTone,
          chapterCount: parsedChapterCount,
        }),
      });

      const outlineData = await outlineRes.json();
      if (!outlineRes.ok) {
        throw new Error(outlineData.error || 'Failed to generate book blueprint and chapters');
      }

      // Auto-generate cover if vision provided
      if (newCoverVision.trim()) {
        fetch('/api/ai/cover/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: book.id,
            customPrompt: newCoverVision.trim(),
            themePrompt: `${newTitle} - ${newThesis}`,
            stylePreset: 'dark_editorial',
          }),
        }).catch((err) => console.warn('Cover auto-generation failed:', err));
      }

      setShowCreateModal(false);
      router.push(`/dashboard/books/${book.id}`);
    } catch (err: any) {
      console.error('Failed to create book blueprint:', err);
      setSubmitError(err.message || 'An error occurred while creating your book blueprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Book Deletion
  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/books/${deletingBook.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete book');
      }

      // Remove from local state
      setBooks((prev) => prev.filter((b) => b.id !== deletingBook.id));
      setDeletingBook(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting book');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'completed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'generating':
        return 'border-blue-200 bg-blue-50 text-blue-700 animate-pulse';
      case 'draft':
      default:
        return 'border-orange-200 bg-orange-50 text-orange-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Studio
              </Link>
              <span className="text-gray-300">/</span>
              <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                Catalog Library
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              All Authority eBooks
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Search, filter, and access your complete collection of monographs, manuscripts, and cover studios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all shadow-md shadow-orange-500/15 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              New Authority Book
            </button>
          </div>
        </div>

        {/* Search & Filter Bar Controls */}
        <div className="rounded-3xl border border-gray-200/70 bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Live Search Input (Col 6) */}
            <div className="relative md:col-span-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, thesis, audience, or tone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Tone Filter (Col 3) */}
            <div className="md:col-span-3">
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-700 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Tones of Voice</option>
                <option value="Authoritative & Practical">Authoritative & Practical</option>
                <option value="Conversational & Direct">Conversational & Direct</option>
                <option value="Executive & Strategic">Executive & Strategic</option>
                <option value="Analytical & Rigorous">Analytical & Rigorous</option>
                <option value="Inspiring & Visionary">Inspiring & Visionary</option>
              </select>
            </div>

            {/* Status Filter (Col 2) */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-700 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="generating">Generating</option>
                <option value="completed">Completed</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Sort Order (Col 2) */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-700 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              >
                <option value="updated_desc">Recently Updated</option>
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <span>
                Showing <strong className="text-gray-900 font-bold">{filteredAndSortedBooks.length}</strong> of <strong className="text-gray-900 font-bold">{books.length}</strong> eBooks
              </span>
              {hasActiveFilters && (
                <span className="text-orange-500 font-medium">(Filtered)</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 font-semibold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Search & Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-gray-200/60 border border-gray-200" />
            ))}
          </div>
        )}

        {/* Zero Results / Empty States */}
        {!loading && books.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/70 backdrop-blur-sm p-10 sm:p-14 text-center space-y-5">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500 border border-orange-100">
              <BookMarked className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900">Your Library is Empty</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                You haven't authored any books yet. Initialize a blueprint or start drafting with our KDP-grade engine.
              </p>
            </div>
            <div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Initialize Your First eBook
              </button>
            </div>
          </div>
        )}

        {!loading && books.length > 0 && filteredAndSortedBooks.length === 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-10 text-center space-y-4">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-orange-50 text-orange-500 border border-orange-100">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-gray-900">No eBooks Found</h3>
              <p className="text-xs text-gray-500">
                No manuscripts match your current search terms or filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Search & Show All eBooks
            </button>
          </div>
        )}

        {/* POPULATED BOOKS GRID */}
        {!loading && filteredAndSortedBooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedBooks.map((b) => (
              <div
                key={b.id}
                className="group relative rounded-3xl border border-gray-200/70 bg-white/90 backdrop-blur-sm p-5 sm:p-6 transition-all hover:border-orange-200 hover:shadow-card-hover shadow-card flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(b.status)}`}>
                      {b.status}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(b.updated_at || b.created_at)}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                      <Link href={`/dashboard/books/${b.id}`}>
                        {b.title}
                      </Link>
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">
                        {b.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Thesis snippet */}
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {b.core_thesis || 'No core thesis outlined.'}
                  </p>

                  {/* Meta Pills (Audience & Tone) */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      <Target className="h-2.5 w-2.5 text-gray-400" />
                      {b.target_audience || 'General audience'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 border border-orange-100">
                      <Tag className="h-2.5 w-2.5 text-orange-400" />
                      {b.tone_voice}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 border-t border-gray-100 pt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/books/${b.id}`}
                      className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 py-1.5 text-xs font-bold text-white hover:shadow-md hover:shadow-orange-500/25 transition-all"
                    >
                      Studio Outline
                    </Link>
                    <Link
                      href={`/dashboard/books/${b.id}/cover`}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center gap-1"
                    >
                      <Palette className="h-3 w-3" />
                      Cover
                    </Link>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      setDeletingBook(b);
                      setDeleteError(null);
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete eBook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Authority eBook</h3>
                <p className="text-xs text-gray-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100 text-xs text-gray-700 space-y-1">
              <div className="font-semibold text-gray-900">{deletingBook.title}</div>
              <p className="text-gray-400 line-clamp-2">{deletingBook.core_thesis}</p>
            </div>

            {deleteError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                disabled={isDeleting}
                className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                disabled={isDeleting}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete eBook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-gray-100 p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Initialize Authority eBook</h3>
                  <p className="text-xs text-gray-500">Synthesizes thesis, chapter pipelines, and rolling context memory.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateBook} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Sovereign Consultant"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scaling Advisory Revenue with High-Leverage Systems"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Target Audience & Persona <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior tech leads, solo agency founders, or high-ticket consultants"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Core Thesis & Unfair Advantage <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What counter-intuitive, high-leverage insight does this book prove? e.g. Billing by the hour caps advisory leverage; high-performing agencies productize institutional frameworks instead."
                  value={newThesis}
                  onChange={(e) => setNewThesis(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Tone of Voice
                  </label>
                  <select
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
                  >
                    <option value="Authoritative & Practical">Authoritative & Practical</option>
                    <option value="Conversational & Direct">Conversational & Direct</option>
                    <option value="Executive & Strategic">Executive & Strategic</option>
                    <option value="Analytical & Rigorous">Analytical & Rigorous</option>
                    <option value="Inspiring & Visionary">Inspiring & Visionary</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Chapter Count
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={25}
                    value={newChapterCount}
                    onChange={(e) => setNewChapterCount(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                  <span>Cover Aesthetic Vision (Optional)</span>
                  <span className="text-[11px] text-orange-500 lowercase font-normal">Optional auto-generation</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dark moody minimalist marble texture with sharp orange geometric typography"
                  value={newCoverVision}
                  onChange={(e) => setNewCoverVision(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                <div className="text-xs text-gray-400">
                  Cost: <span className="font-semibold text-orange-600">3 Credits (Blueprint)</span> + 1/chapter
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Generating Blueprint...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate eBook Pipeline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
