import { useState } from "react";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendSurveyModal } from "@/components/send-survey-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManualSendButtonProps {
  surveyId: string;
  surveyName: string;
  isActive: boolean;
}

export function ManualSendButton({ surveyId, surveyName, isActive }: ManualSendButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["delivery", "list", surveyId] });
  };

  if (!isActive) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Manual Send</CardTitle>
        </CardHeader>
        <CardContent>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                disabled
                className="w-full"
                data-testid="send-survey-button"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Survey Manually
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Activate the survey first to send it</p>
            </TooltipContent>
          </Tooltip>
          <p className="mt-2 text-xs text-muted-foreground">
            Activate your survey first to enable manual sending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Manual Send</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setModalOpen(true)}
            data-testid="send-survey-button"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Survey Manually
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Enter a phone number to send this survey to a customer.
          </p>
        </CardContent>
      </Card>

      <SendSurveyModal
        surveyId={surveyId}
        surveyName={surveyName}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
