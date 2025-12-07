-- ===============================================================================
-- STORAGE BUCKET POLICIES MIGRATION
-- ===============================================================================
-- This file sets up the storage bucket policies for organization logos
-- Run this AFTER creating the 'organization-logos' bucket in Supabase Storage
-- ===============================================================================

-- ===============================================================================
-- INSTRUCTIONS TO CREATE BUCKET FIRST:
-- ===============================================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create bucket"
-- 3. Bucket name: organization-logos
-- 4. Public bucket: YES (check the box)
-- 5. File size limit: 2097152 (2MB in bytes)
-- 6. Allowed MIME types: image/jpeg,image/png,image/svg+xml,image/webp
-- 7. Click "Create bucket"
-- 
-- THEN run this SQL file to set up access policies
-- ===============================================================================

-- ===============================================================================
-- STEP 1: Allow authenticated admins to upload logos
-- ===============================================================================

-- Drop existing policy if it exists (for re-running)
DROP POLICY IF EXISTS "Allow authenticated users to upload organization logos" ON storage.objects;

-- Create policy for uploading organization logos
CREATE POLICY "Allow authenticated users to upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'
);

-- Note: We allow all authenticated users because the API endpoint
-- will handle the actual permission checks (super_admin or org admin)

-- ===============================================================================
-- STEP 2: Allow authenticated admins to update logos
-- ===============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to update organization logos" ON storage.objects;

CREATE POLICY "Allow authenticated users to update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos'
);

-- ===============================================================================
-- STEP 3: Allow authenticated admins to delete logos
-- ===============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to delete organization logos" ON storage.objects;

CREATE POLICY "Allow authenticated users to delete organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos'
);

-- ===============================================================================
-- STEP 4: Allow everyone (public) to view/download logos
-- ===============================================================================

DROP POLICY IF EXISTS "Allow public to view organization logos" ON storage.objects;

CREATE POLICY "Allow public to view organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- ===============================================================================
-- VERIFICATION
-- ===============================================================================

-- Check if policies were created successfully
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%organization logos%'
    INTO policy_count;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STORAGE POLICIES VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Storage policies created: %', policy_count;
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✅ All storage policies created successfully!';
        RAISE NOTICE '';
        RAISE NOTICE 'Policies active:';
        RAISE NOTICE '  - Upload (INSERT)';
        RAISE NOTICE '  - Update (UPDATE)';
        RAISE NOTICE '  - Delete (DELETE)';
        RAISE NOTICE '  - Public read (SELECT)';
    ELSE
        RAISE WARNING '⚠️  Expected 4 policies, found %. Please check storage bucket exists.', policy_count;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- List all policies for organization-logos bucket
SELECT 
    policyname as "Policy Name",
    cmd as "Operation",
    CASE 
        WHEN roles = '{authenticated}' THEN 'Authenticated Users'
        WHEN roles = '{public}' THEN 'Public (Anyone)'
        ELSE roles::text
    END as "Who Can Access"
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%organization logos%'
ORDER BY cmd;

-- ===============================================================================
-- EXAMPLE USAGE
-- ===============================================================================

-- After running this, you can upload logos via:
-- 1. API endpoint: POST /api/admin/organizations/[orgId]/logo
-- 2. Direct Supabase client upload:

/*
const { data, error } = await supabase.storage
  .from('organization-logos')
  .upload('org-id/logo.png', file, {
    contentType: 'image/png',
    upsert: true
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('organization-logos')
  .getPublicUrl('org-id/logo.png');
*/

-- ===============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ===============================================================================
-- To remove these policies, run:
/*
DROP POLICY IF EXISTS "Allow authenticated users to upload organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view organization logos" ON storage.objects;
*/
-- ===============================================================================

RAISE NOTICE '
========================================
NEXT STEPS:
========================================
1. Verify bucket exists:
   - Go to Supabase Dashboard → Storage
   - Check "organization-logos" bucket exists
   - Ensure it is marked as PUBLIC

2. Test upload via API:
   POST /api/admin/organizations/{orgId}/logo
   Body: FormData with "logo" file

3. Verify logo displays:
   - Logo should be visible at public URL
   - Homepage should show logo on subdomain

4. Security notes:
   - File validation done at API level
   - Max size: 2MB (enforced in API)
   - Allowed types: JPEG, PNG, SVG, WebP
========================================
';
