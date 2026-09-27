import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Sparkles, Calendar, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import BlogPostContent from '@/components/blog/BlogPostContent';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await store.getBlogPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | FolioCraft AI`,
    description: post.meta_description,
    keywords: post.target_keywords,
    alternates: {
      canonical: post.canonical_url || `https://foliocraft.ai/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.published_at,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await store.getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  // Generate Article JSON-LD Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: {
      '@type': 'Organization',
      name: 'FolioCraft AI Research Team',
      url: 'https://foliocraft.ai',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FolioCraft AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://foliocraft.ai/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonical_url || `https://foliocraft.ai/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      {/* Dynamic SEO/AEO/GEO Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {post.schema_json && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schema_json) }}
        />
      )}

      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Publication Index
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-800/80 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300 uppercase">
              {post.funnel_stage}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(post.published_at)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">6 min read</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
            {post.meta_description}
          </p>
        </header>

        {/* High-Contrast 68ch Measure Editorial Reader Layout */}
        <article className="max-w-none">
          <BlogPostContent content={post.content_markdown} />
        </article>

        {/* In-Article Conversion Banner */}
        <div className="my-12 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 p-8 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> Stop Writing AI Slop
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Publish your authority book in an afternoon with FolioCraft AI.
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Ingest voice memos, synthesize an 8-chapter blueprint with strict context memory, design crisp vector covers, and export 1-click Amazon KDP trade paperback PDFs.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
            >
              Start Free (20 Credits Included)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
