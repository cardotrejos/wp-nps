import { useState, useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useTemplates } from "@/hooks/use-templates";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import { TemplateGallery } from "@/components/onboarding/template-gallery";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";

export const Route = createFileRoute("/onboarding/template")({
  component: TemplateSelectionPage,
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
 * Template Selection Route (Story 1.5 - Task 4)
 *
 * Allows user to select their first survey template after WhatsApp verification.
 * Guards against skipping previous steps.
 */
function TemplateSelectionPage() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Get onboarding state
  const {
    state: onboardingState,
    isPending: stateLoading,
    isComplete,
    completeStep,
  } = useOnboarding();

  // Fetch templates using reusable hook
  const { data: templates, isPending: templatesLoading } = useTemplates();

  // Auto-select default template (NPS)
  useEffect(() => {
    if (templates && !selectedTemplateId) {
      const defaultTemplate = templates.find((t) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  }, [templates, selectedTemplateId]);

  // Redirect to dashboard if onboarding is already complete
  useEffect(() => {
    if (!stateLoading && isComplete) {
      navigate({ to: "/dashboard" });
    }
  }, [stateLoading, isComplete, navigate]);

  // Guard: Redirect if step 2 (WhatsApp) is not complete
  useEffect(() => {
    if (stateLoading) return;

    const completedSteps = onboardingState?.completedSteps ?? [];
    const hasCompletedWhatsApp = completedSteps.includes(ONBOARDING_STEPS.WHATSAPP_CONNECTED);

    if (!hasCompletedWhatsApp) {
      toast.info("Please complete WhatsApp verification first");
      navigate({ to: "/onboarding" });
    }
  }, [stateLoading, onboardingState, navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mark step 3 as complete with selected template
      await completeStep(ONBOARDING_STEPS.TEMPLATE_SELECTED, {
        selectedTemplateId,
      });

      toast.success("Template selected! Your setup is complete.");
      navigate({ to: "/onboarding/complete" });
    } catch (error) {
      console.error("Failed to save template selection:", error);
      toast.error("Failed to save selection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loader while loading state or templates
  if (stateLoading || templatesLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Progress stepper
  const steps = [
    { id: "account", label: "Account", completed: true },
    { id: "whatsapp", label: "WhatsApp", completed: true },
    { id: "template", label: "Template", completed: false, active: true },
    { id: "complete", label: "Complete", completed: false },
  ];

  return (
    <div className="mx-auto mt-10 w-full max-w-4xl p-6">
      {/* Progress Stepper */}
      <div className="mb-8 flex justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s.completed
                  ? "bg-primary text-primary-foreground"
                  : s.active
                    ? "border-2 border-primary bg-background text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.completed ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 ${s.completed ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Choose Your First Survey</h1>
        <p className="mt-2 text-muted-foreground">
          Select a template to get started. You can customize it later.
        </p>
      </div>

      {/* Template Gallery */}
      <TemplateGallery
        templates={templates ?? []}
        selectedId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
        className="mb-8"
      />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate({ to: "/onboarding" })}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedTemplateId || isSubmitting} size="lg">
          {isSubmitting ? "Saving..." : "Use This Template"}
        </Button>
      </div>
    </div>
  );
}
