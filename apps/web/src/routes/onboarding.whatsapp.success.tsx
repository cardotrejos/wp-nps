import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  useWhatsAppConnection,
  parseWhatsAppSuccessParams,
} from "@/hooks/use-whatsapp-connection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/onboarding/whatsapp/success")({
  component: WhatsAppSuccessComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw new Error("Not authenticated");
    }
    return { session: session.data };
  },
});

/**
 * WhatsApp Connection Success Redirect Handler
 *
 * This page is where Kapso redirects after successful WhatsApp connection.
 * It receives query params and confirms the connection with our backend.
 */
function WhatsAppSuccessComponent() {
  const navigate = useNavigate();
  const { confirmConnection, isConfirming, error } = useWhatsAppConnection();
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Parse query params from Kapso redirect
        const searchParams = new URLSearchParams(window.location.search);
        const params = parseWhatsAppSuccessParams(searchParams);

        if (!params) {
          setLocalError(
            "Missing required parameters from WhatsApp connection. Please try again.",
          );
          setIsProcessing(false);
          return;
        }

        await confirmConnection(params);
        setConfirmed(true);
        toast.success("WhatsApp connected successfully!");
      } catch (err) {
        console.error("Failed to confirm connection:", err);
        // Set local error for display
        setLocalError(
          err instanceof Error
            ? err.message
            : "Failed to confirm connection. Please try again.",
        );
      } finally {
        setIsProcessing(false);
      }
    };

    handleConfirmation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state - show while processing or confirming
  if (isProcessing || isConfirming) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="mb-2 text-xl font-bold">Confirming Connection...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your WhatsApp connection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - check both local errors and hook errors
  const displayError = localError ?? error;
  if (displayError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Connection Failed</h2>
            <p className="mb-6 text-muted-foreground">
              {typeof displayError === "string"
                ? displayError
                : displayError instanceof Error
                  ? displayError.message
                  : "An error occurred"}
            </p>
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

  // Success state
  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold">WhatsApp Connected!</h2>
            <p className="mb-6 text-muted-foreground">
              Your WhatsApp Business account is now connected to FlowPulse.
            </p>
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/onboarding" })}
            >
              Continue Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default loading (shouldn't normally be seen)
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
