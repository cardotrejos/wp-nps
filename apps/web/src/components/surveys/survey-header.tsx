import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyHeader Component (Story 2.2 - Task 5.1, 5.2)
 *
 * Displays survey name, type badge, status badge, and action buttons.
 * Preview and Test buttons are disabled until Stories 2.4 and 2.5.
 */

interface SurveyHeaderProps {
  survey: Survey;
}

const typeColors: Record<string, string> = {
  nps: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  csat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ces: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function SurveyHeader({ survey }: SurveyHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: "/surveys" });
  };

  const questionCount = survey.questions?.length ?? 0;

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
            <Badge variant="outline" className={statusColors[survey.status] ?? statusColors.draft}>
              {survey.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{survey.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {questionCount} question{questionCount !== 1 ? "s" : ""} | Created{" "}
            {new Date(survey.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled title="Coming in Story 2.4">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming in Story 2.5">
            <Send className="mr-2 h-4 w-4" />
            Test
          </Button>
        </div>
      </div>
    </div>
  );
}
