'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openFaqIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-gray-800 hover:text-orange-600 transition-colors"
            >
              <h3 className="text-sm font-bold text-gray-800 pr-4">{faq.q}</h3>
              <ChevronDown
                className={`h-4 w-4 text-orange-500 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                <p>{faq.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
