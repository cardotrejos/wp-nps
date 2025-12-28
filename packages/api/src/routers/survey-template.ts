import { z } from "zod";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "@wp-nps/db";
import { surveyTemplate } from "@wp-nps/db/schema/survey-template";

import { publicProcedure } from "../index";

/**
 * Survey Template Router (Story 1.5)
 *
 * Templates are GLOBAL - not org-scoped.
 * Uses publicProcedure since templates are accessible to all users.
 */
export const surveyTemplateRouter = {
  /**
   * List all survey templates
   * Returns templates ordered by: isDefault DESC, name ASC
   */
  list: publicProcedure.handler(async () => {
    const templates = await db.query.surveyTemplate.findMany({
      orderBy: (t, { desc, asc }) => [desc(t.isDefault), asc(t.name)],
    });

    return templates;
  }),

  /**
   * Get a single template by ID
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const template = await db.query.surveyTemplate.findFirst({
      where: eq(surveyTemplate.id, input.id),
    });

    if (!template) {
      throw new ORPCError("NOT_FOUND", { message: "Template not found" });
    }

    return template;
  }),
};
