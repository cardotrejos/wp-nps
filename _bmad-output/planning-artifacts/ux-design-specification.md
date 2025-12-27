---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - flowpulse.md
  - docs/component-inventory.md
  - docs/project-overview.md
  - _bmad-output/analysis/brainstorming-session-2025-12-26.md
  - _bmad-output/planning-artifacts/research/market-nps-csat-saas-competitive-landscape-research-2025-12-26.md
---

# UX Design Specification: FlowPulse

**Author:** Cardotrejos
**Date:** 2025-12-26

---

## Project Context

**Product:** FlowPulse - WhatsApp-native customer feedback platform
**Target Users:** SMB e-commerce businesses, especially in LATAM markets
**Pricing:** $49-149/mo SaaS
**Key Differentiator:** WhatsApp-native NPS/CSAT/CES surveys with 5x response rates

---

## Executive Summary

### Project Vision

FlowPulse is a WhatsApp-native customer feedback platform that delivers NPS, CSAT, and CES surveys directly inside WhatsApp conversations. The core value proposition is 5x higher response rates than email surveys, achieved by meeting customers where they already are.

**Target Market:** SMB e-commerce businesses, especially in LATAM/WhatsApp-dominant markets
**Price Point:** $49-149/mo (underserved SMB segment)
**Competitive Position:** WhatsApp-ONLY, not "also WhatsApp" - own the channel completely

### Target Users

**Primary Persona: Derek (E-commerce Owner)**
- 400+ orders/month via WhatsApp Business catalog
- LATAM-based, WhatsApp-native for transactions
- Core pain: Low-information returns and silent dissatisfaction
- Quote: "I burned 15,000 pesos changing my recipe based on a GUESS"
- Tech comfort: Moderate - needs simple setup, checks phone constantly

**Secondary Personas:**
- Maria (Restaurant): Multi-location, needs real-time feedback before Yelp reviews
- Priya (Fitness): Subscription business, needs pattern detection for churn prevention

### Key Design Challenges

1. **10-Minute Setup** - SMB owners have limited time; onboarding must deliver value fast
2. **WhatsApp-First Mental Model** - Alerts and notifications should go TO WhatsApp, not email
3. **Mobile-First Dashboard** - Derek checks NPS while managing orders on his phone
4. **Multi-Tenant Complexity** - Org → members → connections → surveys → responses hierarchy
5. **Power vs Simplicity** - Templates for quick start, builder for customization

### Design Opportunities

1. **"Crisis Averted" Moments** - Visualize saves (detractor → resolved) as shareable wins
2. **Response Rate Proof** - Show "5x better than email" with real comparative data
3. **WhatsApp Dogfooding** - Send detractor alerts to owner's WhatsApp (use our own product)
4. **Delighted Migration** - Simple, clean UI that feels familiar to Delighted refugees

---

## Core User Experience

### Defining Experience

**Core User Action:** Quick status check - "What's happening with my customers?"

Derek's primary interaction is a 30-second mobile check between orders:
- Current NPS score (up/down indicator)
- Any detractor alerts needing attention
- Response count and trends
- Quick win celebrations

This is NOT a power-user analytics dashboard. It's a pulse check.

### Platform Strategy

| Platform | Priority | Experience |
|----------|----------|------------|
| Mobile Web | Primary | Thumb-friendly, glanceable dashboard |
| Desktop Web | Secondary | Setup, survey builder, deep analytics |
| WhatsApp Notifications | Critical | Detractor alerts sent to owner's WhatsApp |

**Design Decision:** Mobile-first. Every feature must work perfectly on a phone screen.

### Effortless Interactions

- **WhatsApp Connection:** Scan QR code like WhatsApp Web, done in 60 seconds
- **First Survey:** Pick template → test on yourself → send to customers (under 5 min)
- **Daily Check:** Open → see NPS → see alerts → done in 30 seconds
- **Detractor Response:** Tap notification → see customer context → take action

### Critical Success Moments

1. **First Response:** Customer completes survey within 10 minutes of setup
2. **Rate Revelation:** "5x better than email" shown with real comparative data
3. **Crisis Averted:** Detractor alert → quick response → saved customer relationship
4. **Trend Victory:** NPS moving up after implementing feedback

### Experience Principles

1. **Glanceable > Comprehensive** - Answer in 3 seconds, not 30
2. **WhatsApp-Native Thinking** - Everything feels like WhatsApp
3. **Mobile-First, Desktop-Capable** - Design for thumb, enhance for mouse
4. **Show the Win** - Make success visible and shareable
5. **10-Minute Time-to-Value** - First response before interest fades

---

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | Why It Matters | Design Implication |
|---------|----------------|-------------------|
| **In Control** | Replace guessing with knowing | Single-number NPS front and center |
| **Confident** | "I'm making data-driven decisions" | Show proof, celebrate wins |
| **Ahead of Problems** | Catch issues before they become reviews | Alerts framed as opportunities |
| **Validated** | "My instincts were right" | Trend charts showing improvement |

### Emotional Journey Mapping

| Moment | Before FlowPulse | With FlowPulse |
|--------|------------------|----------------|
| Problem awareness | "I'm guessing" → Frustration | "I have data" → Confidence |
| First survey sent | N/A | "That was easy" → Pleasant surprise |
| First response | N/A | "It works!" → Delight |
| Detractor alert | Bad review → Panic | Early warning → Confident action |
| Daily check | Uncertainty, anxiety | Quick reassurance → In control |
| NPS trending up | N/A | Pride, validation → "I'm winning" |

### Micro-Emotions

**Create:**
- Confidence over confusion
- Quick accomplishment over overwhelm
- Pleasant surprise over anxiety
- Trust over skepticism
- Pride in results over guilt about not checking

**Avoid:**
- Analysis paralysis (too many metrics)
- Alert fatigue (too many notifications)
- Setup frustration (too many steps)
- Data anxiety (scary-looking dashboards)

### Emotional Design Principles

1. **Celebrate First** - Every first (response, save, trend up) gets acknowledged
2. **Problems as Opportunities** - Detractor = "chance to save" not "you failed"
3. **Progress Over Perfection** - Show improvement, not just current state
4. **Confidence Through Clarity** - One number, one trend, one action
5. **Trust Through Transparency** - Show where data comes from, never hide bad news

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

| Product | Key Patterns Extracted |
|---------|----------------------|
| **WhatsApp** | Green = success, glanceable lists, bottom nav, notification priority |
| **Shopify Mobile** | Big number hero, trend arrows, activity feed, 2-tap actions |
| **Stripe Dashboard** | Sparklines, period selector, color coding, card layout |
| **Delighted** | Radical simplicity, template-first, clean typography, response stream |

### Transferable UX Patterns

**Navigation:** Bottom tab bar (4 items max), thumb-zone optimization, pull-to-refresh
**Hierarchy:** Hero metric with trend, sparkline charts, card-based modular layout
**Interactions:** Swipe actions, tap-to-expand, long-press quick actions
**Visual:** WhatsApp green for positive, red for alerts, minimal palette

### Anti-Patterns to Avoid

- Dashboard overload → One hero metric
- Required onboarding tours → Progressive disclosure
- Email-first notifications → WhatsApp alerts
- Complex builder upfront → Template-first
- Desktop-first responsive → Mobile-first design

### Design Inspiration Strategy

**Adopt:** WhatsApp green, Shopify hero numbers, Stripe sparklines, Delighted simplicity
**Adapt:** Notification patterns for detractor-only alerts, activity feed for responses
**Avoid:** Multi-level navigation, feature-heavy onboarding, desktop-first layouts

---

## Design System Foundation

### Design System Choice

**shadcn/ui + TailwindCSS 4** (already installed)

Built on Radix UI primitives with full customization control. Perfect balance of speed and flexibility for FlowPulse's mobile-first, SMB-focused dashboard.

### Rationale for Selection

1. **Already in codebase** - No migration needed, team familiar
2. **Mobile-first ready** - Radix primitives work great on touch
3. **Full customization** - Copy-paste model means we own the code
4. **Dark mode built-in** - Already working with next-themes
5. **Accessible by default** - Radix has excellent a11y patterns

### Implementation Approach

- Extend existing shadcn components with FlowPulse-specific variants
- Add custom color tokens for NPS scoring (promoter/passive/detractor)
- Create composite components (NPSScoreCard, ResponseItem, etc.)
- Mobile-first responsive approach for all new components

### Customization Strategy

**Color Palette Extension:**
- Promoter green: `#25D366` (WhatsApp green)
- Passive amber: `#F59E0B`
- Detractor red: `#EF4444`

**New Components Needed:**
- NPSScoreCard (hero metric)
- TrendIndicator (sparkline + arrow)
- ResponseItem (list component)
- AlertBadge (notification indicator)
- BottomNav (mobile navigation)

**Typography:**
- System fonts (already configured)
- Large, bold numbers for metrics
- Comfortable reading size for mobile

---

## Defining Experience

### The Core Interaction

**"Glance at your pulse, act before it's too late."**

FlowPulse's defining experience is the 30-second pulse check: Derek opens the app, sees his NPS score, knows if there's trouble, and takes action - all before his next order comes in.

**Famous examples for comparison:**
- Tinder: "Swipe to match"
- Uber: "Tap to ride"
- **FlowPulse: "Glance and act"**

**What users will say to friends:** "I check my NPS between orders - if someone's unhappy, I know before they leave a bad review."

---

### User Mental Model

**How Derek Currently Solves This:**
- Guesses based on return rates and gut feeling
- Learns about problems 3 days late via bad reviews
- Sends occasional email surveys that get 5-10% response
- Burns money on recipe changes based on assumptions

**Mental Model He Brings:**
- Expects WhatsApp notifications (lives in WhatsApp)
- Expects instant - not a dashboard to log into
- Expects actionable - tell me what to do, not just data
- Expects mobile - checks between fulfilling orders

**Where Confusion Happens:**
- Complex analytics → wants one number
- Email-style thinking → expects WhatsApp-native
- Manual workflows → expects automation

**What Makes Existing Solutions Terrible:**
- Low response rates (email = silence)
- Data arrives too late (review already posted)
- Too complex to check quickly (deep analytics)

---

### Success Criteria

**When users say "this just works":**

| Criteria | Target |
|----------|--------|
| Time to pulse check | < 10 seconds |
| Time to understand status | < 3 seconds (one number, one color) |
| Time from detractor to alert | < 5 minutes |
| Response rate vs email | 5x (proof visible in dashboard) |
| First survey response | < 10 minutes of setup |

**Success Indicators:**
1. **Glanceable** - NPS score visible without scrolling
2. **Actionable** - Detractor alerts go to WhatsApp, not email
3. **Rewarding** - "Crisis averted" moments celebrated
4. **Trustworthy** - Clear source attribution, real numbers

**Users feel smart when:**
- They catch a problem before it becomes a review
- They see NPS trending up after acting on feedback
- They compare their 5x response rate to email industry norms

---

### Novel vs. Established Patterns

**Pattern Evaluation:**

| Aspect | Pattern Type | Notes |
|--------|--------------|-------|
| NPS Score Display | Established | Hero number like Shopify, Stripe |
| WhatsApp Alerts | Novel | Alerts TO WhatsApp (not email) |
| Survey Delivery | Novel | WhatsApp Flows, not email links |
| Response Stream | Established | Activity feed like Delighted |
| Mobile Dashboard | Established | Bottom nav, card layout |

**Novel Elements - Teaching Strategy:**

1. **WhatsApp Alerts to Owner**
   - Metaphor: "Like getting a text from an unhappy customer before they leave"
   - Teaching: First alert includes explanation of why this matters

2. **WhatsApp Survey Delivery**
   - Metaphor: "Surveys that feel like chat, not homework"
   - Teaching: Show comparative response rates immediately

**Established Patterns to Adopt:**
- Hero metric with trend arrow (Shopify)
- Card-based modular dashboard (Stripe)
- Activity feed chronology (Delighted)
- Bottom tab navigation (WhatsApp)

---

### Experience Mechanics

**Core Flow: The 30-Second Pulse Check**

**1. Initiation**
- Trigger: Push notification or scheduled habit
- Entry point: Tap notification → opens to dashboard
- Alternative: App icon → dashboard loads in < 2 seconds

**2. Interaction**
- **See:** Hero NPS score (big number, color-coded)
- **Scan:** Trend arrow (up/down), response count
- **Check:** Alert badges for pending detractors
- **Act:** Tap alert → see customer context → one-tap response options

**3. Feedback**
- Score changes are celebrated (confetti on milestone)
- Trend direction is always visible
- "5x better" comparison shown on first use
- Response count proves the system is working

**4. Completion**
- Green state = "all good, check back later"
- Red state = "X detractors need attention" with clear CTA
- Close app confident, not anxious

**The "Crisis Averted" Moment:**

```
Notification: "⚠️ Detractor alert: Carlos (Order #1247)"
Tap → Customer profile, order history, feedback: "El producto llegó dañado"
One tap → "Enviar mensaje de disculpa + cupón de descuento"
Result → Carlos updated to Promoter next survey
Dashboard → "Crisis Averted" badge + shareable card
```

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->
