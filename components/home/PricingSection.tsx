'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/dodo/config';

export default function PricingSection() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (itemId: string) => {
    setIsCheckoutLoading(itemId);
    try {
      const isPack = itemId.startsWith('topup_');
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isPack ? { packId: itemId } : { planId: itemId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all ${
              plan.isPopular
                ? 'border-2 border-orange-400 bg-white shadow-warm md:-translate-y-2'
                : 'border border-gray-200 bg-white/80 hover:shadow-card'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                Most Popular for Authors
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{plan.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-4xl font-extrabold text-gray-900">
                  ${plan.priceMonthly}
                </span>
                <span className="text-xs text-gray-400">/ month</span>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-xs">
                <div className="font-bold text-orange-700">
                  {plan.creditsPerMonth} Credits / Month
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {plan.id === 'free'
                    ? 'Included on free signup'
                    : `Yields ~${Math.floor(plan.creditsPerMonth / 70)} full books + revisions`}
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-gray-600 pt-2">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={isCheckoutLoading === plan.id}
                className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isCheckoutLoading === plan.id
                  ? 'Connecting...'
                  : plan.priceMonthly === 0
                  ? 'Start Writing Free'
                  : `Upgrade to ${plan.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Credit Top-Up Pack Banner */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
            Instant Credit Top-Up
          </span>
          <h3 className="text-xl font-bold text-gray-900">Need Additional Generation Firepower?</h3>
          <p className="text-xs text-gray-500 max-w-lg">
            Top-up 50 credits for $19 or 150 credits for $49 without recurring subscriptions. Credits never expire.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleCheckout('topup_50')}
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            50 Credits ($19)
          </button>
          <button
            onClick={() => handleCheckout('topup_150')}
            className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:shadow-md hover:shadow-orange-500/25 transition-all"
          >
            150 Credits ($49)
          </button>
        </div>
      </div>
    </div>
  );
}
