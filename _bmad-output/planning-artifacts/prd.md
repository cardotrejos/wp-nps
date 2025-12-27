---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - path: "flowpulse.md"
    type: "vision"
    description: "FlowPulse product vision and business plan"
  - path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    type: "ux"
    description: "Complete UX design specification"
  - path: "_bmad-output/planning-artifacts/research/market-nps-csat-saas-competitive-landscape-research-2025-12-26.md"
    type: "research"
    description: "Competitive landscape analysis"
  - path: "_bmad-output/planning-artifacts/research/technical-shopify-app-store-best-practices-research-2025-12-26.md"
    type: "research"
    description: "Shopify App Store best practices"
  - path: "_bmad-output/analysis/brainstorming-session-2025-12-26.md"
    type: "brainstorming"
    description: "Initial brainstorming session"
  - path: "docs/index.md"
    type: "documentation"
    description: "Project documentation index"
workflowType: 'prd'
lastStep: 11
workflow_completed: true
user_name: 'Cardotrejos'
project_name: 'FlowPulse'
date: '2025-12-26'
---

# Product Requirements Document - FlowPulse

**Author:** Cardotrejos
**Date:** 2025-12-26

---

## Executive Summary

FlowPulse is a WhatsApp-native customer feedback platform that delivers NPS, CSAT, and CES surveys directly inside WhatsApp conversations. By meeting customers where they already are, FlowPulse achieves **5x higher response rates** than traditional email surveys (40-60% vs 5-15%) - giving businesses enough voices to spot patterns and act with confidence.

**The Business Problem:** SMBs struggle to understand customer sentiment before it's too late. Email surveys get ignored, web forms interrupt the experience, and enterprise feedback tools cost $200-500+/mo with lengthy sales cycles. Meanwhile, customers churn without explanation.

**The Opportunity:** FlowPulse targets the e-commerce and SMB feedback market at the perfect moment - Delighted (a major NPS player) is sunsetting by June 2026, leaving thousands of SMB customers seeking alternatives. No truly WhatsApp-native solution exists to capture them.

**The Aha Moment:** Business owners see their first 50 responses arrive within 2 hours of sending - more feedback than they'd typically get from a week of email surveys.

### What Makes This Special

**1. Response Rate Advantage**
5x higher response rates (40-60% vs 5-15% industry benchmarks) means collecting actionable feedback in hours, not weeks. Finally, enough data to make confident decisions.

**2. WhatsApp-Native Experience**
Zero friction = zero drop-off. Customers complete surveys in their existing chat flow - no app switching, no web redirects. Purpose-built for WhatsApp from the ground up.

**3. SMB Accessibility**
Start collecting feedback today, not after a 3-week enterprise sales cycle. Transparent pricing ($49-149/mo), no sales calls required, and a free tier (50 surveys) to feel the difference first.

### Competitive Positioning

**Day-1 Moat:** Deep Kapso integration + first-mover in "WhatsApp NPS" category
**Long-term Moat:** Network effects from aggregated benchmark data (requires scale)

### MVP Focus

**Core Scope:** NPS surveys via WhatsApp with real-time dashboard and Shopify integration
**Success Target:** 100 paying customers achieving 40%+ response rates within 6 months of launch

### Validation Strategy

Response rate claims will be validated through:
1. Beta program with 20 SMBs tracking actual vs. previous tool response rates
2. Time-to-completion analytics (measured from message delivery)
3. Customer interviews comparing FlowPulse to previous feedback tools

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Technical Type** | SaaS B2B Platform |
| **Domain** | Customer Feedback / Survey |
| **Complexity** | Low-Medium |
| **Project Context** | Brownfield - extending existing React + Elysia + oRPC + Drizzle stack |
| **Core Dependency** | Kapso WhatsApp Flows API (flow management, delivery, webhooks) |

**Target Verticals:** E-commerce, SaaS, Hospitality, Healthcare, Restaurants
**Geographic Focus:** LATAM, Europe, Asia (WhatsApp-dominant markets)
**Market Timing:** Delighted sunset (June 2026) creates migration wave

---

## Success Criteria

### User Success

**The "Aha!" Moment by Persona:**

| User Type | "Aha!" Moment | Time to Value |
|-----------|--------------|---------------|
| E-commerce owner | "I just got 3 detractor alerts and saved a churning customer by reaching out" | Within 24 hours |
| SaaS founder | "I can finally see which feature request keeps coming up" | First week |
| Restaurant owner | "My NPS went from unknown to +45 - now I can put that on my website" | First campaign |

**What Makes It "Worth It":**
- **Closed the loop** - Reached out to a detractor and prevented churn
- **Discovered a blind spot** - Found a recurring complaint they didn't know existed
- **Saved time** - "I used to call 50 customers/week, now I don't have to"
- **Got praise** - Shared a promoter quote on social media or in a team meeting
- **Made a decision** - Used data to justify a business change

**Observable Success Signals:**
- User exports their first report (sharing data)
- User sets up their first alert threshold (investing in monitoring)
- User integrates with Slack/CRM (embedding into workflow)
- User sends a second campaign (retention indicator)
- User upgrades plan (strongest signal)
- User marks a detractor as "contacted" (closed-loop tracking)

**30-Day Outcomes:**

| Outcome | Metric | Target |
|---------|--------|--------|
| Know their NPS score | Has calculated baseline NPS | 100% of active users |
| Trend awareness | Can compare this month vs last | Has 2+ data points |
| Identified top issue | Keywords extracted from open responses | At least 1 theme identified |
| Closed-loop action | Marked at least 1 detractor as "contacted" | 30%+ of users |

### Business Success

**Revenue Milestones:**

| Timeline | Customers | Avg MRR | Total MRR | ARR |
|----------|-----------|---------|-----------|-----|
| Month 6 | 50 | $80 | $4,000 | $48K |
| Month 12 | 200 | $100 | $20,000 | $240K |
| Month 18 | 500 | $110 | $55,000 | $660K |
| Month 24 | 800 | $120 | $96,000 | $1.15M |

**Unit Economics Targets:**

| Metric | Target | Notes |
|--------|--------|-------|
| CAC | $150 | Content marketing focused |
| LTV | $1,200 | 12-month average retention |
| LTV/CAC | 8:1 | Healthy ratio |
| Gross Margin | 80% | Low infrastructure costs |
| Payback Period | 2 months | Quick payback |
| Net Revenue Retention | 110% | Expansion from upgrades |

**Conversion & Retention Metrics:**

| Metric | Target | Rationale |
|--------|--------|-----------|
| Trial to Paid Conversion | > 25% | Validates pricing and value prop |
| Time to Paid Conversion | < 14 days | Aligns with trial length |
| Monthly Active Orgs | 80%+ of paying customers | Health indicator |
| Feature Adoption | 3+ features used/month | Stickiness |
| Referral Rate | > 10% of promoters refer | Eating our own dog food |

**Strategic Tracking:**

| Segment | Why Track | Target |
|---------|-----------|--------|
| Delighted Migrants | Key opportunity window | 20% of Year 1 customers |
| Shopify App Installs | Distribution channel | 50+ installs/month by Month 6 |

**Launch Target:** MVP shipped by Q2 2025 to capture Delighted migration wave (sunset June 2026)

### Technical Success

| Metric | Target | Rationale |
|--------|--------|-----------|
| Survey Delivery Rate | 99.5%+ | WhatsApp messages must reliably reach customers |
| Survey Send Failure Rate | < 0.5% | Acceptable error threshold |
| Response Processing Time | < 5 seconds | Real-time dashboard updates |
| Dashboard Load Time | < 2 seconds | SMB users expect fast UI |
| Kapso API Uptime | Match Kapso SLA | Core dependency |
| Alert Delivery Latency | < 1 minute | Detractor alerts need to be timely |

### Measurable Outcomes

**User Success Metrics (Leading Indicators):**

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| Time to First Response | From signup to first survey response received | < 2 hours | Event: signup_complete → first_response_received |
| Activation Rate | % of signups that complete 1 survey campaign | > 60% | Funnel: signup → survey_sent → response_received |
| Response Rate | Survey completion rate | 40-60% | surveys_completed / surveys_delivered |
| 7-day Retention | Returns to dashboard within 7 days | > 70% | Cohort analysis on dashboard_view events |
| Second Campaign Rate | Sends 2nd survey within 30 days | > 50% | Event: second_survey_sent within 30d of first |

**Survey Quality Metrics:**

| Metric | Definition | Target |
|--------|------------|--------|
| Survey Completion Rate by Question | Drop-off analysis per question | < 20% drop-off per question |
| NPS Score Distribution | Healthy spread vs polarized | Standard deviation < 3 |

---

## Product Scope

### MVP - Minimum Viable Product

Must work for this to be useful:

**Core Survey Flow:**
- NPS surveys via WhatsApp (Kapso Flows)
- Real-time dashboard with NPS score calculation
- Detractor alerts (WhatsApp notification to business owner)
- "Mark as Contacted" action for closed-loop tracking
- Basic response analytics (score breakdown, response timeline)

**User Management:**
- Onboarding flow (guided first survey setup)
- WhatsApp number connection flow (Kapso integration)
- Single WhatsApp number per organization

**Distribution:**
- API trigger for survey sends
- Free tier (50 surveys/month) - *Note: Consider paid-only launch, add free tier post-validation*

**Shopify Integration:** *Moved to Growth - reduces MVP risk from App Store approval timeline*

### Growth Features (Post-MVP)

Makes it competitive:

- **Shopify App Store integration** (post-purchase trigger)
- CSAT + CES survey types
- Custom survey builder (drag-and-drop)
- Zapier/webhook integrations
- Multi-user teams with roles
- AI-powered keyword extraction from open responses
- Multiple WhatsApp numbers
- CSV export and reporting
- Slack integration for alerts

### Vision (Future)

Dream version:

- White-label option for agencies
- Industry benchmark data (compare your NPS to similar businesses)
- Predictive churn scoring (ML-based)
- Multi-language survey templates
- Advanced segmentation and cohort analysis
- API for custom integrations
- Enterprise SSO (SAML, OIDC)

---

## User Journeys

### Journey 1: Derek's First 10 Minutes (Onboarding)

**Persona:** Derek, E-commerce Owner (400+ orders/month, LATAM-based)
**Goal:** First survey response within 10 minutes of signup
**Emotional Arc:** Skeptical → Curious → Surprised → Confident
**MVP Status:** ✅ Required

Derek has just burned 15,000 pesos changing his artisanal soap recipe based on a guess. A friend mentions FlowPulse over lunch: "You're selling via WhatsApp but surveying via email? That's backwards."

That evening, Derek signs up. The welcome screen doesn't ask for his credit card—just his WhatsApp. He scans a QR code (like WhatsApp Web), and within 60 seconds, his business number is connected. No API keys, no developer needed.

FlowPulse offers three templates. Derek picks "Post-Purchase NPS" and taps "Test on myself." His phone buzzes. There it is—a survey inside WhatsApp, right in his business chat. He taps "9" and types "love the new packaging."

Back in the dashboard, his test response appears instantly. "Ready to go live," the screen says. Derek sets the trigger to "after order confirmation" and activates.

Twenty minutes later, while packing orders, his phone buzzes again. A real customer responded. NPS: 8. "Entrega rápida!" Derek grins. He has data now—not guesses.

**Failure Paths:**

| Scenario | User Experience | Recovery |
|----------|-----------------|----------|
| QR scan timeout (60s) | "Having trouble? Try these steps..." | Manual pairing option, retry button |
| Test not received | "Check WhatsApp is open on phone" | Device conflict modal, re-scan option |
| Abandoned mid-setup | Email reminder after 24h | "Continue where you left off" deep link |

**Time Budget:**

| Step | Target |
|------|--------|
| Signup → WhatsApp connected | 60 seconds |
| Template selected + tested | 2 minutes |
| First real response received | < 10 minutes |

**Requirements Revealed:**
- QR-based WhatsApp connection (Kapso integration)
- Survey templates (NPS, CSAT, CES)
- Self-test functionality
- Trigger configuration (post-purchase)
- Real-time response display
- Onboarding recovery flows

---

### Journey 2: Derek's Daily Pulse Check (30 Seconds)

**Persona:** Derek, returning user
**Goal:** Status understood in 3 seconds, action taken in 30
**Emotional Arc:** Curious → Informed → Reassured (or Alert → Action)
**MVP Status:** ✅ Required

It's 7:30 AM. Derek opens FlowPulse while his coffee brews. The dashboard loads in under 2 seconds.

**Good day:** The NPS ring is green. "+47" in big numbers. A small "↑3" shows improvement. No alert banner. Derek sees his latest responses—three 9s and a 10 overnight. He smiles, closes the app, and starts packing orders. Total time: 12 seconds.

**Alert day:** The ring is amber. "+38" with "↓9" in red. A banner reads: "3 detractors need attention." Derek's coffee can wait. He taps the banner.

**Degraded Mode (Kapso Down):**
If Kapso/WhatsApp is unavailable, Derek sees:
- Cached NPS score with "Last updated: 2 hours ago"
- Banner: "WhatsApp connection interrupted. Reconnect →"
- Historical data still accessible

**Key States:**

| State | Visual | Action |
|-------|--------|--------|
| Healthy (50+) | Green ring | Glance and go |
| Attention (30-49) | Amber ring | Review if time |
| Urgent (<30) | Red ring + banner | Act now |
| Offline | Gray ring + timestamp | Reconnect prompt |

**Requirements Revealed:**
- Hero NPS score with trend indicator
- Alert banner for detractors
- Fast dashboard load (<2s)
- Mobile-first, glanceable design
- Color-coded urgency states
- Cached data for offline/degraded mode
- Last updated timestamp

---

### Journey 3: Crisis Averted (Detractor Response)

**Persona:** Derek, responding to unhappy customer
**Goal:** Unhappy customer → intervention → relationship saved
**Emotional Arc:** Alert → Informed → Action → Relief → Pride
**MVP Status:** ✅ Required

Derek's phone buzzes during lunch. A WhatsApp notification from FlowPulse: "🔴 Carlos Martinez scored 3 - 'El producto llegó dañado'"

Derek taps the notification. The customer context card appears:
- **Carlos Martinez** - NPS: 3 (was 8 last month)
- **Order #1247** - Artisanal soap gift set, Dec 24
- **Feedback:** "El producto llegó dañado"
- **History:** 12 orders this year, $847 lifetime value

This is a loyal customer having a bad experience. Derek taps "Quick Response" and selects the "Damaged Product" template: an apology plus free replacement offer. He personalizes it slightly and sends—all without leaving FlowPulse.

Three days later, Carlos receives a follow-up survey. NPS: 9. "Gracias por solucionar tan rápido!"

FlowPulse celebrates: "🎉 Crisis Averted! Carlos went from Detractor (3) to Promoter (9)." A shareable card appears. Derek screenshots it for his monthly team meeting.

**Failure Paths:**

| Scenario | User Experience | Recovery |
|----------|-----------------|----------|
| No response in 24h | Escalation reminder to Derek | "Still needs attention" badge |
| Follow-up still negative | No celebration, remains in "needs attention" | Suggest personal outreach |
| Customer unsubscribed | "Customer opted out of surveys" | Manual follow-up suggested |

**Crisis Averted Criteria:**
- Original NPS ≤ 6 (Detractor)
- Follow-up NPS ≥ 7 (Passive/Promoter)
- Resolution within 7 days

**Requirements Revealed:**
- WhatsApp alerts for detractors (sent to owner's WhatsApp)
- Customer context card (order, history, LTV)
- Quick response templates
- Follow-up survey trigger
- "Crisis Averted" celebration + shareable card
- "Mark as Contacted" action
- Escalation reminders for unresolved detractors

---

### Journey 4: Maria Creates a New Survey

**Persona:** Maria, Restaurant Owner (secondary persona)
**Goal:** New survey live in under 5 minutes
**Emotional Arc:** Intent → Guided → Confident → Launched
**MVP Status:** ⚠️ Partial (Templates only - Builder is Growth)

Maria runs three taco locations. She's been using FlowPulse for NPS but wants to add a post-visit CSAT survey.

She taps the "+" button. A template gallery appears: NPS, CSAT, CES, Custom. She picks "Restaurant CSAT" and sees a preview—star rating, food quality question, open feedback.

Maria tweaks one question ("How was your server?" → "¿Cómo fue tu mesero?") and previews it in WhatsApp format. Looks good. She sets the trigger to "manual send" since she'll have servers share a QR code at checkout.

One test to herself. It works. She taps "Activate."

"🚀 Survey Live!" Her new CSAT survey is ready. She texts the QR code to her location managers.

**Time Budget:**

| Step | Target |
|------|--------|
| Template selection | 30 seconds |
| Customization + preview | 2 minutes |
| Test + activation | 2 minutes |
| **Total** | < 5 minutes |

**MVP vs Growth:**

| Capability | MVP | Growth |
|------------|-----|--------|
| Template gallery | ✅ | ✅ |
| Basic question editing | ✅ | ✅ |
| Drag-and-drop builder | ❌ | ✅ |
| Conditional logic | ❌ | ✅ |
| Custom branding | ❌ | ✅ |

**Requirements Revealed:**
- Survey template gallery
- Basic survey customization (question text editing)
- WhatsApp preview
- Multiple trigger types (API, scheduled, manual/QR)
- Survey activation flow

---

### Journey 5: Customer Completes a Survey (End User)

**Persona:** Ana, Derek's customer
**Goal:** Provide feedback in under 60 seconds
**Emotional Arc:** Neutral → Engaged → Satisfied
**MVP Status:** ✅ Required

Ana just received her order from Derek's shop. Her phone buzzes—a WhatsApp message from the business she just bought from.

"¡Hola Ana! 🌿 Gracias por tu compra. ¿Nos ayudas con una pregunta rápida?"

She taps and sees a native WhatsApp Flow—not a link to a website. A simple 0-10 scale appears. She taps "9."

A follow-up appears: "¡Genial! ¿Qué te gustó más?" Quick options: packaging, quality, speed. She taps "packaging" and adds "Me encantó la presentación."

"¡Gracias Ana! 💚" The survey closes. Total time: 47 seconds. Ana didn't leave WhatsApp, didn't load a browser, didn't create an account.

**Failure Paths:**

| Scenario | User Experience | Recovery |
|----------|-----------------|----------|
| WhatsApp Flows unsupported | Fallback to simple message with link | Graceful degradation |
| Message delivery failed | Retry after 1 hour, max 2 retries | Mark as undeliverable |
| Survey expired | "This survey is no longer active" | Apologetic message |

**Requirements Revealed:**
- Native WhatsApp Flows (Kapso integration)
- Fallback for unsupported devices
- Single-question progression (not overwhelming)
- Pre-built response options + optional text
- Branded thank-you message
- Sub-60-second completion target
- Delivery retry logic

---

### Journey 6: Developer Integrates via API

**Persona:** Luis, Developer at SaaS company
**Goal:** Trigger surveys programmatically after support tickets close
**Emotional Arc:** Skeptical → Testing → Confident → Automated
**MVP Status:** ⚠️ Partial (Basic API for MVP, Webhooks for Growth)

Luis's company uses FlowPulse for CSAT but wants to trigger surveys automatically when Zendesk tickets close.

He finds the API docs in FlowPulse's dashboard. The endpoint is simple:
```
POST /api/v1/surveys/{survey_id}/send
```

He grabs his API key from Settings, writes a quick Zapier integration (Zendesk ticket closed → FlowPulse send survey), and tests it. His phone buzzes—the test survey arrived.

Luis configures metadata: `ticket_id`, `agent_name`, `resolution_time`. Now when responses come in, they're linked to specific tickets. The support team can see CSAT scores per agent.

Two weeks later, the head of support says: "We found out 60% of our low scores come from one category—billing questions. We're fixing our billing FAQ."

**Technical Specifications:**

| Capability | MVP | Growth |
|------------|-----|--------|
| Send survey API | ✅ | ✅ |
| API key auth | ✅ | ✅ |
| Metadata support | ✅ | ✅ |
| Webhooks (survey.completed) | ❌ | ✅ |
| Rate limiting (100/min) | ✅ | ✅ |
| Idempotency keys | ❌ | ✅ |

**Requirements Revealed:**
- REST API with simple authentication
- Metadata support (custom fields)
- API documentation in dashboard
- Rate limiting (100 requests/minute)
- Webhook delivery (Growth)
- Idempotency for duplicate prevention (Growth)

---

### Journey 7: Derek Hits His Limit (Billing/Upgrade)

**Persona:** Derek, approaching plan limit
**Goal:** Smooth upgrade without disruption
**Emotional Arc:** Unaware → Alerted → Evaluating → Upgraded
**MVP Status:** ✅ Required

Derek has been using FlowPulse for three weeks on the Starter plan. He's sent 412 surveys and has 88 left this month.

A subtle banner appears on his dashboard: "88 surveys remaining this month. Upgrade for unlimited."

He ignores it—busy packing orders. A week later, at 15 remaining, the banner turns amber: "Running low! Upgrade now to keep collecting feedback."

At 0 remaining, Derek tries to send a survey. A modal appears: "You've reached your monthly limit. Your customers can still respond to sent surveys, but new sends are paused."

Two options: "Upgrade to Growth ($149/mo)" or "Wait for next month."

Derek reviews Growth features: unlimited surveys, CSAT + CES, team members. He's been wanting to add his customer service rep anyway. He upgrades. The modal closes, his survey sends, and a confetti animation plays: "Welcome to Growth! 🚀"

**Limit States:**

| Remaining | Treatment |
|-----------|-----------|
| 100+ | No banner |
| 50-99 | Subtle "Upgrade" link in footer |
| 11-50 | Amber banner with count |
| 1-10 | Persistent amber banner |
| 0 | Modal blocker, pause sends |

**Requirements Revealed:**
- Usage tracking per organization
- Progressive limit warnings
- Upgrade modal with feature comparison
- Seamless Stripe checkout
- Immediate plan activation
- Celebration on upgrade

---

### Journey 8: Ana Joins Derek's Team (Team Member)

**Persona:** Ana, Derek's customer service rep
**Goal:** View dashboard, respond to detractors, without admin access
**Emotional Arc:** Invited → Onboarded → Productive
**MVP Status:** ❌ Growth Feature

Derek's business is growing. He invites his customer service rep, Ana, to FlowPulse so she can handle detractor responses while he focuses on operations.

Ana receives a WhatsApp message (from FlowPulse): "Derek invited you to join Jabones Artesanales on FlowPulse. Tap to accept."

She taps, creates her account in 30 seconds, and sees the dashboard—but with limited options. She can:
- ✅ View NPS score and responses
- ✅ Respond to detractors
- ✅ Mark customers as "contacted"
- ❌ Create or edit surveys
- ❌ View billing or settings
- ❌ Invite other members

Ana sees a detractor alert and handles it. Derek gets a notification: "Ana responded to Carlos Martinez." He reviews her message in the activity log and approves. Team collaboration, without giving away the keys.

**Role Permissions:**

| Capability | Owner | Member |
|------------|-------|--------|
| View dashboard | ✅ | ✅ |
| View responses | ✅ | ✅ |
| Respond to detractors | ✅ | ✅ |
| Create surveys | ✅ | ❌ |
| Edit settings | ✅ | ❌ |
| Manage billing | ✅ | ❌ |
| Invite members | ✅ | ❌ |

**Requirements Revealed:**
- Team member invitation (WhatsApp-based)
- Role-based access control (Owner, Member)
- Activity log for team actions
- Member action notifications to Owner

---

### Journey Requirements Summary

| Journey | Primary User | MVP Status | Key Capabilities Required |
|---------|--------------|------------|--------------------------|
| Onboarding | Business Owner | ✅ Required | WhatsApp connection, templates, self-test, triggers |
| Daily Pulse | Business Owner | ✅ Required | Dashboard, NPS display, alerts, trend indicators, offline mode |
| Crisis Averted | Business Owner | ✅ Required | WhatsApp alerts, context cards, quick responses, follow-up, escalation |
| Survey Creation | Business Owner | ⚠️ Partial | Template gallery, basic customization, preview, activation |
| Customer Survey | End Customer | ✅ Required | WhatsApp Flows, fallback, quick completion |
| API Integration | Developer | ⚠️ Partial | REST API, auth, metadata (webhooks in Growth) |
| Billing/Upgrade | Business Owner | ✅ Required | Usage tracking, limit warnings, Stripe checkout |
| Team Member | Team Member | ❌ Growth | Invitations, RBAC, activity log |

### Capability Areas Identified

Based on all journeys, FlowPulse requires these capability areas:

1. **Authentication & Onboarding** - Signup, WhatsApp connection, guided setup, recovery flows
2. **Survey Management** - Templates, basic customization, preview, activation
3. **Distribution Engine** - API triggers, scheduled sends, manual/QR, retry logic
4. **Response Collection** - WhatsApp Flows, fallback modes, real-time ingestion
5. **Analytics Dashboard** - NPS calculation, trends, response stream, offline cache
6. **Alert System** - Detractor detection, WhatsApp notifications, escalation reminders
7. **Customer Context** - Order linking, history, LTV display
8. **Response Actions** - Quick templates, mark contacted, team assignment
9. **Celebrations** - Crisis averted cards, upgrade confetti, shareable moments
10. **Billing & Usage** - Plan limits, warnings, Stripe integration, upgrade flow
11. **API & Integrations** - REST API, authentication, metadata, rate limits
12. **Team Management** - Invitations, RBAC, activity log (Growth)

---

## Innovation & Novel Patterns

### Innovation Classification

**Primary Innovation Type:** Workflow Containment (not merely "channel-first")

FlowPulse represents a **workflow containment innovation** — the entire feedback→action→resolution loop occurs within a single ecosystem (WhatsApp). This is fundamentally different from adding WhatsApp as a distribution channel.

| Dimension | Traditional NPS Tools | FlowPulse |
|-----------|----------------------|-----------|
| Architecture | Survey tool + channels | Conversational feedback native to WhatsApp |
| WhatsApp Role | Output channel | Input AND output ecosystem |
| Alert Delivery | Email, Dashboard, Slack | Same channel as customer (WhatsApp) |
| Workflow | Cross-app context switching | Single-ecosystem containment |
| Core Value | Survey distribution | Zero-friction data collection |

### Detected Innovation Areas

**1. Workflow Containment (Primary Innovation)**

The real innovation isn't "WhatsApp-native" — it's that the entire feedback workflow is contained:
- Customer receives survey → in WhatsApp
- Customer responds → in WhatsApp
- Owner receives alert → in WhatsApp
- Owner responds to detractor → in WhatsApp
- Recovery confirmation → in WhatsApp

This creates **workflow gravity** — switching costs compound as the entire sentiment management loop becomes embedded in one ecosystem.

**2. Zero-Friction Data Collection**

The 5x response rate (40-60% vs 5-15%) is the **proof**, not the innovation. The innovation is removing all friction from feedback collection:
- No app switching
- No link clicking
- No form loading
- No account creation
- Native UI (WhatsApp Flows)

**3. Inverse Distribution Pattern**

| Traditional Tools | FlowPulse |
|-------------------|-----------|
| Dashboard-first, mobile-second | Mobile-first (WhatsApp), dashboard-second |
| Pull model (user checks dashboard) | Push model (alerts come to user) |
| Scheduled review cadence | Real-time conversational flow |

**4. Market Timing Confluence**

Three tailwinds converging simultaneously:
- **Delighted sunset** (June 2026) → migration wave
- **WhatsApp Business API maturity** → reliable infrastructure
- **LATAM/Asia e-commerce boom** → WhatsApp-dominant commerce

This confluence creates a 12-18 month window for category ownership.

### Riskiest Assumptions

| Assumption | Evidence Level | Validation Gate | Timeline |
|------------|---------------|-----------------|----------|
| 5x response rates achievable | Industry research (not FlowPulse-specific) | Beta cohort data | Week 2-4 of beta |
| SMBs prefer WhatsApp alerts over email | Logical inference | User interviews | Pre-launch |
| Delighted customers will migrate | Market timing | Outreach campaign | Q1 2025 |
| Workflow gravity creates switching costs | Theoretical | 90-day retention analysis | Month 3 post-launch |
| LATAM/Asia markets prioritize WhatsApp | Regional data | Geographic cohort analysis | Month 2 post-launch |

### Validation Approach

| Innovation Claim | Validation Method | Success Criteria | Timeline Gate |
|-----------------|-------------------|------------------|---------------|
| 5x response rates | Beta program A/B test | 40%+ vs. user's previous tool | Beta Week 4 |
| Zero-friction completion | Time-to-complete tracking | <60 seconds average | Beta Week 2 |
| Faster action on detractors | Time-to-response tracking | <4 hours vs. 24+ hours | Beta Week 4 |
| Workflow containment value | Qualitative interviews | "I never leave WhatsApp" theme | Beta Week 6 |
| Market timing | Delighted customer outreach | 20% conversion rate | Q1 2025 |

### Moat Durability (Competitive Defense)

**Threat:** What stops Zendesk Survey, Typeform, or SurveyMonkey from adding WhatsApp-native in 12 months?

| Defense Layer | Durability | Notes |
|--------------|------------|-------|
| First-mover brand in "WhatsApp NPS" | Medium | 12-18 month head start |
| Workflow containment (ecosystem lock-in) | High | Switching costs compound over time |
| Kapso integration depth | Medium | Others can integrate too |
| SMB price positioning ($49-149) | Medium | Enterprise players unlikely to compete here |
| LATAM/Asia market focus | High | US-centric competitors less motivated |
| Shopify App Store presence | Medium | Distribution advantage compounds |

**Moat Strategy:** Speed to workflow gravity. The deeper customers embed FlowPulse into their daily operations, the higher the switching costs become.

### Risk Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Kapso API dependency | Medium | High | Abstract integration layer, identify backup providers |
| WhatsApp Business policy changes | Low | High | Maintain compliance buffer, monitor Meta guidelines |
| Response rate claim not achieved | Medium | High | Conservative messaging (3-5x range), focus on "better than email" |
| Competitors add WhatsApp-native | High | Medium | First-mover brand, workflow gravity, SMB price lock |
| LATAM/Asia market assumptions wrong | Medium | Medium | Validate with beta cohorts before geographic expansion |
| Delighted migration wave smaller than expected | Medium | Low | Not dependent on single acquisition channel |

---

## SaaS B2B Platform Requirements

### Project-Type Overview

FlowPulse is a B2B SaaS platform serving SMB customers (primarily e-commerce) with a self-service model. The platform follows a straightforward multi-tenant architecture where each organization operates independently with their own WhatsApp connection, surveys, and response data.

**SaaS Characteristics:**
- Self-service signup and onboarding (no sales-assisted)
- Usage-based limits per subscription tier
- Organization-level data isolation
- API access for programmatic survey triggers

### Multi-Tenancy Model

| Aspect | Approach |
|--------|----------|
| **Tenant Boundary** | Organization (one business = one tenant) |
| **Data Isolation** | Logical isolation via organization_id foreign keys |
| **WhatsApp Connection** | One WhatsApp Business number per organization (MVP) |
| **Database Strategy** | Shared database, shared schema, tenant-filtered queries |
| **Scaling Approach** | Vertical initially, horizontal when needed |

**MVP Simplifications:**
- Single WhatsApp number per org (multi-number is Growth)
- Single user per org (team members is Growth)
- No data residency requirements initially

### Permission Model (RBAC)

| Role | Dashboard | Responses | Surveys | Settings | Billing | Team |
|------|-----------|-----------|---------|----------|---------|------|
| **Owner** | ✅ View | ✅ View/Respond | ✅ Create/Edit | ✅ Full | ✅ Full | ✅ Invite |
| **Member** | ✅ View | ✅ View/Respond | ❌ Read-only | ❌ None | ❌ None | ❌ None |

**MVP Scope:** Single-user per org (Owner only)
**Growth Scope:** Team invitations, Member role, activity logging

### Subscription Tiers

| Tier | Price | Surveys/Month | Features |
|------|-------|---------------|----------|
| **Free** | $0 | 50 | NPS only, 1 survey template, basic dashboard |
| **Starter** | $49/mo | 500 | NPS/CSAT/CES, templates, alerts, API access |
| **Growth** | $149/mo | Unlimited | + Shopify, + team members, + Zapier, + custom branding |
| **Enterprise** | Custom | Unlimited | + SSO, + dedicated support, + SLA, + white-label |

**Billing Implementation:**
- Stripe for payment processing
- Usage tracking per organization (surveys sent/month)
- Prorated upgrades, immediate downgrades at renewal
- Grace period for overages (soft limit → hard limit)

### Integration Architecture

| Integration | Type | Phase | Purpose |
|-------------|------|-------|---------|
| **Kapso WhatsApp Flows** | Core Dependency | MVP | Survey delivery, response collection |
| **Stripe** | Billing | MVP | Subscription management, payments |
| **Shopify** | E-commerce | Growth | Post-purchase survey triggers |
| **Zapier** | Automation | Growth | Connect to 5000+ apps |
| **Slack** | Notification | Growth | Team alerts for detractors |
| **Webhooks** | Developer | Growth | Custom integrations |

**API Design Principles:**
- REST API with JSON payloads
- API key authentication (org-scoped)
- Rate limiting: 100 requests/minute
- Idempotency keys for survey sends (Growth)

### Compliance Requirements

| Requirement | Approach | Phase |
|-------------|----------|-------|
| **GDPR Data Subject Rights** | Data export API, deletion on request | MVP |
| **WhatsApp Business Policies** | Opt-in required, template approval | MVP |
| **Data Retention** | Configurable per org, 24-month default | MVP |
| **SOC 2** | Future consideration | Enterprise |
| **HIPAA** | Not targeted initially | Future |

**Data Handling:**
- Survey responses stored with organization isolation
- Customer PII (phone numbers) encrypted at rest
- No selling or sharing of customer data
- Webhook payloads exclude PII by default

### Implementation Considerations

**Technology Alignment (Existing Stack):**
- Frontend: React 19 + Vite (existing)
- Backend: Elysia (existing)
- API Layer: oRPC (existing)
- Database: PostgreSQL + Drizzle (existing)
- Auth: Existing auth package

**New Components Needed:**
- Kapso SDK integration
- Stripe billing integration
- WhatsApp message queue
- Real-time dashboard updates (WebSocket or polling)
- Usage metering system

**Deployment:**
- Single-region initially (cost optimization)
- CDN for static assets
- Managed PostgreSQL (Railway, Supabase, or similar)

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Revenue + Problem-Solving Hybrid

FlowPulse MVP is designed to:
1. **Solve the core problem**: Low survey response rates → WhatsApp-native collection
2. **Generate early revenue**: Paid tiers from day 1 ($49-149/mo)
3. **Validate fastest**: Response rate claims proven or disproven in beta

**Launch Criteria:**
- User can send NPS survey via WhatsApp within 10 minutes of signup
- Real-time dashboard shows NPS score and response stream
- Detractor alerts delivered to owner's WhatsApp
- Stripe billing functional for paid tiers

**Key Launch Decision: Free Tier**

| Option | Recommendation |
|--------|----------------|
| **Paid-only launch** | ✅ Recommended - validates willingness-to-pay |
| **Free tier at launch** | ❌ Delays revenue validation, adds support burden |
| **Add free tier post-validation** | ✅ Can always add later if needed |

*Decision: Launch with Starter ($49) and Growth ($149) only. Add free tier after validating revenue.*

### Resource Requirements

| Resource | MVP | Growth |
|----------|-----|--------|
| **Team Size** | 1 (solo founder) | 1-2 |
| **Timeline** | 12 weeks (6 sprints × 2 weeks) | +8 weeks |
| **Primary Skills** | Full-stack (React, Elysia, Drizzle) | + Mobile, DevOps |
| **External Dependencies** | Kapso API, Stripe | + Shopify, Zapier |

### Sprint Breakdown

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| **Sprint 1** | Foundation | Auth, org model, database schema (org_id everywhere), Kapso abstraction layer, connection POC |
| **Sprint 2** | Core Loop | Survey send with state tracking, response ingestion, basic dashboard (polling) |
| **Sprint 3** | Alerts | Detractor detection, WhatsApp notification to owner, delivery failure handling |
| **Sprint 4** | Billing | Stripe integration, usage metering, plan limits, upgrade flow |
| **Sprint 5** | Polish | Onboarding flow, "Mark as Contacted", error handling, edge cases |
| **Sprint 6** | Launch Prep | Testing, docs, marketing site, launch |

**⚠️ Critical Path Dependency:**
```
Kapso API access → Survey send → Response ingestion → Dashboard → Everything else
```
**Action Required:** Get Kapso API access BEFORE Sprint 1 starts. If Kapso onboarding takes 2 weeks, it blocks everything.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Support | Sprint |
|---------|-------------|--------|
| Derek's First 10 Minutes | ✅ Full | Sprint 1-2, 5 |
| Daily Pulse Check | ✅ Full | Sprint 2-3 |
| Crisis Averted | ✅ Full | Sprint 3 |
| Customer Survey | ✅ Full | Sprint 2 |
| Survey Creation | ⚠️ Templates only | Sprint 2 |
| API Integration | ⚠️ Basic | Sprint 2 |
| Billing/Upgrade | ✅ Full | Sprint 4 |
| Team Member | ❌ Excluded | Growth |

**Must-Have Capabilities (MVP):**

| Capability | Sprint | Rationale |
|------------|--------|-----------|
| WhatsApp QR connection | 1 | Core onboarding - no manual API keys |
| Kapso abstraction layer | 1 | Future-proof, easier testing, enables provider swap |
| Multi-tenant schema (org_id) | 1 | Foundation - every table must have organization_id |
| NPS survey template | 2 | Immediate value delivery |
| Survey send API with state tracking | 2 | Trust - users must see send status |
| Survey Send States (Pending/Delivered/Failed/Responded) | 2 | Transparency on delivery |
| Response ingestion (polling, 30s) | 2 | Simple real-time, upgrade to WebSocket later |
| NPS score calculation | 2 | Hero metric on dashboard |
| Detractor WhatsApp alerts | 3 | Key differentiator - same-channel action |
| Delivery failure handling | 3 | Trust - users must know when sends fail |
| Usage metering | 4 | Enforce plan limits |
| Stripe checkout | 4 | Revenue from day 1 |
| Onboarding funnel tracking | 5 | Measure Time to First Response, identify drop-offs |
| Mark as Contacted | 5 | Closed-loop tracking (moved from core to polish) |

**Technical Decisions (Simplicity-First):**

| Decision | MVP Approach | Growth Upgrade |
|----------|--------------|----------------|
| Real-time updates | Polling (30s intervals) | WebSocket if users complain |
| Kapso integration | Abstraction layer from day 1 | Add TwilioAdapter if needed |
| Multi-tenancy | Shared DB, org_id on every table | No change needed |
| Survey creation | Templates only, no builder | Drag-and-drop in Growth |

**Explicitly Excluded from MVP:**

| Feature | Phase | Rationale |
|---------|-------|-----------|
| Free tier | Post-validation | Launch paid-only to validate revenue |
| CSAT/CES surveys | Growth | NPS is sufficient for launch validation |
| Drag-and-drop builder | Growth | Templates cover 90% of use cases |
| Shopify integration | Growth | Reduces MVP risk (App Store approval) |
| Team members/RBAC | Growth | Single-user is simpler to launch |
| Webhooks | Growth | API triggers cover MVP use cases |
| Zapier/Slack | Growth | Can be added post-validation |
| WebSocket real-time | Growth | Polling is sufficient for MVP |

### Post-MVP Features

**Phase 2: Growth (Months 3-6)**

| Feature | Value | Sprint Estimate |
|---------|-------|-----------------|
| Free tier (50 surveys) | Lower friction after revenue validation | 1 sprint |
| CSAT + CES surveys | Broader feedback types | 2 sprints |
| Shopify App Store | Distribution channel | 2 sprints |
| Team members + RBAC | Multi-user organizations | 2 sprints |
| Custom survey builder | Flexibility for power users | 3 sprints |
| Zapier integration | Connect to 5000+ apps | 1 sprint |
| Slack alerts | Team notification channel | 1 sprint |
| Webhooks (outbound) | Developer integrations | 1 sprint |
| WebSocket real-time | Instant dashboard updates | 1 sprint |

**Phase 3: Expansion (Months 6-12)**

| Feature | Value |
|---------|-------|
| AI keyword extraction | Automated insight discovery |
| Multiple WhatsApp numbers | Scale for larger orgs |
| Industry benchmarks | Comparative analytics |
| Advanced segmentation | Cohort analysis |
| Enterprise SSO | Large org security |
| White-label | Agency reseller channel |
| Multi-language templates | International expansion |

### Scope Decision Rationale

**Why paid-only launch (no free tier)?**
- "Revenue MVP" requires validating willingness-to-pay
- Free users create support burden without revenue
- Can add free tier later if acquisition is blocked
- Avoids "free tier abuse" patterns

**Why polling instead of WebSocket?**
- 30-second delay is imperceptible for this use case
- Dramatically simpler to implement and debug
- Can upgrade to WebSocket in Growth if users request it
- "Boring technology" principle - ship what works

**Why Kapso abstraction layer from day 1?**
- Minimal extra work upfront
- Enables easy testing with mock provider
- De-risks Kapso dependency
- Future-proof for Twilio or other providers

**Why NPS-only for MVP (no CSAT/CES)?**
- NPS is the most recognized metric → easier to explain value prop
- Single survey type simplifies onboarding
- CSAT/CES can be added without breaking changes

**Why no Shopify integration in MVP?**
- Shopify App Store review takes 5-10 business days minimum
- Approval is not guaranteed on first submission
- Creates critical path dependency on external approval
- API triggers provide alternative for e-commerce users

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Kapso API instability | Medium | Critical | Abstraction layer from day 1, monitor SLA |
| Kapso onboarding delay | Medium | High | **Start API access process IMMEDIATELY** |
| WhatsApp Flows compatibility | Low | High | Implement fallback to simple text messages |
| Response rate below 40% | Medium | High | Conservative messaging, focus on "better than email" |
| Delivery failures not handled | N/A | High | **Added to MVP scope (Sprint 3)** |

**Market Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SMBs unwilling to pay $49+ | Medium | Critical | Paid-only launch validates this directly |
| Delighted migration smaller than expected | Medium | Medium | Not sole acquisition channel |
| Competitors add WhatsApp-native | High | Medium | Speed to market, workflow gravity moat |

**Resource Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Solo founder bandwidth | High | Medium | Ruthless MVP scope, no scope creep |
| Timeline slippage | Medium | Medium | Fixed scope, variable timeline |
| Burnout | Medium | High | Ship small, iterate fast, celebrate wins |

**Minimum Viable Scope (If Resource-Constrained):**

If we need to cut further, reduce to "Survival MVP":
1. Drop: Survey creation UI (API-only triggers)
2. Drop: Template customization (use defaults only)
3. Drop: Mark as Contacted (manual tracking)
4. Keep: Dashboard + Alerts + Billing + Delivery States (core value loop)

This "survival MVP" could launch in 4-6 weeks vs 12 weeks.

### Immediate Actions Required

| Action | Owner | Deadline |
|--------|-------|----------|
| **Apply for Kapso API access** | Founder | TODAY |
| **Set up Stripe test account** | Founder | Week 1 |
| **Design database schema with org_id** | Founder | Sprint 1 |
| **Create Kapso abstraction interface** | Founder | Sprint 1 |

---

## Functional Requirements

### Authentication & Onboarding

- FR1: Business Owner can sign up using email and password
- FR2: Business Owner can connect their WhatsApp Business number via QR code scan
- FR3: Business Owner can verify WhatsApp connection with a test message
- FR4: Business Owner can complete guided first survey setup within 10 minutes
- FR5: Business Owner can resume onboarding from where they left off after abandonment
- FR6: System can send onboarding reminder emails after 24-hour abandonment

### Survey Management

- FR7: Business Owner can view available survey templates (NPS, CSAT, CES)
- FR8: Business Owner can select a survey template for use
- FR9: Business Owner can edit survey question text within a template
- FR10: Business Owner can preview how a survey will appear in WhatsApp
- FR11: Business Owner can test a survey by sending it to themselves
- FR12: Business Owner can activate or deactivate a survey
- FR13: Business Owner can set a trigger type for a survey (API, manual)

### Survey Distribution

- FR14: Business Owner can trigger a survey send via API with customer phone number
- FR15: Business Owner can include metadata (order_id, customer_name) with API survey sends
- FR16: System can queue survey sends for delivery via Kapso
- FR17: System can track survey send states (Pending, Delivered, Failed, Responded)
- FR18: Business Owner can view the delivery status of sent surveys
- FR19: System can retry failed survey deliveries up to 2 times
- FR20: System can mark surveys as undeliverable after max retries

### Response Collection

- FR21: End Customer can receive NPS survey as native WhatsApp Flow
- FR22: End Customer can complete survey by tapping a 0-10 rating
- FR23: End Customer can provide optional open-text feedback
- FR24: End Customer can complete survey in under 60 seconds
- FR25: System can receive survey responses via Kapso webhooks
- FR26: System can process and store responses in real-time
- FR27: System can fall back to simple text messages if WhatsApp Flows unavailable

### Analytics Dashboard

- FR28: Business Owner can view current NPS score as hero metric
- FR29: Business Owner can view NPS trend indicator (up/down from previous period)
- FR30: Business Owner can view NPS score breakdown by category (Promoters, Passives, Detractors)
- FR31: Business Owner can view response stream with recent responses
- FR32: Business Owner can view response timeline (responses over time)
- FR33: Business Owner can view total surveys sent and response rate
- FR34: Dashboard can display cached data when real-time connection unavailable
- FR35: Dashboard can show "last updated" timestamp when in degraded mode

### Alert System

- FR36: System can detect detractor responses (NPS ≤ 6) in real-time
- FR37: System can send WhatsApp alert to Business Owner when detractor detected
- FR38: Alert can include customer name, score, and feedback text
- FR39: Business Owner can configure detractor alert threshold
- FR40: System can send escalation reminder if detractor not contacted within 24 hours
- FR41: Business Owner can view all active alerts requiring attention

### Customer Context

- FR42: Business Owner can view customer context card for any response
- FR43: Context card can display customer name and phone number
- FR44: Context card can display order information if metadata provided
- FR45: Context card can display response history for repeat customers
- FR46: Context card can display customer lifetime value if available

### Response Actions

- FR47: Business Owner can mark a detractor as "Contacted"
- FR48: Business Owner can send quick response using predefined templates
- FR49: Business Owner can customize quick response before sending
- FR50: Business Owner can trigger follow-up survey to customer
- FR51: System can detect "Crisis Averted" when detractor becomes promoter
- FR52: System can display celebration card when crisis averted
- FR53: Business Owner can share crisis averted card as image

### Billing & Usage

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

### API Access

- FR64: Developer can generate API key for organization
- FR65: Developer can view API documentation within dashboard
- FR66: Developer can send surveys via REST API endpoint
- FR67: Developer can include custom metadata with API requests
- FR68: System can enforce rate limiting (100 requests/minute)
- FR69: System can return appropriate error codes for failed requests

### Settings & Configuration

- FR70: Business Owner can view and edit organization profile
- FR71: Business Owner can view connected WhatsApp number details
- FR72: Business Owner can disconnect and reconnect WhatsApp number
- FR73: Business Owner can configure notification preferences
- FR74: Business Owner can request data export (GDPR)
- FR75: Business Owner can request account deletion (GDPR)

### Onboarding Analytics (Internal)

- FR76: System can track onboarding funnel events (signup, connect, test, first_send, first_response)
- FR77: System can calculate Time to First Response metric
- FR78: System can identify drop-off points in onboarding funnel

---

## Non-Functional Requirements

### Performance

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-P1 | Dashboard initial load completes in < 2 seconds | MVP | Derek's daily pulse check must be instant |
| NFR-P2 | Dashboard data refresh (polling) completes in < 1 second | MVP | Near-real-time feel without WebSocket complexity |
| NFR-P3 | Survey send API responds in < 500ms | MVP | Developer integrations need fast responses |
| NFR-P4 | Detractor alert delivered to owner within 60 seconds of response receipt by FlowPulse | MVP | Same-channel action requires timely alerts |
| NFR-P5 | NPS score calculation updates within 5 seconds of new response | MVP | Dashboard must feel responsive |
| NFR-P6 | Survey loads in WhatsApp Flow within 2 seconds | MVP | Customer friction must be minimal |

### Security

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-S1 | All data encrypted in transit using TLS 1.2+ | MVP | Protect PII and session data |
| NFR-S2 | Customer phone numbers encrypted at rest using Postgres column encryption or app-level encryption | MVP | GDPR-compliant PII protection |
| NFR-S3 | API keys hashed, never stored in plaintext | MVP | Prevent credential exposure |
| NFR-S4 | Session tokens expire after 24 hours of inactivity | MVP | Limit exposure window |
| NFR-S5 | Password hashing uses bcrypt with cost factor ≥ 10 | MVP | Industry standard password protection |
| NFR-S6 | GDPR data export request fulfilled within 30 days | MVP | Legal compliance |
| NFR-S7 | GDPR data deletion completed within 30 days | MVP | Legal compliance |
| NFR-S8 | Payment processing delegated entirely to Stripe | MVP | PCI-DSS compliance via Stripe |
| NFR-S9 | Webhook payloads exclude customer PII by default | MVP | Protect data in transit to third parties |
| NFR-S10 | API rate limiting enforced at 100 requests/minute per org | MVP | Prevent abuse and DoS |
| NFR-S11 | System architecture supports future data residency requirements without re-architecture | MVP | LATAM/EU expansion readiness |

### Scalability

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-SC1 | System supports 1,000 concurrent organizations | MVP | Growth target: 1000 customers |
| NFR-SC2 | Database queries use indexed lookups on organization_id; query plans reviewed before release | MVP | Actionable performance practice |
| NFR-SC3 | Survey send queue processes 1,000 messages/minute (verified via load test before launch) | MVP | Peak usage scenario |
| NFR-SC4 | Dashboard remains responsive with 10,000 responses per org (virtual scrolling, pagination) | Growth | Power user scenario - not MVP |
| NFR-SC5 | Multi-tenant isolation prevents cross-org data leakage at any scale | MVP | Security at scale |

### Reliability

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-R1 | Survey delivery success rate ≥ 99.5% (measured via Kapso delivery receipts over 30-day rolling window, excluding invalid numbers) | MVP | Core value proposition |
| NFR-R2 | Dashboard availability ≥ 99.9% during business hours (measured monthly, excluding scheduled maintenance) | MVP | Users expect reliable access |
| NFR-R3 | Failed survey sends retry automatically up to 2 times | MVP | Graceful failure handling |
| NFR-R4 | System gracefully degrades when Kapso unavailable (show cached data, queue sends) | MVP | Core resilience - Sprint 5 scope |
| NFR-R5 | Alert delivery succeeds ≥ 99% of the time (measured over 30-day rolling window) | MVP | Critical path for detractor response |
| NFR-R6 | Database backups occur daily with 30-day retention | MVP | Data protection |
| NFR-R7 | Recovery Point Objective (RPO) ≤ 24 hours | MVP | Achieved via daily managed Postgres backups (Railway/Supabase) |
| NFR-R8 | Recovery Time Objective (RTO) ≤ 4 hours | MVP | Achieved via single-click redeploy from source |
| NFR-R9 | System reliability targets assume Kapso maintains ≥ 99.9% availability per their SLA; degraded mode activates when Kapso unavailable | MVP | External dependency acknowledgment |

### Integration

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-I1 | Kapso API integration abstracted behind provider interface | MVP | Future-proof for provider changes |
| NFR-I2 | Kapso webhook processing completes in < 5 seconds | MVP | WhatsApp expects timely acknowledgment |
| NFR-I3 | Stripe webhook signature verified on all payment events | MVP | Prevent payment tampering |
| NFR-I4 | API follows RESTful conventions with JSON payloads | MVP | Developer-friendly integration |
| NFR-I5 | API returns meaningful error codes (4xx, 5xx with messages) | MVP | Debuggable integrations |
| NFR-I6 | API documentation auto-generated from code | MVP | Always-current docs |

### Accessibility & Compatibility

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-A1 | Dashboard meets WCAG 2.1 Level A standards | MVP | Basic accessibility compliance |
| NFR-A2 | All interactive elements keyboard-navigable | MVP | Support non-mouse users |
| NFR-A3 | Color contrast ratios meet minimum 4.5:1 for text | MVP | Readability for vision-impaired |
| NFR-A4 | Form fields have associated labels | MVP | Screen reader compatibility |
| NFR-A5 | Dashboard supports Chrome, Firefox, Safari, Edge (latest 2 versions) | MVP | Browser compatibility targets |
| NFR-A6 | Dashboard is usable on mobile devices (minimum 375px width) | MVP | Mobile checking for owners |

### Operational & Observability

| NFR | Requirement | Phase | Rationale |
|-----|-------------|-------|-----------|
| NFR-O1 | Application logs all errors with stack traces | MVP | Debugging capability |
| NFR-O2 | Health check endpoint available at /health | MVP | Infrastructure monitoring |
| NFR-O3 | Key metrics (response rate, NPS, active orgs) queryable | MVP | Business monitoring |
| NFR-O4 | Deployment achievable with zero downtime | MVP | Continuous delivery |
| NFR-O5 | Environment configuration via environment variables | MVP | 12-factor app compliance |
| NFR-O6 | All NFR metrics (response times, delivery rates, error rates) collected and queryable via monitoring dashboard | MVP | Can't improve what you don't measure |

### NFR Testing Strategy

| NFR Category | Test Frequency | Method |
|--------------|----------------|--------|
| Performance | Every deploy | Automated performance tests (Lighthouse, k6) |
| Security | Weekly + before release | Security scan (npm audit) + manual review |
| Reliability | Continuous | Uptime monitoring (UptimeRobot, Checkly) |
| Scalability | Before launch + quarterly | Load testing (k6, Artillery) |
| Accessibility | Before release | Automated (axe-core) + manual testing |
| Integration | Every deploy | Integration test suite |

<!-- Content will be appended sequentially through PRD workflow steps -->

