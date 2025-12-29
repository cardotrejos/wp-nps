import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useSurvey } from "@/hooks/use-surveys";
import { cn } from "@/lib/utils";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { SurveyHeader } from "@/components/surveys/survey-header";
import { QuestionList } from "@/components/surveys/question-list";
import { SurveyPreview } from "@/components/surveys/survey-preview";
import { TriggerTypeSelector } from "@/components/surveys/trigger-type-selector";
import { ApiEndpointDisplay } from "@/components/surveys/api-endpoint-display";
import { ManualSendButton } from "@/components/surveys/manual-send-button";
import { Button } from "@/components/ui/button";
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
 * Survey Edit Page (Story 2.2, 2.3, 2.4, 2.7)
 *
 * Displays a survey with its questions for viewing/editing.
 * Story 2.4: Added WhatsApp preview panel with side-by-side layout.
 * Story 2.7: Added trigger type selection (API or Manual).
 *
 * AC #1: Preview shows WhatsApp chat bubble aesthetic
 * AC #2: Preview updates when questions change
 * AC #3: Phone mockup remains properly sized on resize
 * AC #4: All questions displayed in correct order
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
  // Story 2.4: Preview visibility toggle for mobile (default: visible on desktop)
  const [showPreview, setShowPreview] = useState(true);

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
    <div className="container mx-auto px-4 py-8">
      <SurveyHeader survey={survey} />

      {/* Mobile: Preview Toggle Button (Story 2.4 - Task 4.3) */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full"
        >
          {showPreview ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      {/* Desktop: Side-by-side layout (Story 2.4 - Task 4.2) */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Edit Panel */}
        <div className="space-y-8">
          <QuestionList surveyId={survey.id} questions={survey.questions ?? []} />

          {/* Trigger Type Settings (Story 2.7) */}
          <div className="rounded-lg border p-4">
            <TriggerTypeSelector
              surveyId={survey.id}
              currentType={(survey.triggerType as "api" | "manual") ?? "api"}
            />

            {/* Conditionally show API endpoint or Manual send button */}
            <div className="mt-6">
              {(survey.triggerType ?? "api") === "api" ? (
                <ApiEndpointDisplay surveyId={survey.id} />
              ) : (
                <ManualSendButton surveyId={survey.id} isActive={survey.isActive} />
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel (Story 2.4 - Tasks 4.4, 4.5) */}
        <div
          className={cn(
            "lg:sticky lg:top-6 lg:self-start",
            !showPreview && "hidden lg:block",
          )}
        >
          <div className="lg:rounded-lg lg:border lg:bg-muted/50 lg:p-4">
            <h3 className="mb-4 hidden text-sm font-medium lg:block">WhatsApp Preview</h3>
            <SurveyPreview survey={survey} />
          </div>
        </div>
      </div>
    </div>
  );
}
