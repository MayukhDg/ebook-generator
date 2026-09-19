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
  BookMarked
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

      setShowCreateModal(false);
      router.push(`/dashboard/books/${book.id}`);
    } catch (err) {
      console.error('Failed to create book blueprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Dashboard Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Authoring Workspace
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                {profile?.subscription_tier?.toUpperCase() || 'FREE'} PLAN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {profile?.full_name || 'Author'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your authority books, chapter pipelines, and decoupled cover studios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              New Authority Book
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Credits Available</span>
              <Coins className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {profile?.credits_balance ?? 20}
            </div>
            <div className="text-xs text-amber-400/80 mt-1 flex items-center justify-between">
              <span>Atomic concurrency guarded</span>
              <Link href="/#pricing" className="underline hover:text-amber-300">Top-Up</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Books</span>
              <BookOpen className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {books.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Amazon KDP 6x9 trade ready
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Global Memory</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              Active
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Zero context drift guarantee
            </div>
          </div>
        </div>

        {/* Books Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              Your Authority Books
            </h2>
            <span className="text-xs text-slate-400">
              {books.length} Books in Workspace
            </span>
          </div>

          {/* ZERO DATA EMPTY STATE */}
          {books.length === 0 && !loading && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-8 sm:p-12 text-center space-y-6">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BookMarked className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white">
                  No Authority Books Yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Your <span className="text-amber-400 font-semibold">{profile?.credits_balance ?? 20} welcome credits</span> are ready. Ingest messy voice notes or initialize an 8-chapter blueprint with zero context drift.
                </p>
              </div>

              {/* 3 Step Quick Start Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs space-y-1">
                  <div className="text-amber-400 font-bold font-mono">01. Blueprint</div>
                  <div className="text-white font-semibold">Synthesize Outline</div>
                  <div className="text-slate-400 text-[11px]">Generate 8-10 chapters with coined frameworks (3 Credits).</div>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs space-y-1">
                  <div className="text-cyan-400 font-bold font-mono">02. Co-Write</div>
                  <div className="text-white font-semibold">Stream Chapters</div>
                  <div className="text-slate-400 text-[11px]">Stream 2,000 words with rolling memory (5 Credits).</div>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs space-y-1">
                  <div className="text-emerald-400 font-bold font-mono">03. Publish</div>
                  <div className="text-white font-semibold">KDP Print & EPUB</div>
                  <div className="text-slate-400 text-[11px]">1-click 6x9 paperback PDF with vector covers.</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
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
                  className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all hover:border-amber-500/40 hover:bg-slate-900/90 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        {b.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(b.updated_at)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-slate-300 font-medium line-clamp-1">
                        {b.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {b.core_thesis}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/books/${b.id}`}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all"
                      >
                        Studio Outline
                      </Link>
                      <Link
                        href={`/dashboard/books/${b.id}/cover`}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
                      >
                        Cover Studio
                      </Link>
                    </div>

                    <a
                      href={`/api/books/${b.id}/export/pdf`}
                      download
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Initialize Authority Book Blueprint
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Costs 3 Credits to construct an 8-chapter outline with strict global context memory.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Autonomous Architect"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g., How to Scale High-Ticket Operations on Autonomous Workflows"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Target Reader Archetype *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., B2B founders and enterprise consultants earning $300k-$1M"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Core Thesis / Counter-Intuitive Truth *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Hourly billing penalizes operational efficiency. Service firms must productize tacit knowledge into autonomous software loops."
                  value={newThesis}
                  onChange={(e) => setNewThesis(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Editorial Tone & Voice
                </label>
                <select
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Authoritative & Practical">Authoritative & Practical</option>
                  <option value="Conversational & Direct">Conversational & Direct</option>
                  <option value="Executive & Strategic">Executive & Strategic</option>
                  <option value="Analytical & Rigorous">Analytical & Rigorous</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Synthesizing Blueprint (3 Cr)...</>
                  ) : (
                    <>Generate Book Blueprint (3 Credits)</>
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
