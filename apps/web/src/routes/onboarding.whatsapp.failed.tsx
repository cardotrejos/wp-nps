import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { parseWhatsAppFailureParams } from "@/hooks/use-whatsapp-connection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/onboarding/whatsapp/failed")({
  component: WhatsAppFailedComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw new Error("Not authenticated");
    }
    return { session: session.data };
  },
});

/**
 * WhatsApp Connection Failure Redirect Handler
 *
 * This page is where Kapso redirects after failed WhatsApp connection.
 */
function WhatsAppFailedComponent() {
  const navigate = useNavigate();

  // Parse error from query params
  const searchParams = new URLSearchParams(window.location.search);
  const errorParams = parseWhatsAppFailureParams(searchParams);

  const errorMessage = errorParams?.errorMessage
    ? errorParams.errorMessage
    : errorParams?.errorCode
      ? getErrorMessage(errorParams.errorCode)
      : "The WhatsApp connection could not be completed. Please try again.";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Connection Failed</h2>
          <p className="mb-6 text-muted-foreground">{errorMessage}</p>
          
          {errorParams?.errorCode && (
            <p className="mb-4 text-xs text-muted-foreground">
              Error code: {errorParams.errorCode}
            </p>
          )}

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/onboarding" })}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Map error codes to user-friendly messages
 */
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    access_denied: "Access was denied. Please authorize FlowPulse to connect.",
    user_cancelled: "The connection was cancelled. Please try again when ready.",
    link_expired: "The connection link has expired. Please start again.",
    invalid_request: "Invalid request. Please try again.",
    server_error: "A server error occurred. Please try again later.",
  };

  return errorMessages[errorCode] || `Connection failed: ${errorCode}`;
}
