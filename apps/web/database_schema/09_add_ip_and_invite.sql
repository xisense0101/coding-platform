-- Add allowed_ip and invite_token to exams table

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS allowed_ip TEXT,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

-- Index for faster lookup by invite_token
CREATE INDEX IF NOT EXISTS idx_exams_invite_token ON exams(invite_token);



-- Add exam_mode column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_mode TEXT DEFAULT 'browser' CHECK (exam_mode IN ('browser', 'app'));
COMMENT ON COLUMN exams.exam_mode IS 'browser=Standard web exam, app=Electron app only';
