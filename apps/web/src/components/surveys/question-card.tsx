import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useUpdateQuestion } from "@/hooks/use-surveys";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@wp-nps/db/schema/flowpulse";

/**
 * QuestionCard Component (Story 2.3 - Tasks 4, 7, 8)
 *
 * Displays a single question with inline editing capability.
 * Features:
 * - Auto-save with 2-second debounce
 * - Save status indicator (Saving.../Saved/Error)
 * - Validation for empty text
 * - Retry mechanism for failed saves
 */

interface QuestionCardProps {
  surveyId: string;
  question: SurveyQuestion;
  index: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function QuestionCard({ surveyId, question, index }: QuestionCardProps) {
  const [text, setText] = useState(question.text);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Track if we should trigger a save (when text differs from original)
  const hasUnsavedChanges = useRef(false);
  // Track last saved text to avoid duplicate saves
  const lastSavedText = useRef(question.text);

  const debouncedText = useDebounce(text, 2000);

  const updateQuestion = useUpdateQuestion();

  // Stable save function to avoid exhaustive-deps issues
  // Code Review Fix: Extracted to useCallback to prevent re-renders
  const saveQuestion = useCallback(
    (textToSave: string) => {
      // Validate
      if (!textToSave.trim()) {
        setError("Question text is required");
        setSaveStatus("idle");
        return;
      }

      // Skip if same as last saved
      if (textToSave === lastSavedText.current) {
        hasUnsavedChanges.current = false;
        return;
      }

      setError(null);
      setSaveStatus("saving");

      updateQuestion.mutate(
        { surveyId, questionId: question.id, text: textToSave },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            hasUnsavedChanges.current = false;
            lastSavedText.current = textToSave;
          },
          onError: () => {
            setSaveStatus("error");
          },
        },
      );
    },
    [surveyId, question.id, updateQuestion],
  );

  // Auto-save when debounced text changes
  useEffect(() => {
    // Skip if text hasn't changed from the last saved value
    if (debouncedText === lastSavedText.current) {
      hasUnsavedChanges.current = false;
      return;
    }

    // Skip if no unsaved changes pending
    if (!hasUnsavedChanges.current) return;

    saveQuestion(debouncedText);
  }, [debouncedText, saveQuestion]);

  // Show "Saving..." indicator while typing (before debounce completes)
  useEffect(() => {
    if (text !== lastSavedText.current && text.trim() && !error) {
      setSaveStatus("saving");
      hasUnsavedChanges.current = true;
    }
  }, [text, error]);

  // Reset saved status after 2 seconds
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Sync local state when question.text changes from external source
  useEffect(() => {
    setText(question.text);
    lastSavedText.current = question.text;
  }, [question.text]);

  const handleRetry = useCallback(() => {
    if (!text.trim()) return;
    saveQuestion(text);
  }, [text, saveQuestion]);

  // Code Review Fix: Add onBlur handler to trigger immediate save (AC #3)
  const handleBlur = useCallback(() => {
    // If there are pending changes and text is valid, save immediately
    if (hasUnsavedChanges.current && text.trim() && text !== lastSavedText.current) {
      saveQuestion(text);
    }
  }, [text, saveQuestion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    hasUnsavedChanges.current = true;

    // Immediate validation feedback
    if (!newText.trim()) {
      setError("Question text is required");
    } else {
      setError(null);
    }
  };

  return (
    <Card className={cn(error && "border-destructive")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Question {index}</span>
          <div className="flex items-center gap-2">
            {/* Save Status Indicator */}
            {saveStatus === "saving" && (
              <span className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center text-sm text-green-600">
                <Check className="mr-1 h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1">
                <span className="flex items-center text-sm text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Error
                </span>
                <Button variant="ghost" size="sm" onClick={handleRetry} className="h-6 px-2">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </span>
            )}

            <Badge variant="outline">{question.type === "rating" ? "Rating" : "Text"}</Badge>
            {question.required && <Badge variant="secondary">Required</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter question text..."
          className={cn(
            "min-h-[80px] resize-none",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        {question.type === "rating" && question.scale && (
          <p className="mt-2 text-sm text-muted-foreground">
            Scale: {question.scale.min} - {question.scale.max}
            {question.scale.labels && (
              <span>
                {" "}
                ({question.scale.labels.min} to {question.scale.labels.max})
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
