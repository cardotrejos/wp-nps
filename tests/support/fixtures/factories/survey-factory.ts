/**
 * Survey Factory
 *
 * Creates test surveys via API with auto-cleanup.
 * Follows FlowPulse patterns for NPS/CSAT/CES surveys.
 */

type SurveyType = "nps" | "csat" | "ces";

type SurveyOverrides = {
  name?: string;
  type?: SurveyType;
  orgId?: string;
  questions?: Array<{ text: string; type: string }>;
};

type CreatedSurvey = {
  id: string;
  name: string;
  type: SurveyType;
  orgId: string;
  status: "draft" | "active" | "paused";
};

export class SurveyFactory {
  private createdSurveys: CreatedSurvey[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || "http://localhost:3000/api";
  }

  /**
   * Create a test survey
   *
   * Requires authenticated session context for org_id filter (AR8)
   */
  async createSurvey(authToken: string, overrides: SurveyOverrides = {}): Promise<CreatedSurvey> {
    const timestamp = Date.now();
    const survey = {
      name: overrides.name || `Test Survey ${timestamp}`,
      type: overrides.type || "nps",
      questions: overrides.questions || [
        {
          text: "How likely are you to recommend us?",
          type: "nps",
        },
        {
          text: "What could we improve?",
          type: "open_text",
        },
      ],
    };

    const response = await fetch(`${this.apiUrl}/surveys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(survey),
    });

    if (!response.ok) {
      throw new Error(`Failed to create test survey: ${response.statusText}`);
    }

    const created = (await response.json()) as CreatedSurvey;
    this.createdSurveys.push(created);
    return created;
  }

  /**
   * Create an NPS template survey (common use case)
   */
  async createNPSSurvey(authToken: string, name?: string): Promise<CreatedSurvey> {
    return this.createSurvey(authToken, {
      name: name || "NPS Survey",
      type: "nps",
      questions: [
        {
          text: "How likely are you to recommend us to a friend or colleague?",
          type: "nps",
        },
        {
          text: "What is the main reason for your score?",
          type: "open_text",
        },
      ],
    });
  }

  /**
   * Cleanup all created surveys
   */
  async cleanup(): Promise<void> {
    for (const survey of this.createdSurveys) {
      try {
        await fetch(`${this.apiUrl}/test/cleanup/survey/${survey.id}`, {
          method: "DELETE",
        });
      } catch {
        console.warn(`Failed to cleanup survey ${survey.id}`);
      }
    }
    this.createdSurveys = [];
  }
}
