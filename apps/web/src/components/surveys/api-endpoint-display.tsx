import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Clock } from "lucide-react";
import { toast } from "sonner";

interface ApiEndpointDisplayProps {
  surveyId: string;
}

export function ApiEndpointDisplay({ surveyId }: ApiEndpointDisplayProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL ?? "https://api.flowpulse.app";
  const endpoint = `POST ${baseUrl}/api/v1/surveys/${surveyId}/send`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    toast.success("Endpoint copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">API Endpoint</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Coming Soon
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-background p-2 text-sm font-mono overflow-x-auto opacity-60">
            {endpoint}
          </code>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          API integration will be available after Epic 3 is complete. For now, use Manual Send mode.
        </p>

        <div className="text-xs text-muted-foreground space-y-1 opacity-60">
          <p>
            <strong>Required body:</strong>
          </p>
          <code className="block rounded bg-background p-2">
            {`{ "phoneNumber": "+5511999999999" }`}
          </code>
          <p>
            <strong>Optional:</strong> metadata, customerName
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
