import { useEffect, useState, useRef } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useTemplate } from "@/hooks/use-templates";
import { calculateTimeToValue, logTimeToValueMetric } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/loader";
import { Check, Star, BarChart3, Gauge } from "lucide-react";

export const Route = createFileRoute("/onboarding/complete")({
  component: OnboardingCompletePage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session: session.data };
  },
});

const TYPE_ICONS = {
  nps: Star,
  csat: BarChart3,
  ces: Gauge,
} as const;

/**
 * Onboarding Completion Route (Story 1.5 - Task 6)
 *
 * Shows celebration message after template selection.
 * Displays selected template and provides CTA to dashboard.
 * Respects prefers-reduced-motion for animations.
 */
function OnboardingCompletePage() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  const { state: onboardingState, isPending: stateLoading, isComplete } = useOnboarding();
  const hasLoggedMetric = useRef(false);

  // Fetch org creation date for time-to-value metric
  const { data: orgInfo } = useQuery({
    queryKey: ["onboarding", "org-created-at"],
    queryFn: () => client.onboarding.getOrgCreatedAt(),
    enabled: isComplete,
  });

  // Log time-to-value metric (Story 1.5 - Task 8)
  useEffect(() => {
    if (orgInfo && onboardingState?.onboardingCompletedAt && !hasLoggedMetric.current) {
      const metric = calculateTimeToValue(orgInfo.createdAt, onboardingState.onboardingCompletedAt);
      if (metric) {
        logTimeToValueMetric(orgInfo.orgId, metric.durationMinutes, metric.underTarget);
        hasLoggedMetric.current = true;
      }
    }
  }, [orgInfo, onboardingState?.onboardingCompletedAt]);

  // Fetch selected template using reusable hook
  const selectedTemplateId = onboardingState?.metadata?.selectedTemplateId;
  const { data: template, isPending: templateLoading } = useTemplate(selectedTemplateId);

  // Redirect if onboarding not complete
  useEffect(() => {
    if (!stateLoading && !isComplete) {
      navigate({ to: "/onboarding" });
    }
  }, [stateLoading, isComplete, navigate]);

  // Show confetti animation (respects prefers-reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGoToDashboard = () => {
    navigate({ to: "/dashboard" });
  };

  if (stateLoading || templateLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  const TemplateIcon = TYPE_ICONS[template?.type as keyof typeof TYPE_ICONS] ?? Star;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* CSS Confetti Animation - respects prefers-reduced-motion */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {/* Generate 50 confetti pieces */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="h-3 w-3 rotate-45"
                style={{
                  backgroundColor: [
                    "#f44336",
                    "#e91e63",
                    "#9c27b0",
                    "#673ab7",
                    "#3f51b5",
                    "#2196f3",
                    "#03a9f4",
                    "#00bcd4",
                    "#009688",
                    "#4caf50",
                    "#8bc34a",
                    "#cddc39",
                    "#ffeb3b",
                    "#ffc107",
                    "#ff9800",
                    "#ff5722",
                  ][i % 16],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold">Ready to create your first survey!</h1>
          <p className="mb-6 text-muted-foreground">Your setup is complete. Let's get started!</p>

          {/* Selected Template */}
          {template && (
            <div className="mb-8 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-center gap-2">
                <TemplateIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{template.name}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Selected Template</p>
            </div>
          )}

          <Button onClick={handleGoToDashboard} size="lg" className="w-full">
            Go to Dashboard
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            You can change your template at any time from the dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
