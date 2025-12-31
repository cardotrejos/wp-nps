import { cn } from "@/lib/utils";
import { WhatsAppMessage } from "./whatsapp-message";
import { NPSRatingButtons } from "./nps-rating-buttons";
import type { Survey, SurveyQuestion } from "@wp-nps/db/schema/flowpulse";

/**
 * SurveyPreview Component (Story 2.4 - Task 1)
 *
 * Displays a survey in a mobile phone frame mockup with WhatsApp styling.
 * Features:
 * - Phone frame with 9:16 aspect ratio
 * - WhatsApp header (dark green with back arrow)
 * - WhatsApp beige background (#ece5dd - UX3 requirement)
 * - Chat bubbles for questions
 * - Rating buttons for NPS questions
 * - Responsive scaling for different screen sizes
 *
 * AC #1: Mobile phone frame mockup with WhatsApp chat bubble aesthetic
 * AC #3: Phone mockup remains properly sized on resize
 * AC #4: All questions displayed in correct order
 */

interface SurveyPreviewProps {
  survey: Survey;
  className?: string;
}

export function SurveyPreview({ survey, className }: SurveyPreviewProps) {
  const questions = (survey.questions ?? []) as SurveyQuestion[];

  return (
    <div
      className={cn("flex justify-center", className)}
      role="region"
      aria-label="WhatsApp survey preview"
    >
      {/* Phone Frame */}
      <div
        className="relative aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[2rem] border-[8px] border-gray-800 bg-white shadow-xl"
        aria-label="Mobile phone mockup"
      >
        {/* WhatsApp Header */}
        <header className="flex h-14 items-center gap-3 bg-[#075e54] px-4">
          <svg
            className="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-300" aria-hidden="true" />
            <span className="text-sm font-medium text-white">FlowPulse Survey</span>
          </div>
        </header>

        {/* Chat Area - WhatsApp beige background (UX3) */}
        <main
          className="h-[calc(100%-3.5rem)] space-y-3 overflow-y-auto p-3"
          style={{ backgroundColor: "#ece5dd" }}
          aria-label="Survey questions preview"
        >
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <WhatsAppMessage text={question.text} />

              {question.type === "rating" && question.scale && (
                <NPSRatingButtons
                  min={question.scale.min}
                  max={question.scale.max}
                  labels={question.scale.labels}
                />
              )}

              {question.type === "text" && (
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <span className="text-sm text-gray-400">Type your response...</span>
                </div>
              )}

              {question.required && <span className="ml-2 text-xs text-gray-500">* Required</span>}
            </div>
          ))}

          {questions.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No questions to preview</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
