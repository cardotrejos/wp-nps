import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SendTestButton } from "@/components/surveys/send-test-button";
import { SurveyStatusBadge } from "@/components/surveys/survey-status-badge";
import { SurveyStatusToggle } from "@/components/surveys/survey-status-toggle";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyHeader Component (Story 2.2 - Task 5.1, 5.2)
 * Updated: Story 2.6 - Task 7 - Added SurveyStatusToggle
 *
 * Displays survey name, type badge, status badge, and action buttons.
 * Story 2.5: Added SendTestButton for sending test surveys via WhatsApp.
 * Story 2.6: Added SurveyStatusToggle for activate/deactivate functionality.
 *
 * AC #1, #2, #3: Status toggle button in header actions
 */

interface SurveyHeaderProps {
  survey: Survey;
}

const typeColors: Record<string, string> = {
  nps: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  csat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ces: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

/**
 * Validate and normalize survey status for display
 */
function normalizeStatus(status: string): "draft" | "active" | "inactive" {
  if (status === "active" || status === "inactive") {
    return status;
  }
  return "draft"; // Default fallback for unknown statuses
}

export function SurveyHeader({ survey }: SurveyHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: "/surveys" });
  };

  const questionCount = survey.questions?.length ?? 0;
  const hasQuestions = questionCount > 0;
  // Runtime-validated status for toggle and badge components
  const status = normalizeStatus(survey.status);

  return (
    <div>
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Surveys
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={typeColors[survey.type] ?? typeColors.nps}>
              {survey.type.toUpperCase()}
            </Badge>
            <SurveyStatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-bold">{survey.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {questionCount} question{questionCount !== 1 ? "s" : ""} | Created{" "}
            {new Date(survey.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <SurveyStatusToggle
            surveyId={survey.id}
            status={status}
            hasQuestions={hasQuestions}
          />
          <SendTestButton surveyId={survey.id} />
        </div>
      </div>
    </div>
  );
}
