'use client';

import React, { useState } from 'react';
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
  Send
} from 'lucide-react';
import { FunnelStage } from '@/lib/types';
import { slugify } from '@/lib/utils';

export default function AdminBlogCMSPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
  ]);
  const [isSaved, setIsSaved] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === slugify(title)) {
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
      .filter((f) => f.question && f.answer)
      .map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contentMarkdown) return;

    try {
      await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          funnel_stage: funnelStage,
          meta_description: metaDescription,
          target_keywords: keywords.split(',').map((k) => k.trim()),
          content_markdown: contentMarkdown,
          schema_json: generatedSchema,
          is_published: true,
        }),
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Error publishing blog post:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" /> Admin Editorial CMS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              AEO & SEO Article Publisher
            </h1>
            <p className="text-xs text-slate-400">
              Create search-optimized articles pre-engineered with FAQPage and HowTo JSON-LD schemas for LLM answer engines.
            </p>
          </div>

          {isSaved && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 font-semibold">
              <Check className="h-4 w-4" /> Article Published!
            </div>
          )}
        </div>

        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Editor (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Why 90% of ChatGPT eBooks Fail"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="why-chatgpt-fails-at-writing-books"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Funnel Stage
                </label>
                <select
                  value={funnelStage}
                  onChange={(e) => setFunnelStage(e.target.value as FunnelStage)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="awareness">Awareness (Problem / AI ban risks)</option>
                  <option value="consideration">Consideration (How-To / Frameworks)</option>
                  <option value="purchase">Purchase (Comparisons / Reviews)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Meta Description (for SERP & Answer Engine snippets)
              </label>
              <textarea
                rows={2}
                placeholder="Brief synopsis under 160 characters..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Markdown Body Content *
              </label>
              <textarea
                required
                rows={16}
                placeholder="# Article Title&#10;&#10;Write your deep markdown article here..."
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Right Column: Dynamic FAQ / JSON-LD Schema Builder */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  FAQPage Schema Builder
                </span>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add FAQ
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                LLMs (Perplexity, ChatGPT) extract structured FAQ schemas directly for consensus citation.
              </p>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Question #{idx + 1}
                      </span>
                      {faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-slate-500 hover:text-red-400"
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
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <textarea
                      rows={2}
                      placeholder="Concise, factual answer..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live JSON-LD Schema Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Code className="h-3.5 w-3.5 text-cyan-400" />
                Live JSON-LD Output
              </div>
              <pre className="max-h-48 overflow-y-auto rounded-xl bg-slate-950 p-3 font-mono text-[10px] text-cyan-300 border border-slate-800">
                {JSON.stringify(generatedSchema, null, 2)}
              </pre>
            </div>

            {/* Publish Action Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Send className="h-4 w-4" />
              Publish Article with Schemas
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
