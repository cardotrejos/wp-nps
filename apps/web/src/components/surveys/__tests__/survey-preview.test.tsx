import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SurveyPreview } from "../survey-preview";
import type { Survey } from "@wp-nps/db/schema/flowpulse";

describe("SurveyPreview", () => {
  const createMockSurvey = (overrides: Partial<Survey> = {}): Survey => ({
    id: "survey-1",
    orgId: "org-1",
    name: "Test Survey",
    type: "nps",
    status: "draft",
    triggerType: "api",
    templateId: null,
    questions: [
      {
        id: "q1",
        text: "How likely are you to recommend us?",
        type: "rating" as const,
        required: true,
        scale: { min: 0, max: 10, labels: { min: "Not likely", max: "Very likely" } },
      },
    ],
    settings: null,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it("renders phone frame with WhatsApp header", () => {
    render(<SurveyPreview survey={createMockSurvey()} />);
    expect(screen.getByText("FlowPulse Survey")).toBeInTheDocument();
  });

  it("displays question text in chat bubble", () => {
    render(<SurveyPreview survey={createMockSurvey()} />);
    expect(screen.getByText("How likely are you to recommend us?")).toBeInTheDocument();
  });

  it("renders NPS rating buttons for rating questions", () => {
    render(<SurveyPreview survey={createMockSurvey()} />);
    // Check 0-10 buttons are present (with aria-label "Rating N")
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole("button", { name: `Rating ${i}` })).toBeInTheDocument();
    }
  });

  it("renders scale labels when provided", () => {
    render(<SurveyPreview survey={createMockSurvey()} />);
    expect(screen.getByText("Not likely")).toBeInTheDocument();
    expect(screen.getByText("Very likely")).toBeInTheDocument();
  });

  it("renders text input placeholder for text questions", () => {
    const surveyWithTextQuestion = createMockSurvey({
      questions: [
        {
          id: "q2",
          text: "Any additional feedback?",
          type: "text" as const,
          required: false,
        },
      ],
    });
    render(<SurveyPreview survey={surveyWithTextQuestion} />);
    expect(screen.getByText("Any additional feedback?")).toBeInTheDocument();
    expect(screen.getByText("Type your response...")).toBeInTheDocument();
  });

  it("shows required indicator for required questions", () => {
    render(<SurveyPreview survey={createMockSurvey()} />);
    expect(screen.getByText("* Required")).toBeInTheDocument();
  });

  it("renders multiple questions in order", () => {
    const surveyWithMultipleQuestions = createMockSurvey({
      questions: [
        {
          id: "q1",
          text: "First question",
          type: "rating" as const,
          required: true,
          scale: { min: 0, max: 10 },
        },
        {
          id: "q2",
          text: "Second question",
          type: "text" as const,
          required: false,
        },
        {
          id: "q3",
          text: "Third question",
          type: "rating" as const,
          required: true,
          scale: { min: 0, max: 10 },
        },
      ],
    });

    render(<SurveyPreview survey={surveyWithMultipleQuestions} />);

    expect(screen.getByText("First question")).toBeInTheDocument();
    expect(screen.getByText("Second question")).toBeInTheDocument();
    expect(screen.getByText("Third question")).toBeInTheDocument();
  });

  it("displays empty state when no questions", () => {
    const emptyQuestionsSurvey = createMockSurvey({ questions: [] });
    render(<SurveyPreview survey={emptyQuestionsSurvey} />);
    expect(screen.getByText("No questions to preview")).toBeInTheDocument();
  });

  it("handles null questions gracefully", () => {
    const nullQuestionsSurvey = createMockSurvey({ questions: null as unknown as [] });
    render(<SurveyPreview survey={nullQuestionsSurvey} />);
    expect(screen.getByText("No questions to preview")).toBeInTheDocument();
  });

  // Task 7.4: Test preview updates when survey data changes
  describe("reactivity", () => {
    it("updates preview when survey prop changes", () => {
      const initialSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "Original question text",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
        ],
      });

      const { rerender } = render(<SurveyPreview survey={initialSurvey} />);
      expect(screen.getByText("Original question text")).toBeInTheDocument();

      // Simulate survey data change (like after editing a question)
      const updatedSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "Updated question text",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
        ],
      });

      rerender(<SurveyPreview survey={updatedSurvey} />);
      expect(screen.queryByText("Original question text")).not.toBeInTheDocument();
      expect(screen.getByText("Updated question text")).toBeInTheDocument();
    });

    it("updates preview when questions are added", () => {
      const initialSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "First question",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
        ],
      });

      const { rerender } = render(<SurveyPreview survey={initialSurvey} />);
      expect(screen.getByText("First question")).toBeInTheDocument();
      expect(screen.queryByText("Second question")).not.toBeInTheDocument();

      // Add a new question
      const updatedSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "First question",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
          {
            id: "q2",
            text: "Second question",
            type: "text" as const,
            required: false,
          },
        ],
      });

      rerender(<SurveyPreview survey={updatedSurvey} />);
      expect(screen.getByText("First question")).toBeInTheDocument();
      expect(screen.getByText("Second question")).toBeInTheDocument();
    });

    it("updates preview when questions are removed", () => {
      const initialSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "Question to keep",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
          {
            id: "q2",
            text: "Question to remove",
            type: "text" as const,
            required: false,
          },
        ],
      });

      const { rerender } = render(<SurveyPreview survey={initialSurvey} />);
      expect(screen.getByText("Question to keep")).toBeInTheDocument();
      expect(screen.getByText("Question to remove")).toBeInTheDocument();

      // Remove second question
      const updatedSurvey = createMockSurvey({
        questions: [
          {
            id: "q1",
            text: "Question to keep",
            type: "rating" as const,
            required: true,
            scale: { min: 0, max: 10 },
          },
        ],
      });

      rerender(<SurveyPreview survey={updatedSurvey} />);
      expect(screen.getByText("Question to keep")).toBeInTheDocument();
      expect(screen.queryByText("Question to remove")).not.toBeInTheDocument();
    });
  });

  // Task 7.5: Test responsive behavior
  describe("responsive behavior", () => {
    it("phone frame has max-width constraint for proper sizing", () => {
      const { container } = render(<SurveyPreview survey={createMockSurvey()} />);
      const phoneFrame = container.querySelector('[class*="max-w-"]');
      expect(phoneFrame).toBeInTheDocument();
      expect(phoneFrame?.className).toContain("max-w-[320px]");
    });

    it("phone frame maintains aspect ratio via CSS class", () => {
      const { container } = render(<SurveyPreview survey={createMockSurvey()} />);
      const phoneFrame = container.querySelector('[class*="aspect-"]');
      expect(phoneFrame).toBeInTheDocument();
      expect(phoneFrame?.className).toContain("aspect-[9/16]");
    });

    it("preview container uses flex centering for responsive layout", () => {
      const { container } = render(<SurveyPreview survey={createMockSurvey()} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex");
      expect(wrapper.className).toContain("justify-center");
    });

    it("phone frame uses relative width for responsive scaling", () => {
      const { container } = render(<SurveyPreview survey={createMockSurvey()} />);
      const phoneFrame = container.querySelector('[class*="w-full"]');
      expect(phoneFrame).toBeInTheDocument();
    });

    it("applies custom className for layout flexibility", () => {
      const { container } = render(
        <SurveyPreview survey={createMockSurvey()} className="mt-4 lg:mt-0" />,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("mt-4");
      expect(wrapper.className).toContain("lg:mt-0");
    });
  });
});
