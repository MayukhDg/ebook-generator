-- ==============================================================================
-- 001_initial_schema.sql: FolioCraft AI Database Schema & Core Functions
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table (User Account, Tier & Credit Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    credits_balance INTEGER NOT NULL DEFAULT 20 CHECK (credits_balance >= 0),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'authority', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Books Table (Authority Book Projects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    target_audience TEXT NOT NULL,
    core_thesis TEXT NOT NULL,
    tone_voice TEXT NOT NULL DEFAULT 'Authoritative & Practical',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'published')),
    cover_bg_url TEXT,
    cover_style_config JSONB DEFAULT '{"template":"minimal_authority","font_family":"Inter","title_color":"#FFFFFF","subtitle_color":"#E2E8F0","layout":"center","show_barcode_box":true}'::jsonb,
    cover_full_wrap_url TEXT,
    source_materials JSONB DEFAULT '[]'::jsonb,
    global_context JSONB DEFAULT '{}'::jsonb,
    is_public_preview BOOLEAN DEFAULT false,
    share_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Chapters Table (Chapter Outline & Content)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content_markdown TEXT NOT NULL DEFAULT '',
    word_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'drafting', 'review', 'completed')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (book_id, chapter_number)
);

-- ------------------------------------------------------------------------------
-- 4. Chapter Images Table (In-Chapter Editorial Diagrams & Line-Art)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapter_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    prompt_used TEXT NOT NULL,
    position_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. Chapter Revisions Table (Iterative Snapshots & Rollback History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapter_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    prompt_instruction TEXT,
    content_snapshot TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. Credit Transactions Table (Auditable Credit Burn Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for top-ups/grants, negative for debits
    action_type TEXT NOT NULL CHECK (action_type IN (
        'signup_bonus',
        'subscription_grant',
        'blueprint_generation',
        'chapter_generation',
        'chapter_revision',
        'audio_transcription',
        'cover_generation',
        'illustration_generation',
        'credit_purchase'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. Blog Posts Table (AEO/GEO Optimized Content Engine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    funnel_stage TEXT NOT NULL CHECK (funnel_stage IN ('awareness', 'consideration', 'purchase')),
    canonical_url TEXT,
    target_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    schema_json JSONB NOT NULL,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. Indexes for High Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_share_slug ON public.books(share_slug);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON public.chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapter_images_chapter_id ON public.chapter_images(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_revisions_chapter_id ON public.chapter_revisions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_funnel_stage ON public.blog_posts(funnel_stage);

-- ------------------------------------------------------------------------------
-- 9. Atomic Credit Concurrency Guard (Row-Level Locking)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_cost INTEGER,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    IF p_cost <= 0 THEN
        RAISE EXCEPTION 'COST_MUST_BE_POSITIVE';
    END IF;

    -- Lock the user profile row against race conditions
    SELECT credits_balance INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;

    IF v_current_credits < p_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_CREDITS: Required %, Available %', p_cost, v_current_credits;
    END IF;

    v_new_credits := v_current_credits - p_cost;

    -- Update user profile
    UPDATE public.profiles
    SET credits_balance = v_new_credits,
        updated_at = now()
    WHERE id = p_user_id;

    -- Insert auditable transaction record
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        action_type,
        metadata
    ) VALUES (
        p_user_id,
        -p_cost,
        p_action,
        p_metadata
    );

    RETURN v_new_credits;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Automatic Profile Creation Trigger on Signup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        credits_balance,
        subscription_tier
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        20, -- Free 20 signup credits
        'free'
    );

    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        action_type,
        metadata
    ) VALUES (
        NEW.id,
        20,
        'signup_bonus',
        '{"description": "Welcome bonus credits upon account creation"}'::jsonb
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 11. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: users read and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Books: users manage their own books; public read allowed for preview
CREATE POLICY "Users can CRUD own books"
    ON public.books FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public preview readable by anyone"
    ON public.books FOR SELECT
    USING (is_public_preview = true);

-- Chapters: users manage chapters of their books; public preview allowed
CREATE POLICY "Users can CRUD chapters of own books"
    ON public.chapters FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.books
            WHERE books.id = chapters.book_id
            AND books.user_id = auth.uid()
        )
    );

CREATE POLICY "Public preview chapters readable"
    ON public.chapters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.books
            WHERE books.id = chapters.book_id
            AND books.is_public_preview = true
        )
    );

-- Chapter Images: users manage images of their chapters
CREATE POLICY "Users can CRUD chapter images"
    ON public.chapter_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chapters
            JOIN public.books ON books.id = chapters.book_id
            WHERE chapters.id = chapter_images.chapter_id
            AND books.user_id = auth.uid()
        )
    );

CREATE POLICY "Public preview chapter images readable"
    ON public.chapter_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chapters
            JOIN public.books ON books.id = chapters.book_id
            WHERE chapters.id = chapter_images.chapter_id
            AND books.is_public_preview = true
        )
    );

-- Chapter Revisions: users manage revisions of their chapters
CREATE POLICY "Users can CRUD chapter revisions"
    ON public.chapter_revisions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chapters
            JOIN public.books ON books.id = chapters.book_id
            WHERE chapters.id = chapter_revisions.chapter_id
            AND books.user_id = auth.uid()
        )
    );

-- Credit Transactions: users read their own transactions
CREATE POLICY "Users can view own credit transactions"
    ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Blog Posts: publicly readable; admin writes
CREATE POLICY "Public read for published blog posts"
    ON public.blog_posts FOR SELECT
    USING (is_published = true OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin write for blog posts"
    ON public.blog_posts FOR ALL
    USING ((auth.jwt() ->> 'role') = 'admin');
