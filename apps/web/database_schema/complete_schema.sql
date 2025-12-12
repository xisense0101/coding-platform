-- ===============================================================================
-- COMPLETE DATABASE SCHEMA
-- ===============================================================================
-- This file consolidates all system schemas into a single execution script.
-- Order of execution:
-- 1. Core Tables (Orgs, Users, Auth)
-- 2. Exam System (Questions, Exams, Submissions)
-- 3. Supporting Systems (Notifications, Analytics, etc.)
-- 4. Exam Monitoring & Security
-- 5. Exam Feedback
-- 6. Additional Features (IP, Invites)
-- 7. Performance Indexes
-- 8. Storage Policies
-- 9. Seed Data
-- ===============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===============================================================================
-- 1. CORE TABLES SCHEMA
-- ===============================================================================

-- Organizations (Multi-tenancy support)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE, -- Organization's unique subdomain
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logo_updated_at TIMESTAMP WITH TIME ZONE,
  -- Subdomain validation constraints
  CONSTRAINT chk_subdomain_format CHECK (
    subdomain IS NULL OR (
      subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND 
      LENGTH(subdomain) >= 3 AND 
      LENGTH(subdomain) <= 63
    )
  )
);

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
-- 2. EXAM SYSTEM SCHEMA
-- ===============================================================================

-- Question Banks for organizing questions
CREATE TABLE question_banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  subject_area TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  is_public BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  tags JSONB DEFAULT '[]',
  question_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base Questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,
  
  -- Question basic info
  type TEXT NOT NULL CHECK (type IN ('mcq', 'coding', 'essay', 'file_upload', 'true_false', 'fill_blank', 'matching')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content
  content_type TEXT DEFAULT 'rich' CHECK (content_type IN ('plain', 'rich', 'markdown')),
  rich_content JSONB,
  
  -- Scoring and difficulty
  points INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  
  -- Organization and metadata
  tags JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  average_time_seconds INTEGER DEFAULT 0,
  
  -- Authoring
  created_by UUID NOT NULL REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_question_id UUID REFERENCES questions(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MCQ Questions (Multiple Choice)
CREATE TABLE mcq_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  rich_question_text JSONB,
  
  -- Options and answers
  options JSONB NOT NULL, -- Array of {id, text, rich_text, image_url}
  correct_answers JSONB NOT NULL, -- Array of correct option IDs
  
  -- Configuration
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  randomize_options BOOLEAN DEFAULT TRUE,
  show_answer_immediately BOOLEAN DEFAULT FALSE,
  
  -- Feedback
  explanation TEXT,
  rich_explanation JSONB,
  hints JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coding Questions
CREATE TABLE coding_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Problem description
  problem_statement TEXT NOT NULL,
  rich_problem_statement JSONB,
  
  -- Code templates
  boilerplate_code JSONB NOT NULL, -- {language: code} mapping
  solution_code JSONB, -- {language: code} mapping
  
  -- Test cases
  test_cases JSONB NOT NULL, -- Array of {input, expected_output, is_hidden, weight}
  
  -- Language and execution settings
  allowed_languages JSONB NOT NULL, -- Array of language codes
  time_limit INTEGER DEFAULT 30, -- seconds
  memory_limit INTEGER DEFAULT 128, -- MB
  
  -- Additional settings
  is_solution_provided BOOLEAN DEFAULT FALSE,
  show_expected_output BOOLEAN DEFAULT TRUE,
  allow_custom_input BOOLEAN DEFAULT FALSE,
  
  -- Evaluation settings
  evaluation_type TEXT DEFAULT 'exact' CHECK (evaluation_type IN ('exact', 'fuzzy', 'custom')),
  custom_checker_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay Questions
CREATE TABLE essay_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Question content
  prompt TEXT NOT NULL,
  rich_prompt JSONB,
  
  -- Constraints
  min_words INTEGER DEFAULT 0,
  max_words INTEGER,
  time_limit_minutes INTEGER,
  
  -- Rubric for evaluation
  rubric JSONB, -- Array of criteria with points
  
  -- AI assistance settings
  enable_ai_feedback BOOLEAN DEFAULT FALSE,
  ai_model_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Upload Questions
CREATE TABLE file_upload_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Instructions
  instructions TEXT NOT NULL,
  rich_instructions JSONB,
  
  -- File constraints
  allowed_file_types TEXT[] DEFAULT '{}', -- MIME types
  max_file_size_mb INTEGER DEFAULT 10,
  max_files INTEGER DEFAULT 1,
  
  -- Evaluation
  auto_evaluation BOOLEAN DEFAULT FALSE,
  evaluation_script TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question Bank Items (Many-to-many relationship)
CREATE TABLE question_bank_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES users(id),
  order_index INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_bank_id, question_id)
);

-- Exams
CREATE TABLE exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  
  -- Basic information
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Authoring
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  co_teachers UUID[] DEFAULT '{}',
  
  -- Scheduling
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  grace_period_minutes INTEGER DEFAULT 0,
  
  -- Scoring
  total_marks INTEGER DEFAULT 0,
  pass_marks INTEGER,
  pass_percentage DECIMAL(5,2),
  
  -- Question settings
  randomize_questions BOOLEAN DEFAULT FALSE,
  randomize_options BOOLEAN DEFAULT TRUE,
  questions_per_page INTEGER DEFAULT 1,
  
  -- Access control
  allowed_languages JSONB DEFAULT '[]',
  allowed_users UUID[] DEFAULT '{}',
  blocked_users UUID[] DEFAULT '{}',
  ip_restrictions TEXT[], -- CIDR blocks
  
  -- Test code authentication
  test_code TEXT,
  test_code_type TEXT DEFAULT 'permanent' CHECK (test_code_type IN ('permanent', 'rotating')),
  test_code_rotation_minutes INTEGER DEFAULT 60,
  test_code_last_rotated TIMESTAMP WITH TIME ZONE,
  
  -- Security settings
  security_settings JSONB DEFAULT '{}',
  proctoring_enabled BOOLEAN DEFAULT FALSE,
  require_webcam BOOLEAN DEFAULT FALSE,
  require_microphone BOOLEAN DEFAULT FALSE,
  lock_screen BOOLEAN DEFAULT FALSE,
  disable_copy_paste BOOLEAN DEFAULT FALSE,
  prevent_tab_switching BOOLEAN DEFAULT FALSE,
  
  -- Result settings
  show_results_immediately BOOLEAN DEFAULT TRUE,
  show_correct_answers BOOLEAN DEFAULT FALSE,
  allow_review BOOLEAN DEFAULT TRUE,
  show_score_breakdown BOOLEAN DEFAULT TRUE,
  
  -- Attempt settings
  max_attempts INTEGER DEFAULT 1,
  attempt_timeout_minutes INTEGER,
  
  -- Publication
  is_published BOOLEAN DEFAULT FALSE,
  is_practice BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  submission_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Sections (for organizing questions within exams)
CREATE TABLE exam_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  time_limit INTEGER, -- minutes
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Questions (many-to-many with additional properties)
CREATE TABLE exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_section_id UUID NOT NULL REFERENCES exam_sections(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Question settings for this exam
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  time_limit_seconds INTEGER,
  
  -- Question-specific overrides
  custom_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Submissions
CREATE TABLE exam_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Student information (for anonymous exams)
  attempt_number INTEGER DEFAULT 1,
  roll_number TEXT,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_section TEXT,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_minutes INTEGER,
  auto_submitted BOOLEAN DEFAULT FALSE,
  
  -- Scoring
  total_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2),
  grade_letter TEXT,
  is_passed BOOLEAN DEFAULT FALSE,
  
  -- Status
  submission_status TEXT DEFAULT 'in_progress' CHECK (submission_status IN ('in_progress', 'submitted', 'graded', 'cancelled')),
  is_submitted BOOLEAN DEFAULT FALSE,
  requires_manual_grading BOOLEAN DEFAULT FALSE,
  
  -- Answers and logs
  answers JSONB DEFAULT '{}', -- {question_id: answer_data}
  question_order JSONB DEFAULT '[]', -- Array of question IDs in order shown
  security_log JSONB DEFAULT '[]',
  browser_info JSONB DEFAULT '{}',
  
  -- Feedback
  feedback TEXT,
  teacher_comments TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id, attempt_number)
);

-- Individual Question Attempts (for detailed tracking)
CREATE TABLE attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  exam_submission_id UUID REFERENCES exam_submissions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  
  -- Attempt details
  attempt_number INTEGER DEFAULT 1,
  attempt_type TEXT CHECK (attempt_type IN ('mcq', 'coding', 'essay', 'file_upload')) NOT NULL,
  
  -- Answer data
  answer JSONB, -- Question-specific answer format
  submitted_files UUID[], -- References to media_files for file uploads
  
  -- For coding questions
  language TEXT,
  code_execution_result JSONB,
  test_cases_passed INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  execution_time INTEGER, -- milliseconds
  memory_used INTEGER, -- bytes
  
  -- Scoring
  is_correct BOOLEAN DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  max_points INTEGER DEFAULT 0,
  auto_graded BOOLEAN DEFAULT FALSE,
  
  -- Timing
  time_taken INTEGER, -- seconds
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Feedback
  feedback TEXT,
  ai_feedback JSONB,
  teacher_feedback TEXT,
  
  -- Security
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Proctoring data
CREATE TABLE exam_proctoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  
  -- Media files
  screenshot_url TEXT,
  webcam_url TEXT,
  audio_url TEXT,
  
  -- Activity monitoring
  activity_log JSONB DEFAULT '{}',
  keystroke_log JSONB DEFAULT '[]',
  mouse_activity JSONB DEFAULT '[]',
  tab_switches INTEGER DEFAULT 0,
  copy_paste_attempts INTEGER DEFAULT 0,
  
  -- Security violations
  security_violations JSONB DEFAULT '[]',
  violation_count INTEGER DEFAULT 0,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  
  -- AI analysis results
  ai_analysis_result JSONB DEFAULT '{}',
  suspicious_activity_score DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 3. SUPPORTING SYSTEMS SCHEMA
-- ===============================================================================

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for broadcast
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  rich_content JSONB,
  
  -- Classification
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'exam', 'course', 'system', 'assignment')),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  data JSONB,
  
  -- Scheduling
  send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery
  delivery_method TEXT[] DEFAULT '{"web"}' CHECK (delivery_method <@ '{"web", "email", "sms", "push"}'),
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcement system
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rich_content JSONB,
  
  -- Authoring
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'specific')),
  target_users UUID[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  
  -- Scheduling
  publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  is_published BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events for tracking user behavior
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session tracking
  session_id TEXT,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_action TEXT,
  event_label TEXT,
  event_value NUMERIC,
  
  -- Event data
  event_data JSONB NOT NULL,
  
  -- Context
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Technical details
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  operating_system TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs for security and compliance
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  details JSONB,
  affected_users UUID[] DEFAULT '{}',
  
  -- Technical details
  ip_address INET,
  user_agent TEXT,
  api_endpoint TEXT,
  request_id TEXT,
  
  -- Classification
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  category TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events for monitoring
CREATE TABLE security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  
  -- Event data
  details JSONB,
  affected_resources JSONB DEFAULT '[]',
  
  -- Technical context
  ip_address INET,
  user_agent TEXT,
  location_info JSONB,
  
  -- Resolution
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Follow-up
  requires_action BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings (per organization)
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Setting details
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  
  -- Configuration
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  is_public BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  is_readonly BOOLEAN DEFAULT FALSE,
  
  -- Organization
  category TEXT,
  subcategory TEXT,
  
  -- Validation
  validation_rules JSONB DEFAULT '{}',
  
  -- Auditing
  updated_by UUID REFERENCES users(id),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, key)
);

-- Certificates
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Certificate context
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  
  -- Certificate details
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('course_completion', 'exam_pass', 'achievement', 'participation')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Certificate data
  certificate_url TEXT,
  certificate_template TEXT,
  certificate_data JSONB DEFAULT '{}',
  
  -- Verification
  verification_code TEXT UNIQUE,
  verification_url TEXT,
  
  -- Validity
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(id),
  revoke_reason TEXT,
  
  -- Metadata
  issued_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges/Achievements system
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Badge details
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT DEFAULT '#10B981',
  
  -- Requirements
  requirements JSONB NOT NULL, -- Criteria for earning the badge
  points_value INTEGER DEFAULT 0,
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  max_recipients INTEGER, -- NULL for unlimited
  
  -- Analytics
  earned_count INTEGER DEFAULT 0,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges (many-to-many)
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  -- Earning details
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_for TEXT, -- Description of what they did to earn it
  context_data JSONB DEFAULT '{}',
  
  -- Verification
  awarded_by UUID REFERENCES users(id),
  
  UNIQUE(user_id, badge_id)
);

-- ===============================================================================
-- 4. EXAM MONITORING AND SECURITY SYSTEM
-- ===============================================================================

-- Add strict mode and advanced monitoring columns to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS strict_level INTEGER DEFAULT 1 CHECK (strict_level IN (1, 2, 3));
ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_without_monitor BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS prevent_minimize BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS track_tab_switches BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS track_screen_locks BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS detect_vm BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS require_single_monitor BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_tab_switches INTEGER DEFAULT 3;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_screen_lock_duration INTEGER DEFAULT 30; -- seconds
ALTER TABLE exams ADD COLUMN IF NOT EXISTS auto_terminate_on_violations BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_zoom_changes BOOLEAN DEFAULT TRUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS enable_keystroke_logging BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS enable_screenshot_capture BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS screenshot_interval_seconds INTEGER DEFAULT 300; -- 5 minutes

-- Add invite system columns
ALTER TABLE exams ADD COLUMN IF NOT EXISTS require_invite_token BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS invite_expiry_hours INTEGER DEFAULT 24;

-- Exam invites for secure access
CREATE TABLE IF NOT EXISTS exam_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  -- Token information
  token TEXT NOT NULL UNIQUE,
  token_type TEXT DEFAULT 'single_use' CHECK (token_type IN ('single_use', 'reusable', 'limited')),
  use_limit INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  
  -- Student information (optional - can be specific or generic)
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_email TEXT,
  student_name TEXT,
  roll_number TEXT,
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_expired BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  first_used_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  used_by_ip INET[],
  used_by_user_agent TEXT[],
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive activity logging for exam sessions
CREATE TABLE IF NOT EXISTS exam_monitoring_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event information
  event_type TEXT NOT NULL CHECK (event_type IN (
    'exam_started',
    'exam_submitted',
    'exam_terminated',
    'tab_switched_out',
    'tab_switched_in',
    'screen_locked',
    'screen_unlocked',
    'window_minimized',
    'window_restored',
    'window_blur',
    'window_focus',
    'multi_monitor_detected',
    'vm_detected',
    'copy_attempt',
    'paste_attempt',
    'right_click',
    'keyboard_shortcut',
    'zoom_changed',
    'network_disconnected',
    'network_reconnected',
    'page_reload',
    'browser_devtools_opened',
    'suspicious_activity',
    'violation_threshold_reached',
    'custom_event'
  )),
  event_category TEXT DEFAULT 'security' CHECK (event_category IN ('security', 'navigation', 'system', 'network', 'input', 'violation')),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Event details
  event_message TEXT,
  event_data JSONB DEFAULT '{}',
  
  -- Timing
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER, -- For events like screen lock duration
  
  -- Context
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  section_id UUID REFERENCES exam_sections(id) ON DELETE SET NULL,
  
  -- Technical details
  ip_address INET,
  user_agent TEXT,
  browser_info JSONB DEFAULT '{}',
  screen_resolution TEXT,
  
  -- Electron app specific
  app_version TEXT,
  os_platform TEXT,
  is_vm BOOLEAN DEFAULT FALSE,
  vm_details TEXT,
  monitor_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracked violations with severity and actions taken
CREATE TABLE IF NOT EXISTS exam_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Violation information
  violation_type TEXT NOT NULL CHECK (violation_type IN (
    'excessive_tab_switching',
    'prolonged_screen_lock',
    'multi_monitor_usage',
    'vm_detection',
    'copy_paste_attempt',
    'unauthorized_program',
    'network_manipulation',
    'time_violation',
    'suspicious_pattern',
    'manual_flag',
    'other'
  )),
  violation_severity TEXT DEFAULT 'medium' CHECK (violation_severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Details
  violation_message TEXT NOT NULL,
  violation_details JSONB DEFAULT '{}',
  
  -- Context
  violation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  
  -- Actions taken
  action_taken TEXT CHECK (action_taken IN ('warning_shown', 'logged_only', 'exam_terminated', 'flagged_for_review', 'none')),
  auto_detected BOOLEAN DEFAULT TRUE,
  
  -- Review status
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  is_justified BOOLEAN, -- NULL = not reviewed, TRUE = violation justified, FALSE = false positive
  
  -- Related monitoring log entry
  monitoring_log_id UUID REFERENCES exam_monitoring_logs(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Security Metrics
CREATE TABLE IF NOT EXISTS exam_security_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE UNIQUE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Tab switching metrics
  total_tab_switches INTEGER DEFAULT 0,
  tab_switch_duration_total_ms INTEGER DEFAULT 0,
  max_consecutive_tab_switches INTEGER DEFAULT 0,
  
  -- Screen lock metrics
  total_screen_locks INTEGER DEFAULT 0,
  screen_lock_duration_total_ms INTEGER DEFAULT 0,
  longest_screen_lock_ms INTEGER DEFAULT 0,
  
  -- Window behavior
  total_window_minimizes INTEGER DEFAULT 0,
  total_window_blur_events INTEGER DEFAULT 0,
  total_focus_loss_duration_ms INTEGER DEFAULT 0,
  
  -- Copy/paste attempts
  copy_attempts INTEGER DEFAULT 0,
  paste_attempts INTEGER DEFAULT 0,
  
  -- Zoom changes
  zoom_changes INTEGER DEFAULT 0,
  zoom_levels JSONB DEFAULT '[]', -- Array of {timestamp, level}
  
  -- Network issues
  network_disconnections INTEGER DEFAULT 0,
  total_offline_duration_ms INTEGER DEFAULT 0,
  
  -- System detection
  is_vm_detected BOOLEAN DEFAULT FALSE,
  vm_confidence_score DECIMAL(5,2) DEFAULT 0.00,
  multi_monitor_detected BOOLEAN DEFAULT FALSE,
  monitor_count_max INTEGER DEFAULT 1,
  
  -- Risk scoring
  risk_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100 scale
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_flagged_for_review BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  first_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Keystroke Logs
CREATE TABLE IF NOT EXISTS exam_keystroke_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Keystroke data (anonymized - no actual key values stored for privacy)
  keystroke_count INTEGER DEFAULT 0,
  typing_speed_wpm DECIMAL(5,2),
  typing_pattern JSONB DEFAULT '{}', -- Statistical patterns only
  
  -- Time windows (aggregated per minute)
  time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Question context
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Screenshots
CREATE TABLE IF NOT EXISTS exam_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Screenshot information
  screenshot_url TEXT NOT NULL,
  screenshot_type TEXT DEFAULT 'periodic' CHECK (screenshot_type IN ('periodic', 'violation_triggered', 'random', 'manual')),
  
  -- Context
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  triggered_by_event TEXT,
  
  -- AI analysis (optional)
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_analysis_result JSONB DEFAULT '{}',
  suspicious_items_detected TEXT[],
  
  -- Storage metadata
  file_size_bytes INTEGER,
  storage_path TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Cheating Flags
CREATE TABLE IF NOT EXISTS exam_cheating_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Flag information
  flag_reason TEXT NOT NULL,
  flag_severity TEXT DEFAULT 'high' CHECK (flag_severity IN ('medium', 'high', 'critical')),
  flag_details JSONB DEFAULT '{}',
  
  -- Evidence
  violations_count INTEGER DEFAULT 0,
  related_violation_ids UUID[],
  evidence_urls TEXT[],
  
  -- Status
  flag_status TEXT DEFAULT 'pending' CHECK (flag_status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  auto_flagged BOOLEAN DEFAULT TRUE,
  
  -- Review
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_decision TEXT CHECK (review_decision IN ('confirmed_cheating', 'no_evidence', 'false_positive', 'needs_investigation')),
  review_notes TEXT,
  action_taken TEXT, -- e.g., "Score invalidated", "Warning issued", etc.
  
  -- Notification
  teacher_notified BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update security metrics automatically
CREATE OR REPLACE FUNCTION update_exam_security_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize or update security metrics for the submission
  INSERT INTO exam_security_metrics (
    exam_submission_id,
    exam_id,
    student_id,
    first_activity_at,
    last_activity_at
  )
  VALUES (
    NEW.exam_submission_id,
    NEW.exam_id,
    NEW.student_id,
    NEW.event_timestamp,
    NEW.event_timestamp
  )
  ON CONFLICT (exam_submission_id) DO UPDATE
  SET
    last_activity_at = NEW.event_timestamp,
    updated_at = NOW(),
    -- Increment counters based on event type
    total_tab_switches = CASE 
      WHEN NEW.event_type = 'tab_switched_out' 
      THEN exam_security_metrics.total_tab_switches + 1 
      ELSE exam_security_metrics.total_tab_switches 
    END,
    total_screen_locks = CASE 
      WHEN NEW.event_type = 'screen_locked' 
      THEN exam_security_metrics.total_screen_locks + 1 
      ELSE exam_security_metrics.total_screen_locks 
    END,
    total_window_minimizes = CASE 
      WHEN NEW.event_type = 'window_minimized' 
      THEN exam_security_metrics.total_window_minimizes + 1 
      ELSE exam_security_metrics.total_window_minimizes 
    END,
    total_window_blur_events = CASE 
      WHEN NEW.event_type = 'window_blur' 
      THEN exam_security_metrics.total_window_blur_events + 1 
      ELSE exam_security_metrics.total_window_blur_events 
    END,
    copy_attempts = CASE 
      WHEN NEW.event_type = 'copy_attempt' 
      THEN exam_security_metrics.copy_attempts + 1 
      ELSE exam_security_metrics.copy_attempts 
    END,
    paste_attempts = CASE 
      WHEN NEW.event_type = 'paste_attempt' 
      THEN exam_security_metrics.paste_attempts + 1 
      ELSE exam_security_metrics.paste_attempts 
    END,
    zoom_changes = CASE 
      WHEN NEW.event_type = 'zoom_changed' 
      THEN exam_security_metrics.zoom_changes + 1 
      ELSE exam_security_metrics.zoom_changes 
    END,
    is_vm_detected = CASE 
      WHEN NEW.event_type = 'vm_detected' 
      THEN TRUE 
      ELSE exam_security_metrics.is_vm_detected 
    END,
    multi_monitor_detected = CASE 
      WHEN NEW.event_type = 'multi_monitor_detected' 
      THEN TRUE 
      ELSE exam_security_metrics.multi_monitor_detected 
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update security metrics on new monitoring log
CREATE TRIGGER trigger_update_security_metrics
AFTER INSERT ON exam_monitoring_logs
FOR EACH ROW
EXECUTE FUNCTION update_exam_security_metrics();

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(submission_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  metrics RECORD;
  score DECIMAL(5,2) := 0.00;
BEGIN
  SELECT * INTO metrics FROM exam_security_metrics WHERE exam_submission_id = submission_id;
  
  IF metrics IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- Calculate risk score based on various factors
  -- Tab switches (max 20 points)
  score := score + LEAST(metrics.total_tab_switches * 2.0, 20.0);
  
  -- Screen locks (max 15 points)
  score := score + LEAST(metrics.total_screen_locks * 3.0, 15.0);
  
  -- Copy/paste attempts (max 15 points)
  score := score + LEAST((metrics.copy_attempts + metrics.paste_attempts) * 5.0, 15.0);
  
  -- VM detection (20 points if detected)
  IF metrics.is_vm_detected THEN
    score := score + 20.0;
  END IF;
  
  -- Multi-monitor (15 points if detected)
  IF metrics.multi_monitor_detected THEN
    score := score + 15.0;
  END IF;
  
  -- Window blur events (max 15 points)
  score := score + LEAST(metrics.total_window_blur_events * 1.5, 15.0);
  
  -- Cap at 100
  score := LEAST(score, 100.0);
  
  -- Update the risk score in the metrics table
  UPDATE exam_security_metrics 
  SET 
    risk_score = score,
    risk_level = CASE
      WHEN score >= 75 THEN 'critical'
      WHEN score >= 50 THEN 'high'
      WHEN score >= 25 THEN 'medium'
      ELSE 'low'
    END,
    is_flagged_for_review = CASE WHEN score >= 60 THEN TRUE ELSE FALSE END,
    updated_at = NOW()
  WHERE exam_submission_id = submission_id;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================================
-- 5. EXAM FEEDBACK SYSTEM
-- ===============================================================================

-- Student Exam Feedback
CREATE TABLE exam_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  exam_submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Student information
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  roll_number TEXT,
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One feedback per submission
  UNIQUE(exam_submission_id)
);

-- ===============================================================================
-- 6. ADDITIONAL FEATURES (IP, INVITES)
-- ===============================================================================

-- Add allowed_ip and invite_token to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS allowed_ip TEXT,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

-- Add exam_mode column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_mode TEXT DEFAULT 'browser' CHECK (exam_mode IN ('browser', 'app'));

-- ===============================================================================
-- 7. PERFORMANCE INDEXES
-- ===============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_organizations_subdomain_active ON organizations(subdomain, is_active) WHERE subdomain IS NOT NULL AND is_active = true;

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_org_role ON users(organization_id, role) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON users(last_login) WHERE is_active = true;

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at) WHERE is_active = true;

-- Courses
CREATE INDEX idx_courses_organization_id ON courses(organization_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_courses_org_published ON courses(organization_id, is_published, created_at);
CREATE INDEX idx_courses_teacher_published ON courses(teacher_id, is_published) WHERE is_published = true;
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Sections
CREATE INDEX idx_sections_course_id ON sections(course_id);
CREATE INDEX idx_sections_parent_section_id ON sections(parent_section_id);
CREATE INDEX idx_sections_order ON sections(course_id, order_index);

-- Course Enrollments
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(enrollment_status);
CREATE INDEX idx_enrollments_student_status ON course_enrollments(student_id, enrollment_status, last_accessed);
CREATE INDEX idx_enrollments_course_status ON course_enrollments(course_id, enrollment_status) WHERE enrollment_status = 'active';

-- Questions
CREATE INDEX idx_questions_organization_id ON questions(organization_id);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_published ON questions(is_published) WHERE is_published = true;
CREATE INDEX idx_questions_search ON questions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Exams
CREATE INDEX idx_exams_organization_id ON exams(organization_id);
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_slug ON exams(slug);
CREATE INDEX idx_exams_published ON exams(is_published) WHERE is_published = true;
CREATE INDEX idx_exams_time_range ON exams(start_time, end_time);
CREATE INDEX idx_exams_course_published ON exams(course_id, is_published) WHERE is_published = true;
CREATE INDEX idx_exams_invite_token ON exams(invite_token);
CREATE INDEX idx_exams_search ON exams USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Exam Submissions
CREATE INDEX idx_exam_submissions_exam_id ON exam_submissions(exam_id);
CREATE INDEX idx_exam_submissions_student_id ON exam_submissions(student_id);
CREATE INDEX idx_exam_submissions_status ON exam_submissions(submission_status);
CREATE INDEX idx_exam_submissions_student ON exam_submissions(student_id, exam_id, submitted_at);
CREATE INDEX idx_exam_submissions_exam ON exam_submissions(exam_id, submission_status, submitted_at);

-- Exam Monitoring
CREATE INDEX idx_monitoring_logs_submission ON exam_monitoring_logs(exam_submission_id);
CREATE INDEX idx_monitoring_logs_exam ON exam_monitoring_logs(exam_id);
CREATE INDEX idx_monitoring_logs_student ON exam_monitoring_logs(student_id);
CREATE INDEX idx_monitoring_logs_event_type ON exam_monitoring_logs(event_type);
CREATE INDEX idx_monitoring_logs_severity ON exam_monitoring_logs(severity);
CREATE INDEX idx_monitoring_logs_timestamp ON exam_monitoring_logs(event_timestamp);

-- Exam Feedback
CREATE INDEX idx_exam_feedback_exam_id ON exam_feedback(exam_id);
CREATE INDEX idx_exam_feedback_student_id ON exam_feedback(student_id);
CREATE INDEX idx_exam_feedback_is_read ON exam_feedback(is_read) WHERE is_read = false;
CREATE INDEX idx_exam_feedback_submitted_at ON exam_feedback(submitted_at DESC);
CREATE INDEX idx_exam_feedback_rating ON exam_feedback(rating);

-- Supporting Systems
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_analytics_events_organization_id ON analytics_events(organization_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_media_org_uploader ON media_files(organization_id, uploaded_by, created_at);

-- ===============================================================================
-- 8. STORAGE POLICIES
-- ===============================================================================

-- Create policy for uploading organization logos
CREATE POLICY "Allow authenticated users to upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'
);

-- Allow authenticated users to update organization logos
CREATE POLICY "Allow authenticated users to update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos'
);

-- Allow authenticated users to delete organization logos
CREATE POLICY "Allow authenticated users to delete organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos'
);

-- Allow everyone (public) to view/download organization logos
CREATE POLICY "Allow public to view organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- ===============================================================================
-- 9. SEED DATA
-- ===============================================================================

-- Insert default organization
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
  '00000000-0000-0000-0000-000000000001'::uuid,
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

-- Insert system administrator
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
-- END OF SCHEMA
-- ===============================================================================
