# Data Models - FlowPulse

## Overview

FlowPulse uses **Drizzle ORM** with **PostgreSQL** for data persistence. The schema is defined in `packages/db/src/schema/`.

## Database Connection

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
export const db = drizzle(process.env.DATABASE_URL || "", { schema });
```

## Schema

### User Table

Primary table for user accounts.

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

| Column          | Type      | Constraints             | Description               |
| --------------- | --------- | ----------------------- | ------------------------- |
| `id`            | text      | PRIMARY KEY             | Unique user identifier    |
| `name`          | text      | NOT NULL                | User display name         |
| `email`         | text      | NOT NULL, UNIQUE        | User email address        |
| `emailVerified` | boolean   | NOT NULL, DEFAULT false | Email verification status |
| `image`         | text      | NULLABLE                | Profile image URL         |
| `createdAt`     | timestamp | NOT NULL, DEFAULT now() | Creation timestamp        |
| `updatedAt`     | timestamp | NOT NULL, AUTO-UPDATE   | Last update timestamp     |

### Session Table

Active user sessions for authentication.

```typescript
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_userId_idx").on(table.userId)]);
```

| Column      | Type      | Constraints            | Description             |
| ----------- | --------- | ---------------------- | ----------------------- |
| `id`        | text      | PRIMARY KEY            | Session identifier      |
| `expiresAt` | timestamp | NOT NULL               | Session expiration time |
| `token`     | text      | NOT NULL, UNIQUE       | Session token           |
| `ipAddress` | text      | NULLABLE               | Client IP address       |
| `userAgent` | text      | NULLABLE               | Client user agent       |
| `userId`    | text      | NOT NULL, FK → user.id | Associated user         |

**Indexes**: `session_userId_idx` on `userId`

### Account Table

OAuth and credential accounts linked to users.

```typescript
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
}, (table) => [index("account_userId_idx").on(table.userId)]);
```

| Column         | Type | Constraints            | Description                                  |
| -------------- | ---- | ---------------------- | -------------------------------------------- |
| `id`           | text | PRIMARY KEY            | Account identifier                           |
| `accountId`    | text | NOT NULL               | Provider account ID                          |
| `providerId`   | text | NOT NULL               | Auth provider (e.g., "credential", "google") |
| `userId`       | text | NOT NULL, FK → user.id | Associated user                              |
| `accessToken`  | text | NULLABLE               | OAuth access token                           |
| `refreshToken` | text | NULLABLE               | OAuth refresh token                          |
| `password`     | text | NULLABLE               | Hashed password (for credential auth)        |

**Indexes**: `account_userId_idx` on `userId`

### Verification Table

Email verification and password reset tokens.

```typescript
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);
```

| Column       | Type      | Constraints | Description              |
| ------------ | --------- | ----------- | ------------------------ |
| `id`         | text      | PRIMARY KEY | Verification record ID   |
| `identifier` | text      | NOT NULL    | Email or phone to verify |
| `value`      | text      | NOT NULL    | Verification token/code  |
| `expiresAt`  | timestamp | NOT NULL    | Token expiration time    |

**Indexes**: `verification_identifier_idx` on `identifier`

## Relations

```typescript
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
```

### Entity Relationship Diagram

```
┌─────────────────┐
│      user       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ emailVerified   │
│ image           │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ session │ │ account │
├─────────┤ ├─────────┤
│ id (PK) │ │ id (PK) │
│ token   │ │ provider│
│ expires │ │ tokens  │
│ userId  │ │ userId  │
└─────────┘ └─────────┘

┌──────────────┐
│ verification │
├──────────────┤
│ id (PK)      │
│ identifier   │
│ value        │
│ expiresAt    │
└──────────────┘
```

## Migrations

Drizzle Kit is used for migrations:

```bash
# Generate migration
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Drizzle Studio
pnpm db:studio

# Run migrations
pnpm db:migrate
```

## Usage

```typescript
import { db } from "@wp-nps/db";
import { user, session } from "@wp-nps/db/schema/auth";

// Query example
const users = await db.select().from(user);

// With relations
const userWithSessions = await db.query.user.findFirst({
  with: { sessions: true, accounts: true }
});
```

---

_Generated by BMAD Document Project Workflow_
