'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Code, 
  Check, 
  Eye, 
  PlusCircle, 
  Trash2,
  Send,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Layers,
  Wand2,
  Calendar,
  Tag,
  Edit3,
  XCircle,
  Save
} from 'lucide-react';
import { FunnelStage, BlogPost } from '@/lib/types';
import { slugify, formatDate } from '@/lib/utils';
import BlogPostContent from '@/components/blog/BlogPostContent';

export default function AdminBlogCMSPage() {
  const formRef = useRef<HTMLFormElement>(null);

  // Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [isPublished, setIsPublished] = useState(true);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
  ]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [successPost, setSuccessPost] = useState<{ title: string; slug: string; isUpdated?: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing posts state
  const [existingPosts, setExistingPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        setExistingPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-update slug only if not editing and slug hasn't been manually diverged
    if (!editingPostId && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', val: string) => {
    const updated = [...faqs];
    updated[index][field] = val;
    setFaqs(updated);
  };

  // Compile JSON-LD schema dynamically
  const generatedSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
      .filter((f) => f.question?.trim() && f.answer?.trim())
      .map((f) => ({
        '@type': 'Question',
        name: f.question.trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer.trim(),
        },
      })),
  };

  // Pre-fill a sample article
  const handleLoadSample = () => {
    setEditingPostId(null);
    setTitle('How to Get Started with Digital Publishing & AI eBooks');
    setSlug('how-to-get-started-with-digital-publishing-ai-ebooks');
    setFunnelStage('awareness');
    setMetaDescription('Learn how to turn domain expertise, audio transcripts, and structured frameworks into bestseller-ready digital eBooks with AI.');
    setKeywords('digital publishing, AI ebook generator, amazon kdp, self-publishing');
    setContentMarkdown(`# How to Get Started with Digital Publishing & AI eBooks

In the modern digital economy, the barrier between possessing deep expertise and publishing an authoritative non-fiction book has collapsed. 

For consultants, founders, and subject matter experts, publishing an eBook is no longer merely about royalties—it is the ultimate asymmetric credential. An authoritative book positions you at the pinnacle of your category, commands premium consulting retainers, and opens doors to speaking engagements and enterprise partnerships.

---

## 1. The Death of the 9-Month Writing Agony

Traditional publishing required authors to isolate themselves for a year, writing 60,000 words into a void. Under that model:
- 80% of books were abandoned before completion.
- Fast-evolving industries outpaced the publishing timeline before the manuscript ever hit print.
- Tactical operational frameworks were diluted into academic fluff.

Today, AI-augmented authoring platforms allow operators to **codify existing client frameworks, Zoom recordings, and voice memos** into an immutable global memory architecture.

---

## 2. The 4-Step High-Velocity Publishing Architecture

To publish an Amazon KDP-ready book in days rather than quarters, deploy this sequential pipeline:

1. **Thesis Anchoring:** Define the single counter-intuitive truth that sets your methodology apart from conventional industry cliches.
2. **Modular Blueprinting:** Structure your book into 8 to 12 focused, high-impact chapters with actionable rubrics and field stories.
3. **Voice Transcripts & Deep Drafting:** Ground the manuscript in authentic voice notes and proprietary terminology so the prose carries zero generic AI fluff.
4. **Decoupled Cover & Dual-Format Export:** Produce trade 6x9 print PDFs with calculated spine geometry and reflowable EPUBs simultaneously.

---

## 3. Optimizing for Answer Engine Optimization (AEO)

As search engines evolve into conversational AI answer engines (ChatGPT Search, Perplexity, Google AI Overviews), your digital publication needs structured data.

Embedding **FAQPage and Article JSON-LD schemas** ensures your frameworks are ingested as canonical consensus citations when prospects ask AI about your industry.`);
    setFaqs([
      {
        question: 'Does Amazon KDP allow books written with AI assistance?',
        answer: 'Yes. Amazon KDP requires disclosure of AI-generated content during the upload process, but explicitly permits AI-assisted non-fiction provided the author owns the IP and ensures factual accuracy and copyright compliance.'
      },
      {
        question: 'How long should an authority digital book be?',
        answer: 'For business, consulting, and authority non-fiction, optimal length is typically between 15,000 and 35,000 words (80 to 180 trade paperback pages). Readers prefer concise, high-signal operational frameworks over repetitive fluff.'
      }
    ]);

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Populate form with existing post for editing
  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setFunnelStage(post.funnel_stage);
    setMetaDescription(post.meta_description || '');
    setKeywords(Array.isArray(post.target_keywords) ? post.target_keywords.join(', ') : '');
    setContentMarkdown(post.content_markdown || '');
    setIsPublished(post.is_published ?? true);

    // Extract FAQs if present
    const schemaEntity = (post.schema_json as any)?.mainEntity;
    if (Array.isArray(schemaEntity) && schemaEntity.length > 0) {
      setFaqs(schemaEntity.map((item: any) => ({
        question: item.name || '',
        answer: item.acceptedAnswer?.text || '',
      })));
    } else {
      setFaqs([{ question: '', answer: '' }]);
    }

    setErrorMessage(null);
    setSuccessPost(null);

    // Scroll up to form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setFunnelStage('awareness');
    setMetaDescription('');
    setKeywords('');
    setContentMarkdown('');
    setIsPublished(true);
    setFaqs([{ question: '', answer: '' }]);
    setErrorMessage(null);
  };

  // Submit Handler: Creates or Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentMarkdown.trim()) {
      setErrorMessage('Please provide both an article title and markdown content.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessPost(null);

    try {
      const cleanSlug = slug.trim() || slugify(title);
      const payload = {
        title: title.trim(),
        slug: cleanSlug,
        funnel_stage: funnelStage,
        meta_description: metaDescription.trim() || title.trim(),
        target_keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        content_markdown: contentMarkdown.trim(),
        schema_json: generatedSchema,
        is_published: isPublished,
      };

      const url = editingPostId ? `/api/blog/${editingPostId}` : '/api/blog';
      const method = editingPostId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article.');
      }

      setSuccessPost({
        title: data.title || title,
        slug: data.slug || cleanSlug,
        isUpdated: !!editingPostId,
      });

      // Reset form
      handleCancelEdit();
      loadPosts();
    } catch (err: any) {
      console.error('Error saving blog post:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (id: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${postTitle}"?`)) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete article.');
      }

      setExistingPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingPostId === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      alert(`Error deleting post: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" /> Admin Editorial CMS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              AEO & SEO Article Publisher
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Publish, update, and manage search-optimized articles pre-engineered with FAQPage and HowTo JSON-LD schemas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-all shadow-sm"
            >
              <Wand2 className="h-3.5 w-3.5 text-orange-500" />
              Load Sample Post
            </button>
            <Link
              href="/blog"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Eye className="h-3.5 w-3.5 text-gray-500" />
              View Public Blog
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Editing Banner */}
        {editingPostId && (
          <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Edit3 className="h-4 w-4 text-orange-600 shrink-0" />
              <div className="text-xs text-orange-900">
                <span className="font-bold">Editing Mode:</span> Updating existing post <strong>"{title}"</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Editing & Create New
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successPost && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5 flex items-start justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  {successPost.isUpdated ? 'Article Updated Successfully!' : 'Article Published Successfully!'}
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  <strong>"{successPost.title}"</strong> is saved in your database with structured schemas.
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <Link
                    href={`/blog/${successPost.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                  >
                    View Live Article <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSuccessPost(null)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 flex items-center justify-between gap-3 text-xs text-red-700 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Editor Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Editor (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., How to Get Started with Digital Publishing & AI eBooks"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="how-to-get-started-with-digital-publishing"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Funnel Stage
                </label>
                <select
                  value={funnelStage}
                  onChange={(e) => setFunnelStage(e.target.value as FunnelStage)}
                  className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                >
                  <option value="awareness">Awareness (Problem / Digital Publishing / Tips)</option>
                  <option value="consideration">Consideration (How-To / Step-by-Step Guides)</option>
                  <option value="purchase">Purchase (Comparisons / Reviews / Case Studies)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Meta Description (SERP & Answer Engine Snippet)
                </label>
                <span className={`text-[11px] ${metaDescription.length > 160 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {metaDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="A compelling synopsis under 160 characters for Google and Perplexity snippets..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., digital publishing, AI ebook generator, amazon kdp, authority books"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 block">
                  Markdown Body Content *
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400">
                    {contentMarkdown ? `${contentMarkdown.trim().split(/\s+/).filter(Boolean).length} words` : 'Markdown supported'}
                  </span>
                  <div className="flex items-center rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        editorTab === 'write'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        editorTab === 'preview'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>
              </div>

              {editorTab === 'write' ? (
                <textarea
                  required
                  rows={20}
                  placeholder={"# Article Title\n\nWrite your comprehensive markdown article here with headings (##), lists, and bold text..."}
                  value={contentMarkdown}
                  onChange={(e) => setContentMarkdown(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 p-4 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 leading-relaxed"
                />
              ) : (
                <div className="w-full rounded-2xl border border-slate-800 bg-[#080d1a] p-6 sm:p-8 text-slate-200 overflow-y-auto max-h-[600px] shadow-inner">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-slate-800/80 pb-3">
                    {title || 'Untitled Article'}
                  </h1>
                  {contentMarkdown ? (
                    <BlogPostContent content={contentMarkdown} />
                  ) : (
                    <p className="text-slate-500 italic text-sm">Start typing in the "Write" tab to see live formatted preview here.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: FAQ Schema Builder & Publishing Controls */}
          <div className="space-y-6">
            {/* Publication Settings */}
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 space-y-4 shadow-card">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Publication Status
              </span>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <label className="text-xs text-gray-900 font-semibold cursor-pointer block" htmlFor="publish-toggle">
                    Publish to Live Site
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {isPublished ? 'Visible publicly at /blog' : 'Saved as private draft'}
                  </span>
                </div>
                <input
                  id="publish-toggle"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded text-orange-500 focus:ring-orange-400 accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isPublishing || !title.trim() || !contentMarkdown.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {editingPostId ? 'Updating Article...' : 'Publishing Article...'}
                    </>
                  ) : (
                    <>
                      {editingPostId ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {editingPostId ? 'Update Article' : (isPublished ? 'Publish Article with Schemas' : 'Save Draft Article')}
                    </>
                  )}
                </button>

                {editingPostId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic FAQ / JSON-LD Schema Builder */}
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 space-y-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  FAQPage Schema Builder
                </span>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 hover:text-orange-600"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add FAQ
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                LLMs (Perplexity, ChatGPT) extract structured FAQ schemas directly for consensus citation.
              </p>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Question #{idx + 1}
                      </span>
                      {faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Does Amazon KDP ban AI books?"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                      className="w-full rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                    />
                    <textarea
                      rows={2}
                      placeholder="Concise, factual answer..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                      className="w-full rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live JSON-LD Schema Preview */}
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 space-y-2 shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Code className="h-3.5 w-3.5 text-violet-500" />
                Live JSON-LD Output
              </div>
              <pre className="max-h-48 overflow-y-auto rounded-xl bg-gray-50 border border-gray-200 p-3 font-mono text-[10px] text-violet-600">
                {JSON.stringify(generatedSchema, null, 2)}
              </pre>
            </div>
          </div>
        </form>

        {/* Existing Articles Management Table */}
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-8 space-y-5 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-orange-500" />
                Published Articles & Publications Vault
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage, edit, view, and organize all published articles and drafts in your database ({existingPosts.length} total).
              </p>
            </div>
            <button
              type="button"
              onClick={loadPosts}
              disabled={isLoadingPosts}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPosts ? 'animate-spin text-orange-500' : ''}`} />
              Refresh
            </button>
          </div>

          {isLoadingPosts ? (
            <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
              Loading articles...
            </div>
          ) : existingPosts.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 space-y-2">
              <p>No articles published yet.</p>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-orange-500 hover:underline font-semibold"
              >
                Click here to load a sample article and publish your first post!
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {existingPosts.map((post) => {
                const isCurrentEditing = editingPostId === post.id;
                return (
                  <div
                    key={post.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors ${
                      isCurrentEditing ? 'bg-orange-50/70 border-l-4 border-l-orange-500' : 'hover:bg-orange-50/20'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCurrentEditing && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white animate-pulse">
                            Currently Editing
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          post.is_published
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {post.funnel_stage}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.published_at)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        /blog/{post.slug}
                      </p>
                      {post.meta_description && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {post.meta_description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditPost(post)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                          isCurrentEditing
                            ? 'bg-orange-500 text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                        }`}
                        title="Edit Article"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* View Link */}
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        title="View Public Post"
                      >
                        <Eye className="h-3.5 w-3.5 text-orange-500" />
                        <span className="hidden sm:inline">View</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        type="button"
                        disabled={isDeletingId === post.id}
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
                        title="Delete Article"
                      >
                        {isDeletingId === post.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
