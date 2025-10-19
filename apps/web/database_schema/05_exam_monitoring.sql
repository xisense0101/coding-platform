-- ===============================================================================
-- EXAM MONITORING AND SECURITY SYSTEM
-- ===============================================================================
-- This file contains tables for comprehensive exam monitoring, anti-cheating,
-- security logging, and proctoring features for Electron app integration
-- Requires: 02_exam_system.sql to be run first
-- ===============================================================================

-- ===============================================================================
-- UPDATE EXAMS TABLE WITH STRICT MODE AND MONITORING SETTINGS
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

COMMENT ON COLUMN exams.strict_level IS '1=Relaxed, 2=Medium, 3=Strict monitoring mode';
COMMENT ON COLUMN exams.max_tab_switches IS 'Maximum allowed tab switches before auto-termination';
COMMENT ON COLUMN exams.max_screen_lock_duration IS 'Maximum allowed screen lock duration in seconds';

-- ===============================================================================
-- EXAM INVITES AND TOKEN SYSTEM
-- ===============================================================================

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

-- ===============================================================================
-- EXAM MONITORING LOGS
-- ===============================================================================

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

-- ===============================================================================
-- EXAM VIOLATIONS
-- ===============================================================================

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

-- ===============================================================================
-- EXAM SECURITY METRICS (Aggregated statistics per submission)
-- ===============================================================================

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

-- ===============================================================================
-- EXAM KEYSTROKE LOGS (Optional - for advanced proctoring)
-- ===============================================================================

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

-- ===============================================================================
-- EXAM SCREENSHOTS (Optional - for visual proctoring)
-- ===============================================================================

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

-- ===============================================================================
-- EXAM CHEATING FLAGS (High-priority alerts)
-- ===============================================================================

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

-- ===============================================================================
-- INDEXES FOR PERFORMANCE
-- ===============================================================================

-- Monitoring logs
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_submission ON exam_monitoring_logs(exam_submission_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_exam ON exam_monitoring_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_student ON exam_monitoring_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_event_type ON exam_monitoring_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_severity ON exam_monitoring_logs(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_timestamp ON exam_monitoring_logs(event_timestamp);

-- Violations
CREATE INDEX IF NOT EXISTS idx_violations_submission ON exam_violations(exam_submission_id);
CREATE INDEX IF NOT EXISTS idx_violations_exam ON exam_violations(exam_id);
CREATE INDEX IF NOT EXISTS idx_violations_student ON exam_violations(student_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON exam_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON exam_violations(violation_severity);
CREATE INDEX IF NOT EXISTS idx_violations_reviewed ON exam_violations(is_reviewed);

-- Security metrics
CREATE INDEX IF NOT EXISTS idx_security_metrics_exam ON exam_security_metrics(exam_id);
CREATE INDEX IF NOT EXISTS idx_security_metrics_risk_score ON exam_security_metrics(risk_score);
CREATE INDEX IF NOT EXISTS idx_security_metrics_flagged ON exam_security_metrics(is_flagged_for_review);

-- Cheating flags
CREATE INDEX IF NOT EXISTS idx_cheating_flags_exam ON exam_cheating_flags(exam_id);
CREATE INDEX IF NOT EXISTS idx_cheating_flags_student ON exam_cheating_flags(student_id);
CREATE INDEX IF NOT EXISTS idx_cheating_flags_status ON exam_cheating_flags(flag_status);
CREATE INDEX IF NOT EXISTS idx_cheating_flags_severity ON exam_cheating_flags(flag_severity);

-- Invites
CREATE INDEX IF NOT EXISTS idx_exam_invites_exam ON exam_invites(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_invites_token ON exam_invites(token);
CREATE INDEX IF NOT EXISTS idx_exam_invites_student ON exam_invites(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_invites_valid_until ON exam_invites(valid_until);

-- ===============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- ===============================================================================

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
-- COMMENTS
-- ===============================================================================

COMMENT ON TABLE exam_invites IS 'Secure invite tokens for exam access control';
COMMENT ON TABLE exam_monitoring_logs IS 'Comprehensive activity logging for exam sessions';
COMMENT ON TABLE exam_violations IS 'Tracked violations with severity and review status';
COMMENT ON TABLE exam_security_metrics IS 'Aggregated security statistics per submission';
COMMENT ON TABLE exam_keystroke_logs IS 'Typing pattern analysis for proctoring';
COMMENT ON TABLE exam_screenshots IS 'Visual proctoring through periodic screenshots';
COMMENT ON TABLE exam_cheating_flags IS 'High-priority cheating alerts requiring review';

