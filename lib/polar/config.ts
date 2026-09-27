import { Polar } from '@polar-sh/sdk';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  creditsPerMonth: number;
  polarProductId: string;
  stripePriceId?: string; // backwards compatibility
  isPopular?: boolean;
  features: string[];
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  polarProductId: string;
  stripePriceId?: string; // backwards compatibility
  description: string;
}

// Polar SDK instance singleton
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || '',
  server: (process.env.POLAR_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox',
});

// Product IDs mapped to Polar products created in Polar dashboard
export const POLAR_PRODUCT_IDS = {
  creator: process.env.POLAR_PRODUCT_CREATOR || '',
  authority: process.env.POLAR_PRODUCT_AUTHORITY || '',
  topup_50: process.env.POLAR_PRODUCT_TOPUP_50 || '',
  topup_150: process.env.POLAR_PRODUCT_TOPUP_150 || '',
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Test drive the authority engine with zero risk',
    priceMonthly: 0,
    creditsPerMonth: 20,
    polarProductId: '',
    stripePriceId: '',
    features: [
      '20 Free Welcome Credits (1 Blueprint + 2 Chapters + 1 Cover)',
      'Global Memory Blueprint Generator',
      'Split-Screen Chapter Studio',
      'Web Reader Preview',
      'Standard Export with FolioCraft Watermark',
    ],
  },
  {
    id: 'creator',
    name: 'Authority Creator',
    tagline: 'For consultants & founders writing high-ticket IP books',
    priceMonthly: 29,
    creditsPerMonth: 150,
    polarProductId: POLAR_PRODUCT_IDS.creator,
    stripePriceId: process.env.STRIPE_PRICE_CREATOR || 'price_creator_monthly',
    isPopular: true,
    features: [
      '150 Credits / Month (Up to 2 full 10-chapter books)',
      'Priority GPT-4o Generation & Streaming',
      'OpenAI Whisper Audio Transcription',
      '6x9 Trade Paperback KDP-Compliant PDF',
      'Reflowable EPUB3 Export (Kindle & Apple Books)',
      'Decoupled DALL-E 3 Cover Studio (Negative Space Art)',
      'Custom Chapter Revisions & Case Study Injections',
      'No Watermarks + Full Commercial Rights',
    ],
  },
  {
    id: 'authority',
    name: 'Agency Operator',
    tagline: 'For high-output ghostwriters, agencies & publishers',
    priceMonthly: 79,
    creditsPerMonth: 500,
    polarProductId: POLAR_PRODUCT_IDS.authority,
    stripePriceId: process.env.STRIPE_PRICE_AUTHORITY || 'price_authority_monthly',
    features: [
      '500 Credits / Month (Up to 7 complete books per month)',
      'All Creator Features Included',
      '300 DPI CMYK KDP Full-Wrap PDF with Custom Bleed',
      'Dynamic Spine Width & Barcode Area Positioning',
      'Unlimited Chapter Version Diffs & Instant Rollbacks',
      'Multi-Project Global Context Vaults',
      'Dedicated Priority Queue & Early Feature Access',
    ],
  },
];

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'topup_50',
    name: '50 Credit Top-Up',
    price: 19,
    credits: 50,
    polarProductId: POLAR_PRODUCT_IDS.topup_50,
    stripePriceId: process.env.STRIPE_PRICE_TOPUP_50 || 'price_topup_50',
    description: 'Perfect for drafting 8 extra chapters or exploring multiple AI cover iterations.',
  },
  {
    id: 'topup_150',
    name: '150 Credit Booster',
    price: 49,
    credits: 150,
    polarProductId: POLAR_PRODUCT_IDS.topup_150,
    stripePriceId: process.env.STRIPE_PRICE_TOPUP_150 || 'price_topup_150',
    description: 'Add a full book project with illustrations and KDP wrap renders.',
  },
];
