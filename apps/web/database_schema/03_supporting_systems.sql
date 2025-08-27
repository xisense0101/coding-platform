-- ===============================================================================
-- SUPPORTING SYSTEMS SCHEMA - Notifications, Analytics, Security, Gamification
-- ===============================================================================
-- This file contains all supporting systems for the platform
-- Requires: 01_core_tables.sql and 02_exam_system.sql to be run first
-- ===============================================================================

-- ===============================================================================
-- NOTIFICATIONS AND COMMUNICATION
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

-- ===============================================================================
-- ANALYTICS AND REPORTING
-- ===============================================================================

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

-- ===============================================================================
-- SYSTEM CONFIGURATION
-- ===============================================================================

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

-- ===============================================================================
-- ACHIEVEMENTS AND GAMIFICATION
-- ===============================================================================

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
-- PERFORMANCE INDEXES FOR SUPPORTING SYSTEMS
-- ===============================================================================

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Analytics Events
CREATE INDEX idx_analytics_events_organization_id ON analytics_events(organization_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);

-- Audit Logs
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Security Events
CREATE INDEX idx_security_events_organization_id ON security_events(organization_id);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- Certificates and Badges
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_exam_id ON certificates(exam_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ===============================================================================
-- COMMENTS FOR SUPPORTING SYSTEMS
-- ===============================================================================

COMMENT ON TABLE notifications IS 'Multi-channel notification system';
COMMENT ON TABLE analytics_events IS 'User behavior tracking for insights';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE certificates IS 'Achievement certificates with verification';
COMMENT ON TABLE badges IS 'Gamification badges and achievements system';
COMMENT ON TABLE system_settings IS 'Organization-specific configuration settings';
