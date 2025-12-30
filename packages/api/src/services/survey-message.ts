export type SurveyType = "nps" | "csat" | "ces";

export interface SurveyMessageParams {
  surveyType: SurveyType;
  questionText: string;
  customerName?: string;
  orgName: string;
}

export function formatSurveyMessage(params: SurveyMessageParams): string {
  const { surveyType, questionText, customerName, orgName } = params;

  const greeting = customerName ? `Hi ${customerName}! ` : "Hi! ";

  switch (surveyType) {
    case "nps":
      return `${greeting}${orgName} would love your feedback.\n\n${questionText}\n\nReply with a number from 0 (not likely) to 10 (very likely).`;

    case "csat":
      return `${greeting}${orgName} wants to know about your experience.\n\n${questionText}\n\nReply with a number from 1 (very unsatisfied) to 5 (very satisfied).`;

    case "ces":
      return `${greeting}${orgName} wants to improve.\n\n${questionText}\n\nReply with a number from 1 (very difficult) to 7 (very easy).`;

    default:
      return `${greeting}${questionText}`;
  }
}
