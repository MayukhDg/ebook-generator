import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/data/store';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: 'Authority Publishing & AEO Insights | FolioCraft AI',
  description: 'Technical breakdowns, publishing frameworks, and non-fiction authoring strategies for consultants, founders, and high-output operators.',
};

export default async function BlogIndexPage() {
  const posts = await store.getBlogPosts(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            AUTHORITY EDITORIAL & AEO VAULT
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            The Author Engine Publication
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Data-driven publishing frameworks, AI context drift solutions, and Amazon KDP strategies for founders and consultants.
          </p>
        </div>

        {/* Flagship Articles Grid */}
        {posts.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-800/80 bg-slate-900/40 p-10 sm:p-12 text-center backdrop-blur-xl space-y-4 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Articles In Preparation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              In-depth playbooks, AEO blueprints, and Amazon KDP publishing frameworks are currently being written. Check back soon or launch the studio to begin co-authoring your own book.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/15"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all hover:border-amber-500/40 hover:bg-slate-900/90 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      post.funnel_stage === 'awareness'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : post.funnel_stage === 'consideration'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {post.funnel_stage}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(post.published_at)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {post.meta_description}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-slate-500" />
                    {post.target_keywords?.[0] || 'Publishing'}
                  </span>
                  <span className="font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read Article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
