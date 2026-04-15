-- Create bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-screenshots',
    'payment-screenshots',
    false,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: Tenants can upload to their own folder
CREATE POLICY "tenants_upload_screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- RLS: Tenants can view their own screenshots
CREATE POLICY "tenants_view_own_screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
