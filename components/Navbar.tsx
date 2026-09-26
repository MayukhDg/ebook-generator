'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  Coins,
  Layers,
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
  const [isAdmin, setIsAdmin] = useState(false);

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
      .catch(() => { });

    // Check admin cookie client-side
    const hasAdminCookie = document.cookie.includes('foliocraft_admin_token');
    setIsAdmin(hasAdminCookie);

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
    { label: 'Studio', href: '/dashboard', icon: Layers, requireAuth: true, requireAdmin: false },
    { label: 'Blogs', href: '/blog', icon: FileText, requireAuth: false, requireAdmin: false },
    { label: 'Admin CMS', href: '/admin/blog', icon: ShieldCheck, requireAuth: true, requireAdmin: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 shadow-md shadow-orange-500/20 transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-white stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
                    FolioCraft<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">.ai</span>
                  </span>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                    AUTHORITY
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 hidden sm:inline">
                  Amazon KDP-Grade Authoring
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4">
              {navLinks.map((link) => {
                if (link.requireAuth && !user) return null;
                if (link.requireAdmin && !isAdmin) return null;
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && link.href !== '/dashboard');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200/60 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
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
                  className="group flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1.5 transition-all hover:border-orange-300 hover:bg-orange-100/80 hover:shadow-sm"
                  title="Click to view credit burn ledger and top-up"
                >
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                  </div>
                  <Coins className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-orange-700">
                    {credits} <span className="font-normal text-orange-500 hidden sm:inline">Credits</span>
                  </span>
                </button>

                {/* User email badge */}
                <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-500">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all"
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
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:from-orange-400 hover:to-rose-400 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Start Free (20 Credits)
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-100 bg-white/95 px-4 py-3 space-y-2 backdrop-blur-xl">
            {navLinks.map((link) => {
              if (link.requireAuth && !user) return null;
              if (link.requireAdmin && !isAdmin) return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                >
                  <Icon className="h-4 w-4 text-orange-500" />
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500"
              >
                <LogOut className="h-4 w-4" />
                Sign Out ({user.email})
              </button>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-bold text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 p-6 shadow-2xl shadow-gray-300/30">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500 border border-orange-100">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Credit Economics</h3>
                  <p className="text-xs text-gray-500">Balance: <span className="text-orange-600 font-semibold">{credits} Credits Available</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowCreditModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Credit Cost Ledger */}
            <div className="my-5 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Action Burn Rates
              </h4>
              <div className="grid gap-2">
                {Object.entries(CREDIT_RATES).map(([key, rate]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs"
                  >
                    <span className="text-gray-600">{rate.label}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 font-mono font-semibold text-orange-600 border border-orange-100">
                      -{rate.cost} credits
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Up Options */}
            <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Need Additional Credits?</h4>
                  <p className="text-xs text-gray-500">Top-up 50 credits for $19 or upgrade to Authority tier ($29/mo for 150 credits).</p>
                </div>
                <Link
                  href="/#pricing"
                  onClick={() => setShowCreditModal(false)}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:shadow-md hover:shadow-orange-500/25"
                >
                  View Plans
                </Link>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCreditModal(false)}
                className="rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
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
