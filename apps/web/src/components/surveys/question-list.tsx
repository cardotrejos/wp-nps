import { cn } from "@/lib/utils";
import { QuestionCard } from "./question-card";
import type { SurveyQuestion } from "@wp-nps/db/schema/flowpulse";

/**
 * QuestionList Component (Story 2.2 - Task 5.3, 5.4, Story 2.3 - Task 5)
 *
 * Displays questions in order with type indicators.
 * Questions are numbered starting from 1.
 * Story 2.3: Added surveyId prop for inline editing support.
 */

interface QuestionListProps {
  surveyId: string;
  questions: SurveyQuestion[];
  className?: string;
}

export function QuestionList({ surveyId, questions, className }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-muted-foreground">No questions in this survey yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold">Questions</h2>
      {questions.map((question, index) => (
        <QuestionCard key={question.id} surveyId={surveyId} question={question} index={index + 1} />
      ))}
    </div>
  );
}
