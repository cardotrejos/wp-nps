-- Enable Row-Level Security on FlowPulse Tables
-- This provides defense-in-depth alongside application-level filtering
-- Run this after db:push to enable RLS policies

-- Enable RLS on all FlowPulse tables
ALTER TABLE IF EXISTS whatsapp_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS org_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS org_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alert ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent runs)
DROP POLICY IF EXISTS whatsapp_connection_org_isolation ON whatsapp_connection;
DROP POLICY IF EXISTS webhook_job_org_isolation ON webhook_job;
DROP POLICY IF EXISTS org_metrics_org_isolation ON org_metrics;
DROP POLICY IF EXISTS org_usage_org_isolation ON org_usage;
DROP POLICY IF EXISTS survey_org_isolation ON survey;
DROP POLICY IF EXISTS survey_response_org_isolation ON survey_response;
DROP POLICY IF EXISTS alert_org_isolation ON alert;

-- Create RLS policies for org isolation
-- Each policy checks that org_id matches the current session variable

CREATE POLICY whatsapp_connection_org_isolation ON whatsapp_connection
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY webhook_job_org_isolation ON webhook_job
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY org_metrics_org_isolation ON org_metrics
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY org_usage_org_isolation ON org_usage
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY survey_org_isolation ON survey
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY survey_response_org_isolation ON survey_response
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY alert_org_isolation ON alert
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

-- Force RLS for table owners (prevents bypass)
ALTER TABLE IF EXISTS whatsapp_connection FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_job FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS org_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS org_usage FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_response FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alert FORCE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'whatsapp_connection',
  'webhook_job',
  'org_metrics',
  'org_usage',
  'survey',
  'survey_response',
  'alert'
);
