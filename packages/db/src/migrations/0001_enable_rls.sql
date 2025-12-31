ALTER TABLE "whatsapp_connection" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "webhook_job" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "org_metrics" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "org_usage" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey_response" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "alert" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey_delivery" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "api_key" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "whatsapp_connection_org_isolation" ON "whatsapp_connection" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "webhook_job_org_isolation" ON "webhook_job" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "org_metrics_org_isolation" ON "org_metrics" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "org_usage_org_isolation" ON "org_usage" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "survey_org_isolation" ON "survey" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "survey_response_org_isolation" ON "survey_response" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "alert_org_isolation" ON "alert" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "survey_delivery_org_isolation" ON "survey_delivery" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "customer_org_isolation" ON "customer" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
CREATE POLICY "api_key_org_isolation" ON "api_key" FOR ALL USING (org_id = current_setting('app.current_org_id', true)) WITH CHECK (org_id = current_setting('app.current_org_id', true));
--> statement-breakpoint
ALTER TABLE "whatsapp_connection" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "webhook_job" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "org_metrics" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "org_usage" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey_response" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "alert" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "survey_delivery" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customer" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "api_key" FORCE ROW LEVEL SECURITY;
