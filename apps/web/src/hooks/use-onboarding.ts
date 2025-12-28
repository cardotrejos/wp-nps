import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import type { OnboardingState } from "@wp-nps/db/schema/auth";

/**
 * useOnboarding Hook (Story 1.4)
 *
 * Provides onboarding state management with TanStack Query
 * - Fetches and caches onboarding state
 * - Mutations for updating and completing steps
 * - Optimistic updates for responsive UX
 */

const ONBOARDING_QUERY_KEY = ["onboarding", "state"] as const;

/**
 * Fetch and cache the current onboarding state
 */
export function useOnboardingState() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: () => client.onboarding.getState(),
    staleTime: 1000 * 60, // 1 minute cache
  });
}

/**
 * Mutation to update the current step (navigation tracking)
 */
export function useUpdateCurrentStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: number) => client.onboarding.updateStep({ step }),
    onMutate: async (newStep) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ONBOARDING_QUERY_KEY });

      // Snapshot the previous value
      const previous = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);

      // Optimistic update
      queryClient.setQueryData<OnboardingState>(ONBOARDING_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          currentStep: newStep,
          lastActivityAt: new Date().toISOString(),
        };
      });

      return { previous };
    },
    onError: (_err, _newStep, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(ONBOARDING_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
    },
  });
}

/**
 * Mutation to mark a step as completed
 */
export function useCompleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ step, metadata }: { step: number; metadata?: Record<string, unknown> }) =>
      client.onboarding.completeStep({ step, metadata }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
    },
  });
}

/**
 * Mutation to update onboarding metadata
 */
export function useUpdateOnboardingMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metadata: Record<string, unknown>) =>
      client.onboarding.updateMetadata({ metadata }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
    },
  });
}

/**
 * Check if onboarding is complete
 */
export function useIsOnboardingComplete() {
  const { data: state, isPending } = useOnboardingState();

  const isComplete =
    state?.onboardingCompletedAt != null || (state?.completedSteps ?? []).includes(3);

  return {
    isComplete,
    isPending,
    state,
  };
}

/**
 * Convenience hook for common onboarding operations
 */
export function useOnboarding() {
  const queryClient = useQueryClient();
  const stateQuery = useOnboardingState();
  const updateStepMutation = useUpdateCurrentStep();
  const completeStepMutation = useCompleteStep();
  const updateMetadataMutation = useUpdateOnboardingMetadata();

  const state = stateQuery.data;
  const isComplete =
    state?.onboardingCompletedAt != null || (state?.completedSteps ?? []).includes(3);

  return {
    // State
    state,
    isComplete,
    currentStep: state?.currentStep ?? 1,
    completedSteps: state?.completedSteps ?? [],
    metadata: state?.metadata ?? {},

    // Loading states
    isPending: stateQuery.isPending,
    isUpdating:
      updateStepMutation.isPending ||
      completeStepMutation.isPending ||
      updateMetadataMutation.isPending,

    // Errors
    error:
      stateQuery.error ??
      updateStepMutation.error ??
      completeStepMutation.error ??
      updateMetadataMutation.error,

    // Actions
    updateStep: (step: number) => updateStepMutation.mutateAsync(step),
    completeStep: (step: number, metadata?: Record<string, unknown>) =>
      completeStepMutation.mutateAsync({ step, metadata }),
    updateMetadata: (metadata: Record<string, unknown>) =>
      updateMetadataMutation.mutateAsync(metadata),

    // Refresh
    refetch: () => queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY }),
  };
}
