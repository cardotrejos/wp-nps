import { createHash } from "node:crypto";

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/^\+/, "").replace(/\D/g, "");
}

export function hashPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return createHash("sha256").update(normalized).digest("hex");
}
