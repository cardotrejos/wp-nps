import type { NewSurveyTemplate } from "../schema/survey-template";

/**
 * Survey Template Seeds (Story 1.5)
 *
 * Pre-defined templates for NPS, CSAT, and CES surveys.
 * NPS is marked as default (recommended for first-time users).
 */

export const surveyTemplateSeeds: NewSurveyTemplate[] = [
  {
    id: "nps-default",
    name: "Net Promoter Score (NPS)",
    type: "nps",
    description:
      "Measure customer loyalty with the industry-standard 0-10 recommendation question.",
    isDefault: true,
    questions: [
      {
        id: "nps-main",
        text: "How likely are you to recommend us to a friend or colleague?",
        type: "rating",
        scale: {
          min: 0,
          max: 10,
          labels: { min: "Not at all likely", max: "Extremely likely" },
        },
        required: true,
      },
      {
        id: "nps-feedback",
        text: "What is the primary reason for your score?",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "csat-default",
    name: "Customer Satisfaction (CSAT)",
    type: "csat",
    description: "Measure satisfaction with a specific experience or interaction.",
    isDefault: false,
    questions: [
      {
        id: "csat-main",
        text: "How satisfied are you with your experience?",
        type: "rating",
        scale: {
          min: 1,
          max: 5,
          labels: { min: "Very dissatisfied", max: "Very satisfied" },
        },
        required: true,
      },
    ],
  },
  {
    id: "ces-default",
    name: "Customer Effort Score (CES)",
    type: "ces",
    description: "Measure how easy it was for customers to complete a task.",
    isDefault: false,
    questions: [
      {
        id: "ces-main",
        text: "How easy was it to complete your task today?",
        type: "rating",
        scale: {
          min: 1,
          max: 7,
          labels: { min: "Very difficult", max: "Very easy" },
        },
        required: true,
      },
    ],
  },
];
