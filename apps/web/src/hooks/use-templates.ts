import { useQuery } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

/**
 * Template Query Hooks (Story 1.5)
 *
 * Provides reusable hooks for fetching survey templates.
 * Templates are cached for 1 hour since they rarely change.
 */

const TEMPLATE_STALE_TIME = 1000 * 60 * 60; // 1 hour

/**
 * Fetch all survey templates
 */
export function useTemplates() {
  return useQuery({
    queryKey: ["survey-templates"],
    queryFn: () => client.surveyTemplate.list(),
    staleTime: TEMPLATE_STALE_TIME,
  });
}

/**
 * Fetch a single template by ID
 */
export function useTemplate(templateId: string | null | undefined) {
  return useQuery({
    queryKey: ["survey-template", templateId],
    queryFn: () => (templateId ? client.surveyTemplate.getById({ id: templateId }) : null),
    enabled: !!templateId,
    staleTime: TEMPLATE_STALE_TIME,
  });
}
