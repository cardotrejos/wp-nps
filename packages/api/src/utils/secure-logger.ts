// NFR-S9: PII patterns to redact from logs (security-critical)
const PII_PATTERNS = [
  /\+\d{10,15}/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
];

const PII_FIELD_NAMES = new Set([
  "phone",
  "phone_number",
  "phoneNumber",
  "customerPhone",
  "customer_phone",
  "email",
  "to",
]);

function redactPII(obj: unknown): unknown {
  if (typeof obj === "string") {
    let result = obj;
    for (const pattern of PII_PATTERNS) {
      result = result.replace(pattern, "[REDACTED]");
    }
    return result;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }

  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (PII_FIELD_NAMES.has(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactPII(value);
      }
    }
    return result;
  }

  return obj;
}

export const secureLog = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, data ? redactPII(data) : "");
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, data ? redactPII(data) : "");
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, data ? redactPII(data) : "");
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`, data ? redactPII(data) : "");
    }
  },
};

export { redactPII };
