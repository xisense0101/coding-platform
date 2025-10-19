-- ===============================================================================
-- EXAM FEEDBACK SYSTEM
-- ===============================================================================
-- Allows students to provide feedback about their exam experience
-- Requires: 02_exam_system.sql to be run first
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

-- Indexes for efficient querying
CREATE INDEX idx_exam_feedback_exam_id ON exam_feedback(exam_id);
CREATE INDEX idx_exam_feedback_student_id ON exam_feedback(student_id);
CREATE INDEX idx_exam_feedback_is_read ON exam_feedback(is_read) WHERE is_read = false;
CREATE INDEX idx_exam_feedback_submitted_at ON exam_feedback(submitted_at DESC);
CREATE INDEX idx_exam_feedback_rating ON exam_feedback(rating);

-- Comments
COMMENT ON TABLE exam_feedback IS 'Student feedback and ratings collected after exam submission';
COMMENT ON COLUMN exam_feedback.rating IS 'Star rating from 1-5 stars';
COMMENT ON COLUMN exam_feedback.feedback_text IS 'Optional text feedback from student';
COMMENT ON COLUMN exam_feedback.is_read IS 'Whether teacher/admin has read this feedback';

