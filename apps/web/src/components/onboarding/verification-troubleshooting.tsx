import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface VerificationTroubleshootingProps {
  error: Error | null;
  attemptCount: number;
  onRetry: () => void;
}

const MAX_ATTEMPTS = 3;

/**
 * Troubleshooting UI for when test message fails
 *
 * Shows:
 * - User-friendly error message
 * - Troubleshooting tips
 * - Retry button
 * - Option to go back and reconnect WhatsApp
 * - Attempt counter
 *
 * AC: #3
 */
export function VerificationTroubleshooting({
  error,
  attemptCount,
  onRetry,
}: VerificationTroubleshootingProps) {
  const hasRemainingAttempts = attemptCount < MAX_ATTEMPTS;

  // Get user-friendly error message
  const getErrorMessage = () => {
    if (!error) {
      return "Something went wrong sending the test message.";
    }

    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("not connected") || errorMessage.includes("phone_not_connected")) {
      return "Your WhatsApp doesn't seem to be connected properly.";
    }

    if (errorMessage.includes("failed") || errorMessage.includes("test_message_failed")) {
      return "The test message couldn't be delivered.";
    }

    if (errorMessage.includes("rate_limited")) {
      return "Too many attempts. Please wait a moment before trying again.";
    }

    return error.message || "Something went wrong sending the test message.";
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center text-destructive">
          <AlertCircle className="h-5 w-5" />
          Verification Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Message */}
        <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
          <p>{getErrorMessage()}</p>
        </div>

        {/* Attempt Counter */}
        <div className="text-center text-sm text-muted-foreground">
          Attempt {attemptCount} of {MAX_ATTEMPTS}
        </div>

        {/* Troubleshooting Tips */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Try these steps:</p>
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
            <li>Make sure WhatsApp is open on your phone</li>
            <li>Check that you have a stable internet connection</li>
            <li>Verify the phone number connected is correct</li>
            <li>Try closing and reopening WhatsApp</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {hasRemainingAttempts ? (
            <Button className="w-full" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          ) : (
            <div className="rounded-lg bg-amber-100 p-3 text-center text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Maximum attempts reached. Please reconnect your WhatsApp.
            </div>
          )}

          <Link
            to="/onboarding"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Reconnect WhatsApp
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-muted-foreground">
          <p>If the problem persists, try disconnecting and reconnecting your WhatsApp account.</p>
        </div>
      </CardContent>
    </Card>
  );
}
