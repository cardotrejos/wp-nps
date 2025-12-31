import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
      const previousSurvey = queryClient.getQueryData(surveyKeys.detail(variables.surveyId));

      // Optimistically update the cache
      queryClient.setQueryData(surveyKeys.detail(variables.surveyId), (old: Survey | undefined) => {
        if (!old) return old;
        return {
          ...old,
          questions: old.questions?.map((q) =>
            q.id === variables.questionId ? { ...q, text: variables.text } : q,
          ),
        };
      });

      // Return context with snapshot for rollback
      return { previousSurvey };
    },
    // Rollback on error
    onError: (_error, variables, context) => {
      if (context?.previousSurvey) {
        queryClient.setQueryData(surveyKeys.detail(variables.surveyId), context.previousSurvey);
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

/**
 * Activate a survey (Story 2.6)
 * AC #1: Changes status to 'active'
 * AC #5: Shows toast confirmation on success/error
 */
export function useActivateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId }: { surveyId: string }) => client.survey.activate({ surveyId }),
    onSuccess: (data) => {
      toast.success("Survey activated");
      // Invalidate survey queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.id) });
    },
    onError: (error: Error) => {
      const message = error.message ?? "Failed to activate survey";
      toast.error(message);
    },
  });
}

/**
 * Deactivate a survey (Story 2.6)
 * AC #2: Changes status to 'inactive'
 * AC #5: Shows toast confirmation on success/error
 */
export function useDeactivateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId }: { surveyId: string }) => client.survey.deactivate({ surveyId }),
    onSuccess: (data) => {
      toast.success("Survey deactivated");
      // Invalidate survey queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.id) });
    },
    onError: (error: Error) => {
      const message = error.message ?? "Failed to deactivate survey";
      toast.error(message);
    },
  });
}

/**
 * Update survey trigger type (Story 2.7)
 * AC #5: Shows toast confirmation "Trigger type updated" on success
 */
export function useUpdateTriggerType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, triggerType }: { surveyId: string; triggerType: "api" | "manual" }) =>
      client.survey.updateTriggerType({ surveyId, triggerType }),
    onSuccess: (data) => {
      toast.success("Trigger type updated");
      // Invalidate survey queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.id) });
    },
    onError: (error: Error) => {
      const message = error.message ?? "Failed to update trigger type";
      toast.error(message);
    },
  });
}

/**
 * WhatsApp connection query keys (Story 2.5)
 */
export const whatsappKeys = {
  all: ["whatsapp"] as const,
  connection: () => [...whatsappKeys.all, "connection"] as const,
};

/**
 * Fetch WhatsApp connection status for the current organization (Story 2.5)
 * Used to determine if "Send Test to Me" button should be enabled
 */
export function useWhatsAppConnection() {
  return useQuery({
    queryKey: whatsappKeys.connection(),
    queryFn: () => client.whatsapp.getConnection(),
    staleTime: 1000 * 60, // 1 minute cache
  });
}

/**
 * Send a test survey to the user's own WhatsApp (Story 2.5)
 * AC #1: Shows "Test sent! Check your WhatsApp" on success
 * AC #4: Shows error message with failure reason on error
 */
export function useSendTestSurvey() {
  return useMutation({
    mutationFn: ({ surveyId }: { surveyId: string }) => client.survey.sendTest({ surveyId }),
    onSuccess: () => {
      toast.success("Test sent! Check your WhatsApp");
    },
    onError: (error: Error) => {
      const message = error.message ?? "Failed to send test";
      if (message.includes("connect WhatsApp")) {
        toast.error("Please connect WhatsApp first");
      } else {
        toast.error(message);
      }
    },
  });
}
