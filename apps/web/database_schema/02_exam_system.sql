-- ===============================================================================
-- EXAM SYSTEM SCHEMA - Questions, Exams, Submissions, Grading
-- ===============================================================================
-- This file contains the comprehensive exam and assessment system
-- Requires: 01_core_tables.sql to be run first
-- ===============================================================================

-- ===============================================================================
-- QUESTION SYSTEM
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

-- ===============================================================================
-- EXAM SYSTEM
-- ===============================================================================

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

-- ===============================================================================
-- EXAM SUBMISSIONS AND GRADING
-- ===============================================================================

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
-- INDEXES FOR EXAM SYSTEM
-- ===============================================================================

-- Questions
CREATE INDEX idx_questions_organization_id ON questions(organization_id);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_published ON questions(is_published) WHERE is_published = true;

-- Question Banks
CREATE INDEX idx_question_banks_organization_id ON question_banks(organization_id);
CREATE INDEX idx_question_banks_created_by ON question_banks(created_by);

-- Attempts
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_attempts_exam_submission_id ON attempts(exam_submission_id);

-- Exams
CREATE INDEX idx_exams_organization_id ON exams(organization_id);
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_slug ON exams(slug);
CREATE INDEX idx_exams_published ON exams(is_published) WHERE is_published = true;
CREATE INDEX idx_exams_time_range ON exams(start_time, end_time);

-- Exam Submissions
CREATE INDEX idx_exam_submissions_exam_id ON exam_submissions(exam_id);
CREATE INDEX idx_exam_submissions_student_id ON exam_submissions(student_id);
CREATE INDEX idx_exam_submissions_status ON exam_submissions(submission_status);

-- Full-text search for questions and exams
CREATE INDEX idx_questions_search ON questions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_exams_search ON exams USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ===============================================================================
-- COMMENTS FOR EXAM SYSTEM
-- ===============================================================================

COMMENT ON TABLE questions IS 'Flexible question system supporting multiple types';
COMMENT ON TABLE mcq_questions IS 'Multiple choice questions with rich content support';
COMMENT ON TABLE coding_questions IS 'Programming questions with automated testing';
COMMENT ON TABLE essay_questions IS 'Essay questions with rubric-based evaluation';
COMMENT ON TABLE file_upload_questions IS 'File upload assignments with automated processing';
COMMENT ON TABLE exams IS 'Comprehensive exam system with security and proctoring';
COMMENT ON TABLE exam_submissions IS 'Student exam submissions with detailed tracking';
COMMENT ON TABLE attempts IS 'Individual question attempts with performance metrics';
