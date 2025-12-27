/**
 * Kapso Package
 *
 * WhatsApp integration via Kapso service.
 * This package provides the client interface for sending surveys via WhatsApp.
 *
 * For testing, use the mock client:
 * import { KapsoMockClient } from '@wp-nps/kapso/mock';
 */

export * from "./types";
export { KapsoMockClient } from "./mock";

// The real KapsoClient will be implemented in a future story
// For now, only the mock client is available for testing
