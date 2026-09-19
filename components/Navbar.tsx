'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Sparkles, 
  Coins, 
  Layers, 
  Palette, 
  FileText, 
  ShieldCheck, 
  User, 
  LogOut, 
  LogIn, 
  Menu, 
  X 
} from 'lucide-react';
import { CREDIT_RATES } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(20);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch credits
    fetch('/api/profile')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && typeof data.credits_balance === 'number') {
          setCredits(data.credits_balance);
        }
      })
      .catch(() => {});

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { label: 'Studio', href: '/dashboard', icon: Layers, requireAuth: true },
    { label: 'Blog & AEO', href: '/blog', icon: FileText, requireAuth: false },
    { label: 'Admin CMS', href: '/admin/blog', icon: ShieldCheck, requireAuth: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080d1a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md shadow-amber-500/20 transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                    FolioCraft<span className="text-amber-400">.ai</span>
                  </span>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                    AUTHORITY
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Amazon KDP-Grade Authoring
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4">
              {navLinks.map((link) => {
                if (link.requireAuth && !user) return null;
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && link.href !== '/dashboard');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800/80 text-amber-400 border border-slate-700/60 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Area: Auth State & Credit Pill */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Live Credit Balance Pill */}
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="group flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 transition-all hover:border-amber-400/60 hover:bg-amber-500/20"
                  title="Click to view credit burn ledger and top-up"
                >
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                  </div>
                  <Coins className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-amber-300">
                    {credits} <span className="font-normal text-amber-400/80 hidden sm:inline">Credits</span>
                  </span>
                </button>

                {/* User email badge */}
                <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300">
                  <User className="h-3 w-3 text-slate-400" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  title="Sign out of your workspace"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Start Free (20 Credits)
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-3 space-y-2 backdrop-blur-xl">
            {navLinks.map((link) => {
              if (link.requireAuth && !user) return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-amber-400" />
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign Out ({user.email})
              </button>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950"
                >
                  Start Free (20 Credits)
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Credit Economics Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Atomic Credit Economics</h3>
                  <p className="text-xs text-slate-400">Balance: <span className="text-amber-400 font-semibold">{credits} Credits Available</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowCreditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Credit Cost Ledger */}
            <div className="my-5 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Action Burn Rates
              </h4>
              <div className="grid gap-2">
                {Object.entries(CREDIT_RATES).map(([key, rate]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs"
                  >
                    <span className="text-slate-300">{rate.label}</span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono font-semibold text-amber-400 border border-amber-500/20">
                      -{rate.cost} credits
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Up Options */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Need Additional Credits?</h4>
                  <p className="text-xs text-slate-300">Top-up 50 credits for $19 or upgrade to Authority tier ($29/mo for 150 credits).</p>
                </div>
                <Link
                  href="/#pricing"
                  onClick={() => setShowCreditModal(false)}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  View Plans
                </Link>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCreditModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
