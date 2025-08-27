-- Default Organization Setup
-- This ensures there's always a default organization for new users

-- Insert default organization if it doesn't exist
INSERT INTO organizations (
  id,
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  settings,
  subscription_plan,
  max_users,
  max_storage_gb,
  features,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Default Organization',
  'default',
  NULL,
  '#3B82F6',
  '#1E40AF',
  '{}',
  'basic',
  1000,
  50,
  '{"courses": true, "exams": true, "analytics": true}',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create an index for faster organization lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

-- Add some sample data for development (optional)
-- This will only insert if no other organizations exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug != 'default') THEN
    INSERT INTO organizations (
      name,
      slug,
      logo_url,
      primary_color,
      secondary_color,
      settings,
      subscription_plan,
      max_users,
      max_storage_gb,
      features,
      is_active
    ) VALUES 
    (
      'Sample University',
      'sample-university',
      NULL,
      '#059669',
      '#047857',
      '{"theme": "green", "allow_public_registration": true}',
      'premium',
      5000,
      100,
      '{"courses": true, "exams": true, "analytics": true, "proctoring": true}',
      TRUE
    ),
    (
      'Demo School',
      'demo-school',
      NULL,
      '#DC2626',
      '#B91C1C',
      '{"theme": "red", "allow_public_registration": false}',
      'enterprise',
      10000,
      500,
      '{"courses": true, "exams": true, "analytics": true, "proctoring": true, "sso": true}',
      TRUE
    );
  END IF;
END $$;
