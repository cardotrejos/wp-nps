import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useOnboardingState, useIsOnboardingComplete } from "@/hooks/use-onboarding";
import { getNextStep, getStepRoute, isOnboardingComplete } from "@/lib/onboarding";
import Loader from "@/components/loader";

interface OnboardingGuardProps {
  children: React.ReactNode;
  /**
   * If true, requires onboarding to be complete to access the wrapped content.
   * If onboarding is incomplete, redirects to the appropriate onboarding step.
   * Default: true
   */
  requireComplete?: boolean;
}

/**
 * OnboardingGuard Component (Story 1.4)
 *
 * Wraps authenticated routes to enforce onboarding completion.
 * - Redirects to appropriate onboarding step if incomplete
 * - Shows loading state while checking onboarding status
 * - Handles edge cases like direct URL navigation
 *
 * Usage:
 * <OnboardingGuard>
 *   <DashboardContent />
 * </OnboardingGuard>
 */
export function OnboardingGuard({ children, requireComplete = true }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const { data: state, isPending } = useOnboardingState();
  const { isComplete } = useIsOnboardingComplete();

  useEffect(() => {
    // Wait for state to load
    if (isPending || !state) return;

    // If we require complete onboarding and it's not complete, redirect
    if (requireComplete && !isComplete) {
      const nextStep = getNextStep(state);
      const route = getStepRoute(nextStep);

      // Avoid redirect loop - don't redirect if already on onboarding
      if (!window.location.pathname.startsWith("/onboarding")) {
        navigate({ to: route });
      }
    }
  }, [isPending, isComplete, state, requireComplete, navigate]);

  // Show loader while checking onboarding status
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  // If we require complete and it's not complete, show loader (will redirect)
  if (requireComplete && !isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * OnboardingStepGuard Component
 *
 * Ensures user is on the correct onboarding step.
 * Redirects if they try to access a step they shouldn't be on.
 */
interface OnboardingStepGuardProps {
  children: React.ReactNode;
  /**
   * The step number this content is for (1, 2, or 3)
   */
  step: number;
}

export function OnboardingStepGuard({ children, step }: OnboardingStepGuardProps) {
  const navigate = useNavigate();
  const { data: state, isPending } = useOnboardingState();

  useEffect(() => {
    if (isPending || !state) return;

    // If onboarding is complete, redirect to dashboard
    if (isOnboardingComplete(state)) {
      navigate({ to: "/dashboard" });
      return;
    }

    const currentStep = getNextStep(state);

    // If user is trying to access a step they shouldn't be on
    if (step !== currentStep) {
      const route = getStepRoute(currentStep);
      navigate({ to: route });
    }
  }, [isPending, state, step, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

export default OnboardingGuard;
