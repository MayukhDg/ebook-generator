'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, MessageSquare, Sparkles, Send } from 'lucide-react';

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const email = 'mayukhdg@outlook.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-8 sm:p-12 shadow-card">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-orange-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left column: Message & Context */}
        <div className="md:col-span-7 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span>We Value Your Input</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Book a Demo or Share Your Thoughts
          </h3>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Contact us for a demo or to give us feedback. Really appreciate it. Whether you are an author scaling your publication, an agency operator, or have suggestions to make OpusCraft better, we would love to hear from you.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              Replies within 24 hours
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
              Direct founder discussion
            </div>
          </div>
        </div>

        {/* Right column: Interactive Email Card */}
        <div className="md:col-span-5 flex flex-col items-center md:items-stretch gap-4">
          <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20">
              <Mail className="h-6 w-6" />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Direct Email
              </div>
              <a
                href={`mailto:${email}?subject=OpusCraft%20Demo%20%2F%20Feedback`}
                className="mt-1 block text-base sm:text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors select-all"
              >
                {email}
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={`mailto:${email}?subject=OpusCraft%20Demo%20%2F%20Feedback`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-rose-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

