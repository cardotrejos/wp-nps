import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWhatsAppConnection } from "@/hooks/use-whatsapp-connection";
import { Loader2, ExternalLink, CheckCircle } from "lucide-react";

interface WhatsAppConnectorProps {
  onConnected?: () => void;
}

/**
 * WhatsApp Connector Component
 *
 * Uses Kapso Setup Links to connect WhatsApp:
 * 1. User clicks "Connect WhatsApp"
 * 2. We create a Setup Link and redirect to Kapso's page
 * 3. User completes Facebook login on Kapso's page
 * 4. Kapso redirects back to our success/failure route
 */
export function WhatsAppConnector({ onConnected }: WhatsAppConnectorProps) {
  const { isConnected, phoneNumber, isLoading, isCreatingSetupLink, startConnection, error } =
    useWhatsAppConnection();

  // If already connected, show success state
  if (isConnected && phoneNumber) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold">WhatsApp Connected</h2>
          <p className="mb-4 text-muted-foreground">
            Connected to: <span className="font-medium">{phoneNumber}</span>
          </p>
          {onConnected && (
            <Button onClick={onConnected} className="w-full">
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleConnect = async () => {
    try {
      await startConnection();
      // This will redirect to Kapso's page
    } catch (err) {
      console.error("Failed to start WhatsApp connection:", err);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Connect WhatsApp Business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            Connect your WhatsApp Business account to start sending NPS surveys to your customers.
          </p>
          <p>You'll be redirected to Facebook to authorize the connection.</p>
        </div>

        {/* Connect Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleConnect}
          disabled={isLoading || isCreatingSetupLink}
        >
          {isCreatingSetupLink ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect WhatsApp
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "An error occurred"}
          </div>
        )}

        {/* Info box */}
        <div className="rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
          <p>
            <strong>Requirements:</strong> You need a WhatsApp Business account connected to a
            Facebook Business account.
          </p>
        </div>

        {/* What happens next */}
        <div className="space-y-2 text-sm">
          <p className="font-medium">What happens next:</p>
          <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
            <li>You'll be redirected to Facebook</li>
            <li>Log in and select your WhatsApp Business account</li>
            <li>Authorize FlowPulse to send messages</li>
            <li>You'll be redirected back here</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
