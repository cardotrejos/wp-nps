# Source Tree Analysis - FlowPulse

## Repository Structure

FlowPulse is a **Turbo monorepo** with 6 parts organized into apps and packages.

```
wp-nps/
├── apps/                        # Deployable applications
│   ├── web/                     # React frontend (Part: web)
│   └── server/                  # Elysia backend (Part: server)
├── packages/                    # Shared libraries
│   ├── api/                     # oRPC API definitions (Part: api)
│   ├── db/                      # Drizzle ORM & schemas (Part: db)
│   ├── auth/                    # Better Auth config (Part: auth)
│   └── config/                  # Shared TypeScript config (Part: config)
├── docs/                        # Project documentation
├── package.json                 # Root workspace config
├── turbo.json                   # Turbo build orchestration
└── pnpm-workspace.yaml          # Workspace definition (if using pnpm)
```

## Detailed Source Tree

### apps/server (Backend API)

**Entry Point**: `src/index.ts`

```
apps/server/
├── src/
│   └── index.ts          # 🚀 Server entry - Elysia app, routes, handlers
├── package.json          # Dependencies: elysia, @orpc/server, better-auth
├── tsconfig.json         # TypeScript config (extends @wp-nps/config)
└── tsdown.config.ts      # Build configuration
```

**Key Routes**:
- `/` → Health check
- `/api/auth/*` → Better Auth handler
- `/rpc*` → oRPC RPC handler
- `/api*` → OpenAPI handler

---

### apps/web (Frontend)

**Entry Point**: `src/main.tsx`

```
apps/web/
├── src/
│   ├── main.tsx              # 🚀 React entry point, router setup
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── sonner.tsx
│   │   ├── header.tsx        # Navigation header
│   │   ├── loader.tsx        # Loading indicator
│   │   ├── mode-toggle.tsx   # Theme switcher
│   │   ├── theme-provider.tsx
│   │   ├── sign-in-form.tsx  # Auth forms
│   │   ├── sign-up-form.tsx
│   │   └── user-menu.tsx
│   ├── routes/               # TanStack Router (file-based)
│   │   ├── __root.tsx        # Root layout, providers
│   │   ├── index.tsx         # / → Home page
│   │   ├── login.tsx         # /login → Auth page
│   │   └── dashboard.tsx     # /dashboard → Protected page
│   ├── lib/
│   │   ├── auth-client.ts    # Better Auth React client
│   │   └── utils.ts          # cn() utility
│   └── utils/
│       └── orpc.ts           # oRPC client + TanStack Query
├── public/                   # Static assets
├── package.json
├── vite.config.ts            # Vite bundler config
├── components.json           # shadcn CLI config
└── tsconfig.json
```

---

### packages/api (API Library)

**Exports**: `@wp-nps/api`, `@wp-nps/api/context`, `@wp-nps/api/routers/index`

```
packages/api/
├── src/
│   ├── index.ts              # 🔌 Procedure exports (publicProcedure, protectedProcedure)
│   ├── context.ts            # Request context (session from auth)
│   └── routers/
│       └── index.ts          # 📡 AppRouter definition (healthCheck, privateData)
├── package.json
└── tsconfig.json
```

**Integration Points**:
- Imported by `apps/server` for API handlers
- Type exported to `apps/web` for type-safe client

---

### packages/db (Database Library)

**Exports**: `@wp-nps/db`, `@wp-nps/db/schema/*`

```
packages/db/
├── src/
│   ├── index.ts              # 💾 Drizzle client export
│   └── schema/
│       ├── index.ts          # Schema barrel export
│       └── auth.ts           # 📊 Auth tables (user, session, account, verification)
├── drizzle.config.ts         # Migration config
├── package.json
└── tsconfig.json
```

**Integration Points**:
- Used by `packages/auth` for Better Auth adapter
- Used by `apps/server` via `packages/auth`

---

### packages/auth (Auth Library)

**Exports**: `@wp-nps/auth`

```
packages/auth/
├── src/
│   └── index.ts              # 🔐 Better Auth instance with Drizzle adapter
├── package.json
└── tsconfig.json
```

**Integration Points**:
- Imported by `apps/server` for auth routes
- Schema used from `packages/db`

---

### packages/config (Config Library)

**Exports**: Shared TypeScript configuration

```
packages/config/
├── tsconfig.base.json        # ⚙️ Base TypeScript config for all packages
└── package.json
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         apps/web                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────────────────┐ │
│  │ Routes  │───▶│Components│───▶│ orpc client (utils/orpc.ts) │ │
│  └─────────┘    └─────────┘    └──────────────┬──────────────┘ │
│                                               │ HTTP /rpc      │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        apps/server                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Elysia (index.ts)                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│  │  │/api/auth │  │  /rpc    │  │       /api           │  │   │
│  │  │(BetterAuth)│ │(oRPC)   │  │    (OpenAPI)         │  │   │
│  │  └────┬─────┘  └────┬─────┘  └──────────────────────┘  │   │
│  └───────┼─────────────┼──────────────────────────────────┘   │
│          │             │                                        │
│          ▼             ▼                                        │
│  ┌───────────────┐  ┌────────────────────────────────────┐    │
│  │packages/auth  │  │         packages/api               │    │
│  │ (better-auth) │  │  (appRouter, procedures, context)  │    │
│  └───────┬───────┘  └────────────────────────────────────┘    │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    packages/db                             │ │
│  │            (Drizzle ORM + PostgreSQL)                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Critical Folders

| Folder | Purpose | Entry Point |
|--------|---------|-------------|
| `apps/server/src` | Backend API server | `index.ts` |
| `apps/web/src` | React frontend | `main.tsx` |
| `apps/web/src/routes` | Page components | `__root.tsx` |
| `apps/web/src/components` | UI components | Various |
| `packages/api/src` | API definitions | `index.ts` |
| `packages/db/src/schema` | Database models | `auth.ts` |
| `packages/auth/src` | Auth configuration | `index.ts` |

## File Counts

| Part | TypeScript Files | Config Files |
|------|-----------------|--------------|
| web | 20 | 4 |
| server | 1 | 3 |
| api | 3 | 2 |
| db | 3 | 3 |
| auth | 1 | 2 |
| config | 0 | 2 |
| **Total** | **28** | **16** |

## Build Pipeline (Turbo)

```
turbo.json tasks:
├── build      # Compile all packages (dependsOn: ^build)
├── dev        # Run dev servers (cache: false, persistent: true)
├── check-types # TypeScript type checking
├── lint       # Run linter
└── db:*       # Database operations (push, studio, migrate, generate)
```

---

*Generated by BMAD Document Project Workflow*
