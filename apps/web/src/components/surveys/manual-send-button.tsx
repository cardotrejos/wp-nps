import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Clock } from "lucide-react";

interface ManualSendButtonProps {
  surveyId: string;
  isActive: boolean;
}

export function ManualSendButton({ surveyId: _surveyId, isActive }: ManualSendButtonProps) {
  if (!isActive) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Manual Send</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Activate Survey to Send
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Activate your survey first to enable manual sending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Manual Send</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Coming Soon
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" disabled className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Send Survey Manually
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Manual survey sending will be available after Epic 3. Use the "Send Test to Me" button to preview.
        </p>
      </CardContent>
    </Card>
  );
}
