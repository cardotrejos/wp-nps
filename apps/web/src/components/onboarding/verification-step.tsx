import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { VerificationTroubleshooting } from "./verification-troubleshooting";

interface VerificationStepProps {
  phoneNumber: string;
  onVerified: () => void;
}

/**
 * Mask phone number for privacy display
 * +5511999999999 → +55 ** *** **99
 */
function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  const last2 = phone.slice(-2);
  const countryCode = phone.slice(0, 3);
  return `${countryCode} ** *** **${last2}`;
}

/**
 * WhatsApp Verification Step Component
 *
 * Allows users to verify their WhatsApp connection by:
 * 1. Sending a test message to their connected number
 * 2. Confirming they received it
 *
 * AC: #1, #2, #4, #5
 */
export function VerificationStep({ phoneNumber, onVerified }: VerificationStepProps) {
  const [hasSent, setHasSent] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const {
    deliveryStatus,
    sendTestMessage,
    confirmVerification,
    isSending,
    isConfirming,
    error,
    attemptCount,
  } = useVerificationStatus();

  const handleSendTest = async () => {
    try {
      await sendTestMessage();
      setHasSent(true);
      toast.success("Test message sent - check your WhatsApp!");
    } catch (e) {
      console.error("Failed to send test message:", e);
      setShowTroubleshooting(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmVerification();
      toast.success("WhatsApp verified!");
      onVerified();
    } catch (e) {
      console.error("Failed to confirm verification:", e);
      toast.error("Verification failed. Please try again.");
    }
  };

  const handleRetry = () => {
    setShowTroubleshooting(false);
    setHasSent(false);
  };

  // Show troubleshooting UI on error
  if (showTroubleshooting) {
    return (
      <VerificationTroubleshooting
        error={error}
        attemptCount={attemptCount}
        onRetry={handleRetry}
      />
    );
  }

  const maskedPhone = maskPhone(phoneNumber);
  const isDelivered = deliveryStatus === "delivered";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Verify Your WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Phone Display */}
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Connected Number</p>
          <p className="font-mono text-lg">{maskedPhone}</p>
        </div>

        {/* Status Badge */}
        {hasSent && (
          <div className="flex justify-center">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                isDelivered
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {isDelivered ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Delivered!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Sent - Waiting...
                </>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          {!hasSent ? (
            <>
              <p>We'll send a test message to verify your connection.</p>
              <p>Make sure WhatsApp is open on your phone.</p>
            </>
          ) : (
            <>
              <p>Check your WhatsApp for the test message.</p>
              <p>Click below once you've received it.</p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasSent ? (
            <Button className="w-full" onClick={handleSendTest} disabled={isSending}>
              {isSending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Message
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="default"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />I Received It
                </>
              )}
            </Button>
          )}

          {hasSent && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendTest}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Send Again
                </>
              )}
            </Button>
          )}
        </div>

        {/* Error display (inline, not full troubleshooting) */}
        {error && !showTroubleshooting && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error instanceof Error ? error.message : "An error occurred"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
