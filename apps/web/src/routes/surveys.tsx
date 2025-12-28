import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useSurveys } from "@/hooks/use-surveys";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { SurveyList } from "@/components/surveys/survey-list";
import { EmptySurveysState } from "@/components/surveys/empty-surveys-state";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";

export const Route = createFileRoute("/surveys")({
  component: SurveysPage,
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

/**
 * Surveys List Page (Story 2.1 - Task 1)
 *
 * Displays a list of existing surveys or empty state with CTA.
 * AC #3: Empty state with prominent "Create Your First Survey" CTA
 * AC #4: Survey list with "Create Survey" header button
 */
function SurveysPage() {
  const { data, isPending, error } = useSurveys();

  // Wrap in OnboardingGuard to ensure onboarding is complete
  return (
    <OnboardingGuard>
      <SurveysContent data={data} isPending={isPending} error={error} />
    </OnboardingGuard>
  );
}

interface SurveysContentProps {
  data: ReturnType<typeof useSurveys>["data"];
  isPending: boolean;
  error: Error | null;
}

function SurveysContent({ data, isPending, error }: SurveysContentProps) {
  const navigate = useNavigate();

  const handleCreateSurvey = () => {
    navigate({ to: "/surveys/new" });
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <p className="text-destructive">Failed to load surveys: {error.message}</p>
      </div>
    );
  }

  const surveys = data?.items ?? [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Surveys</h1>
          <p className="mt-1 text-muted-foreground">Manage your customer feedback surveys</p>
        </div>
        {surveys.length > 0 && (
          <Button onClick={handleCreateSurvey}>
            <Plus className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        )}
      </div>

      {surveys.length === 0 ? <EmptySurveysState /> : <SurveyList surveys={surveys} />}
    </div>
  );
}
