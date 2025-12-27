import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW Server for Node.js testing environment
 *
 * This server intercepts HTTP requests during tests and returns
 * mock responses defined in the handlers.
 */

export const server = setupServer(...handlers);
