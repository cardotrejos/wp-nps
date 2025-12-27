---
stepsCompleted: [1, 2]
inputDocuments:
  - path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
    description: "Product Requirements Document with 78 FRs and 40 NFRs"
  - path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    type: "ux"
    description: "Complete UX design specification"
  - path: "_bmad-output/planning-artifacts/research/market-nps-csat-saas-competitive-landscape-research-2025-12-26.md"
    type: "research"
    description: "Competitive landscape analysis"
  - path: "_bmad-output/planning-artifacts/research/technical-shopify-app-store-best-practices-research-2025-12-26.md"
    type: "research"
    description: "Shopify App Store best practices"
  - path: "docs/architecture.md"
    type: "existing"
    description: "Current architecture (Better-T Stack)"
  - path: "docs/data-models.md"
    type: "existing"
    description: "Current database schema (auth tables)"
  - path: "docs/api-contracts.md"
    type: "existing"
    description: "oRPC API contracts"
  - path: "docs/integration-architecture.md"
    type: "existing"
    description: "Turbo monorepo integration patterns"
  - path: "docs/index.md"
    type: "existing"
    description: "Project documentation index"
workflowType: 'architecture'
lastStep: 2
project_name: 'FlowPulse'
user_name: 'Cardotrejos'
date: '2025-12-26'
---

# Architecture Decision Document: FlowPulse

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Document Context

**Project:** FlowPulse - WhatsApp-native customer feedback platform
**Type:** Brownfield (extending existing Better-T Stack codebase)
**Date:** 2025-12-26
**Architect:** Cardotrejos + Winston (AI Architect)

### Input Documents Loaded

| Document | Type | Key Insights |
|----------|------|--------------|
| PRD | Planning | 78 FRs, 40 NFRs, 6-sprint MVP plan, Kapso integration critical |
| UX Design | Planning | Mobile-first, WhatsApp-native patterns, shadcn/ui base |
| Existing Architecture | Brownfield | Better-T Stack: Bun + Elysia + oRPC + Drizzle + React 19 |
| Data Models | Brownfield | Auth tables only; FlowPulse tables to be added |
| API Contracts | Brownfield | oRPC type-safe RPC, Better Auth sessions |
| Integration Architecture | Brownfield | Turbo monorepo with 6 packages |
| Market Research | Research | Delighted sunsetting, SMB gap at $49-149/mo |
| Technical Research | Research | Shopify App Store requires GraphQL API by April 2025 |

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (78 FRs across 11 capability areas):**

| Area | FR Count | Architectural Implication |
|------|----------|--------------------------|
| Authentication & Onboarding | 6 | Extend Better Auth with org membership, RBAC |
| Survey Management | 7 | CRUD + templates + versioning + soft delete |
| Survey Distribution | 7 | **Kapso API integration (critical path)** |
| Response Collection | 7 | Webhook receiver + real-time processing |
| Analytics Dashboard | 8 | Aggregation queries, caching strategy |
| Alert System | 6 | Push to owner's WhatsApp, real-time triggers |
| Customer Context | 5 | Customer 360 view, order linking |
| Response Actions | 7 | Quick response templates, escalation workflow |
| Billing & Usage | 10 | Subscription tiers, usage tracking, limits |
| API Access | 6 | External API for integrations (Shopify, etc.) |
| Settings & Configuration | 6 | Org/user preferences, WhatsApp consent |

**Non-Functional Requirements (40 NFRs across 7 categories):**

| Category | Key Requirements | Architectural Impact |
|----------|-----------------|---------------------|
| Performance | Dashboard < 2s, API < 200ms | Query optimization, response caching |
| Scalability | 10K responses/org/month (Growth) | Indexed queries, pagination, archival |
| Reliability | 99.5% uptime, graceful degradation | Kapso failure handling, retry queues |
| Security | Multi-tenant isolation, RBAC | RLS + application filtering hybrid |
| Maintainability | 80% test coverage | Testing strategy, Kapso mocks |
| Accessibility | WCAG AA, mobile-first | axe-core CI integration |
| Observability | Logging, metrics, alerting | Structured logging, health checks |

### Scale & Complexity Assessment

| Indicator | Assessment | Notes |
|-----------|------------|-------|
| **Complexity Level** | Medium-High | External API dependency, multi-tenancy |
| **Primary Domain** | Full-stack SaaS | Web dashboard + API + external integration |
| **Multi-tenancy** | Required | org → members → surveys → responses hierarchy |
| **Real-time Features** | Limited MVP | Polling for MVP, WebSocket-ready architecture |
| **Estimated Components** | ~15-20 | Across frontend, backend, database |

### Technical Constraints & Dependencies

| Constraint | Source | Impact | Mitigation |
|------------|--------|--------|------------|
| **Kapso WhatsApp Flows API** | External | Critical path for all survey operations | Abstraction layer, retry queue, health monitoring |
| **Better-T Stack** | Brownfield | Must extend existing patterns | Follow established oRPC/Drizzle conventions |
| **PostgreSQL** | Brownfield | Schema extension required | Incremental migrations per sprint |
| **oRPC Type Safety** | Brownfield | Router organization needed | Nested routers by capability area |
| **Shopify GraphQL API** | Future | Required by April 2025 for App Store | Design API layer for multiple integrations |
| **Polling (not WebSocket)** | PRD Scoping | MVP simplicity | Architecture hooks for future upgrade |

### Cross-Cutting Concerns

| Concern | Description | Architectural Decision Needed |
|---------|-------------|------------------------------|
| **Multi-Tenancy** | `org_id` isolation in all FlowPulse tables | RLS + application filtering hybrid |
| **Authentication** | Extend session with org context | Add org membership to Better Auth |
| **Kapso Abstraction** | Isolate external dependency | `packages/kapso/` or `packages/integrations/` |
| **Error Handling** | Graceful degradation when Kapso unavailable | Retry queue, user-facing status |
| **Usage Metering** | Track surveys per billing cycle | Usage table with period aggregation |
| **Audit Trail** | Log key actions for compliance | Append-only audit log table |
| **Owner WhatsApp Alerts** | Our differentiator feature | Consent flow, separate notification channel |

### Kapso Integration Risk Mitigation

**Risk Level:** HIGH - Single point of failure for core functionality

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Kapso API unavailable | Medium | Critical | Health check + graceful degradation UX |
| Survey delivery failure | Medium | High | Retry queue with exponential backoff |
| Webhook delivery failure | Medium | High | Idempotent processing, deduplication |
| Rate limiting | Low | Medium | Queue with rate limiter |
| Breaking API changes | Low | High | Version pinning, abstraction layer |

**Architectural Requirements:**
- Mock Kapso service for CI/CD (no external calls in tests)
- Contract tests against Kapso API specification
- Failure scenario coverage (timeouts, auth failures, rate limits)
- Delivery status tracking (Pending → Delivered → Failed → Responded)

### Multi-Tenancy Enforcement Strategy

**Hybrid Approach (Defense in Depth):**

1. **PostgreSQL Row-Level Security (RLS)**
   - Enable RLS on all FlowPulse tables
   - Policies enforce `org_id = current_setting('app.current_org_id')`
   - Defense against SQL injection and query bugs

2. **Application-Level Filtering**
   - All queries include explicit `WHERE org_id = ?`
   - Middleware extracts org context from session
   - Performance optimization (RLS has overhead)

3. **Testing Strategy**
   - Automated cross-tenant access tests (should fail)
   - Seed test data with multiple orgs
   - CI gate on isolation violations

### Router Organization Pattern

**Nested oRPC Routers by Capability:**

```typescript
export const appRouter = {
  // Auth (existing)
  healthCheck: publicProcedure,
  privateData: protectedProcedure,

  // FlowPulse capability routers
  org: orgRouter,           // Organization management
  survey: surveyRouter,     // Survey CRUD + templates
  distribution: distRouter, // Kapso integration
  response: responseRouter, // Response collection
  analytics: analyticsRouter, // Dashboard queries
  alert: alertRouter,       // Notification management
  billing: billingRouter,   // Subscription + usage
  settings: settingsRouter, // Preferences
};
```

### Future Considerations

| Feature | Architectural Preparation |
|---------|--------------------------|
| **Free Tier** | Usage limits table, tier enforcement middleware |
| **Delighted Migration** | Data import API endpoint, CSV/JSON format support |
| **Shopify Integration** | GraphQL client package, OAuth flow |
| **WebSocket Upgrade** | Event emitter pattern, subscription-ready queries |
| **Multi-language Surveys** | i18n table structure, locale in survey model |

---
