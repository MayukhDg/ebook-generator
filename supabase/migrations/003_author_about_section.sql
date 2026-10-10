-- ==============================================================================
-- Migration: Add "About the Author" fields to books table
-- Adds author_bio (text) and author_photo_url (text) columns
-- Creates author-photos storage bucket with RLS policies
-- ==============================================================================

-- 1. Add author fields to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_bio TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_photo_url TEXT;

-- 2. Create author-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'author-photos',
    'author-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage policies for author-photos bucket
CREATE POLICY "Public Read Access for Author Photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'author-photos');

CREATE POLICY "User Isolated Insert for Author Photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'author-photos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Update for Author Photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'author-photos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Delete for Author Photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'author-photos'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
