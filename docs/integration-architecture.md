# Integration Architecture - FlowPulse

## Overview

FlowPulse is a **Turbo monorepo** with 6 integrated parts. This document describes how the parts communicate and share code.

## Part Dependency Graph

```
                    ┌─────────────────────┐
                    │   packages/config   │
                    │  (TypeScript base)  │
                    └─────────┬───────────┘
                              │ extends
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │packages/db│   │packages/ │   │packages/ │
        │ (Drizzle)│   │   api    │   │   auth   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │               │
             │              │     ┌─────────┘
             │              │     │
             ▼              │     ▼
        ┌──────────────────┐│┌──────────┐
        │                  ││ │packages/ │
        │                  │└▶│   auth   │
        │  apps/server     │  └────┬─────┘
        │    (Elysia)      │◀──────┘
        │                  │
        └────────┬─────────┘
                 │ HTTP
                 ▼
        ┌──────────────────┐
        │    apps/web      │
        │    (React)       │
        └──────────────────┘
```

## Integration Points

### 1. Web ↔ Server (HTTP/oRPC)

| From     | To          | Protocol       | Endpoint      | Purpose               |
| -------- | ----------- | -------------- | ------------- | --------------------- |
| apps/web | apps/server | oRPC over HTTP | `/rpc/*`      | Type-safe API calls   |
| apps/web | apps/server | Better Auth    | `/api/auth/*` | Authentication        |
| apps/web | apps/server | REST/OpenAPI   | `/api/*`      | OpenAPI documentation |

**Implementation**:

```typescript
// apps/web/src/utils/orpc.ts
export const link = new RPCLink({
  url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
  fetch(url, options) {
    return fetch(url, { ...options, credentials: "include" });
  },
});
```

### 2. Server ↔ API Package (Library Import)

| From        | To                        | Method    | Purpose            |
| ----------- | ------------------------- | --------- | ------------------ |
| apps/server | @wp-nps/api               | TS Import | Router definitions |
| apps/server | @wp-nps/api/context       | TS Import | Request context    |
| apps/server | @wp-nps/api/routers/index | TS Import | AppRouter type     |

**Implementation**:

```typescript
// apps/server/src/index.ts
import { createContext } from "@wp-nps/api/context";
import { appRouter } from "@wp-nps/api/routers/index";
```

### 3. Server ↔ Auth Package (Library Import)

| From         | To           | Method    | Purpose            |
| ------------ | ------------ | --------- | ------------------ |
| apps/server  | @wp-nps/auth | TS Import | Auth handler       |
| packages/api | @wp-nps/auth | TS Import | Session validation |

**Implementation**:

```typescript
// apps/server/src/index.ts
import { auth } from "@wp-nps/auth";

app.all("/api/auth/*", async (context) => {
  return auth.handler(context.request);
});
```

### 4. Auth ↔ DB Package (Library Import)

| From         | To                     | Method    | Purpose         |
| ------------ | ---------------------- | --------- | --------------- |
| @wp-nps/auth | @wp-nps/db             | TS Import | Database client |
| @wp-nps/auth | @wp-nps/db/schema/auth | TS Import | Auth schema     |

**Implementation**:

```typescript
// packages/auth/src/index.ts
import { db } from "@wp-nps/db";
import * as schema from "@wp-nps/db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
});
```

### 5. Web ↔ API Package (Type Import)

| From     | To                        | Method    | Purpose              |
| -------- | ------------------------- | --------- | -------------------- |
| apps/web | @wp-nps/api/routers/index | TS Import | AppRouterClient type |

**Implementation**:

```typescript
// apps/web/src/utils/orpc.ts
import type { AppRouterClient } from "@wp-nps/api/routers/index";
export const client: AppRouterClient = createORPCClient(link);
```

## Shared Type Flow

```
packages/api                 apps/server             apps/web
┌─────────────┐             ┌───────────┐           ┌──────────┐
│ appRouter   │────────────▶│  Handler  │           │          │
│ (procedures)│             │  (Elysia) │           │          │
│             │             │           │◀──HTTP───▶│  Client  │
│ AppRouter   │─────────────┼───────────┼──────────▶│ (orpc)   │
│ (type)      │             │           │           │          │
└─────────────┘             └───────────┘           └──────────┘
```

**End-to-End Type Safety**:

1. `appRouter` defines procedures with Zod schemas in `packages/api`
2. `AppRouter` type is exported
3. `apps/server` mounts router with `RPCHandler`
4. `apps/web` imports `AppRouterClient` type for client
5. Full autocomplete and type checking across network boundary

## Environment Configuration

| Variable          | Used By                    | Purpose                 |
| ----------------- | -------------------------- | ----------------------- |
| `DATABASE_URL`    | packages/db                | PostgreSQL connection   |
| `CORS_ORIGIN`     | apps/server, packages/auth | Allowed frontend origin |
| `VITE_SERVER_URL` | apps/web                   | Backend API URL         |

## Build Order (Turbo)

Turbo handles build dependencies automatically:

```
1. packages/config     (no deps)
2. packages/db         (depends on config)
3. packages/api        (depends on config)
4. packages/auth       (depends on db)
5. apps/server         (depends on api, auth)
6. apps/web            (depends on api - types only)
```

## Runtime Data Flow

### Authentication Flow

```
1. User submits login form
   └─▶ apps/web calls POST /api/auth/sign-in

2. Server validates credentials
   └─▶ packages/auth queries packages/db
   └─▶ Creates session in database
   └─▶ Returns session cookie

3. Subsequent requests include cookie
   └─▶ apps/web includes credentials: "include"
   └─▶ apps/server reads session from cookie
   └─▶ packages/api/context extracts session
   └─▶ Protected procedures have access to user
```

### API Request Flow

```
1. Frontend initiates query
   └─▶ orpc.privateData.queryOptions()
   └─▶ TanStack Query manages caching

2. oRPC client serializes request
   └─▶ POST /rpc/privateData

3. Server receives request
   └─▶ Elysia routes to RPCHandler
   └─▶ createContext extracts session
   └─▶ appRouter.privateData.handler runs
   └─▶ Returns { message, user }

4. Response flows back
   └─▶ oRPC deserializes response
   └─▶ TanStack Query caches result
   └─▶ Component re-renders with data
```

---

_Generated by BMAD Document Project Workflow_
