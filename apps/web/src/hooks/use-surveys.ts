import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * useSurveys Hook (Story 2.1)
 *
 * Provides survey list fetching with TanStack Query
 * Uses query key factory pattern for proper cache management
 */

export const surveyKeys = {
  all: ["surveys"] as const,
  lists: () => [...surveyKeys.all, "list"] as const,
  list: (filters?: { limit?: number; offset?: number }) =>
    [...surveyKeys.lists(), filters] as const,
  details: () => [...surveyKeys.all, "detail"] as const,
  detail: (id: string) => [...surveyKeys.details(), id] as const,
};

interface UseSurveysOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Fetch surveys for the current organization
 */
export function useSurveys(options: UseSurveysOptions = {}) {
  const { limit = 20, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: surveyKeys.list({ limit, offset }),
    queryFn: () => client.survey.list({ limit, offset }),
    enabled,
    staleTime: 1000 * 60, // 1 minute cache
  });
}

/**
 * Fetch a single survey by ID
 */
export function useSurvey(id: string, enabled = true) {
  return useQuery({
    queryKey: surveyKeys.detail(id),
    queryFn: () => client.survey.getById({ id }),
    enabled: enabled && !!id,
    staleTime: 1000 * 60, // 1 minute cache
  });
}

/**
 * Create a new survey from a template (Story 2.2)
 * Invalidates survey list cache on success
 */
export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { templateId: string; name?: string }) => client.survey.create(params),
    onSuccess: () => {
      // Invalidate survey list cache to show new survey
      queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
    },
  });
}

/**
 * Update a question's text in a survey (Story 2.3)
 * Uses true optimistic update for immediate UI feedback
 * Code Review Fix: Added onMutate for true optimistic update, onError for rollback
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { surveyId: string; questionId: string; text: string }) =>
      client.survey.updateQuestion(params),
    // True optimistic update - update cache BEFORE server responds
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: surveyKeys.detail(variables.surveyId),
      });

      // Snapshot the previous value for rollback
      const previousSurvey = queryClient.getQueryData(
        surveyKeys.detail(variables.surveyId)
      );

      // Optimistically update the cache
      queryClient.setQueryData(
        surveyKeys.detail(variables.surveyId),
        (old: Survey | undefined) => {
          if (!old) return old;
          return {
            ...old,
            questions: old.questions?.map((q) =>
              q.id === variables.questionId ? { ...q, text: variables.text } : q
            ),
          };
        }
      );

      // Return context with snapshot for rollback
      return { previousSurvey };
    },
    // Rollback on error
    onError: (_error, variables, context) => {
      if (context?.previousSurvey) {
        queryClient.setQueryData(
          surveyKeys.detail(variables.surveyId),
          context.previousSurvey
        );
      }
    },
    // Always refetch after error or success to ensure cache is in sync
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: surveyKeys.detail(variables.surveyId),
      });
    },
  });
}
