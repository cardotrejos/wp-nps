export interface KapsoFlowResponse {
  flow_token?: string;
  rating?: string;
  feedback?: string;
  [key: string]: unknown;
}

export interface KapsoMessageData {
  id: string;
  from?: string;
  to?: string;
  type: "text" | "interactive";
  timestamp?: string;
  text?: { body: string };
  interactive?: {
    type: string;
    nfm_reply?: {
      name: string;
      body: string;
      response_json: string;
    };
  };
  kapso?: {
    direction: "inbound" | "outbound";
    origin?: string;
    content?: string;
    message_type_data?: {
      type: string;
    };
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
  messageType: "text" | "flow_response";
  flowResponse?: KapsoFlowResponse;
}

export interface ParsedSurveyResponse {
  score: number | null;
  feedback: string | null;
}

function isFlowResponse(message: KapsoMessageData): boolean {
  return (
    message.type === "interactive" &&
    (message.interactive?.type === "nfm_reply" ||
      message.kapso?.message_type_data?.type === "nfm_reply")
  );
}

function parseFlowResponseContent(message: KapsoMessageData): KapsoFlowResponse | null {
  const jsonString =
    message.interactive?.nfm_reply?.response_json ?? message.kapso?.content;

  if (!jsonString) return null;

  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as KapsoFlowResponse;
    }
    return null;
  } catch {
    return null;
  }
}

function parseWebhookItem(item: KapsoWebhookItem): ParsedWebhook {
  if (!item.message?.id) {
    throw new Error("Invalid webhook payload: missing message ID");
  }

  const message = item.message;
  const isFlow = isFlowResponse(message);
  const flowResponse = isFlow ? parseFlowResponseContent(message) : null;

  const content = message.kapso?.content ?? message.text?.body ?? "";

  const baseResult = {
    phoneNumberId: item.phone_number_id,
    customerPhone: message.from ?? message.to ?? "",
    messageId: message.id,
    content,
    direction: message.kapso?.direction ?? "inbound",
    timestamp: message.timestamp ?? new Date().toISOString(),
  };

  if (isFlow && flowResponse) {
    return {
      ...baseResult,
      messageType: "flow_response" as const,
      flowResponse,
    };
  }

  return {
    ...baseResult,
    messageType: "text" as const,
  };
}

function isBatchedPayload(p: unknown): p is KapsoBatchedPayload {
  return (
    typeof p === "object" && p !== null && "batch" in p && (p as KapsoBatchedPayload).batch === true
  );
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
