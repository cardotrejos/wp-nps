import { db } from "@wp-nps/db";
import * as schema from "@wp-nps/db/schema/auth";
import { env } from "@wp-nps/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import bcrypt from "bcryptjs";

// NFR-S5: bcrypt cost factor must be ≥10 for security compliance
const BCRYPT_COST_FACTOR = 10;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, BCRYPT_COST_FACTOR);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  session: {
    expiresIn: 86400, // 24 hours - session expires after 24h of inactivity
    updateAge: 3600, // Refresh session every hour of activity
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      memberRole: "member",
    }),
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
