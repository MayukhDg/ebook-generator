'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AdminGatePage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() }),
      });

      if (res.ok) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#FEFCF9] to-[#F0E6FF] px-4">
      {/* Floating gradient orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-orange-200/40 to-pink-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-gradient-to-tr from-violet-200/30 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              FolioCraft<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">.ai</span>
            </span>
          </Link>
        </div>

        {/* Gate card */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/40 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600 mb-2">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500">
              Enter your admin secret key to access the editorial CMS.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Secret Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter admin secret..."
                  autoFocus
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !secret.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isVerifying ? (
                'Verifying...'
              ) : (
                <>
                  Access Admin CMS
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This area is restricted to site administrators only.
        </p>
      </div>
    </div>
  );
}
