import type { FlowJson } from "../types";

/**
 * NPS Survey Flow for testing manual send functionality
 *
 * This flow collects:
 * 1. NPS rating (0-10)
 * 2. Optional feedback comment
 * 3. Thank you screen
 *
 * Flow JSON version 7.0 compatible with WhatsApp Flows
 */
export const npsSurveyFlow: FlowJson = {
  version: "7.0",
  routingModel: {
    NPS_RATING: ["FEEDBACK"],
    FEEDBACK: ["THANK_YOU"],
    THANK_YOU: [],
  },
  screens: [
    {
      id: "NPS_RATING",
      title: "Quick Survey",
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "TextHeading",
            text: "How likely are you to recommend us?",
          },
          {
            type: "TextBody",
            text: "On a scale of 0-10, where 10 is extremely likely",
          },
          {
            type: "RadioButtonsGroup",
            name: "nps_score",
            label: "Your rating",
            required: true,
            dataSource: [
              { id: "0", title: "0 - Not at all" },
              { id: "1", title: "1" },
              { id: "2", title: "2" },
              { id: "3", title: "3" },
              { id: "4", title: "4" },
              { id: "5", title: "5 - Neutral" },
              { id: "6", title: "6" },
              { id: "7", title: "7" },
              { id: "8", title: "8" },
              { id: "9", title: "9" },
              { id: "10", title: "10 - Extremely likely" },
            ],
          },
          {
            type: "Footer",
            label: "Next",
            onClickAction: {
              name: "navigate",
              next: { type: "screen", name: "FEEDBACK" },
              payload: {
                nps_score: "${form.nps_score}",
              },
            },
          },
        ],
      },
    },
    {
      id: "FEEDBACK",
      title: "Your Feedback",
      data: {
        nps_score: { type: "string", __example__: "8" },
      },
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "TextHeading",
            text: "Tell us more",
          },
          {
            type: "TextBody",
            text: "What's the main reason for your score?",
          },
          {
            type: "TextArea",
            name: "feedback",
            label: "Your feedback (optional)",
            required: false,
            maxChars: 500,
          },
          {
            type: "Footer",
            label: "Submit",
            onClickAction: {
              name: "navigate",
              next: { type: "screen", name: "THANK_YOU" },
              payload: {
                nps_score: "${data.nps_score}",
                feedback: "${form.feedback}",
              },
            },
          },
        ],
      },
    },
    {
      id: "THANK_YOU",
      title: "Thank You",
      terminal: true,
      data: {
        nps_score: { type: "string", __example__: "8" },
        feedback: { type: "string", __example__: "Great service!" },
      },
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "TextHeading",
            text: "Thank you!",
          },
          {
            type: "TextBody",
            text: "Your feedback helps us improve. We appreciate you taking the time to respond.",
          },
          {
            type: "Footer",
            label: "Done",
            onClickAction: {
              name: "complete",
              payload: {
                nps_score: "${data.nps_score}",
                feedback: "${data.feedback}",
              },
            },
          },
        ],
      },
    },
  ],
};

/**
 * Simple test flow for quick verification
 * Single screen with minimal components
 */
export const simpleTestFlow: FlowJson = {
  version: "7.0",
  routingModel: {
    WELCOME: [],
  },
  screens: [
    {
      id: "WELCOME",
      title: "FlowPulse Test",
      terminal: true,
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "TextHeading",
            text: "Connection Verified!",
          },
          {
            type: "TextBody",
            text: "Your WhatsApp Flow integration is working correctly.",
          },
          {
            type: "Footer",
            label: "Done",
            onClickAction: {
              name: "complete",
              payload: {
                test: "success",
                timestamp: "${system.timestamp}",
              },
            },
          },
        ],
      },
    },
  ],
};
