import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

/**
 * Survey Template Schema (Story 1.5)
 *
 * Templates are GLOBAL - not org-scoped.
 * No RLS policy needed as all templates are publicly readable.
 * Pre-seeded with NPS, CSAT, CES templates.
 */

export interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating" | "text";
  scale?: { min: number; max: number; labels?: { min: string; max: string } };
  required: boolean;
}

export const surveyTemplate = pgTable("survey_template", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'nps' | 'csat' | 'ces'
  description: text("description").notNull(),
  questions: jsonb("questions").notNull().$type<TemplateQuestion[]>(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SurveyTemplate = typeof surveyTemplate.$inferSelect;
export type NewSurveyTemplate = typeof surveyTemplate.$inferInsert;
