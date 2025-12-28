import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

/**
 * EmptySurveysState Component (Story 2.1 - Task 4.5, 4.6)
 *
 * Displays a friendly empty state when no surveys exist.
 * Includes value prop messaging and large CTA button.
 */

export function EmptySurveysState() {
  const navigate = useNavigate();

  const handleCreateSurvey = () => {
    navigate({ to: "/surveys/new" });
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <FileQuestion className="h-12 w-12 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">No surveys yet</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        Create your first survey to start collecting customer feedback. Email gets 9% response
        rates. WhatsApp gets 45%.
      </p>
      <Button size="lg" onClick={handleCreateSurvey}>
        Create Your First Survey
      </Button>
    </div>
  );
}
