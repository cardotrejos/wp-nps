import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  decimal,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { surveyTemplate } from "./survey-template";

/**
 * SurveyQuestion type - shared between templates and surveys
 * Story 2.1: Added type export for use in components
 */
export interface SurveyQuestion {
  id: string;
  text: string;
  type: "rating" | "text";
  scale?: { min: number; max: number; labels?: { min: string; max: string } };
  required: boolean;
}

// WhatsApp Connection table - tracks WhatsApp connections per organization
export const whatsappConnection = pgTable(
  "whatsapp_connection",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number"),
    status: text("status").notNull().default("pending"),
    kapsoId: text("kapso_id"),
    connectedAt: timestamp("connected_at"),
    lastSeenAt: timestamp("last_seen_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_whatsapp_connection_org_id").on(table.orgId),
    index("idx_whatsapp_connection_phone_number_id").on(
      sql`(${table.metadata}->>'phoneNumberId')`,
    ),
  ],
);

export const webhookJob = pgTable(
  "webhook_job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    source: text("source").notNull().default("kapso"),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }).defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_webhook_job_org_id").on(table.orgId),
    index("idx_webhook_job_pending").on(table.nextRetryAt).where(sql`status = 'pending'`),
    uniqueIndex("uq_webhook_job_idempotency").on(table.idempotencyKey),
  ],
);

export type WebhookJob = typeof webhookJob.$inferSelect;
export type NewWebhookJob = typeof webhookJob.$inferInsert;

// Org Metrics table - pre-aggregated metrics for dashboard (AR5)
export const orgMetrics = pgTable(
  "org_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    metricDate: timestamp("metric_date").notNull(),
    npsScore: decimal("nps_score", { precision: 5, scale: 2 }),
    promoterCount: integer("promoter_count").notNull().default(0),
    passiveCount: integer("passive_count").notNull().default(0),
    detractorCount: integer("detractor_count").notNull().default(0),
    totalResponses: integer("total_responses").notNull().default(0),
    totalSent: integer("total_sent").notNull().default(0),
    responseRate: decimal("response_rate", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_org_metrics_org_id").on(table.orgId),
    index("idx_org_metrics_date").on(table.metricDate),
  ],
);

// Org Usage table - usage metering for billing (AR6)
export const orgUsage = pgTable(
  "org_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    surveysSent: integer("surveys_sent").notNull().default(0),
    responsesReceived: integer("responses_received").notNull().default(0),
    alertsTriggered: integer("alerts_triggered").notNull().default(0),
    planLimit: integer("plan_limit"),
    usagePercent: decimal("usage_percent", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_org_usage_org_id").on(table.orgId),
    index("idx_org_usage_period").on(table.periodStart, table.periodEnd),
  ],
);

// Survey table - survey definitions (Story 2.1: Updated with proper types)
export const survey = pgTable(
  "survey",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("nps"), // 'nps' | 'csat' | 'ces'
    status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'inactive'
    triggerType: text("trigger_type").notNull().default("api"), // 'api' | 'manual' (Story 2.7)
    templateId: text("template_id").references(() => surveyTemplate.id),
    questions: jsonb("questions").$type<SurveyQuestion[]>().notNull().default([]),
    settings: jsonb("settings"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_survey_org_id").on(table.orgId),
    index("idx_survey_status").on(table.status),
  ],
);

export type Survey = typeof survey.$inferSelect;
export type NewSurvey = typeof survey.$inferInsert;

// Customer table - tracks customers per organization (Story 3.7)
export const customer = pgTable(
  "customer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    phoneNumberHash: text("phone_number_hash").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_customer_org_id").on(table.orgId),
    uniqueIndex("uq_customer_org_phone").on(table.orgId, table.phoneNumberHash),
  ],
);

export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;

// Survey Response table - individual survey responses
export const surveyResponse = pgTable(
  "survey_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => survey.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customer.id), // Story 3.7: Link to customer record
    customerPhone: text("customer_phone").notNull(),
    score: integer("score"),
    feedback: text("feedback"),
    category: text("category"), // 'promoter' | 'passive' | 'detractor'
    deliveryId: text("delivery_id"), // Story 3.7: References surveyDelivery.id (kept as text for compatibility)
    isTest: boolean("is_test").notNull().default(false), // Story 2.5: Test responses excluded from analytics
    respondedAt: timestamp("responded_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_survey_response_org_id").on(table.orgId),
    index("idx_survey_response_survey_id").on(table.surveyId),
    index("idx_survey_response_category").on(table.category),
    index("idx_survey_response_created").on(table.createdAt),
  ],
);

// Alert table - detractor alerts
export const alert = pgTable(
  "alert",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    responseId: uuid("response_id")
      .notNull()
      .references(() => surveyResponse.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("detractor"),
    status: text("status").notNull().default("active"),
    contactedAt: timestamp("contacted_at"),
    resolvedAt: timestamp("resolved_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_alert_org_id").on(table.orgId),
    index("idx_alert_status").on(table.status),
  ],
);

// Relations
export const whatsappConnectionRelations = relations(whatsappConnection, ({ one }) => ({
  organization: one(organization, {
    fields: [whatsappConnection.orgId],
    references: [organization.id],
  }),
}));

export const webhookJobRelations = relations(webhookJob, ({ one }) => ({
  organization: one(organization, {
    fields: [webhookJob.orgId],
    references: [organization.id],
  }),
}));

export const orgMetricsRelations = relations(orgMetrics, ({ one }) => ({
  organization: one(organization, {
    fields: [orgMetrics.orgId],
    references: [organization.id],
  }),
}));

export const orgUsageRelations = relations(orgUsage, ({ one }) => ({
  organization: one(organization, {
    fields: [orgUsage.orgId],
    references: [organization.id],
  }),
}));

export const surveyRelations = relations(survey, ({ one, many }) => ({
  organization: one(organization, {
    fields: [survey.orgId],
    references: [organization.id],
  }),
  template: one(surveyTemplate, {
    fields: [survey.templateId],
    references: [surveyTemplate.id],
  }),
  responses: many(surveyResponse),
}));

export const customerRelations = relations(customer, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customer.orgId],
    references: [organization.id],
  }),
  responses: many(surveyResponse),
}));

export const surveyResponseRelations = relations(surveyResponse, ({ one, many }) => ({
  organization: one(organization, {
    fields: [surveyResponse.orgId],
    references: [organization.id],
  }),
  survey: one(survey, {
    fields: [surveyResponse.surveyId],
    references: [survey.id],
  }),
  customer: one(customer, {
    fields: [surveyResponse.customerId],
    references: [customer.id],
  }),
  alerts: many(alert),
}));

export const alertRelations = relations(alert, ({ one }) => ({
  organization: one(organization, {
    fields: [alert.orgId],
    references: [organization.id],
  }),
  response: one(surveyResponse, {
    fields: [alert.responseId],
    references: [surveyResponse.id],
  }),
}));

// Survey Delivery table - tracks survey sends (Story 2.5)
export const surveyDelivery = pgTable(
  "survey_delivery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => survey.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    phoneNumberHash: text("phone_number_hash").notNull(),
    status: text("status").notNull().default("pending"),
    isTest: boolean("is_test").notNull().default(false),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(2),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    kapsoDeliveryId: text("kapso_delivery_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deliveredAt: timestamp("delivered_at"),
    respondedAt: timestamp("responded_at"),
  },
  (table) => [
    index("idx_survey_delivery_org_id").on(table.orgId),
    index("idx_survey_delivery_survey_id").on(table.surveyId),
    index("idx_survey_delivery_status").on(table.status),
    index("idx_survey_delivery_phone_hash").on(table.phoneNumberHash),
  ],
);

export const surveyDeliveryRelations = relations(surveyDelivery, ({ one }) => ({
  organization: one(organization, {
    fields: [surveyDelivery.orgId],
    references: [organization.id],
  }),
  survey: one(survey, {
    fields: [surveyDelivery.surveyId],
    references: [survey.id],
  }),
}));

// API Key table - tracks API keys per organization (Story 3.2)
// NFR-S3: API keys hashed, never stored in plaintext
export const apiKey = pgTable(
  "api_key",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(), // SHA-256 hash - never store plaintext
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for display (fp_xxxxxxxx...)
    name: text("name").default("Default API Key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_api_key_org_id").on(table.orgId),
    index("idx_api_key_hash").on(table.keyHash),
    // Task 1.3: Unique constraint - only one active (non-revoked) key per org
    uniqueIndex("uq_api_key_active_org").on(table.orgId).where(sql`revoked_at IS NULL`),
  ],
);

export type ApiKey = typeof apiKey.$inferSelect;
export type NewApiKey = typeof apiKey.$inferInsert;

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  organization: one(organization, {
    fields: [apiKey.orgId],
    references: [organization.id],
  }),
}));

// Onboarding Email Log table - tracks reminder emails sent (Story 3.9)
// Used for deduplication to prevent spam
export const onboardingEmailLog = pgTable(
  "onboarding_email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emailType: text("email_type").notNull(), // 'reminder_24h' | 'reminder_48h' | 'reminder_72h'
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_onboarding_email_log_org").on(table.orgId),
    index("idx_onboarding_email_log_lookup").on(table.orgId, table.emailType, table.sentAt),
  ],
);

export type OnboardingEmailLog = typeof onboardingEmailLog.$inferSelect;
export type NewOnboardingEmailLog = typeof onboardingEmailLog.$inferInsert;

export const onboardingEmailLogRelations = relations(onboardingEmailLog, ({ one }) => ({
  organization: one(organization, {
    fields: [onboardingEmailLog.orgId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [onboardingEmailLog.userId],
    references: [user.id],
  }),
}));
