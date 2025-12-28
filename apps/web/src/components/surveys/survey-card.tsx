import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyCard Component (Story 2.1 - Task 4.1, 4.2)
 *
 * Displays a survey card with name, type badge, status badge,
 * question count, and creation date.
 *
 * Note: Survey detail route will be implemented in Story 2.3+.
 */

interface SurveyCardProps {
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

export function SurveyCard({ survey }: SurveyCardProps) {
  const questionCount = survey.questions?.length ?? 0;

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={typeColors[survey.type] ?? typeColors.nps}>
            {survey.type.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={statusColors[survey.status] ?? statusColors.draft}>
            {survey.status}
          </Badge>
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
