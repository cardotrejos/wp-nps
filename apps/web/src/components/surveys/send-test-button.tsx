import { Link } from "@tanstack/react-router";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSendTestSurvey, useWhatsAppConnection } from "@/hooks/use-surveys";

/**
 * SendTestButton Component (Story 2.5)
 *
 * Sends a test survey to the user's own WhatsApp number.
 *
 * AC #1: Click sends survey to verified WhatsApp number
 * AC #3: Shows "connect WhatsApp first" when not connected
 * AC #5: Tooltip explains what the button does
 */

interface SendTestButtonProps {
  surveyId: string;
}

export function SendTestButton({ surveyId }: SendTestButtonProps) {
  const { data: connection, isPending: isCheckingConnection } = useWhatsAppConnection();
  const sendTest = useSendTestSurvey();

  // Accept both 'active' and 'verified' as valid connection statuses
  const isConnected = connection?.status === "active" || connection?.status === "verified";
  const isSending = sendTest.isPending;

  const handleSendTest = () => {
    if (!isConnected) return;
    sendTest.mutate({ surveyId });
  };

  // Loading state while checking connection
  if (isCheckingConnection) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  // WhatsApp not connected - show disabled button with tooltip
  if (!isConnected) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline" size="sm" disabled>
            <Send className="mr-2 h-4 w-4" />
            Send Test to Me
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Please{" "}
            <Link to="/onboarding" className="underline">
              connect WhatsApp
            </Link>{" "}
            first
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // WhatsApp connected - show enabled button with tooltip
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="outline" size="sm" onClick={handleSendTest} disabled={isSending}>
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test to Me
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Send this survey to your WhatsApp to preview</p>
      </TooltipContent>
    </Tooltip>
  );
}
