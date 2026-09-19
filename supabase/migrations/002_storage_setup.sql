-- ==============================================================================
-- 002_storage_setup.sql: Supabase Storage Buckets & Policies
-- ==============================================================================

-- 1. Create Public Storage Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'book-covers',
        'book-covers',
        true,
        10485760, -- 10MB limit
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']::text[]
    ),
    (
        'chapter-illustrations',
        'chapter-illustrations',
        true,
        10485760, -- 10MB limit
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Object RLS Policies: Public Read Access
CREATE POLICY "Public Read Access for Book Covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'book-covers');

CREATE POLICY "Public Read Access for Chapter Illustrations"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chapter-illustrations');

-- 3. Storage Object RLS Policies: Authenticated User-Isolated Upload & Management
CREATE POLICY "User Isolated Insert for Book Covers"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'book-covers'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Update for Book Covers"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'book-covers'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Delete for Book Covers"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'book-covers'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Insert for Chapter Illustrations"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'chapter-illustrations'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Update for Chapter Illustrations"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'chapter-illustrations'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "User Isolated Delete for Chapter Illustrations"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'chapter-illustrations'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
