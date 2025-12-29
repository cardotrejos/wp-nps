import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
  decimal,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
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
  (table) => [index("idx_whatsapp_connection_org_id").on(table.orgId)],
);

// Webhook Jobs table - job queue for async processing (AR3)
export const webhookJob = pgTable(
  "webhook_job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    payload: jsonb("payload").notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    scheduledFor: timestamp("scheduled_for").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_webhook_job_org_id").on(table.orgId),
    index("idx_webhook_job_status").on(table.status),
    index("idx_webhook_job_scheduled_for").on(table.scheduledFor),
  ],
);

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
    customerPhone: text("customer_phone").notNull(),
    score: integer("score"),
    feedback: text("feedback"),
    category: text("category"),
    deliveryId: text("delivery_id"),
    isTest: boolean("is_test").notNull().default(false), // Story 2.5: Test responses excluded from analytics
    respondedAt: timestamp("responded_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_survey_response_org_id").on(table.orgId),
    index("idx_survey_response_survey_id").on(table.surveyId),
    index("idx_survey_response_category").on(table.category),
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

export const surveyResponseRelations = relations(surveyResponse, ({ one, many }) => ({
  organization: one(organization, {
    fields: [surveyResponse.orgId],
    references: [organization.id],
  }),
  survey: one(survey, {
    fields: [surveyResponse.surveyId],
    references: [survey.id],
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
    status: text("status").notNull().default("pending"), // pending, queued, sent, delivered, failed
    isTest: boolean("is_test").notNull().default(false),
    metadata: jsonb("metadata"),
    kapsoDeliveryId: text("kapso_delivery_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    index("idx_survey_delivery_org_id").on(table.orgId),
    index("idx_survey_delivery_survey_id").on(table.surveyId),
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
