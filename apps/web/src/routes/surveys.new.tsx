import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useTemplates } from "@/hooks/use-templates";
import { useCreateSurvey } from "@/hooks/use-surveys";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { TemplateGallery } from "@/components/onboarding/template-gallery";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";

export const Route = createFileRoute("/surveys/new")({
  component: NewSurveyPage,
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
 * Template Gallery Page (Story 2.1 - Task 2, Story 2.2 - Task 4)
 *
 * Displays all available templates for creating a new survey.
 * AC #1: Template gallery with NPS, CSAT, CES options
 * AC #2: Hover state shows question preview (via TemplateCard)
 * Story 2.2: Creates survey from template and navigates to edit page
 */
function NewSurveyPage() {
  return (
    <OnboardingGuard>
      <NewSurveyContent />
    </OnboardingGuard>
  );
}

function NewSurveyContent() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { data: templates, isPending, error } = useTemplates();
  const createSurveyMutation = useCreateSurvey();

  const handleContinue = () => {
    if (selectedTemplateId) {
      createSurveyMutation.mutate(
        { templateId: selectedTemplateId },
        {
          onSuccess: (newSurvey) => {
            toast.success("Survey created successfully!");
            // Navigate to the survey edit page
            navigate({
              to: "/surveys/$surveyId",
              params: { surveyId: newSurvey.id },
            });
          },
          onError: (err) => {
            toast.error(err.message || "Failed to create survey");
          },
        },
      );
    }
  };

  const handleBack = () => {
    navigate({ to: "/surveys" });
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
        <p className="text-destructive">Failed to load templates: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Surveys
        </button>
        <h1 className="text-2xl font-bold">Choose a Template</h1>
        <p className="mt-2 text-muted-foreground">
          Select a survey template to get started. You can customize the questions after.
        </p>
      </div>

      <TemplateGallery
        templates={templates ?? []}
        selectedId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
        className="mt-8"
      />

      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={handleBack}>
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedTemplateId || createSurveyMutation.isPending}
        >
          {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
        </Button>
      </div>
    </div>
  );
}
