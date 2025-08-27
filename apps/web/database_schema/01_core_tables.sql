-- ===============================================================================
-- CORE TABLES SCHEMA - Organizations, Users, Authentication
-- ===============================================================================
-- This file contains the foundational tables that other systems depend on
-- Run this first before any other schema files
-- ===============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===============================================================================
-- ORGANIZATIONS (Multi-tenancy)
-- ===============================================================================

-- Organizations (Multi-tenancy support)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  max_users INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  max_courses INTEGER DEFAULT 50,
  max_exams_per_month INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  billing_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- USERS AND AUTHENTICATION
-- ===============================================================================

-- Enhanced Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')) DEFAULT 'student',
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Multi-factor authentication
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  backup_codes JSONB DEFAULT '[]',
  
  -- User preferences and permissions
  permissions JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  
  -- Student specific fields
  student_id TEXT,
  enrollment_year INTEGER,
  graduation_year INTEGER,
  department TEXT,
  year_of_study INTEGER,
  
  -- Teacher specific fields
  employee_id TEXT,
  specialization TEXT[],
  qualifications JSONB DEFAULT '[]',
  experience_years INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions for security tracking
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- MEDIA AND FILE MANAGEMENT
-- ===============================================================================

-- Media files storage
CREATE TABLE media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  storage_provider TEXT DEFAULT 'local' CHECK (storage_provider IN ('local', 'aws_s3', 'gcp', 'azure')),
  alt_text TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File access logs
CREATE TABLE file_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'upload', 'delete')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- COURSE MANAGEMENT SYSTEM
-- ===============================================================================

-- Course categories
CREATE TABLE course_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES course_categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Courses
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  co_teachers UUID[] DEFAULT '{}',
  
  -- Course details
  course_code TEXT,
  credit_hours INTEGER DEFAULT 0,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_hours INTEGER DEFAULT 0,
  prerequisites TEXT[],
  learning_objectives TEXT[],
  
  -- Course settings
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  allow_enrollment BOOLEAN DEFAULT TRUE,
  enrollment_limit INTEGER,
  enrollment_start_date TIMESTAMP WITH TIME ZONE,
  enrollment_end_date TIMESTAMP WITH TIME ZONE,
  course_start_date TIMESTAMP WITH TIME ZONE,
  course_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Pricing (if applicable)
  is_free BOOLEAN DEFAULT TRUE,
  price DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  
  -- Settings and metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Analytics
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course tags for better organization
CREATE TABLE course_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Course tag assignments
CREATE TABLE course_tag_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES course_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, tag_id)
);

-- Course sections (modules)
CREATE TABLE sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  parent_section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  rich_content JSONB,
  
  -- Section configuration
  section_type TEXT DEFAULT 'content' CHECK (section_type IN ('content', 'quiz', 'assignment', 'video', 'reading')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT TRUE,
  
  -- Time tracking
  estimated_duration_minutes INTEGER DEFAULT 0,
  
  -- Access control
  unlock_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Enrollments
CREATE TABLE course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Enrollment details
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('pending', 'active', 'completed', 'dropped', 'suspended')),
  
  -- Progress tracking
  completion_date TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  -- Time tracking
  total_time_spent_minutes INTEGER DEFAULT 0,
  
  -- Grading
  final_grade DECIMAL(5,2),
  grade_letter TEXT,
  is_passed BOOLEAN DEFAULT FALSE,
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  receive_notifications BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  enrollment_source TEXT, -- 'manual', 'self', 'bulk', 'api'
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, course_id)
);

-- Section Progress tracking
CREATE TABLE section_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  
  -- Progress status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
  
  -- Question tracking
  questions_completed INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Time tracking
  time_spent_minutes INTEGER DEFAULT 0,
  first_accessed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Scoring
  points_earned INTEGER DEFAULT 0,
  max_points INTEGER DEFAULT 0,
  
  -- Attempts
  attempt_count INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, section_id)
);

-- ===============================================================================
-- INDEXES FOR CORE TABLES
-- ===============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_users_employee_id ON users(employee_id) WHERE employee_id IS NOT NULL;

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at) WHERE is_active = true;

-- Courses
CREATE INDEX idx_courses_organization_id ON courses(organization_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_courses_featured ON courses(is_featured) WHERE is_featured = true;

-- Sections
CREATE INDEX idx_sections_course_id ON sections(course_id);
CREATE INDEX idx_sections_parent_section_id ON sections(parent_section_id);
CREATE INDEX idx_sections_order ON sections(course_id, order_index);

-- Course Enrollments
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(enrollment_status);

-- Full-text search for courses
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ===============================================================================
-- SAMPLE DATA FOR CORE TABLES
-- ===============================================================================

-- Insert default organization (customize for your needs)
INSERT INTO organizations (id, name, slug, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Default Organization', 
    'default', 
    true
) ON CONFLICT (slug) DO NOTHING;

-- Insert system administrator (customize for your needs)
INSERT INTO users (
    id, 
    organization_id, 
    email, 
    role, 
    full_name, 
    first_name, 
    last_name,
    is_active, 
    is_verified
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@system.local',
    'super_admin',
    'System Administrator',
    'System',
    'Administrator',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ===============================================================================
-- COMMENTS FOR CORE TABLES
-- ===============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations with subscription plans and limits';
COMMENT ON TABLE users IS 'Enhanced user profiles with role-based access and MFA support';
COMMENT ON TABLE courses IS 'Comprehensive course management with categories and enrollment tracking';
COMMENT ON TABLE sections IS 'Course sections/modules with hierarchical organization';
COMMENT ON TABLE course_enrollments IS 'Student course enrollment and progress tracking';
COMMENT ON TABLE section_progress IS 'Detailed progress tracking for course sections';
