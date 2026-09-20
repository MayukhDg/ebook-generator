'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  Sparkles, 
  PlusCircle, 
  Coins, 
  Layers, 
  Palette, 
  Printer, 
  FileText, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  X,
  Mic,
  ArrowRight,
  BookMarked,
  ImageIcon
} from 'lucide-react';
import { Book, Profile, CreditTransaction } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Book Wizard State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newThesis, setNewThesis] = useState('');
  const [newTone, setNewTone] = useState('Authoritative & Practical');
  const [newCoverVision, setNewCoverVision] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
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
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAudience || !newThesis) return;

    setIsSubmitting(true);
    try {
      // 1. Create Book Draft
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

      // 2. Generate Blueprint & Global Context (3 Credits)
      await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          title: newTitle,
          subtitle: newSubtitle,
          targetAudience: newAudience,
          coreThesis: newThesis,
          toneVoice: newTone,
        }),
      });

      // 3. Auto-generate cover if user provided a cover vision (4 Credits)
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
    } catch (err) {
      console.error('Failed to create book blueprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Dashboard Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Authoring Workspace
              </span>
              <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] text-orange-600 font-semibold">
                {profile?.subscription_tier?.toUpperCase() || 'FREE'} PLAN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome, {profile?.full_name || 'Author'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Manage your authority books, chapter pipelines, and decoupled cover studios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all shadow-md shadow-orange-500/15 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              New Authority Book
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-card">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Credits Available</span>
              <Coins className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-3xl font-black font-mono text-gray-900">
              {profile?.credits_balance ?? 20}
            </div>
            <div className="text-xs text-orange-500/80 mt-1 flex items-center justify-between">
              <span>Atomic concurrency guarded</span>
              <Link href="/#pricing" className="underline hover:text-orange-600">Top-Up</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-card">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Books</span>
              <BookOpen className="h-4 w-4 text-violet-500" />
            </div>
            <div className="text-3xl font-black font-mono text-gray-900">
              {books.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Amazon KDP 6x9 trade ready
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-card">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Global Memory</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-600">
              Active
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Zero context drift guarantee
            </div>
          </div>
        </div>

        {/* Books Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Your Authority Books
            </h2>
            <span className="text-xs text-gray-400">
              {books.length} Books in Workspace
            </span>
          </div>

          {/* ZERO DATA EMPTY STATE */}
          {books.length === 0 && !loading && (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 backdrop-blur-sm p-8 sm:p-12 text-center space-y-6">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500 border border-orange-100">
                <BookMarked className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-gray-900">
                  No Authority Books Yet
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Your <span className="text-orange-600 font-semibold">{profile?.credits_balance ?? 20} welcome credits</span> are ready. Ingest messy voice notes or initialize an 8-chapter blueprint with zero context drift.
                </p>
              </div>

              {/* 3 Step Quick Start Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
                <div className="rounded-xl border border-gray-200/60 bg-white/80 p-3.5 text-xs space-y-1 shadow-sm">
                  <div className="text-orange-500 font-bold font-mono">01. Blueprint</div>
                  <div className="text-gray-800 font-semibold">Synthesize Outline</div>
                  <div className="text-gray-400 text-[11px]">Generate 8-10 chapters with coined frameworks (3 Credits).</div>
                </div>
                <div className="rounded-xl border border-gray-200/60 bg-white/80 p-3.5 text-xs space-y-1 shadow-sm">
                  <div className="text-violet-500 font-bold font-mono">02. Co-Write</div>
                  <div className="text-gray-800 font-semibold">Stream Chapters</div>
                  <div className="text-gray-400 text-[11px]">Stream 2,000 words with rolling memory (5 Credits).</div>
                </div>
                <div className="rounded-xl border border-gray-200/60 bg-white/80 p-3.5 text-xs space-y-1 shadow-sm">
                  <div className="text-emerald-500 font-bold font-mono">03. Publish</div>
                  <div className="text-gray-800 font-semibold">KDP Print & EPUB</div>
                  <div className="text-gray-400 text-[11px]">1-click 6x9 paperback PDF with vector covers.</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-105 hover:shadow-orange-500/30"
                >
                  <Sparkles className="h-4 w-4" />
                  Initialize Your First Book (3 Credits)
                </button>
              </div>
            </div>
          )}

          {/* POPULATED BOOKS GRID */}
          {books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="group relative rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 transition-all hover:border-orange-200 hover:shadow-card-hover shadow-card flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
                        {b.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(b.updated_at)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-1">
                        {b.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {b.core_thesis}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/books/${b.id}`}
                        className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 py-1.5 text-xs font-bold text-white hover:shadow-md hover:shadow-orange-500/25 transition-all"
                      >
                        Studio Outline
                      </Link>
                      <Link
                        href={`/dashboard/books/${b.id}/cover`}
                        className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-all"
                      >
                        Cover Studio
                      </Link>
                    </div>

                    <a
                      href={`/api/books/${b.id}/export/pdf`}
                      download
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" /> PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Book Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl shadow-gray-300/30 space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Initialize Authority Book Blueprint
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Costs 3 Credits to construct an 8-chapter outline with strict global context memory.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-600 block mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Autonomous Architect"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g., How to Scale High-Ticket Operations on Autonomous Workflows"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">
                  Target Reader Archetype *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., B2B founders and enterprise consultants earning $300k-$1M"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">
                  Core Thesis / Counter-Intuitive Truth *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Hourly billing penalizes operational efficiency. Service firms must productize tacit knowledge into autonomous software loops."
                  value={newThesis}
                  onChange={(e) => setNewThesis(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">
                  Editorial Tone & Voice
                </label>
                <select
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                >
                  <option value="Authoritative & Practical">Authoritative & Practical</option>
                  <option value="Conversational & Direct">Conversational & Direct</option>
                  <option value="Executive & Strategic">Executive & Strategic</option>
                  <option value="Analytical & Rigorous">Analytical & Rigorous</option>
                </select>
              </div>

              {/* Cover Design Vision (NEW) */}
              <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-orange-500" />
                  <label className="font-semibold text-orange-700 block text-xs">
                    Cover Design Vision
                    <span className="font-normal text-gray-400 ml-1">(Optional • 4 Credits)</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g., Abstract watercolor mountains with a sunrise gradient, minimalist warm tones, editorial feel..."
                  value={newCoverVision}
                  onChange={(e) => setNewCoverVision(e.target.value)}
                  className="w-full rounded-lg bg-white border border-orange-200/60 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none"
                />
                <p className="text-[11px] text-gray-400">
                  Describe how your cover should look. If provided, DALL-E 3 will auto-generate the cover background on book creation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:shadow-md hover:shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Synthesizing Blueprint{newCoverVision.trim() ? ' + Cover' : ''} ...</>
                  ) : (
                    <>Generate Book Blueprint ({newCoverVision.trim() ? '3 + 4 Credits' : '3 Credits'})</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
