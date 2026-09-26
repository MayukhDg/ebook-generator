import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Sparkles, Printer, FileCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/60 backdrop-blur-sm text-gray-500">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500">
                <BookOpen className="h-4 w-4 text-white stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                FolioCraft<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">.ai</span>
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                AUTHORITY ENGINE
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-gray-400">
              The anti-slop authoring engine for founders, consultants, and operators. Synthesize messy notes, voice transcripts, and client frameworks into Amazon KDP-grade paperback books with zero context drift and decoupled typography.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-emerald-600">
                <Printer className="h-3.5 w-3.5" /> 6x9 KDP 300 DPI Ready
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-orange-500">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% User IP Ownership
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-violet-500">
                <FileCheck className="h-3.5 w-3.5" /> Reflowable EPUB3 Validated
              </span>
            </div>
          </div>

          {/* Product & Studio */}

          <div className="mt-10 flex flex-col items-center justify-between border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row">
            <p>© {new Date().getFullYear()} FolioCraft AI. All rights reserved. Built for published authors.</p>
            <p className="mt-2 sm:mt-0">
              Amazon, Kindle, and KDP are registered trademarks of Amazon.com, Inc. FolioCraft AI is independent.
            </p>
          </div>
        </div>
    </footer>
  );
}
