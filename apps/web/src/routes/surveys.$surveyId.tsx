import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { useSurvey } from "@/hooks/use-surveys";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { SurveyHeader } from "@/components/surveys/survey-header";
import { QuestionList } from "@/components/surveys/question-list";
import Loader from "@/components/loader";

export const Route = createFileRoute("/surveys/$surveyId")({
  component: SurveyEditPage,
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
 * Survey Edit Page (Story 2.2 - Task 2)
 *
 * Displays a survey with its questions for viewing/editing.
 * AC #4: View all template questions pre-filled
 * Editing is implemented in Story 2.3.
 */
function SurveyEditPage() {
  const { surveyId } = Route.useParams();
  const { data: survey, isPending, error } = useSurvey(surveyId);

  // Wrap in OnboardingGuard to ensure onboarding is complete
  return (
    <OnboardingGuard>
      <SurveyEditContent survey={survey} isPending={isPending} error={error} />
    </OnboardingGuard>
  );
}

interface SurveyEditContentProps {
  survey: ReturnType<typeof useSurvey>["data"];
  isPending: boolean;
  error: Error | null;
}

function SurveyEditContent({ survey, isPending, error }: SurveyEditContentProps) {
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    const isNotFound =
      error.message === "Survey not found" ||
      error.message === "You don't have access to this survey";

    return (
      <div className="container py-8">
        <p className="text-destructive">
          {isNotFound
            ? "Survey not found or you do not have access to it."
            : `Error: ${error.message}`}
        </p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container py-8">
        <p className="text-destructive">Survey not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <SurveyHeader survey={survey} />
      <QuestionList surveyId={survey.id} questions={survey.questions ?? []} className="mt-8" />
    </div>
  );
}
