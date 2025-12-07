-- ===============================================================================
-- SUBDOMAIN FEATURE MIGRATION
-- ===============================================================================
-- This migration adds multi-tenant subdomain support to existing organizations
-- Run this file AFTER your existing database is set up
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ===============================================================================

-- ===============================================================================
-- STEP 1: Add subdomain column to organizations table
-- ===============================================================================

-- Add subdomain column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'subdomain'
    ) THEN
        ALTER TABLE organizations ADD COLUMN subdomain TEXT UNIQUE;
        RAISE NOTICE 'Added subdomain column to organizations table';
    ELSE
        RAISE NOTICE 'Subdomain column already exists, skipping...';
    END IF;
END $$;

-- ===============================================================================
-- STEP 2: Add subdomain validation constraint
-- ===============================================================================

-- Add constraint to validate subdomain format
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_subdomain_format'
    ) THEN
        ALTER TABLE organizations
        ADD CONSTRAINT chk_subdomain_format CHECK (
            subdomain IS NULL OR (
                subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND 
                LENGTH(subdomain) >= 3 AND 
                LENGTH(subdomain) <= 63
            )
        );
        RAISE NOTICE 'Added subdomain validation constraint';
    ELSE
        RAISE NOTICE 'Subdomain validation constraint already exists, skipping...';
    END IF;
END $$;

-- ===============================================================================
-- STEP 3: Create indexes for fast subdomain lookups
-- ===============================================================================

-- Index for subdomain lookups (only non-null subdomains)
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain 
ON organizations(subdomain) 
WHERE subdomain IS NOT NULL;

-- Index for active organizations (commonly queried)
CREATE INDEX IF NOT EXISTS idx_organizations_active 
ON organizations(is_active) 
WHERE is_active = true;

-- Composite index for subdomain + active status (for middleware queries)
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain_active 
ON organizations(subdomain, is_active) 
WHERE subdomain IS NOT NULL AND is_active = true;

-- ===============================================================================
-- STEP 4: Ensure logo_url column exists (usually already exists)
-- ===============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE organizations ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column to organizations table';
    ELSE
        RAISE NOTICE 'Logo_url column already exists, skipping...';
    END IF;
END $$;

-- ===============================================================================
-- STEP 5: Add metadata column for tracking logo changes (optional)
-- ===============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'logo_updated_at'
    ) THEN
        ALTER TABLE organizations ADD COLUMN logo_updated_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added logo_updated_at column to organizations table';
    ELSE
        RAISE NOTICE 'Logo_updated_at column already exists, skipping...';
    END IF;
END $$;

-- ===============================================================================
-- VERIFICATION QUERIES
-- ===============================================================================

-- Check if migration was successful
DO $$
DECLARE
    subdomain_exists BOOLEAN;
    logo_url_exists BOOLEAN;
    constraint_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Check subdomain column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'subdomain'
    ) INTO subdomain_exists;
    
    -- Check logo_url column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'logo_url'
    ) INTO logo_url_exists;
    
    -- Check constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_subdomain_format'
    ) INTO constraint_exists;
    
    -- Check indexes
    SELECT COUNT(*) FROM pg_indexes 
    WHERE tablename = 'organizations' 
    AND indexname LIKE '%subdomain%'
    INTO index_count;
    
    -- Print verification results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Subdomain column exists: %', subdomain_exists;
    RAISE NOTICE 'Logo_url column exists: %', logo_url_exists;
    RAISE NOTICE 'Subdomain constraint exists: %', constraint_exists;
    RAISE NOTICE 'Subdomain indexes created: %', index_count;
    RAISE NOTICE '========================================';
    
    IF subdomain_exists AND logo_url_exists AND constraint_exists AND index_count >= 2 THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️  Some components may be missing. Please review the output above.';
    END IF;
END $$;

-- ===============================================================================
-- EXAMPLE: How to add a subdomain to existing organization
-- ===============================================================================

-- Update existing organization with subdomain (example - CUSTOMIZE THIS)
-- Uncomment and modify as needed:

-- UPDATE organizations 
-- SET subdomain = 'chitkara' 
-- WHERE name = 'Chitkara University';

-- UPDATE organizations 
-- SET subdomain = 'mit' 
-- WHERE name = 'MIT';

-- ===============================================================================
-- RESERVED SUBDOMAINS LIST (FOR REFERENCE)
-- ===============================================================================
-- These subdomains should NOT be used for organizations:
-- www, api, admin, app, mail, smtp, ftp, staging, dev, test, 
-- dashboard, blog, docs, support, status, cdn
-- 
-- You can prevent these in your application code (already done in middleware)
-- ===============================================================================

-- ===============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ===============================================================================
-- To rollback this migration, run:
/*
-- Remove indexes
DROP INDEX IF EXISTS idx_organizations_subdomain_active;
DROP INDEX IF EXISTS idx_organizations_active;
DROP INDEX IF EXISTS idx_organizations_subdomain;

-- Remove constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_subdomain_format;

-- Remove columns (WARNING: This deletes data!)
ALTER TABLE organizations DROP COLUMN IF EXISTS logo_updated_at;
ALTER TABLE organizations DROP COLUMN IF EXISTS subdomain;
-- Note: logo_url is likely used elsewhere, so don't drop it

-- Verify rollback
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'organizations';
*/
-- ===============================================================================

RAISE NOTICE '
========================================
NEXT STEPS:
========================================
1. Create Supabase Storage Bucket:
   - Name: organization-logos
   - Public: YES
   - Run: database_schema/storage_policies_migration.sql

2. Update .env.local with:
   NEXT_PUBLIC_BASE_DOMAIN=blockscode.me
   NEXT_PUBLIC_STORAGE_BUCKET=organization-logos

3. Add subdomain to your organizations:
   UPDATE organizations SET subdomain = ''your-subdomain'' WHERE id = ''org-id'';

4. Test subdomain:
   Visit: https://your-subdomain.blockscode.me

5. Upload organization logos via admin panel
========================================
';
