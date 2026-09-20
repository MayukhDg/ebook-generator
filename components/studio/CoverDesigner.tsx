'use client';

import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Sparkles, 
  Download, 
  Layers, 
  Sliders, 
  Type, 
  Maximize2, 
  Check, 
  RefreshCw,
  Printer,
  Info,
  Save,
  FileDown,
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import { Book, CoverStyleConfig } from '@/lib/types';
import { calculateSpineWidthInches, calculateEstimatedPages } from '@/lib/utils';

interface CoverDesignerProps {
  book: Book;
  totalWords?: number;
  onUpdateConfig?: (config: CoverStyleConfig) => void;
}

const PRESETS = [
  { id: 'bold_founder', name: 'Bold Founder', font: 'Space Grotesk', defaultTitleColor: '#F8FAFC', defaultSubColor: '#94A3B8', accent: '#38BDF8' },
  { id: 'hbr_authority', name: 'HBR Authority', font: 'Inter', defaultTitleColor: '#FFFFFF', defaultSubColor: '#FCD34D', accent: '#F59E0B' },
  { id: 'penguin_classic', name: 'Penguin Classic', font: 'Playfair Display', defaultTitleColor: '#FDFBF7', defaultSubColor: '#E2E8F0', accent: '#D97706' },
  { id: 'modern_minimalist', name: 'Modern Minimalist', font: 'Inter', defaultTitleColor: '#FFFFFF', defaultSubColor: '#94A3B8', accent: '#E2E8F0' },
  { id: 'tech_horizon', name: 'Tech Horizon', font: 'Space Grotesk', defaultTitleColor: '#FFFFFF', defaultSubColor: '#6EE7B7', accent: '#10B981' },
  { id: 'pure_monograph', name: 'Pure Monograph', font: 'Playfair Display', defaultTitleColor: '#F8FAFC', defaultSubColor: '#CBD5E1', accent: '#64748B' },
];

export default function CoverDesigner({ book, totalWords = 8000, onUpdateConfig }: CoverDesignerProps) {
  const [viewMode, setViewMode] = useState<'front' | 'wrap'>('front');
  const [bgUrl, setBgUrl] = useState<string>(
    book.cover_bg_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [stylePreset, setStylePreset] = useState<string>(book.cover_style_config?.template || 'bold_founder');
  const [fontFamily, setFontFamily] = useState<string>(book.cover_style_config?.font_family || 'Space Grotesk');
  const [titleColor, setTitleColor] = useState<string>(book.cover_style_config?.title_color || '#F8FAFC');
  const [subtitleColor, setSubtitleColor] = useState<string>(book.cover_style_config?.subtitle_color || '#94A3B8');
  const [accentColor, setAccentColor] = useState<string>(book.cover_style_config?.accent_color || '#38BDF8');
  const [authorName, setAuthorName] = useState<string>(book.cover_style_config?.author_name || 'Marcus Vance');
  const [titleText, setTitleText] = useState<string>(book.title || 'The Sovereign Operator');
  const [subtitleText, setSubtitleText] = useState<string>(book.subtitle || 'How to Build a 7-Figure Advisory Firm on Autonomous Systems');

  // Custom cover prompt
  const [customCoverPrompt, setCustomCoverPrompt] = useState<string>('');

  // Amazon KDP Spine Calculations
  const estimatedPages = calculateEstimatedPages(totalWords);
  const spineWidthInches = calculateSpineWidthInches(estimatedPages);

  const handleSaveCover = async (overrides?: {
    template?: string;
    font_family?: string;
    title_color?: string;
    subtitle_color?: string;
    accent_color?: string;
    author_name?: string;
    title?: string;
    subtitle?: string;
    bgUrl?: string;
  }) => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const nextTitle = overrides?.title !== undefined ? overrides.title : titleText;
      const nextSubtitle = overrides?.subtitle !== undefined ? overrides.subtitle : subtitleText;
      const nextBgUrl = overrides?.bgUrl !== undefined ? overrides.bgUrl : bgUrl;
      const nextPreset = overrides?.template || stylePreset;
      const nextFont = overrides?.font_family || fontFamily;
      const nextTitleColor = overrides?.title_color || titleColor;
      const nextSubtitleColor = overrides?.subtitle_color || subtitleColor;
      const nextAccentColor = overrides?.accent_color || accentColor;
      const nextAuthorName = overrides?.author_name || authorName;

      const payload = {
        title: nextTitle,
        subtitle: nextSubtitle,
        cover_bg_url: nextBgUrl,
        cover_style_config: {
          template: nextPreset,
          font_family: nextFont,
          title_color: nextTitleColor,
          subtitle_color: nextSubtitleColor,
          accent_color: nextAccentColor,
          author_name: nextAuthorName,
          layout: book.cover_style_config?.layout || 'center',
          show_barcode_box: book.cover_style_config?.show_barcode_box ?? true,
        },
      };

      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update book cover settings');

      setSaveStatus('saved');
      if (onUpdateConfig) {
        onUpdateConfig(payload.cover_style_config);
      }
      setTimeout(() => setSaveStatus('idle'), 2500);
      return true;
    } catch (err) {
      console.error('Error saving cover config:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3500);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setStylePreset(presetId);
    setFontFamily(preset.font);
    setTitleColor(preset.defaultTitleColor);
    setSubtitleColor(preset.defaultSubColor);
    setAccentColor(preset.accent);

    handleSaveCover({
      template: presetId,
      font_family: preset.font,
      title_color: preset.defaultTitleColor,
      subtitle_color: preset.defaultSubColor,
      accent_color: preset.accent,
    });
  };

  const handleGenerateBg = async (presetTheme: string) => {
    setIsGeneratingBg(true);
    try {
      const res = await fetch('/api/ai/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          stylePreset: presetTheme,
          themePrompt: `${titleText || book.title} - ${book.core_thesis}`,
          customPrompt: customCoverPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setBgUrl(data.imageUrl);
        handleSaveCover({ bgUrl: data.imageUrl });
      }
    } catch (err) {
      console.error('Failed to generate cover art:', err);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Left Control Panel */}
      <div className="w-full lg:w-96 space-y-6 shrink-0 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-5 shadow-card">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-orange-500">
            <Palette className="h-4 w-4" />
            <h2 className="text-sm font-bold tracking-wide uppercase">Cover Studio (2-Layer)</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Decoupled AI artwork + vector typography guarantees crisp, misspelling-free Amazon KDP covers.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">View Format</label>
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('front')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'front'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Front Cover (1600x2560)
            </button>
            <button
              onClick={() => setViewMode('wrap')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'wrap'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Full KDP Wrap (Wrap + Spine)
            </button>
          </div>
        </div>

        {/* Typography Presets */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Typography Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all ${
                  stylePreset === p.id
                    ? 'border-orange-300 bg-orange-50 text-orange-700 font-semibold'
                    : 'border-gray-200 bg-gray-50/60 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span>{p.name}</span>
                {stylePreset === p.id && <Check className="h-3.5 w-3.5 text-orange-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Text Customizer */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-600 block">Typography Content</label>
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Book Title</span>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Subtitle</span>
            <input
              type="text"
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              onBlur={() => handleSaveCover()}
              className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Author Name</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onBlur={() => handleSaveCover()}
              className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Title Color</span>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => {
                setTitleColor(e.target.value);
                handleSaveCover({ title_color: e.target.value });
              }}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Subtitle Color</span>
            <input
              type="color"
              value={subtitleColor}
              onChange={(e) => {
                setSubtitleColor(e.target.value);
                handleSaveCover({ subtitle_color: e.target.value });
              }}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block mb-1">Accent</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => {
                setAccentColor(e.target.value);
                handleSaveCover({ accent_color: e.target.value });
              }}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>

        {/* Save Cover Button */}
        <button
          onClick={() => handleSaveCover()}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-bold transition-all shadow-md ${
            saveStatus === 'saved'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : saveStatus === 'error'
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/20 active:scale-[0.99]'
          } disabled:opacity-50 cursor-pointer`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="h-4 w-4" />
              Cover Saved to Book!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Failed to Save
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Cover Design
            </>
          )}
        </button>

        {/* AI Background Generator CTA with Custom Prompt */}
        <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">AI Background Art</span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              4 Credits
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Describe your ideal cover background, or let the presets guide DALL-E 3.
          </p>
          {/* Custom Cover Prompt Textarea */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ImageIcon className="h-3 w-3 text-orange-500" />
              <span className="text-[10px] font-semibold text-orange-700">Cover Vision Prompt</span>
            </div>
            <textarea
              rows={3}
              placeholder="e.g., Abstract watercolor mountains at dawn with warm coral and gold tones, editorial minimalist feel, lots of negative space for text..."
              value={customCoverPrompt}
              onChange={(e) => setCustomCoverPrompt(e.target.value)}
              className="w-full rounded-lg bg-white border border-orange-200/60 px-2.5 py-1.5 text-[11px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none"
            />
          </div>
          <button
            onClick={() => handleGenerateBg(stylePreset)}
            disabled={isGeneratingBg}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-orange-200 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-50"
          >
            {isGeneratingBg ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Generating Texture...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {customCoverPrompt.trim() ? 'Generate from Your Vision' : 'Regenerate AI Background'}
              </>
            )}
          </button>
        </div>

        {/* KDP Spine Telemetry */}
        <div className="rounded-xl border border-gray-200/60 bg-gray-50/60 p-3 text-[11px] space-y-1.5 text-gray-400">
          <div className="flex justify-between items-center text-gray-600 font-medium">
            <span>Amazon KDP Spine Math:</span>
            <span className="text-orange-600 font-mono font-bold">{spineWidthInches}" Width</span>
          </div>
          <p>
            Formula: {estimatedPages} est. pages × 0.002252" = {spineWidthInches}" spine.
          </p>
          <p className="text-[10px] text-gray-400">
            Includes 0.125" bleed margins for trade paperback print compliance.
          </p>
        </div>
      </div>

      {/* Right Canvas / Live SVG Vector Preview */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/95 border border-gray-200/60 rounded-2xl p-6 relative w-full overflow-hidden min-h-[640px] shadow-card">
        {/* Canvas Toolbar */}
        <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 z-20">
          <button
            onClick={async () => {
              await handleSaveCover();
              window.open(`/api/books/${book.id}/export/pdf`, '_blank');
            }}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            title="Exports full 6x9 trade paperback PDF including your designed front cover as Page 1"
          >
            <Download className="h-3.5 w-3.5" />
            Download E-Book (With Cover)
          </button>
          <a
            href={`/api/books/${book.id}/export/pdf?interiorOnly=true`}
            download
            className="hidden sm:flex items-center gap-1 rounded-full border border-gray-600 bg-gray-800/90 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title="Exports interior manuscript pages only (for physical KDP printing where cover is uploaded separately)"
          >
            <Printer className="h-3 w-3" />
            KDP Interior Only
          </a>
          <a
            href={`/api/books/${book.id}/export/epub`}
            download
            className="flex items-center gap-1.5 rounded-full bg-gray-800 border border-gray-600 px-2.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition-all shadow-sm"
            title="Exports reflowable EPUB with embedded cover image for e-readers"
          >
            <FileDown className="h-3.5 w-3.5" />
            EPUB
          </a>
        </div>

        {/* View Mode: FRONT COVER ONLY */}
        {viewMode === 'front' && (
          <div 
            className="relative w-[340px] sm:w-[380px] h-[540px] sm:h-[600px] rounded-lg shadow-2xl overflow-hidden border border-slate-700/60 transition-all transform hover:scale-[1.01]"
            style={{
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Subtle paper grain & lighting overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

            {/* Book Spine Shadow Left Border */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

            {/* Vector Typography Overlay (100% Crisp, Vector Quality) */}
            <div className="relative z-10 h-full flex flex-col justify-between p-8 text-center">
              {/* Header / Accent */}
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: accentColor, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}15` }}>
                  AN AUTHORITY BLUEPRINT
                </div>
              </div>

              {/* Central Title & Subtitle Area */}
              <div className="space-y-3">
                <h1 
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                  style={{ color: titleColor, fontFamily: fontFamily }}
                >
                  {titleText}
                </h1>
                
                {/* Minimalist Divider Accent */}
                <div className="w-12 h-0.5 mx-auto my-2" style={{ backgroundColor: accentColor }} />

                <p 
                  className="text-xs sm:text-sm font-medium leading-relaxed max-w-[280px] mx-auto opacity-90"
                  style={{ color: subtitleColor }}
                >
                  {subtitleText}
                </p>
              </div>

              {/* Footer Author Name */}
              <div className="border-t border-white/10 pt-4">
                <span className="text-[10px] tracking-widest text-slate-400 uppercase block mb-0.5">
                  Authored By
                </span>
                <span 
                  className="text-sm font-bold tracking-wider"
                  style={{ color: titleColor, fontFamily: fontFamily }}
                >
                  {authorName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Mode: FULL KDP WRAP (Back + Spine + Front + Barcode Placeholder) */}
        {viewMode === 'wrap' && (
          <div className="w-full max-w-4xl overflow-x-auto p-4 flex justify-center">
            <div 
              className="relative flex h-[480px] rounded-lg shadow-2xl overflow-hidden border border-slate-700/60"
              style={{
                width: '780px',
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Darkening tint for back cover legibility */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              {/* 1. BACK COVER (Left 46%) */}
              <div className="relative w-[360px] h-full p-6 flex flex-col justify-between text-left border-r border-black/40 z-10">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
                    ADVANCE PRAISE FOR THE SOVEREIGN OPERATOR
                  </span>
                  <p className="text-xs italic text-slate-300 leading-relaxed">
                    "This is the definitive playbook for any consultant who wants to escape the billable hour trap and build an autonomous enterprise."
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">— Enterprise Strategy Review</p>
                  
                  <div className="pt-2">
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-6">
                      {book.core_thesis}
                    </p>
                  </div>
                </div>

                {/* KDP Barcode Box Placeholder */}
                <div className="flex items-end justify-between pt-4">
                  <div className="text-[10px] text-slate-400">
                    <div>FolioCraft AI Press</div>
                    <div>Category: Business / Systems</div>
                  </div>
                  <div className="w-28 h-14 bg-white border border-slate-300 rounded flex flex-col items-center justify-center text-[9px] text-slate-900 font-mono shadow-sm">
                    <div className="w-24 h-7 border-b border-dashed border-slate-400 flex items-center justify-center font-bold tracking-wider">
                      ||| | |||| || |
                    </div>
                    <span>ISBN RESERVED</span>
                  </div>
                </div>
              </div>

              {/* 2. PAPERBACK SPINE (Center ~60px) */}
              <div className="relative w-[60px] h-full bg-black/40 border-r border-black/40 flex flex-col items-center justify-between py-6 z-10">
                <span className="text-[9px] font-bold text-amber-400 tracking-wider [writing-mode:vertical-rl] rotate-180">
                  FolioCraft
                </span>
                <span 
                  className="text-xs font-bold text-white tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase"
                  style={{ fontFamily }}
                >
                  {titleText}
                </span>
                <span className="text-[9px] font-medium text-slate-300 [writing-mode:vertical-rl] rotate-180">
                  {authorName}
                </span>
              </div>

              {/* 3. FRONT COVER (Right 360px) */}
              <div className="relative w-[360px] h-full p-6 flex flex-col justify-between text-center z-10">
                <div>
                  <div className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor, border: `1px solid ${accentColor}40` }}>
                    AUTHORITY EDITION
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl font-black leading-tight" style={{ color: titleColor, fontFamily }}>
                    {titleText}
                  </h1>
                  <p className="text-[11px] leading-snug opacity-90 max-w-[240px] mx-auto" style={{ color: subtitleColor }}>
                    {subtitleText}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <span className="text-xs font-bold tracking-wider" style={{ color: titleColor }}>
                    {authorName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
