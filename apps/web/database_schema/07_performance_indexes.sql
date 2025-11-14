-- ===============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ===============================================================================
-- Additional indexes to improve authentication and query performance
-- Run this file to add performance-critical indexes
-- Safe to run multiple times - uses IF NOT EXISTS
-- ===============================================================================

-- ===============================================================================
-- AUTHENTICATION PERFORMANCE INDEXES
-- ===============================================================================

-- Ensure email index exists (should already exist, but adding for safety)
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON users(email);

-- Composite index for organization + role queries (common in admin panels)
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role) WHERE is_active = true;

-- Index for last_login queries (useful for analytics and inactive user detection)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login) WHERE is_active = true;

-- Index for organization_id lookups
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id) WHERE is_active = true;

-- ===============================================================================
-- SESSION AND SECURITY INDEXES
-- ===============================================================================

-- Index for active session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active, expires_at) 
WHERE is_active = true;

-- ===============================================================================
-- COURSE AND ENROLLMENT INDEXES
-- ===============================================================================

-- Index for course lookups by organization and published status
CREATE INDEX IF NOT EXISTS idx_courses_org_published ON courses(organization_id, is_published, created_at);

-- Index for teacher's courses
CREATE INDEX IF NOT EXISTS idx_courses_teacher_published ON courses(teacher_id, is_published) 
WHERE is_published = true;

-- Index for student enrollments with status
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON course_enrollments(student_id, enrollment_status, last_accessed);

-- Index for course enrollments with status
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON course_enrollments(course_id, enrollment_status) 
WHERE enrollment_status = 'active';

-- ===============================================================================
-- EXAM SYSTEM INDEXES
-- ===============================================================================

-- Index for exam lookups by course
CREATE INDEX IF NOT EXISTS idx_exams_course_published ON exams(course_id, is_published) 
WHERE is_published = true;

-- Index for exam submissions by student
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON exam_submissions(student_id, exam_id, submitted_at);

-- Index for exam submissions by exam  
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON exam_submissions(exam_id, submission_status, submitted_at);

-- ===============================================================================
-- MEDIA AND FILES INDEXES
-- ===============================================================================

-- Index for media files by organization and uploader
CREATE INDEX IF NOT EXISTS idx_media_org_uploader ON media_files(organization_id, uploaded_by, created_at);

-- Index for public media files
CREATE INDEX IF NOT EXISTS idx_media_public ON media_files(is_public, organization_id) 
WHERE is_public = true;

-- ===============================================================================
-- QUERY OPTIMIZATION NOTES
-- ===============================================================================

-- The indexes above are designed to optimize:
-- 1. User authentication and profile lookups (email, organization_id)
-- 2. Role-based access control checks (organization_id + role)
-- 3. Admin panel queries (organization stats, user lists)
-- 4. Course enrollment queries
-- 5. Session validation and security tracking
-- 6. Exam and assessment lookups

-- To check if indexes are being used, run:
-- EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
-- EXPLAIN ANALYZE SELECT * FROM users WHERE organization_id = '...' AND role = 'admin';

-- To view all indexes on a table:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = 'users';

-- ===============================================================================
-- VACUUM AND ANALYZE
-- ===============================================================================

-- After creating indexes, update table statistics for query planner
ANALYZE users;
ANALYZE organizations;
ANALYZE courses;
ANALYZE course_enrollments;

-- Optional: Only analyze if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        EXECUTE 'ANALYZE user_sessions';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exams') THEN
        EXECUTE 'ANALYZE exams';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exam_submissions') THEN
        EXECUTE 'ANALYZE exam_submissions';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'media_files') THEN
        EXECUTE 'ANALYZE media_files';
    END IF;
END $$;

-- ===============================================================================
-- COMPLETION MESSAGE
-- ===============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes created successfully!';
  RAISE NOTICE '📊 Run EXPLAIN ANALYZE on your queries to verify index usage';
  RAISE NOTICE '🔍 Monitor slow queries with: SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;';
END $$;
