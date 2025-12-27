---
stepsCompleted: [1, 2, 3]
lastStep: 3
stories_completed:
  - epic_1: 6
  - epic_2: 7
  - epic_3: 12
  - epic_4: 10
  - epic_5a: 7
  - epic_5b: 8
  - epic_6: 9
  - epic_7: 9
total_stories_created: 68
workflow_paused: false
completed_at: '2025-12-26'
inputDocuments:
  - path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
    description: "Product Requirements Document with 78 FRs and 49 NFRs"
  - path: "_bmad-output/planning-artifacts/architecture.md"
    type: "architecture"
    description: "Complete architecture document with 6 decisions, 12+ patterns"
  - path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    type: "ux"
    description: "UX design specification with component strategy"
workflowType: 'epics-and-stories'
lastStep: 2
project_name: 'FlowPulse'
user_name: 'Cardotrejos'
date: '2025-12-26'
epic_count: 8
total_frs: 78
party_mode_refinements:
  - "Merged API (Epic 7) into Epic 3 (Distribution)"
  - "Split Epic 5 into 5a (Alerts) and 5b (Actions)"
  - "Added cross-cutting concerns section"
  - "Mapped epics to 6-sprint plan"
---

# FlowPulse - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FlowPulse, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Onboarding (6 FRs)**

- FR1: Business Owner can sign up using email and password
- FR2: Business Owner can connect their WhatsApp Business number via QR code scan
- FR3: Business Owner can verify WhatsApp connection with a test message
- FR4: Business Owner can complete guided first survey setup within 10 minutes
- FR5: Business Owner can resume onboarding from where they left off after abandonment
- FR6: System can send onboarding reminder emails after 24-hour abandonment

**Survey Management (7 FRs)**

- FR7: Business Owner can view available survey templates (NPS, CSAT, CES)
- FR8: Business Owner can select a survey template for use
- FR9: Business Owner can edit survey question text within a template
- FR10: Business Owner can preview how a survey will appear in WhatsApp
- FR11: Business Owner can test a survey by sending it to themselves
- FR12: Business Owner can activate or deactivate a survey
- FR13: Business Owner can set a trigger type for a survey (API, manual)

**Survey Distribution (7 FRs)**

- FR14: Business Owner can trigger a survey send via API with customer phone number
- FR15: Business Owner can include metadata (order_id, customer_name) with API survey sends
- FR16: System can queue survey sends for delivery via Kapso
- FR17: System can track survey send states (Pending, Delivered, Failed, Responded)
- FR18: Business Owner can view the delivery status of sent surveys
- FR19: System can retry failed survey deliveries up to 2 times
- FR20: System can mark surveys as undeliverable after max retries

**Response Collection (7 FRs)**

- FR21: End Customer can receive NPS survey as native WhatsApp Flow
- FR22: End Customer can complete survey by tapping a 0-10 rating
- FR23: End Customer can provide optional open-text feedback
- FR24: End Customer can complete survey in under 60 seconds
- FR25: System can receive survey responses via Kapso webhooks
- FR26: System can process and store responses in real-time
- FR27: System can fall back to simple text messages if WhatsApp Flows unavailable

**Analytics Dashboard (8 FRs)**

- FR28: Business Owner can view current NPS score as hero metric
- FR29: Business Owner can view NPS trend indicator (up/down from previous period)
- FR30: Business Owner can view NPS score breakdown by category (Promoters, Passives, Detractors)
- FR31: Business Owner can view response stream with recent responses
- FR32: Business Owner can view response timeline (responses over time)
- FR33: Business Owner can view total surveys sent and response rate
- FR34: Dashboard can display cached data when real-time connection unavailable
- FR35: Dashboard can show "last updated" timestamp when in degraded mode

**Alert System (6 FRs)**

- FR36: System can detect detractor responses (NPS ≤ 6) in real-time
- FR37: System can send WhatsApp alert to Business Owner when detractor detected
- FR38: Alert can include customer name, score, and feedback text
- FR39: Business Owner can configure detractor alert threshold
- FR40: System can send escalation reminder if detractor not contacted within 24 hours
- FR41: Business Owner can view all active alerts requiring attention

**Customer Context (5 FRs)**

- FR42: Business Owner can view customer context card for any response
- FR43: Context card can display customer name and phone number
- FR44: Context card can display order information if metadata provided
- FR45: Context card can display response history for repeat customers
- FR46: Context card can display customer lifetime value if available

**Response Actions (7 FRs)**

- FR47: Business Owner can mark a detractor as "Contacted"
- FR48: Business Owner can send quick response using predefined templates
- FR49: Business Owner can customize quick response before sending
- FR50: Business Owner can trigger follow-up survey to customer
- FR51: System can detect "Crisis Averted" when detractor becomes promoter
- FR52: System can display celebration card when crisis averted
- FR53: Business Owner can share crisis averted card as image

**Billing & Usage (10 FRs)**

- FR54: Business Owner can view current usage (surveys sent this month)
- FR55: Business Owner can view remaining surveys in current plan
- FR56: System can display progressive warnings as usage approaches limit
- FR57: System can block new survey sends when plan limit reached
- FR58: Business Owner can upgrade subscription plan
- FR59: Business Owner can view available plans with feature comparison
- FR60: System can process subscription payment via Stripe
- FR61: System can activate upgraded plan immediately after payment
- FR62: Business Owner can view billing history and invoices
- FR63: Business Owner can update payment method

**API Access (6 FRs)**

- FR64: Developer can generate API key for organization
- FR65: Developer can view API documentation within dashboard
- FR66: Developer can send surveys via REST API endpoint
- FR67: Developer can include custom metadata with API requests
- FR68: System can enforce rate limiting (100 requests/minute)
- FR69: System can return appropriate error codes for failed requests

**Settings & Configuration (6 FRs)**

- FR70: Business Owner can view and edit organization profile
- FR71: Business Owner can view connected WhatsApp number details
- FR72: Business Owner can disconnect and reconnect WhatsApp number
- FR73: Business Owner can configure notification preferences
- FR74: Business Owner can request data export (GDPR)
- FR75: Business Owner can request account deletion (GDPR)

**Onboarding Analytics - Internal (3 FRs)**

- FR76: System can track onboarding funnel events (signup, connect, test, first_send, first_response)
- FR77: System can calculate Time to First Response metric
- FR78: System can identify drop-off points in onboarding funnel

### Non-Functional Requirements

**Performance (6 NFRs)**

- NFR-P1: Dashboard initial load completes in < 2 seconds
- NFR-P2: Dashboard data refresh (polling) completes in < 1 second
- NFR-P3: Survey send API responds in < 500ms
- NFR-P4: Detractor alert delivered to owner within 60 seconds of response receipt
- NFR-P5: NPS score calculation updates within 5 seconds of new response
- NFR-P6: Survey loads in WhatsApp Flow within 2 seconds

**Security (11 NFRs)**

- NFR-S1: All data encrypted in transit using TLS 1.2+
- NFR-S2: Customer phone numbers encrypted at rest
- NFR-S3: API keys hashed, never stored in plaintext
- NFR-S4: Session tokens expire after 24 hours of inactivity
- NFR-S5: Password hashing uses bcrypt with cost factor ≥ 10
- NFR-S6: GDPR data export request fulfilled within 30 days
- NFR-S7: GDPR data deletion completed within 30 days
- NFR-S8: Payment processing delegated entirely to Stripe
- NFR-S9: Webhook payloads exclude customer PII by default
- NFR-S10: API rate limiting enforced at 100 requests/minute per org
- NFR-S11: System architecture supports future data residency requirements

**Scalability (5 NFRs)**

- NFR-SC1: System supports 1,000 concurrent organizations
- NFR-SC2: Database queries use indexed lookups on organization_id
- NFR-SC3: Survey send queue processes 1,000 messages/minute
- NFR-SC4: Dashboard remains responsive with 10,000 responses per org (Growth)
- NFR-SC5: Multi-tenant isolation prevents cross-org data leakage at any scale

**Reliability (9 NFRs)**

- NFR-R1: Survey delivery success rate ≥ 99.5%
- NFR-R2: Dashboard availability ≥ 99.9% during business hours
- NFR-R3: Failed survey sends retry automatically up to 2 times
- NFR-R4: System gracefully degrades when Kapso unavailable
- NFR-R5: Alert delivery succeeds ≥ 99% of the time
- NFR-R6: Database backups occur daily with 30-day retention
- NFR-R7: Recovery Point Objective (RPO) ≤ 24 hours
- NFR-R8: Recovery Time Objective (RTO) ≤ 4 hours
- NFR-R9: System reliability targets assume Kapso maintains ≥ 99.9% availability

**Integration (6 NFRs)**

- NFR-I1: Kapso API integration abstracted behind provider interface
- NFR-I2: Kapso webhook processing completes in < 5 seconds
- NFR-I3: Stripe webhook signature verified on all payment events
- NFR-I4: API follows RESTful conventions with JSON payloads
- NFR-I5: API returns meaningful error codes (4xx, 5xx with messages)
- NFR-I6: API documentation auto-generated from code

**Accessibility & Compatibility (6 NFRs)**

- NFR-A1: Dashboard meets WCAG 2.1 Level A standards
- NFR-A2: All interactive elements keyboard-navigable
- NFR-A3: Color contrast ratios meet minimum 4.5:1 for text
- NFR-A4: Form fields have associated labels
- NFR-A5: Dashboard supports Chrome, Firefox, Safari, Edge (latest 2 versions)
- NFR-A6: Dashboard is usable on mobile devices (minimum 375px width)

**Operational & Observability (6 NFRs)**

- NFR-O1: Application logs all errors with stack traces
- NFR-O2: Health check endpoint available at /health
- NFR-O3: Key metrics (response rate, NPS, active orgs) queryable
- NFR-O4: Deployment achievable with zero downtime
- NFR-O5: Environment configuration via environment variables
- NFR-O6: All NFR metrics collected and queryable via monitoring dashboard

### Additional Requirements

**From Architecture Document:**

- AR1: Extend Better Auth with organization plugin for multi-tenancy (creates organization, member, invitation tables automatically)
- AR2: Create dedicated `packages/kapso/` package with IKapsoClient interface abstraction
- AR3: Implement KapsoMockClient for all testing (no external API calls in CI)
- AR4: Use DB-backed webhook_jobs table with queue semantics (no Redis/BullMQ for MVP)
- AR5: Deploy to Railway.app with São Paulo region for LATAM market proximity
- AR6: Implement org_metrics table for pre-aggregated dashboard metrics
- AR7: Implement org_usage table for usage tracking and billing limits
- AR8: Use hybrid multi-tenancy enforcement (PostgreSQL RLS + application-level orgId filtering)
- AR9: Follow naming conventions: singular lowercase tables, kebab-case components, camelCase oRPC procedures
- AR10: Implement TanStack Query key factory pattern in packages/shared/src/query-keys.ts
- AR11: All FlowPulse queries MUST include orgId filter (multi-tenancy enforcement)
- AR12: oRPC handlers return data directly (no response wrappers)
- AR13: Use polling (30s intervals) for dashboard real-time updates (WebSocket-ready architecture for future)
- AR14: Implement webhook processor using setInterval with 5s polling in Bun
- AR15: Use Vitest for unit/integration tests, Playwright for E2E, MSW for Kapso contract tests
- AR16: Transaction rollback + Docker Compose for test database strategy

**From UX Design Document:**

- UX1: Mobile-first dashboard design with bottom tab navigation (4 items max)
- UX2: NPSScoreRing component as hero metric (SVG-based, responsive, color-coded thresholds)
- UX3: WhatsApp beige (#ece5dd) background for response section (chat bubble aesthetic)
- UX4: Hybrid design direction: Hero Pulse Ring (Direction 1) + WhatsApp chat bubbles (Direction 2) + Bottom nav (Direction 4)
- UX5: 10-minute time-to-value target for onboarding journey
- UX6: QR Scanner component for WhatsApp connection (60s timeout, troubleshooting flow)
- UX7: Progress stepper component for onboarding flow
- UX8: Customer Context Card for detractor response (order history, previous NPS, LTV)
- UX9: Quick Response Menu with pre-built templates (damaged, late, quality, service)
- UX10: CelebrationCard for "Crisis Averted" moments (shareable 1200x630px image)
- UX11: Alert Banner with visual hierarchy inversion when detractors present
- UX12: Loading skeletons with 1s minimum display and 300ms crossfade
- UX13: Empty states with value props (e.g., "Email gets 9%. WhatsApp gets 45%.")
- UX14: Triple encoding for color blindness (color + icon + text label)
- UX15: Focus management with trap and restoration for modals
- UX16: Reduced motion support via prefers-reduced-motion media query
- UX17: Skip links for keyboard navigation accessibility
- UX18: axe-core CI/CD accessibility gate blocking PRs
- UX19: Heroic framing copy (e.g., "Customer needs you" not "Detractor detected")
- UX20: First NPS reveal ceremony (500ms pause, count-up animation, ring fill)

### FR Coverage Map

| FR Range | Epic | Description |
|----------|------|-------------|
| FR1-FR6 | Epic 1 | Authentication & Onboarding |
| FR7-FR13 | Epic 2 | Survey Creation & Management |
| FR14-FR20 | Epic 3 | Survey Distribution |
| FR21-FR27 | Epic 3 | Response Collection |
| FR28-FR35 | Epic 4 | Analytics Dashboard |
| FR36-FR41 | Epic 5a | Detractor Alerts |
| FR42-FR46 | Epic 5b | Customer Context |
| FR47-FR53 | Epic 5b | Response Actions |
| FR54-FR63 | Epic 6 | Billing & Subscription |
| FR64-FR69 | Epic 3 | API Access (merged) |
| FR70-FR75 | Epic 7 | Settings & Configuration |
| FR76-FR78 | Epic 7 | Onboarding Analytics |

---

## Cross-Cutting Concerns

These are addressed incrementally across epics, not as standalone stories:

| Concern | Addressed In | Notes |
|---------|--------------|-------|
| CI/CD & Deployment | Epic 1 (foundation), then incremental | Railway.app São Paulo (AR5) |
| Testing Infrastructure | Epic 1 (Vitest/MSW setup), then per-epic | AR15, AR16 |
| Accessibility Compliance | Every UI epic | axe-core gate (UX18), WCAG AA |
| Multi-Tenancy Enforcement | Every data epic | AR8, AR11 - orgId filtering |
| Error Handling & Logging | Every epic | NFR-O1, graceful degradation |

---

## Sprint Mapping

| Sprint | Epics | Deliverable |
|--------|-------|-------------|
| Sprint 1 | Epic 1 + Epic 2 (partial) | Auth, org model, survey templates, CI/CD foundation |
| Sprint 2 | Epic 2 (complete) + Epic 3 | Survey CRUD, Kapso integration, API endpoint |
| Sprint 3 | Epic 4 + Epic 5a | Dashboard with NPS hero, detractor alerts |
| Sprint 4 | Epic 5b + Epic 6 | Response actions, Crisis Averted, Stripe billing |
| Sprint 5 | Epic 7 + Polish | Settings, GDPR, onboarding analytics, error handling |
| Sprint 6 | Launch Prep | E2E testing, performance optimization, documentation |

---

## Epic List

### Epic 1: Foundation & Onboarding

**Goal:** Business Owner can sign up, create their organization, and connect their WhatsApp Business number - ready to send their first survey.

**FRs Covered:** FR1-FR6 (Authentication & Onboarding)
**Additional Requirements:** AR1, AR8, AR9, AR15 (testing foundation), UX5-UX7
**Sprint Target:** Sprint 1

---

### Epic 2: Survey Creation & Management

**Goal:** Business Owner can select templates, customize surveys, preview them in WhatsApp format, and test on themselves.

**FRs Covered:** FR7-FR13 (Survey Management)
**Additional Requirements:** UX17-UX18 (Template components)
**Sprint Target:** Sprint 1-2

---

### Epic 3: Survey Distribution, Response Collection & API

**Goal:** Business Owner can send surveys to customers via WhatsApp (manually or via API), receive responses in real-time, and track delivery status. Developers can integrate via REST API.

**FRs Covered:** FR14-FR27 (Distribution + Response Collection) + FR64-FR69 (API Access)
**Additional Requirements:** AR2-AR4, AR14, NFR-I1, NFR-I2, NFR-I4, NFR-I5, NFR-I6
**Sprint Target:** Sprint 2

*Note: API merged per Party Mode recommendation - the API IS the survey send mechanism*

---

### Epic 4: Analytics Dashboard

**Goal:** Business Owner can view their NPS score, trends, response breakdown, and recent feedback at a glance - the "30-second pulse check."

**FRs Covered:** FR28-FR35 (Analytics Dashboard)
**Additional Requirements:** AR6, AR13, UX1-UX4, UX11-UX13, UX20
**Sprint Target:** Sprint 3

---

### Epic 5a: Detractor Alerts

**Goal:** Business Owner receives real-time WhatsApp alerts when unhappy customers respond, with escalation reminders for unaddressed detractors.

**FRs Covered:** FR36-FR41 (Alert System)
**Additional Requirements:** AR14 (webhook processor for alerts)
**Sprint Target:** Sprint 3

*Note: Split from original Epic 5 per Party Mode recommendation - delivers alert value independently*

---

### Epic 5b: Customer Response & Crisis Resolution

**Goal:** Business Owner can view customer context, send quick responses, trigger follow-ups, and celebrate "Crisis Averted" moments when detractors become promoters.

**FRs Covered:** FR42-FR53 (Customer Context + Response Actions)
**Additional Requirements:** UX8-UX10, UX19
**Sprint Target:** Sprint 4

*Note: Split from original Epic 5 - enables incremental delivery of response capabilities*

---

### Epic 6: Billing & Subscription Management

**Goal:** Business Owner can view usage, see plan limits, upgrade their subscription, and manage payment methods.

**FRs Covered:** FR54-FR63 (Billing & Usage)
**Additional Requirements:** AR7, NFR-S8, NFR-I3
**Sprint Target:** Sprint 4

---

### Epic 7: Settings, Configuration & Compliance

**Goal:** Business Owner can manage organization settings, WhatsApp connection, notification preferences, and request GDPR data export/deletion.

**FRs Covered:** FR70-FR78 (Settings + Onboarding Analytics)
**Additional Requirements:** NFR-S6, NFR-S7
**Sprint Target:** Sprint 5

---

## Stories

---

## Epic 1: Foundation & Onboarding

### Story 1.0: Foundation - Schema, RLS & Test Infrastructure

As a **Developer**,
I want to **have the base database schema, multi-tenancy enforcement, and test infrastructure in place**,
So that **all subsequent stories have a secure, testable foundation**.

**Acceptance Criteria:**

**Given** the project is freshly cloned
**When** I run `bun db:push`
**Then** all base tables are created (user, organization, member, session via Better Auth)
**And** RLS policies are enabled on all tenant-scoped tables
**And** the `org_id` context injection pattern is implemented

**Given** I run `bun test`
**When** the test suite executes
**Then** Vitest runs with proper configuration
**And** MSW is configured for Kapso mocking (AR3)
**And** test database uses transaction rollback isolation (AR16)

**Given** any database query runs
**When** the query targets tenant-scoped data
**Then** `org_id` filter is automatically enforced (AR11)

**Technical Notes:**
- Creates: Base tables via Better Auth org plugin (AR1)
- Implements: RLS policies + application-level filtering (AR8)
- Sets up: Vitest + MSW + Docker Compose test DB (AR15, AR16)
- Components: ProgressStepper (UX7) - reusable across onboarding

---

### Story 1.1: User Registration with Organization Creation

As a **Business Owner**,
I want to **sign up with my email and password and have my organization created automatically**,
So that **I can start using FlowPulse without manual setup steps**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter my email, password, and organization name
**Then** my account is created with a hashed password (bcrypt cost ≥10)
**And** an organization is created with me as the owner
**And** I am logged in and redirected to the onboarding flow
**And** a session token is issued (expires after 24h inactivity)

**Given** I try to sign up with an email already in use
**When** I submit the form
**Then** I see an error message "Email already registered"
**And** I am not logged in

**Technical Notes:**
- Uses: Better Auth org plugin (AR1)
- Implements: NFR-S5 (bcrypt), NFR-S4 (session expiry)

---

### Story 1.2: WhatsApp Connection via QR Code

As a **Business Owner**,
I want to **connect my WhatsApp Business number by scanning a QR code**,
So that **FlowPulse can send surveys on my behalf**.

**Acceptance Criteria:**

**Given** I am logged in and on the WhatsApp connection step
**When** I view the QR code screen
**Then** I see a QR code from Kapso with clear scan instructions
**And** a 60-second countdown timer is visible (UX6)
**And** a progress stepper shows my current step (UX7)

**Given** I scan the QR code with my WhatsApp Business app
**When** the connection is established
**Then** I see a "Connected!" success message
**And** my WhatsApp number is stored (encrypted at rest - NFR-S2)
**And** the connection status updates to "active"

**Given** 60 seconds pass without a successful scan
**When** the timeout occurs
**Then** I see troubleshooting tips (UX6)
**And** a "Retry" button generates a fresh QR code

**Technical Notes:**
- Creates: `whatsapp_connection` table with `org_id` FK
- Integrates: Kapso QR endpoint (AR2)
- Components: QRScanner (UX6)

---

### Story 1.3: WhatsApp Connection Verification

As a **Business Owner**,
I want to **verify my WhatsApp connection with a test message**,
So that **I know the integration is working before sending to customers**.

**Acceptance Criteria:**

**Given** I have connected my WhatsApp number
**When** I click "Send Test Message"
**Then** a test message is sent to my own WhatsApp number
**And** I see "Test sent - check your WhatsApp" confirmation

**Given** I receive the test message on my WhatsApp
**When** I confirm receipt in the app
**Then** the connection is marked as "verified"
**And** I can proceed to the next onboarding step

**Given** the test message fails to send
**When** Kapso returns an error
**Then** I see an error message with retry option
**And** troubleshooting guidance is displayed

**Technical Notes:**
- Uses: Kapso send message API (AR2)
- Updates: `whatsapp_connection.verified = true`

---

### Story 1.4: Onboarding Progress Persistence

As a **Business Owner**,
I want to **resume onboarding from where I left off if I abandon the flow**,
So that **I don't have to start over when I return**.

**Acceptance Criteria:**

**Given** I am on step 3 of onboarding
**When** I close the browser and return later
**Then** I am returned to step 3 automatically
**And** my previously entered data is preserved

**Given** I completed step 2 but not step 3
**When** I log back in within 24 hours
**Then** I see my progress stepper showing step 3
**And** I can continue from where I left off

**Given** my QR code expired during abandonment
**When** I resume onboarding on the WhatsApp connection step
**Then** a new QR code is automatically generated
**And** I can scan the fresh QR code to connect

**Technical Notes:**
- Creates: `onboarding_state` column on `organization` table
- Stores: current_step, completed_steps, last_activity_at
- Handles: QR TTL expiry gracefully

---

### Story 1.5: First Survey Template Selection

As a **Business Owner**,
I want to **select which survey template I want to use for my first survey**,
So that **I'm ready to create my survey in the next step**.

**Acceptance Criteria:**

**Given** I have verified my WhatsApp connection
**When** I reach the template selection step
**Then** I see NPS, CSAT, and CES template cards
**And** each template shows a preview and description
**And** "NPS" is highlighted as recommended for first-time users

**Given** I select a template
**When** I click "Use this template"
**Then** my selection is stored in my onboarding state
**And** I am shown a success message and proceed to completion
**And** the 10-minute timer goal is tracked (UX5, FR77)

**Given** I complete template selection
**When** onboarding finishes
**Then** I see a "Ready to create your first survey!" message
**And** I am redirected to the dashboard

**Technical Notes:**
- Stores: `selected_template_id` in onboarding state
- Does NOT create survey yet (that's Epic 2)
- Tracks: Time to First Template Selection (FR77)

---

## Epic 2: Survey Creation & Management

### Story 2.1: Survey Template Gallery

As a **Business Owner**,
I want to **view all available survey templates**,
So that **I can choose the right survey type for my needs**.

**Acceptance Criteria:**

**Given** I am logged in and on the Surveys page
**When** I click "Create Survey"
**Then** I see a template gallery with NPS, CSAT, and CES options
**And** each template shows type, description, and question count
**And** templates are displayed as cards with preview thumbnails

**Given** I am viewing the template gallery
**When** I hover over a template card
**Then** I see a brief preview of the survey questions

**Technical Notes:**
- Uses: Seeded template data from Story 1.0
- Components: TemplateCard (UX design spec)
- Route: `/surveys/new`

---

### Story 2.2: Create Survey from Template

As a **Business Owner**,
I want to **create a new survey by selecting a template**,
So that **I can quickly set up a survey without starting from scratch**.

**Acceptance Criteria:**

**Given** I am viewing the template gallery
**When** I click "Use this template" on the NPS template
**Then** a new survey is created for my organization
**And** the survey is pre-populated with template questions
**And** I am redirected to the survey edit page
**And** the survey status is "draft"

**Given** I create a survey
**When** it is saved to the database
**Then** the `org_id` is set to my organization (AR11)
**And** the survey has a unique ID

**Technical Notes:**
- Creates: `survey` table record with `org_id` FK
- Creates: `survey_question` table records
- Status: Draft by default

---

### Story 2.3: Edit Survey Question Text

As a **Business Owner**,
I want to **edit the question text in my survey**,
So that **I can customize the wording for my brand**.

**Acceptance Criteria:**

**Given** I am on the survey edit page
**When** I click on a question text field
**Then** I can edit the question text inline
**And** changes are auto-saved after 2 seconds of inactivity

**Given** I edit the NPS question text
**When** I change "How likely are you to recommend us?" to "How likely are you to recommend [Brand Name]?"
**Then** the updated text is saved
**And** I see a "Saved" indicator

**Given** I try to save an empty question
**When** I delete all text and blur the field
**Then** I see a validation error "Question text is required"
**And** the empty value is not saved

**Technical Notes:**
- Updates: `survey_question.text`
- Uses: TanStack Form with debounced auto-save
- Validation: Non-empty text required

---

### Story 2.4: Preview Survey in WhatsApp Format

As a **Business Owner**,
I want to **preview how my survey will appear in WhatsApp**,
So that **I can see exactly what my customers will see**.

**Acceptance Criteria:**

**Given** I am on the survey edit page
**When** I click "Preview"
**Then** I see a mobile phone frame mockup
**And** the survey is displayed as it would appear in WhatsApp
**And** the preview shows the WhatsApp chat bubble aesthetic (UX3)

**Given** I edit a question
**When** I view the preview
**Then** the preview updates to reflect my changes

**Given** I view the preview on desktop
**When** I resize my browser
**Then** the phone mockup remains properly sized

**Technical Notes:**
- Component: SurveyPreview with phone-frame variant
- Uses: WhatsApp beige background (#ece5dd - UX3)
- Responsive: Works on all screen sizes

---

### Story 2.5: Test Survey on Myself

As a **Business Owner**,
I want to **send a test survey to my own WhatsApp**,
So that **I can experience the survey as my customers will**.

**Acceptance Criteria:**

**Given** I am on the survey edit page
**When** I click "Send Test to Me"
**Then** the survey is sent to my verified WhatsApp number
**And** I see "Test sent! Check your WhatsApp" confirmation

**Given** I receive the test on my WhatsApp
**When** I complete the survey
**Then** the response is marked as "test" (not counted in analytics)
**And** I can view the test response in the dashboard

**Given** my WhatsApp is not connected
**When** I click "Send Test to Me"
**Then** I see "Please connect WhatsApp first" with a link

**Technical Notes:**
- Uses: Kapso send survey API (AR2)
- Flags: `is_test = true` on response record
- Requires: Verified WhatsApp connection

---

### Story 2.6: Activate or Deactivate Survey

As a **Business Owner**,
I want to **activate or deactivate my survey**,
So that **I can control when surveys are being sent**.

**Acceptance Criteria:**

**Given** I have a draft survey
**When** I click "Activate"
**Then** the survey status changes to "active"
**And** the survey can now receive API triggers
**And** I see a green "Active" badge

**Given** I have an active survey
**When** I click "Deactivate"
**Then** the survey status changes to "inactive"
**And** new API triggers are rejected for this survey
**And** I see a gray "Inactive" badge

**Given** I try to activate a survey with no questions
**When** I click "Activate"
**Then** I see an error "Add at least one question before activating"

**Technical Notes:**
- Updates: `survey.status` (draft, active, inactive)
- API behavior: Only active surveys can be triggered

---

### Story 2.7: Set Survey Trigger Type

As a **Business Owner**,
I want to **set how my survey will be triggered**,
So that **I can choose between API automation or manual sends**.

**Acceptance Criteria:**

**Given** I am on the survey settings page
**When** I view trigger options
**Then** I see "API Trigger" and "Manual Send" options
**And** each option has a description of how it works

**Given** I select "API Trigger"
**When** I save the setting
**Then** the survey can be triggered via the REST API
**And** I see API endpoint documentation inline

**Given** I select "Manual Send"
**When** I save the setting
**Then** I see a "Send Survey" button on the survey page
**And** I can manually enter a phone number to send to

**Technical Notes:**
- Creates: `survey.trigger_type` column (api, manual)
- Displays: Inline API docs for "api" type
- Enables: Manual send UI for "manual" type

---

## Epic 3: Survey Distribution, Response Collection & API

### Story 3.0: Kapso Integration Package

As a **Developer**,
I want to **have a dedicated Kapso integration package with interface abstraction**,
So that **all Kapso API calls go through a consistent, testable interface**.

**Acceptance Criteria:**

**Given** the codebase
**When** I need to interact with Kapso
**Then** I import from `@wp-nps/kapso` package
**And** I use the `IKapsoClient` interface (AR2)

**Given** I am writing tests
**When** I need to mock Kapso
**Then** I use `KapsoMockClient` which implements `IKapsoClient` (AR3)
**And** no real API calls are made in CI

**Given** I am writing webhook tests
**When** I use `KapsoMockClient`
**Then** I can call `mockValidSignature()` and `mockInvalidSignature()`
**And** signature verification behavior is testable without real Kapso

**Technical Notes:**
- Creates: `packages/kapso/` with `IKapsoClient` interface
- Implements: `KapsoClient` (real) and `KapsoMockClient` (test)
- Methods: `sendSurvey()`, `getQRCode()`, `sendMessage()`, `verifyWebhookSignature()`

---

### Story 3.1: Webhook Job Queue Infrastructure

As a **System**,
I want to **have a database-backed job queue for webhook processing**,
So that **I can reliably process async operations without Redis**.

**Acceptance Criteria:**

**Given** a job needs to be queued
**When** I insert into `webhook_jobs` table
**Then** the job is persisted with status "pending"
**And** includes payload, retry_count, and scheduled_at

**Given** the job processor is running
**When** it polls every 5 seconds (AR14)
**Then** it picks up pending jobs ordered by scheduled_at
**And** processes them one at a time
**And** updates status to "processing", then "completed" or "failed"

**Given** a job fails
**When** retry_count < 2
**Then** the job is rescheduled with exponential backoff
**And** retry_count is incremented

**Technical Notes:**
- Creates: `webhook_jobs` table (AR4)
- Processor: setInterval with 5s polling in Bun (AR14)
- Statuses: pending, processing, completed, failed

---

### Story 3.2: API Key Generation

As a **Developer**,
I want to **generate an API key for my organization**,
So that **I can authenticate API requests programmatically**.

**Acceptance Criteria:**

**Given** I am on the API settings page
**When** I click "Generate API Key"
**Then** a new API key is generated and displayed once
**And** I see a warning "Copy this key now - it won't be shown again"
**And** the key is hashed before storage (NFR-S3)

**Given** I have an existing API key
**When** I generate a new one
**Then** the old key is invalidated
**And** the new key replaces it

**Given** I try to use a revoked API key
**When** I make an API request
**Then** I receive a 401 Unauthorized response

**Technical Notes:**
- Creates: `api_key` table with hashed key and `org_id`
- Uses: crypto.randomBytes for key generation
- Stores: Only hashed version (NFR-S3)

---

### Story 3.3: Survey Send API Endpoint

As a **Developer**,
I want to **trigger a survey send via REST API**,
So that **I can automate survey delivery from my application**.

**Acceptance Criteria:**

**Given** I have a valid API key
**When** I POST to `/api/v1/surveys/{id}/send` with `{ phone: "+5511999999999" }`
**Then** a survey send is queued
**And** I receive a 202 Accepted with `{ delivery_id: "..." }`
**And** response time is < 500ms (NFR-P3)

**Given** I include metadata in the request
**When** I send `{ phone: "...", metadata: { order_id: "123", customer_name: "Carlos" } }`
**Then** the metadata is stored with the delivery record (FR15)

**Given** the survey is inactive
**When** I try to send it
**Then** I receive a 400 Bad Request with message "Survey is not active"

**Technical Notes:**
- Endpoint: POST `/api/v1/surveys/:surveyId/send`
- Queue: Inserts into `webhook_jobs` for async delivery

---

### Story 3.3b: API Rate Limiting Middleware

As a **System**,
I want to **enforce rate limiting across all API endpoints**,
So that **no single organization can overwhelm the system**.

**Acceptance Criteria:**

**Given** an organization makes API requests
**When** they exceed 100 requests/minute (NFR-S10)
**Then** subsequent requests receive 429 Too Many Requests
**And** the response includes `Retry-After` header

**Given** rate limiting is applied
**When** the minute window resets
**Then** the organization can make requests again

**Technical Notes:**
- Middleware: Applied to all `/api/v1/*` routes
- Storage: In-memory counter per org (reset every 60s)
- Header: `X-RateLimit-Remaining` on all responses

---

### Story 3.4: Survey Delivery via Kapso

As a **System**,
I want to **deliver surveys to customers via Kapso WhatsApp Flows**,
So that **customers receive surveys in their WhatsApp**.

**Acceptance Criteria:**

**Given** a survey send job is picked up by the processor
**When** Kapso API is called
**Then** the survey is delivered as a WhatsApp Flow (FR21)
**And** delivery state updates to "delivered" (FR17)

**Given** the customer's WhatsApp is unreachable
**When** Kapso returns an error
**Then** delivery state updates to "failed"
**And** the job is retried up to 2 times (FR19, NFR-R3)

**Given** max retries are exhausted
**When** the third attempt fails
**Then** delivery state updates to "undeliverable" (FR20)
**And** no further retries are attempted

**Given** WhatsApp Flows are unavailable
**When** Kapso indicates fallback needed
**Then** `KapsoClient` internally sends a text message fallback (FR27)
**And** the processor is unaware of the fallback (abstraction preserved)

**Given** a delivery is tested with retry scenarios
**When** using `KapsoMockClient.mockFailure(n)` where n = failure count
**Then** I can verify: first success, retry success, all-fail-undeliverable

**Technical Notes:**
- Uses: `KapsoClient.sendSurvey()` (AR2)
- Creates: `survey_delivery` table with states
- States: pending, delivered, failed, undeliverable, responded

---

### Story 3.5: Delivery Status Tracking

As a **Business Owner**,
I want to **view the delivery status of my sent surveys**,
So that **I know which customers received the survey**.

**Acceptance Criteria:**

**Given** I am on the survey detail page
**When** I click "Deliveries" tab
**Then** I see a list of all delivery attempts
**And** each shows: phone (masked), status, timestamp, metadata

**Given** a delivery failed
**When** I view its status
**Then** I see "Failed" with the error reason
**And** I see retry count (e.g., "2/2 retries exhausted")

**Given** I have many deliveries
**When** I scroll the list
**Then** deliveries are paginated (20 per page)
**And** I can filter by status

**Technical Notes:**
- Queries: `survey_delivery` with `org_id` filter (AR11)
- Phone masking: Show last 4 digits only
- Pagination: Offset-based with 20 per page

---

### Story 3.6: Kapso Webhook Receiver

As a **System**,
I want to **receive survey responses via Kapso webhooks**,
So that **customer feedback is captured in real-time**.

**Acceptance Criteria:**

**Given** a customer completes a survey
**When** Kapso sends a webhook to `/webhooks/kapso`
**Then** the webhook is processed in < 5 seconds (NFR-I2)
**And** the response is stored with score and feedback

**Given** the webhook payload is received
**When** it contains NPS score (0-10) and optional feedback
**Then** the `survey_response` record is created
**And** delivery status updates to "responded" (FR17)

**Given** the webhook signature is invalid
**When** the request is received
**Then** it is rejected with 401 Unauthorized
**And** no data is stored

**Technical Notes:**
- Endpoint: POST `/webhooks/kapso`
- Creates: `survey_response` table with `org_id` FK
- Validates: Webhook signature from Kapso
- Excludes: Customer PII from logs (NFR-S9)

---

### Story 3.7: Response Storage and Processing

As a **System**,
I want to **process and store responses in real-time**,
So that **analytics are immediately updated**.

**Acceptance Criteria:**

**Given** a response is received
**When** it is stored
**Then** the NPS score is categorized (0-6: Detractor, 7-8: Passive, 9-10: Promoter)
**And** the response is linked to the delivery record

**Given** a response includes metadata
**When** it is stored
**Then** the metadata (order_id, customer_name) is preserved
**And** it's available in the customer context

**Given** a new response is stored
**When** the insert transaction commits
**Then** `org_metrics` is updated in the SAME transaction (not async)
**And** NPS score reflects the new response immediately (NFR-P5)

**Technical Notes:**
- Updates: `org_metrics` table for pre-aggregated NPS (AR6)
- Categorizes: score into promoter/passive/detractor
- Real-time: Same transaction update

---

### Story 3.8: API Documentation

As a **Developer**,
I want to **view API documentation within the dashboard**,
So that **I can understand how to integrate with FlowPulse**.

**Acceptance Criteria:**

**Given** I am on the API settings page
**When** I click "Documentation"
**Then** I see auto-generated API docs (NFR-I6)
**And** docs include endpoints, request/response schemas, and examples

**Given** I view an endpoint
**When** I read the documentation
**Then** I see required headers (Authorization: Bearer {api_key})
**And** I see example curl commands
**And** I see error codes and their meanings (NFR-I5)

**Technical Notes:**
- Uses: oRPC OpenAPI generation (@orpc/openapi)
- Displays: Inline in dashboard, not external link
- Includes: All survey send endpoints

---

### Story 3.9: Onboarding Reminder Emails

As a **System**,
I want to **send reminder emails to users who abandon onboarding for 24 hours**,
So that **we can recover users who got interrupted**.

**Acceptance Criteria:**

**Given** a user signed up but didn't complete onboarding
**When** 24 hours pass without any activity
**Then** a reminder email job is queued via webhook_jobs
**And** the email is sent with a link to resume

**Given** a user already completed onboarding
**When** the job processor runs
**Then** no reminder email is sent

**Given** a reminder was already sent in the last 24 hours
**When** the job runs again
**Then** no duplicate email is sent

**Technical Notes:**
- Uses: `webhook_jobs` queue from Story 3.1
- Creates: `onboarding_email_log` table
- Tracks: FR76 onboarding funnel events

---

### Story 3.10: Manual Survey Send UI

As a **Business Owner**,
I want to **manually enter a phone number and send a survey**,
So that **I can send surveys to individual customers without API integration**.

**Acceptance Criteria:**

**Given** my survey has trigger type "Manual Send"
**When** I click "Send Survey" on the survey page
**Then** I see a modal with a phone number input field
**And** the field validates international phone format

**Given** I enter a valid phone number
**When** I click "Send"
**Then** the survey is queued for delivery
**And** I see "Survey sent to +55...1234" confirmation
**And** the delivery appears in the Deliveries tab

**Given** I enter an invalid phone number
**When** I click "Send"
**Then** I see "Invalid phone number format" error
**And** the survey is not sent

**Technical Notes:**
- Uses: Same `webhook_jobs` queue as API sends
- Validates: E.164 phone format
- Component: Modal with phone input + send button

---

## Epic 4: Analytics Dashboard

### Story 4.1: Dashboard Layout with Bottom Navigation

As a **Business Owner**,
I want to **see a mobile-first dashboard with bottom tab navigation**,
So that **I can quickly access key sections with my thumb**.

**Acceptance Criteria:**

**Given** I am logged in on mobile
**When** I view the dashboard
**Then** I see a bottom navigation bar with 4 tabs max (UX1)
**And** tabs include: Home, Surveys, Responses, Settings
**And** the current tab is highlighted

**Given** I am on desktop
**When** I view the dashboard
**Then** navigation adapts to sidebar or top nav
**And** the bottom nav is hidden

**Given** I tap a navigation tab
**When** the page changes
**Then** the transition is smooth (< 300ms)

**Technical Notes:**
- Component: BottomNav (UX design spec)
- Responsive: Bottom nav on mobile, sidebar on desktop
- Route: `/dashboard`

---

### Story 4.2: NPS Score Hero Metric

As a **Business Owner**,
I want to **see my current NPS score as the dominant hero metric**,
So that **I can understand my customer sentiment in 3 seconds**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** the page loads
**Then** I see the NPSScoreRing as the hero metric (UX2)
**And** the score is displayed in large text (60px - hero typography)
**And** the ring color reflects the score threshold

**Given** my NPS score is 72
**When** I view the dashboard
**Then** the ring is green (promoter color)
**And** I see the label "Excellent" below the score

**Given** I have fewer than 10 responses
**When** I view the dashboard
**Then** I see an "Early data" badge on the score
**And** a tooltip explains "Score based on limited responses"

**Technical Notes:**
- Component: NPSScoreRing (SVG-based, UX2)
- Reads from: `org_metrics.current_nps` (AR6)
- Thresholds: 70+ Excellent, 50-69 Great, 30-49 Good, 0-29 Room to grow, <0 Opportunity

---

### Story 4.3: NPS Trend Indicator

As a **Business Owner**,
I want to **see if my NPS is trending up or down from the previous period**,
So that **I know if things are improving or need attention**.

**Acceptance Criteria:**

**Given** I am viewing the NPS hero metric
**When** my NPS increased by 5 points from last period
**Then** I see a green up arrow with "+5"
**And** the trend is displayed next to the score

**Given** my NPS decreased by 3 points
**When** I view the dashboard
**Then** I see a red down arrow with "-3"

**Given** I don't have enough historical data
**When** I view the dashboard
**Then** the trend indicator shows "--" with "Not enough data"

**Technical Notes:**
- Compares: Current period vs previous period (same duration)
- Default period: Last 30 days vs prior 30 days
- Reads from: `org_metrics` table

---

### Story 4.4: NPS Category Breakdown

As a **Business Owner**,
I want to **see the breakdown of Promoters, Passives, and Detractors**,
So that **I understand the composition of my NPS score**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the breakdown section
**Then** I see three categories with counts and percentages
**And** Promoters (9-10) in green, Passives (7-8) in amber, Detractors (0-6) in red

**Given** I have 50 promoters, 30 passives, 20 detractors
**When** I view the breakdown
**Then** I see "50 (50%)", "30 (30%)", "20 (20%)"
**And** a horizontal bar visualizes the distribution

**Given** color blindness accessibility is required
**When** I view the breakdown
**Then** each category has an icon AND text label (triple encoding - UX14)

**Technical Notes:**
- Reads from: `org_metrics` table (pre-aggregated)
- Component: CategoryBreakdown with bar chart
- Accessibility: Color + icon + text (UX14)

---

### Story 4.5: Response Stream

As a **Business Owner**,
I want to **see a stream of recent responses**,
So that **I can read the latest customer feedback**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I scroll below the hero metric
**Then** I see a list of recent responses in chat bubble style (UX3)
**And** the background is WhatsApp beige (#ece5dd)

**Given** a response is displayed
**When** I view the response card
**Then** I see: customer name (or phone), NPS score badge, feedback text, timestamp
**And** the score badge is color-coded

**Given** I tap a response card
**When** the detail view opens
**Then** I see full customer context (links to Epic 5b)

**Technical Notes:**
- Component: ResponseCard with chat bubble styling
- Background: WhatsApp beige (UX3)
- Queries: `survey_response` with `org_id` filter, ordered by created_at DESC

---

### Story 4.6: Response Timeline Chart

As a **Business Owner**,
I want to **see responses over time on a chart**,
So that **I can identify patterns and spikes in feedback**.

**Acceptance Criteria:**

**Given** I am on the analytics section
**When** I view the timeline chart
**Then** I see a line chart showing response count by day
**And** I can see the last 30 days by default

**Given** I want to change the time period
**When** I select "Last 7 days" or "Last 90 days"
**Then** the chart updates to show that period

**Given** I hover over a data point
**When** the tooltip appears
**Then** I see the date and response count

**Technical Notes:**
- Component: Sparkline or line chart (Recharts or similar)
- Period selector: 7d, 30d, 90d
- Data: Aggregated by day from `survey_response`

---

### Story 4.7: Survey Metrics Summary

As a **Business Owner**,
I want to **see total surveys sent and response rate**,
So that **I can measure my feedback collection effectiveness**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the metrics summary
**Then** I see: "1,234 Surveys Sent" and "45% Response Rate"
**And** both metrics show period comparison (vs last period)

**Given** my response rate is 45% vs industry average 9%
**When** I view the metric
**Then** I see "5x better than email" value prop (UX13)

**Technical Notes:**
- Reads from: `org_metrics` table
- Calculation: response_count / delivery_count * 100
- Value prop: Show comparison to email industry average

---

### Story 4.8: Dashboard Data Polling

As a **Business Owner**,
I want to **see my dashboard refresh automatically**,
So that **I always see the latest data without manual refresh**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** 30 seconds pass (AR13)
**Then** the dashboard data refreshes automatically
**And** updates appear without full page reload

**Given** I pull down on mobile
**When** I release
**Then** the dashboard refreshes immediately
**And** I see a brief loading indicator

**Technical Notes:**
- Uses: TanStack Query with `refetchInterval: 30_000` (AR13)
- Pattern: Polling, not WebSockets (MVP decision)
- Loading: Skeleton states during refresh (UX12)

---

### Story 4.9: Graceful Degradation and Caching

As a **Business Owner**,
I want to **see cached data when real-time connection is unavailable**,
So that **I can still view my dashboard during network issues**.

**Acceptance Criteria:**

**Given** the API is unreachable
**When** I view the dashboard
**Then** I see the last cached data
**And** a "Last updated: 5 minutes ago" timestamp is visible (FR35)
**And** an "Offline" indicator appears

**Given** the connection is restored
**When** the next poll succeeds
**Then** the cached data is replaced with fresh data
**And** the "Offline" indicator disappears

**Given** I have never loaded the dashboard
**When** the API is unreachable on first load
**Then** I see a friendly error message with retry button

**Technical Notes:**
- Uses: TanStack Query stale-while-revalidate
- Stores: Last successful response in query cache
- Shows: "Last updated" timestamp from cache

---

### Story 4.10: First NPS Reveal Ceremony

As a **Business Owner**,
I want to **experience a special reveal when I see my NPS for the first time**,
So that **the moment feels significant and memorable**.

**Acceptance Criteria:**

**Given** I am a first-time user with my first response
**When** I view the dashboard
**Then** there is a 500ms pause before the score appears (UX20)
**And** the score counts up from 0 to the actual value
**And** the ring fills with color as the count completes

**Given** I have seen my NPS before
**When** I view the dashboard
**Then** the score appears immediately without ceremony

**Given** the user prefers reduced motion
**When** the reveal would occur
**Then** the score appears instantly without animation (UX16)

**Technical Notes:**
- Tracks: `user.has_seen_first_nps` flag
- Animation: Count-up (800ms), ring fill (500ms)
- Respects: `prefers-reduced-motion` media query

---

## Epic 5a: Detractor Alerts

### Story 5a.1: Detractor Detection on Response Receipt

As a **System**,
I want to **detect detractor responses (NPS ≤ 6) immediately when received**,
So that **Business Owners can be alerted to unhappy customers in real-time**.

**Acceptance Criteria:**

**Given** a survey response is received via webhook
**When** the NPS score is 6 or below
**Then** the response is flagged as "detractor"
**And** a detractor alert job is queued within 1 second

**Given** a survey response with score 7 or above
**When** it is processed
**Then** no detractor alert is created

**Given** the org has a custom threshold configured (e.g., ≤5)
**When** a response with score 6 is received
**Then** it does NOT trigger an alert (respects custom threshold - FR39)

**Technical Notes:**
- Extends: Story 3.7 (Response Storage and Processing)
- Queries: `organization.alert_threshold` (default: 6)
- Creates: `detractor_alert` record with status "pending"
- Queue: Alert delivery job in `webhook_jobs`

---

### Story 5a.2: WhatsApp Alert Delivery to Business Owner

As a **Business Owner**,
I want to **receive a WhatsApp message when an unhappy customer responds**,
So that **I can reach out immediately and resolve their concern**.

**Acceptance Criteria:**

**Given** a detractor alert is queued
**When** the job processor picks it up
**Then** a WhatsApp message is sent to the organization owner's number
**And** delivery completes within 60 seconds of response receipt (NFR-P4)

**Given** the alert is sent
**When** I receive it on WhatsApp
**Then** I see customer name, score, and feedback text (FR38)
**And** the message uses heroic framing: "Customer needs you" (UX19)

**Given** the WhatsApp delivery fails
**When** retry attempts are exhausted
**Then** the alert is marked as "failed"
**And** it remains visible in the dashboard (fallback)

**Technical Notes:**
- Uses: `KapsoClient.sendMessage()` (AR2)
- Message template: "🚨 {customer_name} needs you! Score: {score}/10. '{feedback_preview}...'"
- Success rate target: ≥99% (NFR-R5)
- Creates: `detractor_alert.whatsapp_sent_at` timestamp

---

### Story 5a.3: Alert Threshold Configuration

As a **Business Owner**,
I want to **configure the NPS threshold that triggers detractor alerts**,
So that **I can adjust sensitivity based on my standards**.

**Acceptance Criteria:**

**Given** I am on the Settings > Alerts page
**When** I view the alert threshold setting
**Then** I see a slider or dropdown with options 0-6
**And** the default value is 6 (standard NPS detractor definition)

**Given** I change the threshold to 5
**When** I save the setting
**Then** only scores ≤5 will trigger alerts going forward
**And** existing pending alerts are not affected

**Given** I set the threshold to 0
**When** a customer gives score 0
**Then** an alert is triggered
**But** scores 1-6 do not trigger alerts

**Technical Notes:**
- Creates: `organization.alert_threshold` column (default: 6)
- Range: 0-6 (NPS detractor range)
- UI: Slider with value display

---

### Story 5a.4: Alert Banner on Dashboard

As a **Business Owner**,
I want to **see an urgent alert banner when detractors need attention**,
So that **I notice unhappy customers immediately upon login**.

**Acceptance Criteria:**

**Given** I have unresolved detractor alerts
**When** I view the dashboard
**Then** I see an alert banner at the top with count (UX11)
**And** the visual hierarchy inverts (alert becomes dominant)
**And** I see "2 customers need you" (heroic framing - UX19)

**Given** I click the alert banner
**When** the action triggers
**Then** I am taken to the Alerts page with filters applied

**Given** I have no pending alerts
**When** I view the dashboard
**Then** no alert banner is shown
**And** the NPS hero metric is the dominant element

**Technical Notes:**
- Component: AlertBanner (UX11) with visual hierarchy inversion
- Queries: `detractor_alert` where status = 'pending' AND org_id = context.org
- Copy: Heroic framing (UX19)

---

### Story 5a.5: Active Alerts Dashboard

As a **Business Owner**,
I want to **view all active alerts requiring my attention**,
So that **I can prioritize which customers to contact first**.

**Acceptance Criteria:**

**Given** I navigate to the Alerts page
**When** the page loads
**Then** I see a list of pending detractor alerts
**And** alerts are sorted by urgency (oldest first)

**Given** I view an alert card
**When** I look at the details
**Then** I see: customer name, phone (masked), score, feedback, time since response
**And** I see a "Contact" action button

**Given** I have both pending and resolved alerts
**When** I use the filter
**Then** I can view "Pending", "Contacted", or "All" alerts

**Technical Notes:**
- Route: `/alerts`
- Component: AlertCard with customer summary
- Filters: status (pending, contacted, all)
- Sorting: created_at ASC (oldest first for urgency)

---

### Story 5a.6: Mark Alert as Contacted

As a **Business Owner**,
I want to **mark an alert as "Contacted" when I reach out to the customer**,
So that **I can track which detractors I've addressed**.

**Acceptance Criteria:**

**Given** I am viewing an active alert
**When** I click "Mark as Contacted"
**Then** the alert status changes to "contacted"
**And** a timestamp is recorded
**And** the alert moves to the resolved section

**Given** I mark an alert as contacted
**When** I view the alert later
**Then** I see "Contacted at {timestamp}"
**And** the alert is no longer counted in the pending count

**Technical Notes:**
- Updates: `detractor_alert.status` to 'contacted'
- Updates: `detractor_alert.contacted_at` timestamp
- Refreshes: Alert count in header/banner

---

### Story 5a.7: Escalation Reminder After 24 Hours

As a **System**,
I want to **send an escalation reminder if a detractor alert is not contacted within 24 hours**,
So that **unhappy customers don't go unaddressed**.

**Acceptance Criteria:**

**Given** a detractor alert has been pending for 24 hours
**When** the escalation job runs
**Then** a follow-up WhatsApp message is sent to the owner (FR40)
**And** the message says "Reminder: {customer_name} still needs your attention"

**Given** the alert was already marked as contacted
**When** 24 hours pass
**Then** no escalation reminder is sent

**Given** an escalation was already sent
**When** another 24 hours pass
**Then** no additional escalations are sent (max 1 escalation per alert)

**Technical Notes:**
- Uses: `webhook_jobs` queue with 24h scheduled_at
- Creates: `detractor_alert.escalation_sent_at` timestamp
- Max escalations: 1 per alert

---

## Epic 5b: Customer Response & Crisis Resolution

### Story 5b.1: Customer Context Card

As a **Business Owner**,
I want to **view a customer context card for any response**,
So that **I understand who the customer is before reaching out**.

**Acceptance Criteria:**

**Given** I tap on a response in the response stream
**When** the detail view opens
**Then** I see a Customer Context Card (UX8)
**And** it displays customer name and phone number (FR42, FR43)

**Given** the response includes metadata
**When** I view the context card
**Then** I see order information (order_id, date, items) if provided (FR44)

**Given** this customer has responded before
**When** I view the context card
**Then** I see response history (previous scores, dates) (FR45)
**And** I can see their "sentiment journey"

**Technical Notes:**
- Component: CustomerContextCard (UX8)
- Queries: `survey_response` with `phone` match + `org_id` filter
- Phone: Masked display, full number on tap

---

### Story 5b.2: Customer Lifetime Value Display

As a **Business Owner**,
I want to **see customer lifetime value when viewing a response**,
So that **I can prioritize high-value customers**.

**Acceptance Criteria:**

**Given** the customer has LTV data from metadata
**When** I view the context card
**Then** I see "Lifetime Value: $1,234" (FR46)

**Given** the customer has no LTV data
**When** I view the context card
**Then** the LTV section is hidden (not "N/A")

**Given** the customer is a repeat responder with high LTV
**When** I view their detractor alert
**Then** I see a "High Value" badge for prioritization

**Technical Notes:**
- Reads: LTV from response metadata (`ltv` or `customer_value`)
- Display: Currency formatted based on org locale
- Optional: Shows only when data exists

---

### Story 5b.3: Quick Response Templates

As a **Business Owner**,
I want to **send quick responses using predefined templates**,
So that **I can respond to customers efficiently with consistent messaging**.

**Acceptance Criteria:**

**Given** I am viewing a detractor response
**When** I click "Quick Response"
**Then** I see a menu of predefined templates (UX9)
**And** templates include: Damaged Order, Late Delivery, Quality Issue, Service Complaint

**Given** I select "Late Delivery" template
**When** the template loads
**Then** the message is pre-filled with appropriate text
**And** placeholders like {customer_name} are auto-replaced

**Given** I want to send the template as-is
**When** I click "Send"
**Then** the message is sent via WhatsApp
**And** the alert is marked as contacted (FR48)

**Technical Notes:**
- Creates: `response_template` table with org-level defaults
- Component: QuickResponseMenu (UX9)
- Uses: `KapsoClient.sendMessage()` for delivery

---

### Story 5b.4: Customize Quick Response Before Sending

As a **Business Owner**,
I want to **customize a quick response before sending**,
So that **I can personalize the message for the specific situation**.

**Acceptance Criteria:**

**Given** I selected a template
**When** I want to modify it
**Then** I can edit the message text in a textarea (FR49)
**And** I see a character count

**Given** I customize the message
**When** I click "Send"
**Then** the customized version is sent (not the template)
**And** the alert is marked as contacted

**Given** I want to save my customization as a new template
**When** I click "Save as Template"
**Then** a new template is created for my organization

**Technical Notes:**
- Modal: Edit textarea with send/cancel buttons
- Stores: Sent message in `customer_interaction` table
- Optional: Save custom template functionality

---

### Story 5b.5: Trigger Follow-up Survey

As a **Business Owner**,
I want to **trigger a follow-up survey to a customer I've addressed**,
So that **I can measure if my response resolved their concern**.

**Acceptance Criteria:**

**Given** I am viewing a customer I contacted
**When** I click "Send Follow-up Survey"
**Then** a follow-up survey is queued for delivery (FR50)
**And** I see "Follow-up scheduled" confirmation

**Given** a follow-up survey is sent
**When** the customer responds
**Then** the response is linked to the original detractor alert
**And** it can trigger "Crisis Averted" detection

**Given** I already sent a follow-up in the last 7 days
**When** I try to send another
**Then** I see a warning "Follow-up already sent on {date}"
**And** I can still override if needed

**Technical Notes:**
- Creates: `survey_delivery` with `followup_for_alert_id` FK
- Cooldown: 7 days default between follow-ups to same customer
- Queue: Uses `webhook_jobs` like regular sends

---

### Story 5b.6: Crisis Averted Detection

As a **System**,
I want to **detect when a detractor becomes a promoter after being contacted**,
So that **Business Owners can celebrate successful recovery**.

**Acceptance Criteria:**

**Given** a customer was a detractor (score ≤6)
**When** they respond to a follow-up with score ≥9
**Then** the system flags this as "Crisis Averted" (FR51)
**And** the detractor alert is updated with recovery status

**Given** a crisis is averted
**When** the Business Owner views the dashboard
**Then** they see a celebration notification
**And** the response card shows a "Crisis Averted" badge

**Given** the customer improves to 7-8 (passive)
**When** the follow-up is processed
**Then** it is NOT marked as "Crisis Averted" (only 9-10 counts)

**Technical Notes:**
- Compares: Original score vs follow-up score
- Threshold: Requires score ≥9 (promoter) for crisis averted
- Updates: `detractor_alert.crisis_averted = true`

---

### Story 5b.7: Celebration Card Display

As a **Business Owner**,
I want to **see a celebration card when I turn a detractor into a promoter**,
So that **my successful recovery effort is recognized**.

**Acceptance Criteria:**

**Given** a "Crisis Averted" is detected
**When** I view the dashboard
**Then** I see a CelebrationCard modal/banner (FR52, UX10)
**And** it shows the customer name, before score, after score

**Given** the celebration card is displayed
**When** I view it
**Then** I see celebratory visuals (confetti, trophy, success messaging)
**And** the heroic framing says "You turned Carlos around!" (UX19)

**Given** I dismiss the celebration
**When** I return to dashboard
**Then** the celebration is not shown again
**And** I can find it in "Wins" history

**Technical Notes:**
- Component: CelebrationCard (UX10)
- Animation: Confetti (respects reduced motion)
- Tracks: `user.seen_celebration_ids` for one-time display

---

### Story 5b.8: Share Crisis Averted Card

As a **Business Owner**,
I want to **share my "Crisis Averted" success as an image**,
So that **I can celebrate with my team or on social media**.

**Acceptance Criteria:**

**Given** I am viewing a Crisis Averted celebration
**When** I click "Share"
**Then** a shareable image is generated (1200x630px) (FR53, UX10)
**And** I can download it or share to social platforms

**Given** the image is generated
**When** I view it
**Then** it includes: customer first name, score journey (6→10), company branding
**And** NO sensitive data (phone, full name, order details)

**Given** I want to share on LinkedIn/Twitter
**When** I use native share
**Then** the image is properly formatted for each platform

**Technical Notes:**
- Size: 1200x630px (social media optimal)
- Generation: Canvas/SVG export or server-side
- Privacy: Only first name and scores, no PII
- Component: ShareableCard with download/share buttons

---

## Epic 6: Billing & Subscription Management

### Story 6.1: Current Usage Display

As a **Business Owner**,
I want to **view how many surveys I've sent this billing period**,
So that **I can track my usage against my plan limits**.

**Acceptance Criteria:**

**Given** I am on the Billing page
**When** the page loads
**Then** I see "1,234 of 2,500 surveys used this month" (FR54, FR55)
**And** a visual progress bar shows usage percentage

**Given** I am on the dashboard
**When** I view the sidebar/header
**Then** I see a compact usage indicator
**And** clicking it navigates to the full Billing page

**Given** it's the start of a new billing period
**When** usage resets
**Then** the counter shows "0 of 2,500 surveys used"
**And** the reset date is displayed

**Technical Notes:**
- Reads: `org_usage` table (AR7)
- Tracks: `surveys_sent_this_period`, `period_start_date`
- Component: UsageProgressBar with percentage fill

---

### Story 6.2: Progressive Usage Warnings

As a **System**,
I want to **display progressive warnings as usage approaches the limit**,
So that **Business Owners can upgrade before hitting their cap**.

**Acceptance Criteria:**

**Given** usage reaches 75% of plan limit
**When** I view the dashboard
**Then** I see a yellow "Approaching limit" banner (FR56)
**And** the banner links to upgrade options

**Given** usage reaches 90% of plan limit
**When** I view the dashboard
**Then** I see an orange "Almost at limit" warning
**And** remaining count is prominently displayed

**Given** usage reaches 100% of plan limit
**When** I try to send a survey
**Then** the send is blocked (FR57)
**And** I see "Upgrade to continue sending surveys"

**Technical Notes:**
- Thresholds: 75%, 90%, 100%
- Colors: Yellow (warning), Orange (urgent), Red (blocked)
- Banner: Persists until dismissed or resolved

---

### Story 6.3: Plan Limit Enforcement

As a **System**,
I want to **block new survey sends when the plan limit is reached**,
So that **usage is enforced according to subscription terms**.

**Acceptance Criteria:**

**Given** my organization has reached its survey limit
**When** I try to send a survey via API
**Then** I receive a 402 Payment Required response (FR57)
**And** the error message says "Plan limit reached. Upgrade to continue."

**Given** my organization has reached its survey limit
**When** I try to send via manual UI
**Then** the "Send" button is disabled
**And** I see "Upgrade to unlock" messaging

**Given** I upgrade my plan
**When** the upgrade is processed
**Then** the block is immediately lifted
**And** I can send surveys again

**Technical Notes:**
- Check: `org_usage.surveys_sent >= org.plan_limit` before send
- API: Returns 402 with upgrade link
- Real-time: No cache delay on limit enforcement

---

### Story 6.4: Available Plans Display

As a **Business Owner**,
I want to **view available subscription plans with feature comparison**,
So that **I can choose the right plan for my needs**.

**Acceptance Criteria:**

**Given** I navigate to the Plans page
**When** the page loads
**Then** I see all available plans with pricing (FR59)
**And** plans show: name, price, survey limit, features included

**Given** I am on the Starter plan
**When** I view the plans
**Then** my current plan is highlighted with "Current Plan" badge
**And** upgrade options show clear upgrade path

**Given** I compare plans
**When** I view the comparison
**Then** I see a side-by-side feature matrix
**And** key differences are highlighted

**Technical Notes:**
- Plans: Starter ($49/1K surveys), Growth ($99/5K), Scale ($149/15K)
- Static data for MVP (no admin plan management)
- Component: PlanCard with feature list

---

### Story 6.5: Plan Upgrade Flow

As a **Business Owner**,
I want to **upgrade my subscription plan**,
So that **I can access higher limits and more features**.

**Acceptance Criteria:**

**Given** I click "Upgrade" on a higher plan
**When** the upgrade flow starts
**Then** I see a Stripe checkout modal (FR58, NFR-S8)
**And** my email is pre-filled

**Given** I complete the Stripe checkout
**When** payment succeeds
**Then** my plan is upgraded immediately (FR61)
**And** I see "Welcome to Growth!" confirmation
**And** new limits take effect right away

**Given** payment fails
**When** Stripe returns an error
**Then** I see a clear error message
**And** I can retry or use a different card

**Technical Notes:**
- Uses: Stripe Checkout Sessions
- Webhook: Handles `checkout.session.completed`
- Updates: `organization.plan_id`, `org_usage.period_limit`

---

### Story 6.6: Stripe Webhook Processing

As a **System**,
I want to **process Stripe webhooks securely**,
So that **billing events are reliably captured**.

**Acceptance Criteria:**

**Given** Stripe sends a webhook
**When** the signature is verified (NFR-I3)
**Then** the event is processed
**And** relevant tables are updated

**Given** a `checkout.session.completed` event arrives
**When** it's processed
**Then** the organization's plan is upgraded
**And** usage limits are updated

**Given** an `invoice.payment_failed` event arrives
**When** it's processed
**Then** the organization is notified
**And** a grace period begins

**Given** the webhook signature is invalid
**When** the request is received
**Then** it is rejected with 401
**And** no data is modified

**Technical Notes:**
- Endpoint: POST `/webhooks/stripe`
- Signature: Verified using Stripe SDK
- Events: checkout.session.completed, invoice.paid, invoice.payment_failed

---

### Story 6.7: Billing History and Invoices

As a **Business Owner**,
I want to **view my billing history and download invoices**,
So that **I can manage my expenses and accounting**.

**Acceptance Criteria:**

**Given** I navigate to Billing > History
**When** the page loads
**Then** I see a list of past invoices (FR62)
**And** each shows: date, amount, status, plan

**Given** I click on an invoice
**When** the action triggers
**Then** I can download the PDF invoice from Stripe
**And** the invoice opens in a new tab

**Given** I have no billing history (new user)
**When** I view the page
**Then** I see "No invoices yet" with helpful context

**Technical Notes:**
- Uses: Stripe API to fetch invoices
- Storage: Only references in DB, PDFs from Stripe
- Pagination: 10 invoices per page

---

### Story 6.8: Payment Method Management

As a **Business Owner**,
I want to **update my payment method**,
So that **I can ensure uninterrupted service**.

**Acceptance Criteria:**

**Given** I navigate to Billing > Payment Method
**When** the page loads
**Then** I see my current card (last 4 digits, expiry) (FR63)
**And** a "Update" button is visible

**Given** I click "Update Payment Method"
**When** the flow starts
**Then** I see a Stripe payment element
**And** I can enter a new card

**Given** I submit a new card
**When** validation passes
**Then** the new card becomes the default
**And** I see "Payment method updated" confirmation

**Technical Notes:**
- Uses: Stripe Customer Portal or SetupIntent
- Stores: Stripe customer ID in organization table
- Displays: Last 4 digits only (not full card)

---

### Story 6.9: Plan Downgrade Handling

As a **Business Owner**,
I want to **downgrade my plan at period end**,
So that **I can reduce costs while honoring my current period**.

**Acceptance Criteria:**

**Given** I am on a higher plan
**When** I click "Downgrade" on a lower plan
**Then** I see "Downgrade will take effect at period end"
**And** I must confirm the downgrade

**Given** I confirm the downgrade
**When** the action completes
**Then** my current plan continues until period end
**And** the new plan is scheduled for next period

**Given** my usage exceeds the downgrade plan's limit
**When** I try to downgrade
**Then** I see a warning about exceeding limits
**And** I must acknowledge before proceeding

**Technical Notes:**
- Stripe: Uses subscription schedule for future changes
- Validates: Current usage vs target plan limit
- Creates: `organization.pending_plan_change` record

---

## Epic 7: Settings, Configuration & Compliance

### Story 7.1: Organization Profile Management

As a **Business Owner**,
I want to **view and edit my organization profile**,
So that **my business information is accurate across the platform**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Organization
**When** the page loads
**Then** I see my organization name, logo, and contact details (FR70)
**And** I can click "Edit" to modify any field

**Given** I edit the organization name
**When** I save the changes
**Then** the new name appears throughout the app
**And** I see "Profile updated" confirmation

**Given** I upload a new logo
**When** the upload completes
**Then** the logo is displayed in the header/sidebar
**And** old logo is replaced

**Technical Notes:**
- Updates: `organization` table
- Logo: Store in object storage, 200x200px max
- Route: `/settings/organization`

---

### Story 7.2: WhatsApp Connection Details

As a **Business Owner**,
I want to **view my connected WhatsApp number details**,
So that **I can verify the correct number is connected**.

**Acceptance Criteria:**

**Given** I navigate to Settings > WhatsApp
**When** the page loads
**Then** I see my connected WhatsApp number (FR71)
**And** I see connection status (Connected/Disconnected)
**And** I see connection date and last activity

**Given** my WhatsApp is connected
**When** I view the details
**Then** I see the business name from WhatsApp
**And** I see a "Send Test" button to verify connection

**Given** my WhatsApp is disconnected
**When** I view the page
**Then** I see "Not Connected" status
**And** a "Connect WhatsApp" button is prominent

**Technical Notes:**
- Reads: `whatsapp_connection` table
- Shows: Masked phone number, last activity timestamp
- Route: `/settings/whatsapp`

---

### Story 7.3: WhatsApp Reconnection Flow

As a **Business Owner**,
I want to **disconnect and reconnect my WhatsApp number**,
So that **I can change to a different number if needed**.

**Acceptance Criteria:**

**Given** I have a connected WhatsApp
**When** I click "Disconnect"
**Then** I see a confirmation modal (FR72)
**And** the modal warns about service interruption

**Given** I confirm disconnect
**When** the action completes
**Then** the WhatsApp is disconnected
**And** survey sends are paused
**And** I see the "Connect WhatsApp" flow

**Given** I am reconnecting
**When** I scan the new QR code
**Then** the new number is connected
**And** survey sends resume

**Technical Notes:**
- Updates: `whatsapp_connection.status` to 'disconnected'
- Creates: New `whatsapp_connection` record on reconnect
- Reuses: QR Scanner from Story 1.2

---

### Story 7.4: Notification Preferences

As a **Business Owner**,
I want to **configure my notification preferences**,
So that **I receive alerts in my preferred way**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Notifications
**When** the page loads
**Then** I see toggles for different notification types (FR73)
**And** options include: Detractor alerts, Usage warnings, Weekly digest

**Given** I toggle "Detractor alerts via WhatsApp" off
**When** I save preferences
**Then** I no longer receive WhatsApp alerts for detractors
**And** I still see them in the dashboard

**Given** I want email notifications
**When** I enable "Email notifications"
**Then** I receive notifications via email
**And** I can set preferred email address

**Technical Notes:**
- Creates: `notification_preference` table
- Columns: `org_id`, `type`, `channel` (whatsapp, email, dashboard)
- Default: All enabled for new orgs

---

### Story 7.5: GDPR Data Export Request

As a **Business Owner**,
I want to **request an export of all my data**,
So that **I can exercise my GDPR rights**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Privacy
**When** I click "Request Data Export"
**Then** I see a confirmation explaining what will be exported (FR74)
**And** I must confirm my request

**Given** I confirm the export request
**When** the request is submitted
**Then** I see "Export requested - you'll receive an email within 30 days" (NFR-S6)
**And** a job is queued to generate the export

**Given** the export is ready
**When** I receive the email
**Then** I can download a ZIP file with all my data
**And** the download link expires after 7 days

**Technical Notes:**
- Creates: `data_export_request` table
- Queue: Uses `webhook_jobs` for async processing
- Format: JSON + CSV in ZIP file
- SLA: 30 days max (NFR-S6)

---

### Story 7.6: GDPR Account Deletion Request

As a **Business Owner**,
I want to **request deletion of my account and all data**,
So that **I can exercise my right to be forgotten**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Privacy
**When** I click "Delete Account"
**Then** I see a serious warning about permanent deletion (FR75)
**And** I must type "DELETE" to confirm

**Given** I confirm deletion
**When** the request is submitted
**Then** my account is scheduled for deletion in 30 days (NFR-S7)
**And** I can cancel during the grace period

**Given** 30 days pass without cancellation
**When** the deletion job runs
**Then** all my data is permanently deleted
**And** my email is hashed for anti-spam purposes only

**Technical Notes:**
- Creates: `deletion_request` table with `scheduled_at`
- Grace period: 30 days for user to cancel
- Cascade: Deletes org, surveys, responses, alerts, etc.

---

### Story 7.7: Onboarding Funnel Event Tracking

As a **System**,
I want to **track onboarding funnel events**,
So that **we can measure onboarding success and identify drop-offs**.

**Acceptance Criteria:**

**Given** a user performs an onboarding action
**When** the action completes
**Then** a funnel event is logged (FR76)
**And** events include: signup, whatsapp_connect, verification, first_survey, first_send, first_response

**Given** funnel events are tracked
**When** I query the analytics
**Then** I can see conversion rates between steps
**And** I can identify where users drop off (FR78)

**Given** a user completes all steps
**When** they receive their first response
**Then** the "Time to First Response" metric is calculated (FR77)

**Technical Notes:**
- Creates: `onboarding_event` table
- Columns: `org_id`, `event_type`, `created_at`
- Analysis: Internal analytics dashboard (post-MVP) or SQL queries

---

### Story 7.8: Time to First Response Metric

As a **Product Team** (internal),
I want to **calculate Time to First Response for each organization**,
So that **we can measure how quickly users get value**.

**Acceptance Criteria:**

**Given** an organization receives their first survey response
**When** the response is processed
**Then** "Time to First Response" is calculated and stored (FR77)
**And** calculation = first_response_at - signup_at

**Given** an organization has TTFR calculated
**When** I query organization metrics
**Then** I can retrieve their TTFR value
**And** I can aggregate TTFR across all orgs

**Given** the 10-minute target (UX5)
**When** TTFR exceeds 10 minutes
**Then** the organization is flagged for onboarding analysis

**Technical Notes:**
- Stores: `organization.time_to_first_response` (seconds)
- Calculates: On first response receipt
- Target: < 600 seconds (10 minutes)

---

### Story 7.9: Session and Security Settings

As a **Business Owner**,
I want to **view and manage my active sessions**,
So that **I can ensure my account is secure**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Security
**When** the page loads
**Then** I see my active sessions (device, location, last activity)
**And** I can "Sign out" of other sessions

**Given** I want to change my password
**When** I click "Change Password"
**Then** I must enter current password first
**And** I can set a new password meeting security requirements

**Given** I sign out of another session
**When** the action completes
**Then** that session is invalidated immediately
**And** the device must log in again

**Technical Notes:**
- Reads: `session` table from Better Auth
- Location: Derived from IP (rough city/country)
- Password: bcrypt with cost ≥10 (NFR-S5)
