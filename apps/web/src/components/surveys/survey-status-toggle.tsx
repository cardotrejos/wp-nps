import { Loader2, Play, Pause } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActivateSurvey, useDeactivateSurvey } from "@/hooks/use-surveys";

/**
 * SurveyStatusToggle Component (Story 2.6 - Task 4)
 *
 * Provides activate/deactivate button based on current survey status.
 * - Draft/Inactive: Shows "Activate" button (with Play icon)
 * - Active: Shows "Deactivate" button (with Pause icon)
 *
 * AC #1: Activate button when draft/inactive
 * AC #2: Deactivate button when active
 * AC #3: Disabled when no questions (activate only)
 */

interface SurveyStatusToggleProps {
  surveyId: string;
  status: "draft" | "active" | "inactive";
  hasQuestions: boolean;
}

export function SurveyStatusToggle({
  surveyId,
  status,
  hasQuestions,
}: SurveyStatusToggleProps) {
  const activateMutation = useActivateSurvey();
  const deactivateMutation = useDeactivateSurvey();

  const isLoading = activateMutation.isPending || deactivateMutation.isPending;
  const isActive = status === "active";

  const handleToggle = () => {
    if (isActive) {
      deactivateMutation.mutate({ surveyId });
    } else {
      activateMutation.mutate({ surveyId });
    }
  };

  if (isActive) {
    return (
      <Button variant="outline" onClick={handleToggle} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Pause className="mr-2 h-4 w-4" />
        )}
        Deactivate
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      onClick={handleToggle}
      disabled={isLoading || !hasQuestions}
      title={!hasQuestions ? "Add at least one question before activating" : undefined}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Activate
    </Button>
  );
}
