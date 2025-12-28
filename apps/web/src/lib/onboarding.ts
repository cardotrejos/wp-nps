/**
 * Onboarding Constants and Utilities (Story 1.4)
 *
 * Defines onboarding steps, routes, and helper functions
 */

// Re-export OnboardingState type from DB package to ensure single source of truth (Code Review M1)
export type { OnboardingState } from "@wp-nps/db/schema/auth";
import type { OnboardingState } from "@wp-nps/db/schema/auth";

export const ONBOARDING_STEPS = {
  ACCOUNT_CREATED: 1, // Step 1: Account + Org created (auto-complete on signup)
  WHATSAPP_CONNECTED: 2, // Step 2: WhatsApp QR scanned and verified
  TEMPLATE_SELECTED: 3, // Step 3: First survey template chosen
  COMPLETE: 4, // Step 4: All done, redirect to dashboard
} as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export const STEP_ROUTES: Record<number, string> = {
  1: "/onboarding", // Entry point (redirects to step 2 if account done)
  2: "/onboarding", // WhatsApp connection
  3: "/onboarding/template", // Template selection (Story 1.5)
  4: "/dashboard", // Onboarding complete
};

export const STEP_LABELS: Record<number, string> = {
  1: "Account",
  2: "WhatsApp",
  3: "Template",
  4: "Complete",
};

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.onboardingCompletedAt != null || state.completedSteps.includes(3);
}

/**
 * Get the next step the user should be on
 */
export function getNextStep(state: OnboardingState): number {
  const completed = state.completedSteps;

  // Step 1 is auto-completed on signup
  if (!completed.includes(1)) return 1;
  if (!completed.includes(2)) return 2;
  if (!completed.includes(3)) return 3;

  return 4; // Complete
}

/**
 * Get route for a specific step
 */
export function getStepRoute(step: number): string {
  return STEP_ROUTES[step] ?? "/onboarding";
}

/**
 * Check if a step is completed
 */
export function isStepCompleted(state: OnboardingState, step: number): boolean {
  return state.completedSteps.includes(step);
}

/**
 * Get step completion timestamp
 */
export function getStepCompletedAt(state: OnboardingState, step: number): Date | null {
  const timestamp = state.metadata.stepCompletedAt?.[step.toString()];
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Calculate time-to-value metric (Story 1.5 - Task 8)
 *
 * Measures time from organization creation to onboarding completion.
 * Target: under 10 minutes (UX5).
 *
 * @param orgCreatedAt - Organization creation timestamp
 * @param onboardingCompletedAt - Onboarding completion timestamp
 * @returns Object with duration in minutes and whether target was met
 */
export function calculateTimeToValue(
  orgCreatedAt: Date | string,
  onboardingCompletedAt: Date | string | null,
): { durationMinutes: number; underTarget: boolean } | null {
  if (!onboardingCompletedAt) return null;

  const start = new Date(orgCreatedAt);
  const end = new Date(onboardingCompletedAt);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const TARGET_MINUTES = 10;

  return {
    durationMinutes,
    underTarget: durationMinutes <= TARGET_MINUTES,
  };
}

/**
 * Log time-to-value metric for analytics
 * In MVP: console log. Later: proper analytics integration.
 */
export function logTimeToValueMetric(
  orgId: string,
  durationMinutes: number,
  underTarget: boolean,
): void {
  // eslint-disable-next-line no-console
  console.log(
    `[Analytics] time_to_first_template_selection: ${durationMinutes} minutes (target: ${underTarget ? "MET" : "MISSED"}) - org: ${orgId}`,
  );

  // TODO: Integrate with proper analytics service (Mixpanel, Amplitude, etc.)
}
