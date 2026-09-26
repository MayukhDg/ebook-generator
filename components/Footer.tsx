import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Printer, FileCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/70 backdrop-blur-md text-gray-500">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info & Mission */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 shadow-md shadow-orange-500/20 transition-transform group-hover:scale-105">
                <BookOpen className="h-4 w-4 text-white stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                FolioCraft<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">.ai</span>
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                AUTHORITY
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-500">
              The anti-slop authoring engine for founders, consultants, and operators. Synthesize voice memos, notes, and frameworks into Amazon KDP-grade paperback books with zero context drift.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500 font-medium">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100">
                <Printer className="h-3 w-3" /> 6x9 KDP 300 DPI
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-orange-700 border border-orange-100">
                <ShieldCheck className="h-3 w-3" /> 100% Author IP
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-violet-700 border border-violet-100">
                <FileCheck className="h-3 w-3" /> EPUB3 Validated
              </span>
            </div>
          </div>

          {/* Platform & Workflow */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/dashboard" className="text-gray-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1">
                  Authoring Workspace
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Voice Ingestion & Blueprint
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Split-Screen Chapter Studio
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Vector Cover Studio
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-gray-500 hover:text-orange-600 transition-colors">
                  KDP Print & EPUB Export
                </Link>
              </li>
            </ul>
          </div>

          {/* Insights & Comparison */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Resources & Insights
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/blog" className="text-gray-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1 font-medium text-orange-600/90">
                  Authority Publication Vault <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Anti-Slop Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Credit Economics & Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/admin/blog" className="text-gray-400 hover:text-gray-600 transition-colors">
                  Editorial CMS (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  Sign Up (20 Free Credits)
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Sign In to Account
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-gray-500 hover:text-orange-600 transition-colors">
                  100% Retained IP Guarantee
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray-500 hover:text-orange-600 transition-colors">
                  Top-Up Credit Packs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Disclaimers */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row gap-3">
          <p>© {new Date().getFullYear()} FolioCraft AI. All rights reserved. Built for published authors.</p>
          <p className="text-center sm:text-right text-[11px] text-gray-400">
            Amazon, Kindle, and KDP are registered trademarks of Amazon.com, Inc. FolioCraft AI is independent.
          </p>
        </div>
      </div>
    </footer>
  );
}
