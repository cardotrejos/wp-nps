import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Eye, EyeOff, Settings, Send } from "lucide-react";

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
import { DeliveryList } from "@/components/surveys/delivery-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function SurveyEditPage() {
  const { surveyId } = Route.useParams();
  const { data: survey, isPending, error } = useSurvey(surveyId);

  return (
    <OnboardingGuard>
      <SurveyEditContent survey={survey} isPending={isPending} error={error} surveyId={surveyId} />
    </OnboardingGuard>
  );
}

interface SurveyEditContentProps {
  survey: ReturnType<typeof useSurvey>["data"];
  isPending: boolean;
  error: Error | null;
  surveyId: string;
}

function SurveyEditContent({ survey, isPending, error, surveyId }: SurveyEditContentProps) {
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

      <Tabs className="mt-6" defaultValue="setup">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="setup">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <Send className="h-4 w-4" />
            Deliveries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-8">
              <QuestionList surveyId={survey.id} questions={survey.questions ?? []} />

              <div className="rounded-lg border p-4">
                <TriggerTypeSelector
                  surveyId={survey.id}
                  currentType={(survey.triggerType as "api" | "manual") ?? "api"}
                />

                <div className="mt-6">
                  {(survey.triggerType ?? "api") === "api" ? (
                    <ApiEndpointDisplay surveyId={survey.id} />
                  ) : (
                    <ManualSendButton surveyId={survey.id} isActive={survey.isActive} />
                  )}
                </div>
              </div>
            </div>

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
        </TabsContent>

        <TabsContent value="deliveries">
          <DeliveryList surveyId={surveyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
