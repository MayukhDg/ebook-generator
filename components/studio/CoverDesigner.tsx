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
  Info
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
  const [stylePreset, setStylePreset] = useState<string>(book.cover_style_config?.template || 'bold_founder');
  const [fontFamily, setFontFamily] = useState<string>(book.cover_style_config?.font_family || 'Space Grotesk');
  const [titleColor, setTitleColor] = useState<string>(book.cover_style_config?.title_color || '#F8FAFC');
  const [subtitleColor, setSubtitleColor] = useState<string>(book.cover_style_config?.subtitle_color || '#94A3B8');
  const [accentColor, setAccentColor] = useState<string>(book.cover_style_config?.accent_color || '#38BDF8');
  const [authorName, setAuthorName] = useState<string>(book.cover_style_config?.author_name || 'Marcus Vance');
  const [titleText, setTitleText] = useState<string>(book.title || 'The Sovereign Operator');
  const [subtitleText, setSubtitleText] = useState<string>(book.subtitle || 'How to Build a 7-Figure Advisory Firm on Autonomous Systems');

  // Amazon KDP Spine Calculations
  const estimatedPages = calculateEstimatedPages(totalWords);
  const spineWidthInches = calculateSpineWidthInches(estimatedPages);

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setStylePreset(presetId);
    setFontFamily(preset.font);
    setTitleColor(preset.defaultTitleColor);
    setSubtitleColor(preset.defaultSubColor);
    setAccentColor(preset.accent);
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
          themePrompt: `${book.title} - ${book.core_thesis}`,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setBgUrl(data.imageUrl);
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
      <div className="w-full lg:w-96 space-y-6 shrink-0 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Palette className="h-4 w-4" />
            <h2 className="text-sm font-bold tracking-wide uppercase">Cover Studio (2-Layer)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Decoupled AI artwork + vector typography guarantees crisp, misspelling-free Amazon KDP covers.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">View Format</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('front')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'front'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Front Cover (1600x2560)
            </button>
            <button
              onClick={() => setViewMode('wrap')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'wrap'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full KDP Wrap (Wrap + Spine)
            </button>
          </div>
        </div>

        {/* Typography Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Typography Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all ${
                  stylePreset === p.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{p.name}</span>
                {stylePreset === p.id && <Check className="h-3.5 w-3.5 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Text Customizer */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Typography Content</label>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Book Title</span>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Subtitle</span>
            <input
              type="text"
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Author Name</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Title Color</span>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setTitleColor(e.target.value)}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Subtitle Color</span>
            <input
              type="color"
              value={subtitleColor}
              onChange={(e) => setSubtitleColor(e.target.value)}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Accent</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-8 w-full rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>

        {/* AI Background Generator CTA */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">AI Background Art</span>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              4 Credits
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Prompts DALL-E 3 for pure negative-space background texture with zero hallucinated text.
          </p>
          <button
            onClick={() => handleGenerateBg(stylePreset)}
            disabled={isGeneratingBg}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-xs font-semibold text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingBg ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Generating Texture...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Regenerate AI Background
              </>
            )}
          </button>
        </div>

        {/* KDP Spine Telemetry */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-[11px] space-y-1.5 text-slate-400">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>Amazon KDP Spine Math:</span>
            <span className="text-amber-400 font-mono font-bold">{spineWidthInches}" Width</span>
          </div>
          <p>
            Formula: {estimatedPages} est. pages × 0.002252" = {spineWidthInches}" spine.
          </p>
          <p className="text-[10px] text-slate-400">
            Includes 0.125" bleed margins for trade paperback print compliance.
          </p>
        </div>
      </div>

      {/* Right Canvas / Live SVG Vector Preview */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 relative w-full overflow-hidden min-h-[640px]">
        {/* Canvas Toolbar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <a
            href={`/api/books/${book.id}/export/pdf`}
            download
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download Print PDF
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
