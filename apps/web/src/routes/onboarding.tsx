import { useState, useEffect } from "react";
import { createFileRoute, redirect, useNavigate, Outlet, useMatch } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useWhatsAppConnection } from "@/hooks/use-whatsapp-connection";
import { useOnboarding } from "@/hooks/use-onboarding";
import { isOnboardingComplete, ONBOARDING_STEPS } from "@/lib/onboarding";
import { WhatsAppConnector } from "@/components/onboarding/whatsapp-connector";
import { VerificationStep } from "@/components/onboarding/verification-step";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";

type OnboardingStep = "welcome" | "whatsapp" | "verify" | "connected";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingComponent,
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
 * Onboarding Flow Component
 *
 * Guides user through WhatsApp connection via Kapso Setup Links
 * Story 1.4: Persists onboarding state across sessions
 * UX7: Shows progress stepper for current onboarding step
 */
function OnboardingComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const isExactMatch = useMatch({ from: "/onboarding", shouldThrow: false })?.id === "/onboarding";

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [initialized, setInitialized] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  if (!isExactMatch) {
    return <Outlet />;
  }

  // Get onboarding state from server (Story 1.4)
  const {
    state: onboardingState,
    isPending: isLoadingOnboarding,
    completeStep,
    updateMetadata,
  } = useOnboarding();

  // Get current WhatsApp connection status
  const { connection, isLoading: isLoadingConnection } = useWhatsAppConnection();

  // Auto-advance to appropriate step based on persisted state and connection status
  useEffect(() => {
    if (isLoadingConnection || isLoadingOnboarding || initialized) return;

    // Check if this is a returning user (Story 1.4 - AC #2)
    if (onboardingState?.lastActivityAt) {
      setIsReturningUser(true);
    }

    // If onboarding is already complete, redirect to dashboard (AC #5)
    if (onboardingState && isOnboardingComplete(onboardingState)) {
      navigate({ to: "/dashboard" });
      return;
    }

    // Determine step based on persisted state and WhatsApp connection
    if (connection) {
      if (connection.status === "verified") {
        // Already verified, go to connected step
        setStep("connected");
      } else if (connection.status === "active") {
        // Connected but not verified, go to verify step
        setStep("verify");
      } else if (connection.status === "pending") {
        // Still waiting for connection, stay on whatsapp step
        setStep("whatsapp");
      }
    } else if (onboardingState) {
      // Resume from persisted state if no connection yet (AC #1, #2)
      const persistedStep = onboardingState.currentStep;
      if (persistedStep >= ONBOARDING_STEPS.WHATSAPP_CONNECTED) {
        // If they were on WhatsApp step but connection expired, stay on whatsapp
        if (!onboardingState.completedSteps.includes(ONBOARDING_STEPS.WHATSAPP_CONNECTED)) {
          setStep("whatsapp");
        }
      }
    }
    setInitialized(true);
  }, [
    connection,
    isLoadingConnection,
    isLoadingOnboarding,
    onboardingState,
    initialized,
    navigate,
  ]);

  const connectedPhoneNumber = connection?.phoneNumber ?? "";

  const handleStartConnection = () => {
    setStep("whatsapp");
  };

  const handleConnectionSuccess = async () => {
    // After WhatsApp is connected, move to verification step
    setStep("verify");
    toast.success("WhatsApp connected! Now let's verify it works.");

    // Update onboarding metadata (Story 1.4 - Task 7)
    await updateMetadata({ whatsappConnected: true });
  };

  const handleVerificationSuccess = async () => {
    setStep("connected");
    toast.success("WhatsApp verified successfully!");

    // Mark WhatsApp step as complete (Story 1.4)
    await completeStep(ONBOARDING_STEPS.WHATSAPP_CONNECTED, {
      whatsappConnected: true,
    });
  };

  const handleContinue = () => {
    navigate({ to: "/onboarding/template" });
  };

  // Show loader while checking connection and onboarding status
  if (isLoadingConnection || isLoadingOnboarding) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader />
        {isReturningUser && (
          <p className="mt-4 text-muted-foreground">Welcome back! Resuming your setup...</p>
        )}
      </div>
    );
  }

  // Progress stepper (UX7)
  const steps = [
    { id: "welcome", label: "Welcome", completed: step !== "welcome" },
    {
      id: "whatsapp",
      label: "Connect",
      completed: step === "verify" || step === "connected",
      active: step === "whatsapp",
    },
    {
      id: "verify",
      label: "Verify",
      completed: step === "connected",
      active: step === "verify",
    },
    { id: "survey", label: "Survey", completed: false },
  ];

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl p-6">
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

      {/* Step Content */}
      {step === "welcome" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold">Welcome to FlowPulse!</h1>
            <p className="text-muted-foreground">
              Hi {session?.user.name}, let's get your WhatsApp NPS surveys set up.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                  Connect WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect your WhatsApp Business account to start sending surveys to your customers.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    2
                  </span>
                  Create Your First Survey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose a template and customize your NPS survey.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    3
                  </span>
                  Start Collecting Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Test your survey and start gathering customer insights.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button className="w-full" size="lg" onClick={handleStartConnection}>
            Connect WhatsApp Business
          </Button>
        </div>
      )}

      {step === "whatsapp" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Step 1: Connect WhatsApp</h1>
            <p className="text-muted-foreground">
              Connect your WhatsApp Business account via Facebook
            </p>
          </div>

          <WhatsAppConnector onConnected={() => handleConnectionSuccess()} />

          <Button variant="ghost" className="w-full" onClick={() => setStep("welcome")}>
            Back
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Step 2: Verify Connection</h1>
            <p className="text-muted-foreground">
              Let's make sure your WhatsApp is working correctly
            </p>
          </div>

          <VerificationStep
            connectedPhoneNumber={connectedPhoneNumber}
            onVerified={handleVerificationSuccess}
          />

          <Button variant="ghost" className="w-full" onClick={() => setStep("whatsapp")}>
            Back
          </Button>
        </div>
      )}

      {step === "connected" && (
        <div className="space-y-6">
          <Card className="mx-auto max-w-md">
            <CardContent className="pt-6 text-center">
              {/* Success Icon */}
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="mb-2 text-2xl font-bold">Connected!</h2>
              <p className="mb-6 text-muted-foreground">
                Your WhatsApp Business account is now connected to FlowPulse.
              </p>

              <Button className="w-full" size="lg" onClick={handleContinue}>
                Continue to Template Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
