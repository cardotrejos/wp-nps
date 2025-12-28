import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  // Wrap dashboard in OnboardingGuard to ensure onboarding is complete (Story 1.4 - AC #4, #5)
  return (
    <OnboardingGuard>
      <div>
        <h1>Dashboard</h1>
        <p>Welcome {session.data?.user.name}</p>
        <p>API: {privateData.data?.message}</p>
      </div>
    </OnboardingGuard>
  );
}
