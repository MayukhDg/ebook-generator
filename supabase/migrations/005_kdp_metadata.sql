-- ==============================================================================
-- Migration: Add Amazon KDP Metadata fields to books table
-- Adds kdp_description (formatted HTML sales copy), kdp_keywords (7 backend search keywords),
-- and kdp_categories (recommended BISAC / Amazon categories)
-- ==============================================================================

-- 1. Add Amazon KDP metadata columns to public.books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS kdp_description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS kdp_keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS kdp_categories JSONB DEFAULT '[]'::jsonb;

-- 2. Index for quick lookup if needed
COMMENT ON COLUMN public.books.kdp_description IS 'Amazon KDP-compliant HTML sales description (h3, h4, p, b, i, ul, li tags, max 4000 chars)';
COMMENT ON COLUMN public.books.kdp_keywords IS 'Amazon KDP 7 backend search keywords (array of 7 strings, max 50 chars each)';
COMMENT ON COLUMN public.books.kdp_categories IS 'Recommended Amazon / BISAC category taxonomy paths';
