'use client';

import React, { useState } from 'react';
import {
  Tag,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Save,
  X,
  FileText,
  Layers,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface AmazonKdpKitProps {
  bookId: string;
  bookTitle: string;
  initialDescription?: string | null;
  initialKeywords?: string[] | null;
  initialCategories?: string[] | null;
}

export default function AmazonKdpKit({
  bookId,
  bookTitle,
  initialDescription,
  initialKeywords,
  initialCategories,
}: AmazonKdpKitProps) {
  const [description, setDescription] = useState(
    initialDescription ||
      `<h3>Discover the Definitive Blueprint</h3><p>An authoritative guide created with OpusCraft.</p><h4>Inside this book:</h4><ul><li><b>Strategic Framework:</b> Step-by-step principles.</li></ul><p><b>Scroll up and click "Buy Now" to begin.</b></p>`
  );

  const [keywords, setKeywords] = useState<string[]>(
    (initialKeywords && initialKeywords.length > 0)
      ? initialKeywords
      : [
          `${bookTitle.toLowerCase()} guide`,
          'executive strategy handbook',
          'practical execution framework',
          'authoritative blueprint',
          'mastery roadmap',
          'high performance manual',
          'strategic business principles',
        ]
  );

  const [categories, setCategories] = useState<string[]>(
    (initialCategories && initialCategories.length > 0)
      ? initialCategories
      : [
          'Business & Money > Management & Leadership',
          'Self-Help > Personal Transformation',
        ]
  );

  const [activeTab, setActiveTab] = useState<'description' | 'keywords' | 'categories'>('description');
  const [descViewMode, setDescViewMode] = useState<'preview' | 'html' | 'edit'>('preview');

  const [draftDescription, setDraftDescription] = useState(description);
  const [draftKeywords, setDraftKeywords] = useState<string[]>([...keywords]);
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  const handleCopyAllKeywords = () => {
    const joined = keywords.filter(Boolean).join(', ');
    copyToClipboard(joined, 'all-keywords');
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setStatusMessage('Generating conversion-optimized Amazon KDP kit with GPT-4o...');

    try {
      const res = await fetch(`/api/books/${bookId}/kdp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to regenerate KDP kit');
      }

      const data = await res.json();
      if (data.kdp_description) {
        setDescription(data.kdp_description);
        setDraftDescription(data.kdp_description);
      }
      if (data.kdp_keywords && Array.isArray(data.kdp_keywords)) {
        setKeywords(data.kdp_keywords);
        setDraftKeywords(data.kdp_keywords);
      }
      if (data.kdp_categories && Array.isArray(data.kdp_categories)) {
        setCategories(data.kdp_categories);
      }

      setStatusMessage('KDP metadata updated successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/books/${bookId}/kdp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          kdp_description: draftDescription.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to save description');

      setDescription(draftDescription.trim());
      setDescViewMode('preview');
      setStatusMessage('Description saved!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKeywords = async () => {
    setIsSaving(true);
    try {
      const cleaned = draftKeywords
        .map((k) => k.trim().slice(0, 50))
        .filter(Boolean)
        .slice(0, 7);

      const res = await fetch(`/api/books/${bookId}/kdp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          kdp_keywords: cleaned,
        }),
      });

      if (!res.ok) throw new Error('Failed to save keywords');

      setKeywords(cleaned);
      setIsEditingKeywords(false);
      setStatusMessage('7 Keywords saved!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const descCharCount = (descViewMode === 'edit' ? draftDescription : description).length;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 backdrop-blur-xl shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative accent blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Amazon KDP Publishing Kit
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                KDP Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              HTML sales description & 7 backend keywords formatted for direct Amazon KDP upload.
            </p>
          </div>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all disabled:opacity-50 shadow-sm shrink-0"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate with AI'}
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 px-3 py-2 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('description')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'description'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>KDP Description</span>
          <span className="text-[10px] opacity-75 font-mono ml-1">
            ({descCharCount}/4,000)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'keywords'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>7 Backend Keywords</span>
          <span className="text-[10px] opacity-75 font-mono ml-1">
            (7/7)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Categories & Tips</span>
        </button>
      </div>

      {/* TAB 1: KDP DESCRIPTION */}
      {activeTab === 'description' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDescViewMode('preview')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  descViewMode === 'preview'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Amazon Preview
              </button>
              <button
                onClick={() => setDescViewMode('html')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  descViewMode === 'html'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw KDP HTML
              </button>
              <button
                onClick={() => {
                  setDraftDescription(description);
                  setDescViewMode('edit');
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  descViewMode === 'edit'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="h-3 w-3 inline mr-1" />
                Edit
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono ${
                  descCharCount > 3900
                    ? 'text-rose-400'
                    : descCharCount > 3500
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {descCharCount} / 4,000 chars
              </span>

              {descViewMode === 'edit' ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDescViewMode('preview')}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    disabled={isSaving}
                    className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 shadow"
                  >
                    <Save className="h-3 w-3" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => copyToClipboard(description, 'description-html')}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-200 transition-all shadow-sm"
                >
                  {copiedKey === 'description-html' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied HTML!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Amazon HTML</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          {descViewMode === 'preview' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 max-h-80 overflow-y-auto text-slate-300 text-xs space-y-2 leading-relaxed font-sans shadow-inner">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center justify-between">
                <span>Simulated Amazon Product Page View</span>
                <span className="text-slate-600">Supports &lt;h3&gt;, &lt;h4&gt;, &lt;p&gt;, &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;li&gt;</span>
              </div>
              <div
                className="prose prose-invert prose-xs max-w-none prose-headings:text-amber-300 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-b:text-white"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          )}

          {descViewMode === 'html' && (
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-80 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap break-all">{description}</pre>
            </div>
          )}

          {descViewMode === 'edit' && (
            <div className="space-y-2">
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                maxLength={4000}
                rows={10}
                placeholder="Enter Amazon KDP formatted HTML description..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500">
                Tip: Amazon KDP strictly supports only <code>&lt;h3&gt;</code>, <code>&lt;h4&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code> tags.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 7 BACKEND KEYWORDS */}
      {activeTab === 'keywords' && (
        <div className="space-y-3">
          {/* Header & Bulk Copy */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">7 Backend Search Keyword Boxes</span>
              <p className="text-[11px] text-slate-400">
                Amazon KDP provides 7 input fields. Each field accepts up to 50 characters.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isEditingKeywords ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setDraftKeywords([...keywords]);
                      setIsEditingKeywords(false);
                    }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveKeywords}
                    disabled={isSaving}
                    className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 shadow"
                  >
                    <Save className="h-3 w-3" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setDraftKeywords([...keywords]);
                      setIsEditingKeywords(true);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={handleCopyAllKeywords}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-200 transition-all shadow-sm"
                  >
                    {copiedKey === 'all-keywords' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">All 7 Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy All 7</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 7 Keyword Slot Cards */}
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const currentVal = isEditingKeywords ? draftKeywords[idx] || '' : keywords[idx] || '';
              const charLen = currentVal.length;
              const slotKey = `kw-${idx}`;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-950/70 p-2.5 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {isEditingKeywords ? (
                      <input
                        type="text"
                        maxLength={50}
                        value={draftKeywords[idx] || ''}
                        onChange={(e) => {
                          const updated = [...draftKeywords];
                          updated[idx] = e.target.value;
                          setDraftKeywords(updated);
                        }}
                        placeholder={`Keyword phrase #${idx + 1} (max 50 chars)...`}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {currentVal || (
                          <span className="text-slate-600 italic">Empty slot</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        charLen > 50
                          ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                          : charLen >= 45
                          ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                          : 'border-slate-800 text-slate-500 bg-slate-900'
                      }`}
                      title="Amazon limit is 50 characters per keyword box"
                    >
                      {charLen}/50
                    </span>

                    {!isEditingKeywords && currentVal && (
                      <button
                        onClick={() => copyToClipboard(currentVal, slotKey)}
                        title="Copy this keyword box to clipboard"
                        className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
                      >
                        {copiedKey === slotKey ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & TIPS */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Recommended Amazon / BISAC Categories
            </span>
            <div className="space-y-1.5">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs"
                >
                  <span className="text-slate-300 font-medium">{cat}</span>
                  <button
                    onClick={() => copyToClipboard(cat, `cat-${idx}`)}
                    className="text-slate-400 hover:text-amber-300 p-1"
                  >
                    {copiedKey === `cat-${idx}` ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Amazon KDP allows you to choose up to 3 categories during book setup in your KDP portal.
            </p>
          </div>

          {/* Amazon Best Practice Checklist */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <HelpCircle className="h-4 w-4" />
              <span>Amazon KDP Best Practices</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pl-4">
              <li>
                <strong className="text-slate-200">No Repeated Words:</strong> You don't need to repeat words already in your title or subtitle in your 7 backend keywords. Amazon indexes titles automatically.
              </li>
              <li>
                <strong className="text-slate-200">50 Character Constraint:</strong> Each of the 7 keyword fields on Amazon KDP has a 50-character limit. OpusCraft automatically calculates character counts so you never exceed them.
              </li>
              <li>
                <strong className="text-slate-200">HTML Tags Supported:</strong> Amazon allows <code>&lt;h3&gt;</code>, <code>&lt;h4&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;ul&gt;</code>, and <code>&lt;li&gt;</code>. Other tags will be stripped by Amazon.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
