import { createHash } from "node:crypto";

/**
 * Hashes a phone number using SHA-256 for privacy-safe storage and comparison.
 * Used across the codebase to consistently hash phone numbers before storing or querying.
 *
 * @param phoneNumber - The phone number to hash (with country code, e.g., "+5511999999999")
 * @returns SHA-256 hex digest of the phone number
 */
export function hashPhoneNumber(phoneNumber: string): string {
  return createHash("sha256").update(phoneNumber).digest("hex");
}
