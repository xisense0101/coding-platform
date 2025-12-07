-- ===============================================================================
-- STORAGE BUCKET POLICIES - Organization Logos
-- ===============================================================================
-- This file contains storage bucket creation and access policies
-- Run this after creating the organization-logos bucket in Supabase Storage
-- ===============================================================================

-- ===============================================================================
-- STORAGE BUCKET: organization-logos
-- ===============================================================================
-- First, create the bucket in Supabase Dashboard:
-- 1. Go to Storage → Create bucket
-- 2. Name: organization-logos
-- 3. Public bucket: YES (to allow public access to logos)
-- 4. File size limit: 2MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/svg+xml, image/webp

-- Storage policies for organization-logos bucket
-- Allow authenticated users (admins/super_admins) to upload organization logos
CREATE POLICY "Allow authenticated users to upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);

-- Allow authenticated users to update organization logos
CREATE POLICY "Allow authenticated users to update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);

-- Allow authenticated users to delete organization logos
CREATE POLICY "Allow authenticated users to delete organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);

-- Allow everyone (public) to view/download organization logos
CREATE POLICY "Allow public to view organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- ===============================================================================
-- ADDITIONAL SECURITY NOTES
-- ===============================================================================
-- 1. File size limit should be enforced at application level (2MB max)
-- 2. File type validation should happen before upload
-- 3. Implement virus scanning for uploaded files in production
-- 4. Use signed URLs for temporary access if needed
-- 5. Consider implementing CDN caching for better performance
-- ===============================================================================
