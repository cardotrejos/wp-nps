export interface KapsoMessageData {
  phone_number: string;
  content: string;
  whatsapp_message_id: string;
  type: "text" | "interactive";
  text?: { body: string };
  kapso?: {
    direction: "inbound" | "outbound";
    origin?: string;
  };
}

export interface KapsoWebhookData {
  phone_number_id: string;
  message: KapsoMessageData;
  conversation: {
    id: string;
    phone_number: string;
    phone_number_id: string;
  };
}

export interface KapsoWebhookPayload {
  event: string;
  data: KapsoWebhookData;
}

export interface ParsedWebhook {
  phoneNumberId: string;
  customerPhone: string;
  messageId: string;
  content: string;
  direction: "inbound" | "outbound";
  timestamp: string;
}

export interface ParsedSurveyResponse {
  score: number | null;
  feedback: string | null;
}

export function parseKapsoWebhook(payload: unknown): ParsedWebhook {
  const p = payload as KapsoWebhookPayload;

  if (!p.data?.phone_number_id || !p.data?.message) {
    throw new Error("Invalid webhook payload: missing required fields");
  }

  const { data } = p;

  if (!data.message.whatsapp_message_id) {
    throw new Error("Invalid webhook payload: missing message ID");
  }

  const content = data.message.content ?? data.message.text?.body ?? "";

  return {
    phoneNumberId: data.phone_number_id,
    customerPhone: data.message.phone_number,
    messageId: data.message.whatsapp_message_id,
    content,
    direction: data.message.kapso?.direction ?? "inbound",
    timestamp: new Date().toISOString(),
  };
}

// Survey type score ranges: NPS (0-10), CSAT (1-5), CES (1-7)
const SCORE_RANGES: Record<"nps" | "csat" | "ces", [number, number]> = {
  nps: [0, 10],
  csat: [1, 5],
  ces: [1, 7],
};

export function parseSurveyResponse(
  content: string,
  surveyType: "nps" | "csat" | "ces",
): ParsedSurveyResponse {
  const numberMatch = content.match(/\b(\d{1,2})\b/);
  let score: number | null = null;

  if (numberMatch) {
    const firstMatch = numberMatch[1];
    if (firstMatch) {
      const num = Number.parseInt(firstMatch, 10);
      const [min, max] = SCORE_RANGES[surveyType];
      if (num >= min && num <= max) {
        score = num;
      }
    }
  }

  const feedback =
    score !== null ? content.replace(/\b\d{1,2}\b/, "").trim() || null : content.trim() || null;

  return { score, feedback };
}

export function isValidWebhookPayload(payload: unknown): payload is KapsoWebhookPayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (!p.data || typeof p.data !== "object") return false;
  const data = p.data as Record<string, unknown>;
  return (
    typeof data.phone_number_id === "string" &&
    typeof data.message === "object" &&
    data.message !== null &&
    typeof (data.message as Record<string, unknown>).whatsapp_message_id === "string"
  );
}
