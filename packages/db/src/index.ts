import { env } from "@wp-nps/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
export type DbClient = Omit<typeof db, "$client">;

export * from "./types";
export * from "./schema";
