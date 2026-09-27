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
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveVertical,
  ArrowUp,
  ArrowDown
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

  // Title Positioning & Framing Options
  const [titlePosition, setTitlePosition] = useState<'top' | 'center' | 'bottom'>(
    book.cover_style_config?.title_position || 'center'
  );
  const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>(
    book.cover_style_config?.title_align || 'center'
  );
  const [titleOffsetY, setTitleOffsetY] = useState<number>(
    book.cover_style_config?.title_offset_y ?? 0
  );
  const [showBadge, setShowBadge] = useState<boolean>(
    book.cover_style_config?.show_badge ?? true
  );
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    book.cover_style_config?.overlay_opacity ?? 45
  );

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
    title_position?: 'top' | 'center' | 'bottom';
    title_align?: 'left' | 'center' | 'right';
    title_offset_y?: number;
    show_badge?: boolean;
    overlay_opacity?: number;
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
      const nextTitlePosition = overrides?.title_position !== undefined ? overrides.title_position : titlePosition;
      const nextTitleAlign = overrides?.title_align !== undefined ? overrides.title_align : titleAlign;
      const nextTitleOffsetY = overrides?.title_offset_y !== undefined ? overrides.title_offset_y : titleOffsetY;
      const nextShowBadge = overrides?.show_badge !== undefined ? overrides.show_badge : showBadge;
      const nextOverlayOpacity = overrides?.overlay_opacity !== undefined ? overrides.overlay_opacity : overlayOpacity;

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
          title_position: nextTitlePosition,
          title_align: nextTitleAlign,
          title_offset_y: nextTitleOffsetY,
          show_badge: nextShowBadge,
          overlay_opacity: nextOverlayOpacity,
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

        {/* Title Placement & Framing Controls */}
        <div className="space-y-3 rounded-xl border border-orange-200/60 bg-orange-50/30 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <MoveVertical className="h-3.5 w-3.5 text-orange-500" />
              Title Position & Placement
            </label>
            <span className="text-[10px] text-orange-600 font-semibold bg-orange-100/70 px-1.5 py-0.5 rounded">
              Photo Safe
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-normal">
            Reposition the title so it never covers faces or focal points of your cover picture.
          </p>

          {/* Position Selector (Top / Center / Bottom) */}
          <div>
            <span className="text-[10px] font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">
              Vertical Position
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setTitlePosition('top');
                  handleSaveCover({ title_position: 'top' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  titlePosition === 'top'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ArrowUp className="h-3 w-3" /> Top
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitlePosition('center');
                  handleSaveCover({ title_position: 'center' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  titlePosition === 'center'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitlePosition('bottom');
                  handleSaveCover({ title_position: 'bottom' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  titlePosition === 'bottom'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ArrowDown className="h-3 w-3" /> Bottom
              </button>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <span className="text-[10px] font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">
              Text Alignment
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setTitleAlign('left');
                  handleSaveCover({ title_align: 'left' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  titleAlign === 'left'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" /> Left
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleAlign('center');
                  handleSaveCover({ title_align: 'center' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  titleAlign === 'center'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" /> Center
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleAlign('right');
                  handleSaveCover({ title_align: 'right' });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  titleAlign === 'right'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" /> Right
              </button>
            </div>
          </div>

          {/* Fine-Tuning Vertical Offset Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                Height Adjustment (Fine-Tune)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-orange-600">
                  {titleOffsetY > 0 ? `+${titleOffsetY}px` : `${titleOffsetY}px`}
                </span>
                {titleOffsetY !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleOffsetY(0);
                      handleSaveCover({ title_offset_y: 0 });
                    }}
                    className="text-[9px] text-gray-400 hover:text-gray-700 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={-120}
              max={120}
              step={4}
              value={titleOffsetY}
              onChange={(e) => setTitleOffsetY(Number(e.target.value))}
              onMouseUp={() => handleSaveCover()}
              onTouchEnd={() => handleSaveCover()}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>Higher (-120px)</span>
              <span>Lower (+120px)</span>
            </div>
          </div>

          {/* Photo Darkening / Contrast Scrim Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                Photo Contrast Tint
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-600">
                {overlayOpacity}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={85}
              step={5}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              onMouseUp={() => handleSaveCover()}
              onTouchEnd={() => handleSaveCover()}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
            />
          </div>

          {/* Toggle Blueprint Badge */}
          <div className="flex items-center justify-between pt-1 border-t border-orange-200/40">
            <span className="text-[11px] font-medium text-gray-700">
              Authority Blueprint Badge
            </span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !showBadge;
                setShowBadge(nextVal);
                handleSaveCover({ show_badge: nextVal });
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                showBadge
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {showBadge ? 'Visible' : 'Hidden'}
            </button>
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
            {/* Dynamic contrast overlay */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity"
              style={{
                backgroundColor: '#000000',
                opacity: overlayOpacity / 100,
              }}
            />
            {/* Scrim gradients for readability when title is top or bottom */}
            {titlePosition === 'bottom' && (
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
            )}
            {titlePosition === 'top' && (
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none" />
            )}

            {/* Book Spine Shadow Left Border */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

            {/* Vector Typography Overlay (100% Crisp, Vector Quality) */}
            <div 
              className={`relative z-10 h-full flex flex-col justify-between p-8 ${
                titleAlign === 'left' ? 'text-left items-start' : titleAlign === 'right' ? 'text-right items-end' : 'text-center items-center'
              }`}
            >
              {titlePosition === 'top' ? (
                <>
                  {/* Top: Badge + Title + Subtitle */}
                  <div 
                    className={`w-full space-y-3 transition-transform duration-150 ease-out ${
                      titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'
                    }`}
                    style={{ transform: `translateY(${titleOffsetY}px)` }}
                  >
                    {showBadge && (
                      <div className={`mb-3 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                        <div 
                          className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.25em]" 
                          style={{ color: accentColor, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}20` }}
                        >
                          AN AUTHORITY BLUEPRINT
                        </div>
                      </div>
                    )}
                    <h1 
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight drop-shadow-md"
                      style={{ color: titleColor, fontFamily: fontFamily }}
                    >
                      {titleText}
                    </h1>
                    
                    {/* Minimalist Divider Accent */}
                    <div 
                      className={`w-12 h-0.5 my-2 ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} 
                      style={{ backgroundColor: accentColor }} 
                    />

                    <p 
                      className={`text-xs sm:text-sm font-medium leading-relaxed max-w-[300px] opacity-90 drop-shadow-sm ${
                        titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'
                      }`}
                      style={{ color: subtitleColor }}
                    >
                      {subtitleText}
                    </p>
                  </div>

                  {/* Empty Center Spacer to preserve the photo face/subject */}
                  <div className="flex-1" />

                  {/* Footer Author Name */}
                  <div className={`w-full border-t border-white/10 pt-4 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                    <span className="text-[10px] tracking-widest text-slate-400 uppercase block mb-0.5">
                      Authored By
                    </span>
                    <span 
                      className="text-sm font-bold tracking-wider drop-shadow"
                      style={{ color: titleColor, fontFamily: fontFamily }}
                    >
                      {authorName}
                    </span>
                  </div>
                </>
              ) : titlePosition === 'bottom' ? (
                <>
                  {/* Top: Optional Badge */}
                  <div className="w-full">
                    {showBadge ? (
                      <div className={titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}>
                        <div 
                          className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.25em]" 
                          style={{ color: accentColor, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}20` }}
                        >
                          AN AUTHORITY BLUEPRINT
                        </div>
                      </div>
                    ) : <div className="h-4" />}
                  </div>

                  {/* Empty Center Spacer */}
                  <div className="flex-1" />

                  {/* Bottom: Title + Subtitle + Author */}
                  <div 
                    className={`w-full space-y-3 transition-transform duration-150 ease-out ${
                      titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'
                    }`}
                    style={{ transform: `translateY(${titleOffsetY}px)` }}
                  >
                    <h1 
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight drop-shadow-lg"
                      style={{ color: titleColor, fontFamily: fontFamily }}
                    >
                      {titleText}
                    </h1>
                    
                    <div 
                      className={`w-12 h-0.5 my-2 ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} 
                      style={{ backgroundColor: accentColor }} 
                    />

                    <p 
                      className={`text-xs sm:text-sm font-medium leading-relaxed max-w-[300px] opacity-90 drop-shadow-md ${
                        titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'
                      }`}
                      style={{ color: subtitleColor }}
                    >
                      {subtitleText}
                    </p>

                    <div className={`border-t border-white/10 pt-3 mt-4 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                      <span className="text-[10px] tracking-widest text-slate-400 uppercase block mb-0.5">
                        Authored By
                      </span>
                      <span 
                        className="text-sm font-bold tracking-wider drop-shadow"
                        style={{ color: titleColor, fontFamily: fontFamily }}
                      >
                        {authorName}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Center Position Default */}
                  <div className="w-full">
                    {showBadge ? (
                      <div className={titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}>
                        <div 
                          className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.25em] mb-4" 
                          style={{ color: accentColor, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}15` }}
                        >
                          AN AUTHORITY BLUEPRINT
                        </div>
                      </div>
                    ) : <div className="h-4" />}
                  </div>

                  {/* Central Title & Subtitle Area */}
                  <div 
                    className={`w-full space-y-3 transition-transform duration-150 ease-out ${
                      titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'
                    }`}
                    style={{ transform: `translateY(${titleOffsetY}px)` }}
                  >
                    <h1 
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight drop-shadow-md"
                      style={{ color: titleColor, fontFamily: fontFamily }}
                    >
                      {titleText}
                    </h1>
                    
                    <div 
                      className={`w-12 h-0.5 my-2 ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} 
                      style={{ backgroundColor: accentColor }} 
                    />

                    <p 
                      className={`text-xs sm:text-sm font-medium leading-relaxed max-w-[280px] opacity-90 drop-shadow-sm ${
                        titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'
                      }`}
                      style={{ color: subtitleColor }}
                    >
                      {subtitleText}
                    </p>
                  </div>

                  {/* Footer Author Name */}
                  <div className={`w-full border-t border-white/10 pt-4 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                    <span className="text-[10px] tracking-widest text-slate-400 uppercase block mb-0.5">
                      Authored By
                    </span>
                    <span 
                      className="text-sm font-bold tracking-wider drop-shadow"
                      style={{ color: titleColor, fontFamily: fontFamily }}
                    >
                      {authorName}
                    </span>
                  </div>
                </>
              )}
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
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: '#000000',
                  opacity: Math.max(0.55, overlayOpacity / 100),
                }}
              />

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
              <div 
                className={`relative w-[360px] h-full p-6 flex flex-col justify-between z-10 ${
                  titleAlign === 'left' ? 'text-left items-start' : titleAlign === 'right' ? 'text-right items-end' : 'text-center items-center'
                }`}
              >
                {titlePosition === 'top' ? (
                  <>
                    <div 
                      className="w-full space-y-2 transition-transform duration-150"
                      style={{ transform: `translateY(${titleOffsetY * 0.8}px)` }}
                    >
                      {showBadge && (
                        <div className={`mb-1 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                          <div className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor, border: `1px solid ${accentColor}40` }}>
                            AUTHORITY EDITION
                          </div>
                        </div>
                      )}
                      <h1 className="text-xl font-black leading-tight drop-shadow-md" style={{ color: titleColor, fontFamily }}>
                        {titleText}
                      </h1>
                      <p className={`text-[11px] leading-snug opacity-90 max-w-[240px] drop-shadow-sm ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} style={{ color: subtitleColor }}>
                        {subtitleText}
                      </p>
                    </div>
                    <div className="flex-1" />
                    <div className={`w-full border-t border-white/10 pt-3 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                      <span className="text-xs font-bold tracking-wider" style={{ color: titleColor }}>
                        {authorName}
                      </span>
                    </div>
                  </>
                ) : titlePosition === 'bottom' ? (
                  <>
                    <div className="w-full">
                      {showBadge ? (
                        <div className={titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}>
                          <div className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor, border: `1px solid ${accentColor}40` }}>
                            AUTHORITY EDITION
                          </div>
                        </div>
                      ) : <div className="h-3" />}
                    </div>
                    <div className="flex-1" />
                    <div 
                      className="w-full space-y-2 transition-transform duration-150"
                      style={{ transform: `translateY(${titleOffsetY * 0.8}px)` }}
                    >
                      <h1 className="text-xl font-black leading-tight drop-shadow-lg" style={{ color: titleColor, fontFamily }}>
                        {titleText}
                      </h1>
                      <p className={`text-[11px] leading-snug opacity-90 max-w-[240px] drop-shadow-md ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} style={{ color: subtitleColor }}>
                        {subtitleText}
                      </p>
                      <div className={`border-t border-white/10 pt-2.5 mt-3 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                        <span className="text-xs font-bold tracking-wider" style={{ color: titleColor }}>
                          {authorName}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full">
                      {showBadge ? (
                        <div className={titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}>
                          <div className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor, border: `1px solid ${accentColor}40` }}>
                            AUTHORITY EDITION
                          </div>
                        </div>
                      ) : <div className="h-3" />}
                    </div>

                    <div 
                      className="w-full space-y-2 transition-transform duration-150"
                      style={{ transform: `translateY(${titleOffsetY * 0.8}px)` }}
                    >
                      <h1 className="text-xl font-black leading-tight drop-shadow-md" style={{ color: titleColor, fontFamily }}>
                        {titleText}
                      </h1>
                      <p className={`text-[11px] leading-snug opacity-90 max-w-[240px] drop-shadow-sm ${titleAlign === 'left' ? 'mr-auto' : titleAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} style={{ color: subtitleColor }}>
                        {subtitleText}
                      </p>
                    </div>

                    <div className={`w-full border-t border-white/10 pt-3 ${titleAlign === 'left' ? 'text-left' : titleAlign === 'right' ? 'text-right' : 'text-center'}`}>
                      <span className="text-xs font-bold tracking-wider" style={{ color: titleColor }}>
                        {authorName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
