import { SurveyCard } from "./survey-card";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyList Component (Story 2.1 - Task 4.3, 4.4)
 *
 * Displays a responsive grid of survey cards.
 * Grid layout: 1 col mobile, 2 cols tablet, 3 cols desktop
 */

interface SurveyListProps {
  surveys: Survey[];
}

export function SurveyList({ surveys }: SurveyListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {surveys.map((survey) => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  );
}
