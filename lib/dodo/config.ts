import DodoPayments from 'dodopayments';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  creditsPerMonth: number;
  dodoProductId: string;
  isPopular?: boolean;
  features: string[];
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  dodoProductId: string;
  description: string;
}

// Dodo Payments SDK instance singleton
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY || '',
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode') as 'test_mode' | 'live_mode',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET || '',
});

// Product IDs mapped to Dodo Payments products created in Dodo Payments dashboard
export const DODO_PRODUCT_IDS = {
  creator: process.env.DODO_PRODUCT_CREATOR || process.env.DODO_PAYMENTS_PRODUCT_CREATOR || '',
  authority: process.env.DODO_PRODUCT_AUTHORITY || process.env.DODO_PAYMENTS_PRODUCT_AUTHORITY || '',
  topup_50: process.env.DODO_PRODUCT_TOPUP_50 || process.env.DODO_PAYMENTS_PRODUCT_TOPUP_50 || '',
  topup_150: process.env.DODO_PRODUCT_TOPUP_150 || process.env.DODO_PAYMENTS_PRODUCT_TOPUP_150 || '',
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Test drive the authority engine with zero risk',
    priceMonthly: 0,
    creditsPerMonth: 20,
    dodoProductId: '',
    features: [
      '20 Free Welcome Credits (1 Blueprint + 2 Chapters + 1 Cover)',
      'Global Memory Blueprint Generator',
      'Split-Screen Chapter Studio',
      'Web Reader Preview',
      'Standard Export with OpusCraft Watermark',
    ],
  },
  {
    id: 'creator',
    name: 'Authority Creator',
    tagline: 'For consultants & founders writing high-ticket IP books',
    priceMonthly: 25,
    creditsPerMonth: 120,
    dodoProductId: DODO_PRODUCT_IDS.creator,
    isPopular: true,
    features: [
      '120 Credits / Month (Up to 2 full 10-chapter books)',
      'Priority Generation & Streaming',
      'Audio Transcription',
      '6x9 Trade Paperback KDP-Compliant PDF',
      'Reflowable EPUB3 Export (Kindle & Apple Books)',
      'Decoupled Cover Studio',
      'Custom Chapter Revisions & Case Study Injections',
      'No Watermarks + Full Commercial Rights',
    ],
  },
  {
    id: 'authority',
    name: 'Agency Operator',
    tagline: 'For high-output ghostwriters, agencies & publishers',
    priceMonthly: 65,
    creditsPerMonth: 400,
    dodoProductId: DODO_PRODUCT_IDS.authority,
    features: [
      '400 Credits / Month (Up to 7 complete books per month)',
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
    price: 10,
    credits: 50,
    dodoProductId: DODO_PRODUCT_IDS.topup_50,
    description: 'Perfect for drafting 8 extra chapters or exploring multiple AI cover iterations.',
  },
  {
    id: 'topup_150',
    name: '150 Credit Booster',
    price: 20,
    credits: 150,
    dodoProductId: DODO_PRODUCT_IDS.topup_150,
    description: 'Add a full book project with illustrations and KDP wrap renders.',
  },
];
