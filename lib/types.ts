export type SubscriptionTier = 'free' | 'creator' | 'authority' | 'enterprise';
export type BookStatus = 'draft' | 'generating' | 'completed' | 'published';
export type ChapterStatus = 'pending' | 'drafting' | 'review' | 'completed';
export type FunnelStage = 'awareness' | 'consideration' | 'purchase';

export type CreditActionType = 
  | 'signup_bonus'
  | 'subscription_grant'
  | 'blueprint_generation'
  | 'chapter_generation'
  | 'chapter_revision'
  | 'audio_transcription'
  | 'cover_generation'
  | 'illustration_generation'
  | 'credit_purchase';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  credits_balance: number;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoverStyleConfig {
  template: 'penguin_classic' | 'hbr_authority' | 'modern_minimalist' | 'bold_founder' | 'tech_horizon' | 'pure_monograph' | string;
  font_family: 'Inter' | 'Playfair Display' | 'Space Grotesk' | 'Merriweather' | string;
  title_color: string;
  subtitle_color: string;
  accent_color?: string;
  layout: 'center' | 'left' | 'split' | 'editorial';
  show_barcode_box: boolean;
  author_name: string;
}

export interface SourceMaterial {
  id: string;
  title: string;
  type: 'audio_transcript' | 'text_note' | 'framework' | 'case_study';
  snippet: string;
  created_at?: string;
}

export interface GlobalContext {
  target_persona: string;
  core_thesis: string;
  terminology: Record<string, string>;
  rolling_abstracts: string[];
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  target_audience: string;
  core_thesis: string;
  tone_voice: string;
  status: BookStatus;
  cover_bg_url: string | null;
  cover_style_config: CoverStyleConfig;
  cover_full_wrap_url: string | null;
  source_materials: SourceMaterial[];
  global_context: GlobalContext;
  is_public_preview: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  summary: string | null;
  content_markdown: string;
  word_count: number;
  status: ChapterStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterImage {
  id: string;
  chapter_id: string;
  image_url: string;
  caption: string | null;
  prompt_used: string;
  position_index: number;
  created_at: string;
}

export interface ChapterRevision {
  id: string;
  chapter_id: string;
  revision_number: number;
  prompt_instruction: string | null;
  content_snapshot: string;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  action_type: CreditActionType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content_markdown: string;
  funnel_stage: FunnelStage;
  canonical_url: string | null;
  target_keywords: string[];
  schema_json: Record<string, any>;
  is_published: boolean;
  published_at: string;
}

export interface CreditRate {
  action: CreditActionType;
  cost: number;
  label: string;
}

export const CREDIT_RATES: Record<string, CreditRate> = {
  blueprint: {
    action: 'blueprint_generation',
    cost: 3,
    label: '1 Book Blueprint & Global Memory Initialization',
  },
  chapter: {
    action: 'chapter_generation',
    cost: 5,
    label: '1 Chapter Generation (1,500 - 2,500 words)',
  },
  refine: {
    action: 'chapter_revision',
    cost: 2,
    label: '1 Targeted Iterative Revision',
  },
  transcribe: {
    action: 'audio_transcription',
    cost: 3,
    label: '1 Voice Note Transcription via Whisper',
  },
  cover: {
    action: 'cover_generation',
    cost: 4,
    label: '1 AI Book Cover Background (DALL-E 3)',
  },
  illustration: {
    action: 'illustration_generation',
    cost: 2,
    label: '1 In-Chapter Editorial Illustration',
  },
};
