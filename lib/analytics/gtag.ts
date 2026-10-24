/**
 * Google Analytics (GA4) Utilities
 * Measurement ID: G-C9JQFMLW24
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-C9JQFMLW24';

/**
 * Safely push to dataLayer or invoke window.gtag even before the external script has finished loading
 */
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag(...args);
    } else {
      (window as any).dataLayer.push(args);
    }
  }
};

/**
 * Track virtual page views for SPA route transitions
 */
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: url,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
};

export interface GTagEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Track custom user events and conversion actions
 */
export const trackEvent = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...rest,
  });
};
