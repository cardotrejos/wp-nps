import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

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

function OnboardingComponent() {
  const { session } = Route.useRouteContext();

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Welcome to FlowPulse!</h1>
      <p className="mb-6 text-muted-foreground">
        Hi {session?.user.name}, let's get your WhatsApp NPS surveys set up.
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Step 1: Connect WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Connect your WhatsApp Business account to start sending surveys.
          </p>
          <p className="mt-2 text-xs text-muted-foreground italic">
            Coming in Story 1.2
          </p>
        </div>

        <div className="rounded-lg border p-4 opacity-50">
          <h2 className="font-semibold">Step 2: Create Your First Survey</h2>
          <p className="text-sm text-muted-foreground">
            Choose a template and customize your NPS survey.
          </p>
        </div>

        <div className="rounded-lg border p-4 opacity-50">
          <h2 className="font-semibold">Step 3: Send Your First Survey</h2>
          <p className="text-sm text-muted-foreground">
            Test your survey by sending it to yourself.
          </p>
        </div>
      </div>
    </div>
  );
}
