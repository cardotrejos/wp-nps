export interface KapsoMessageData {
  id: string;
  from?: string;
  to?: string;
  type: "text" | "interactive";
  text?: { body: string };
  kapso?: {
    direction: "inbound" | "outbound";
    origin?: string;
    content?: string;
  };
}

export interface KapsoWebhookItem {
  phone_number_id: string;
  message: KapsoMessageData;
  conversation: {
    id: string;
    phone_number: string;
    phone_number_id: string;
  };
}

export interface KapsoBatchedPayload {
  type: string;
  batch: true;
  data: KapsoWebhookItem[];
  batch_info?: {
    size: number;
    window_ms: number;
    first_sequence: number;
    last_sequence: number;
    conversation_id: string;
  };
}

export type KapsoWebhookPayload = KapsoBatchedPayload | KapsoWebhookItem;

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

function parseWebhookItem(item: KapsoWebhookItem): ParsedWebhook {
  if (!item.message?.id) {
    throw new Error("Invalid webhook payload: missing message ID");
  }

  const content = item.message.kapso?.content ?? item.message.text?.body ?? "";

  return {
    phoneNumberId: item.phone_number_id,
    customerPhone: item.message.from ?? item.message.to ?? "",
    messageId: item.message.id,
    content,
    direction: item.message.kapso?.direction ?? "inbound",
    timestamp: new Date().toISOString(),
  };
}

function isBatchedPayload(p: unknown): p is KapsoBatchedPayload {
  return typeof p === "object" && p !== null && "batch" in p && (p as KapsoBatchedPayload).batch === true;
}

export function parseKapsoWebhook(payload: unknown): ParsedWebhook[] {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid webhook payload: missing required fields");
  }

  if (isBatchedPayload(payload)) {
    if (!Array.isArray(payload.data) || payload.data.length === 0) {
      throw new Error("Invalid webhook payload: empty batch");
    }
    return payload.data.map(parseWebhookItem);
  }

  const item = payload as KapsoWebhookItem;
  if (!item.message || !item.phone_number_id) {
    throw new Error("Invalid webhook payload: missing required fields");
  }

  return [parseWebhookItem(item)];
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
  if (!Array.isArray(p.data) || p.data.length === 0) return false;
  const firstItem = p.data[0] as Record<string, unknown>;
  return (
    typeof firstItem.phone_number_id === "string" &&
    typeof firstItem.message === "object" &&
    firstItem.message !== null &&
    typeof (firstItem.message as Record<string, unknown>).id === "string"
  );
}
