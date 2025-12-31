import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SurveyStatusBadge Component (Story 2.6 - Task 3)
 *
 * Displays a badge with the survey status using appropriate colors:
 * - Draft: Yellow (work in progress)
 * - Active: Green (survey can receive triggers)
 * - Inactive: Gray (survey is paused)
 *
 * AC #1, #2, #4: Visual status indicator for survey state
 */

type SurveyStatus = "draft" | "active" | "inactive";

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  className?: string;
}

const statusConfig: Record<SurveyStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

/**
 * Type guard to validate survey status
 * Returns true if status is a valid SurveyStatus type
 */
function isValidStatus(status: string): status is SurveyStatus {
  return status === "draft" || status === "active" || status === "inactive";
}

export function SurveyStatusBadge({ status, className }: SurveyStatusBadgeProps) {
  // Runtime validation - fallback to draft for unexpected values
  const validStatus = isValidStatus(status) ? status : "draft";
  const config = statusConfig[validStatus];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
