# Architecture - FlowPulse

## Executive Summary

FlowPulse is a **WhatsApp-native customer feedback platform** built on the **Better-T Stack** - a modern TypeScript-first monorepo architecture providing end-to-end type safety. The platform enables businesses to collect NPS, CSAT, and CES surveys via WhatsApp Flows (Kapso integration), targeting SMBs with a SaaS model ($49-149/mo).

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Bun | Latest | Server JavaScript runtime |
| **Frontend** | React | 19.2.3 | UI library |
| **Build** | Vite | 6.2.2 | Frontend bundler |
| **Backend** | Elysia | 1.3.21 | HTTP framework |
| **API** | oRPC | 1.12.2 | Type-safe RPC |
| **Database** | PostgreSQL | 14+ | Primary database |
| **ORM** | Drizzle | 0.45.1 | Database access |
| **Auth** | Better Auth | 1.4.9 | Authentication |
| **Monorepo** | Turbo | 2.6.3 | Build orchestration |
| **Styling** | TailwindCSS | 4.0.15 | Utility CSS |
| **State** | TanStack Query | 5.90.12 | Server state |
| **Routing** | TanStack Router | 1.141.1 | Client routing |

## Architecture Pattern

**Better-T Stack** combines:
- **Bun** for fast server runtime
- **Elysia** for ergonomic API development
- **TypeScript** throughout (strict mode)
- **oRPC** for type-safe client-server communication
- **React** with modern patterns

### Key Characteristics

1. **End-to-End Type Safety**: Types flow from database schema through API to frontend
2. **Monorepo Structure**: Shared code via internal packages
3. **File-Based Routing**: TanStack Router auto-generates routes
4. **Server State Management**: TanStack Query handles caching, deduplication
5. **Component-Based UI**: shadcn/ui primitives with Radix

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     React Application                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │ │
│  │  │   Routes    │  │  Components │  │    TanStack Query   │   │ │
│  │  │ (TanStack)  │  │  (shadcn)   │  │    + oRPC Client    │   │ │
│  │  └─────────────┘  └─────────────┘  └──────────┬──────────┘   │ │
│  └───────────────────────────────────────────────┼───────────────┘ │
└──────────────────────────────────────────────────┼──────────────────┘
                                                   │ HTTPS
                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Elysia Server                                │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                        Middleware                               ││
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐  ││
│  │  │   CORS   │  │  Auth Check  │  │     Error Handler       │  ││
│  │  └──────────┘  └──────────────┘  └─────────────────────────┘  ││
│  └────────────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                         Routes                                  ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────────────┐  ││
│  │  │/api/auth/*│  │   /rpc/*  │  │         /api/*            │  ││
│  │  │(BetterAuth)│ │  (oRPC)   │  │       (OpenAPI)           │  ││
│  │  └─────┬─────┘  └─────┬─────┘  └───────────────────────────┘  ││
│  └────────┼──────────────┼────────────────────────────────────────┘│
│           │              │                                          │
│           ▼              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                    Business Logic                               ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   ││
│  │  │ Auth Service │  │ API Routers  │  │  Procedure Guards  │   ││
│  │  │ (better-auth)│  │   (oRPC)     │  │ (public/protected) │   ││
│  │  └──────┬───────┘  └──────┬───────┘  └────────────────────┘   ││
│  └─────────┼─────────────────┼────────────────────────────────────┘│
└────────────┼─────────────────┼──────────────────────────────────────┘
             │                 │
             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   user   │  │ session  │  │ account  │  │   verification   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Current Schema

The database currently contains authentication tables only:

- **user**: User profiles (id, name, email, emailVerified, image)
- **session**: Active sessions (id, token, expiresAt, userId)
- **account**: OAuth/credential accounts (id, provider, tokens, userId)
- **verification**: Email verification tokens (id, identifier, value, expiresAt)

### Future FlowPulse Tables (Planned)

Based on the product brief, these will be added:

- **organization**: Multi-tenant business accounts
- **survey**: NPS/CSAT/CES survey definitions
- **response**: Customer feedback responses
- **whatsapp_connection**: Kapso WhatsApp integration
- **contact**: Customer contact information
- **analytics**: Aggregated metrics

## API Design

### oRPC Architecture

```typescript
// Procedure definition
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "Private",
    user: context.session?.user,
  })),
};
```

### Authentication Flow

1. Client submits credentials to `/api/auth/sign-in`
2. Better Auth validates and creates session
3. Session cookie returned (httpOnly, secure, sameSite: none)
4. Subsequent requests include cookie automatically
5. `createContext` extracts session for API handlers

### Authorization Pattern

```typescript
// Middleware-based protection
const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { session: context.session } });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

## Frontend Architecture

### Component Hierarchy

```
RootComponent
├── ThemeProvider (dark/light mode)
│   ├── Header (navigation, user menu)
│   └── Outlet (route content)
│       ├── HomeComponent (/)
│       ├── LoginComponent (/login)
│       │   ├── SignInForm
│       │   └── SignUpForm
│       └── DashboardComponent (/dashboard) [protected]
└── Toaster (notifications)
```

### State Management

- **Server State**: TanStack Query via oRPC utilities
- **Auth State**: Better Auth React client
- **Theme State**: next-themes
- **Form State**: TanStack Form

### Routing

File-based routing with TanStack Router:

```
routes/
├── __root.tsx    # Layout wrapper
├── index.tsx     # / (public)
├── login.tsx     # /login (public)
└── dashboard.tsx # /dashboard (protected)
```

## Deployment Architecture

### Development

- **Frontend**: Vite dev server (HMR)
- **Backend**: Bun hot reload
- **Database**: Local PostgreSQL

### Production (Planned)

```
┌─────────────────┐     ┌─────────────────┐
│   CDN/Static    │     │   Application   │
│   (Vercel/CF)   │     │   Server        │
│   apps/web/dist │     │   (Bun binary)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  PostgreSQL │
              │  (Managed)  │
              └─────────────┘
```

## Security Considerations

1. **Authentication**: Better Auth with secure cookie settings
2. **CORS**: Configured for specific frontend origin
3. **SQL Injection**: Drizzle ORM parameterized queries
4. **XSS**: React's default escaping + CSP headers (todo)
5. **CSRF**: SameSite cookie + credentials include

## Performance Considerations

1. **Bun Runtime**: Faster than Node.js
2. **oRPC**: Minimal serialization overhead
3. **TanStack Query**: Automatic caching and deduplication
4. **Vite**: Fast HMR and optimized builds
5. **Turbo**: Cached builds across packages

---

*Generated by BMAD Document Project Workflow*
