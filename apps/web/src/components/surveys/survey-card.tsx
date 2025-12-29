import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyStatusBadge } from "@/components/surveys/survey-status-badge";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyCard Component (Story 2.1 - Task 4.1, 4.2)
 * Updated: Story 2.6 - Task 6 - Integrated SurveyStatusBadge
 *
 * Displays a survey card with name, type badge, status badge,
 * question count, and creation date.
 *
 * AC #4: Status badge showing "Draft", "Active", or "Inactive" with appropriate color
 */

interface SurveyCardProps {
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

export function SurveyCard({ survey }: SurveyCardProps) {
  const questionCount = survey.questions?.length ?? 0;
  // Runtime-validated status for the badge component
  const status = normalizeStatus(survey.status);

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={typeColors[survey.type] ?? typeColors.nps}>
            {survey.type.toUpperCase()}
          </Badge>
          <SurveyStatusBadge status={status} />
        </div>
        <CardTitle className="mt-2 text-lg line-clamp-1">{survey.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {questionCount} question{questionCount !== 1 ? "s" : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Created {new Date(survey.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
