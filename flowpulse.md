# FlowPulse - WhatsApp NPS & Feedback Platform

> Standalone SaaS product for collecting NPS scores, customer feedback, and surveys via WhatsApp Flows.

**Last updated**: December 24, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Opportunity](#the-opportunity)
3. [Product Vision](#product-vision)
4. [Core Features](#core-features)
5. [Target Markets](#target-markets)
6. [Business Model](#business-model)
7. [Technical Architecture](#technical-architecture)
8. [Go-to-Market Strategy](#go-to-market-strategy)
9. [Competitive Landscape](#competitive-landscape)
10. [Implementation Checklist](#implementation-checklist)
11. [Resources](#resources)

---

## Executive Summary

**FlowPulse** is a WhatsApp-native customer feedback platform that leverages Kapso's WhatsApp Flows to deliver interactive surveys (NPS, CSAT, CES) directly inside WhatsApp.

**Key Value Proposition:**

- 5x higher response rates than email surveys
- Native WhatsApp experience (no app switching)
- Real-time analytics and sentiment tracking
- Works globally (2+ billion WhatsApp users)

**Business Opportunity:**

- $300K MRR potential by month 36
- SMB-focused pricing ($49-149/mo)
- Strong in LATAM, Europe, Asia, Africa markets

---

## The Opportunity

WhatsApp has **2+ billion active users** worldwide. Current feedback tools (email surveys, web forms) suffer from low engagement:

| Channel            | Avg Response Rate | Time to Respond      |
| ------------------ | ----------------- | -------------------- |
| Email surveys      | 5-15%             | Hours/Days           |
| Web pop-ups        | 2-5%              | Seconds (interrupts) |
| SMS surveys        | 20-30%            | Minutes              |
| **WhatsApp Flows** | **40-60%**        | **Under 1 minute**   |

### Why WhatsApp Flows for NPS/Feedback?

- **Native experience** - No app switching, stays in WhatsApp
- **High engagement** - People check WhatsApp constantly
- **Rich UI** - Ratings, multi-select, open text fields
- **Instant delivery** - Real-time push notifications
- **Global reach** - Dominant in LATAM, Europe, Asia, Africa

### Market Pain Points

1. **Low response rates** - Email surveys get ignored
2. **Fragmented feedback** - Data scattered across channels
3. **Delayed insights** - Takes days to collect enough responses
4. **Poor mobile experience** - Web forms don't work well on phones
5. **No context** - Hard to link feedback to specific transactions

---

## Product Vision

**Product Name**: FlowPulse (Working Name)

**Tagline**: _Instant customer feedback via WhatsApp. 5x higher response rates._

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLOWPULSE                                    │
│            WhatsApp-Native Customer Feedback Platform                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   NPS Surveys    │  │  CSAT Surveys    │  │  Custom Forms    │  │
│  │   0-10 Scale     │  │  1-5 Stars       │  │  Any Questions   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    DASHBOARD                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ NPS Score   │  │ Responses   │  │ Trends      │          │  │
│  │  │    +45      │  │   1,234     │  │   📈 +12%   │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                               │  │
│  │  Real-time analytics • Sentiment analysis • Export to CSV    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    INTEGRATIONS                               │  │
│  │  Zapier • HubSpot • Salesforce • Slack • Webhooks • API      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Pre-Built Survey Templates

#### NPS Survey (Net Promoter Score)

```
┌─────────────────────────────────────┐
│  How likely are you to recommend   │
│  [Company] to a friend or          │
│  colleague?                        │
│                                    │
│  0 1 2 3 4 5 6 7 8 9 10           │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○            │
│  Not at all        Extremely       │
│  likely            likely          │
│                                    │
│                    [Submit →]      │
├────────────────────────────────────┤
│  (If score < 7)                    │
│  What could we improve?            │
│  ┌────────────────────────────┐   │
│  │                            │   │
│  └────────────────────────────┘   │
│                    [Submit]        │
├────────────────────────────────────┤
│  (If score >= 9)                   │
│  What do you love most about us?   │
│  ┌────────────────────────────┐   │
│  │                            │   │
│  └────────────────────────────┘   │
│                    [Submit]        │
└─────────────────────────────────────┘
```

**NPS Scoring:**

- **Promoters (9-10)**: Loyal enthusiasts who will refer others
- **Passives (7-8)**: Satisfied but unenthusiastic customers
- **Detractors (0-6)**: Unhappy customers who can damage brand

**NPS Formula**: `% Promoters - % Detractors = NPS Score (-100 to +100)`

#### CSAT Survey (Customer Satisfaction)

```
┌─────────────────────────────────────┐
│  How satisfied are you with your   │
│  recent experience?                │
│                                    │
│     ⭐⭐⭐⭐⭐                      │
│     (Tap to rate)                  │
│                                    │
│  What aspects stood out?           │
│  ☐ Product quality                 │
│  ☐ Customer service                │
│  ☐ Speed of delivery               │
│  ☐ Value for money                 │
│                                    │
│                    [Submit]        │
└─────────────────────────────────────┘
```

#### CES Survey (Customer Effort Score)

```
┌─────────────────────────────────────┐
│  How easy was it to get your       │
│  issue resolved today?             │
│                                    │
│  ○ Very difficult                  │
│  ○ Difficult                       │
│  ○ Neutral                         │
│  ○ Easy                            │
│  ○ Very easy                       │
│                                    │
│                    [Submit]        │
└─────────────────────────────────────┘
```

#### Post-Purchase Survey

```
┌─────────────────────────────────────┐
│  Thanks for your order! 🎉         │
│                                    │
│  Quick feedback on your            │
│  shopping experience:              │
│                                    │
│  Checkout process:                 │
│  😠 😕 😐 🙂 😍                    │
│                                    │
│  Product selection:                │
│  😠 😕 😐 🙂 😍                    │
│                                    │
│  Would you shop with us again?     │
│  ○ Definitely   ○ Maybe   ○ No     │
│                                    │
│                    [Submit]        │
└─────────────────────────────────────┘
```

#### Employee NPS (eNPS)

```
┌─────────────────────────────────────┐
│  How likely are you to recommend   │
│  [Company] as a place to work?     │
│                                    │
│  0 1 2 3 4 5 6 7 8 9 10           │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○            │
│                                    │
│  What's one thing we could         │
│  improve?                          │
│  ┌────────────────────────────┐   │
│  │                            │   │
│  └────────────────────────────┘   │
│                    [Submit]        │
└─────────────────────────────────────┘
```

---

### 2. Custom Survey Builder

Visual drag-and-drop builder for creating custom flows:

```
QUESTION TYPES:
├── Rating Scale (1-5, 1-10, emojis)
├── Single Choice (radio buttons)
├── Multiple Choice (checkboxes)
├── Open Text (short/long)
├── Date Selection
├── Dropdown
└── Contact Info (name, email, phone)

LOGIC FEATURES:
├── Conditional branching (if score < 7, show follow-up)
├── Skip logic (skip question based on answer)
├── Piping (use previous answers in next questions)
└── Required vs optional questions

CUSTOMIZATION:
├── Branding (logo, colors)
├── Custom thank-you messages
├── Multi-language support
└── Scheduled delivery
```

---

### 3. Distribution Channels

| Trigger            | Description                  | Use Case                                   |
| ------------------ | ---------------------------- | ------------------------------------------ |
| **API Trigger**    | Send survey via API call     | After order completion, ticket closure     |
| **Scheduled**      | Send at specific time/date   | Weekly check-ins, quarterly reviews        |
| **Event-Based**    | Webhook triggers survey      | After Stripe payment, Zendesk ticket close |
| **Manual**         | Upload CSV of numbers        | One-time campaigns                         |
| **Template Reply** | Customer replies to template | Opt-in surveys                             |

#### API Trigger Example

```typescript
// POST /api/v1/surveys/{survey_id}/send
const response = await fetch('https://api.flowpulse.io/v1/surveys/srv_abc123/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+15551234567',
    metadata: {
      customer_id: 'cust_xyz789',
      order_id: 'ord_12345',
      order_total: 149.99
    },
    prefill: {
      customer_name: 'John Smith'
    }
  })
});
```

---

### 4. Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  FlowPulse Dashboard                               [Last 30 days ▼] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ NPS Score    │  │ Responses    │  │ Response     │  │ Avg Time│ │
│  │    +42       │  │   2,847      │  │ Rate: 58%    │  │  47 sec │ │
│  │   ↑ +5 pts   │  │   ↑ 23%      │  │   ↑ 12%      │  │  ↓ 8%   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                      │
│  NPS Distribution                    Response Trend                  │
│  ┌────────────────────────┐         ┌────────────────────────┐     │
│  │ Promoters (9-10): 52%  │         │      ___/\___          │     │
│  │ Passives (7-8):  28%   │         │   __/       \__        │     │
│  │ Detractors (0-6): 20%  │         │ _/              \_     │     │
│  └────────────────────────┘         └────────────────────────┘     │
│                                                                      │
│  Top Keywords (from open responses)                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ fast shipping (45) • friendly staff (38) • easy checkout (32)│  │
│  │ product quality (28) • good price (24) • slow support (12)   │  │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Recent Responses                                    [View All →]    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ +1555... │ NPS: 10 │ "Love the new features!" │ 2 min ago   │   │
│  │ +1444... │ NPS: 6  │ "Shipping was slow"      │ 5 min ago   │   │
│  │ +1333... │ NPS: 9  │ "Great customer service" │ 8 min ago   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Alerts                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚠️  NPS dropped below 40 threshold                          │   │
│  │ 🔴 3 detractor responses in the last hour                    │   │
│  │ ✅ Response rate up 15% this week                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Dashboard Features

- **Real-time updates** - See responses as they come in
- **Trend analysis** - Track NPS/CSAT over time
- **Segmentation** - Filter by customer segment, date, survey type
- **Keyword extraction** - AI-powered topic detection from open responses
- **Alerts** - Get notified when metrics drop below thresholds
- **Export** - Download CSV/Excel for further analysis

---

### 5. Integrations & Webhooks

#### Webhook Payload on Survey Completion

```typescript
{
  "event": "survey.completed",
  "timestamp": "2025-12-24T10:30:00Z",
  "survey": {
    "id": "srv_abc123",
    "name": "Post-Purchase NPS",
    "type": "nps"
  },
  "respondent": {
    "phone": "+15551234567",
    "name": "John Smith",
    "customer_id": "cust_xyz789"
  },
  "responses": {
    "nps_score": 9,
    "follow_up": "Love the fast shipping!",
    "categories": ["shipping", "product_quality"]
  },
  "metadata": {
    "order_id": "ord_12345",
    "source": "post_purchase"
  }
}
```

#### Native Integrations

| Category          | Platforms                                      |
| ----------------- | ---------------------------------------------- |
| **CRM**           | HubSpot, Salesforce, Pipedrive, Zoho           |
| **Support**       | Zendesk, Freshdesk, Intercom, Help Scout       |
| **E-commerce**    | Shopify, WooCommerce, BigCommerce, Magento     |
| **Analytics**     | Segment, Amplitude, Mixpanel, Google Analytics |
| **Automation**    | Zapier, Make (Integromat), n8n, Pabbly         |
| **Communication** | Slack, Microsoft Teams, Discord                |
| **Data**          | Airtable, Google Sheets, Notion                |

#### Zapier Integration Examples

```
TRIGGERS:
├── New survey response received
├── Detractor response (NPS 0-6)
├── Promoter response (NPS 9-10)
└── Survey completed with specific answer

ACTIONS:
├── Send FlowPulse survey
├── Add contact to survey list
└── Update survey settings
```

---

## Target Markets

### Primary Markets

| Segment                | Pain Point                 | Value Proposition                         | TAM   |
| ---------------------- | -------------------------- | ----------------------------------------- | ----- |
| **E-commerce**         | Low post-purchase feedback | 5x response rates, instant NPS            | $2B   |
| **SaaS**               | Churn prediction           | Real-time satisfaction tracking           | $1.5B |
| **Hospitality**        | Guest experience           | In-stay feedback, quick issue resolution  | $800M |
| **Healthcare**         | Patient satisfaction       | HIPAA-compliant WhatsApp surveys          | $600M |
| **Financial Services** | Customer loyalty           | Relationship health monitoring            | $1B   |
| **Restaurants**        | Review generation          | Post-meal feedback → drive Google reviews | $400M |

### Use Cases by Industry

#### E-commerce

- Post-purchase NPS
- Delivery satisfaction
- Product feedback
- Return/refund experience

#### SaaS

- Onboarding satisfaction
- Feature feedback
- Support ticket resolution
- Churn risk detection

#### Hospitality

- Check-in experience
- In-stay feedback
- Post-checkout NPS
- Restaurant/amenity ratings

#### Healthcare

- Appointment satisfaction
- Provider feedback
- Facility ratings
- Treatment follow-up

### Geographic Focus

**Tier 1 (High WhatsApp adoption + business maturity)**:

- Brazil, Mexico, India, Indonesia, Germany, Spain, Italy

**Tier 2 (Growing markets)**:

- Colombia, Argentina, UK, France, Nigeria, South Africa

**Tier 3 (Emerging)**:

- US (growing WhatsApp business use), Canada, Australia

### WhatsApp Penetration by Region

| Region        | WhatsApp Users | Business Adoption |
| ------------- | -------------- | ----------------- |
| Latin America | 95%+           | Very High         |
| Europe        | 80-90%         | High              |
| Asia-Pacific  | 70-85%         | Medium-High       |
| Africa        | 85%+           | Growing           |
| North America | 25-30%         | Growing           |

---

## Business Model

### Pricing Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLOWPULSE PRICING                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STARTER              GROWTH                ENTERPRISE               │
│  $49/month            $149/month            Custom                   │
│                                                                      │
│  ✓ 500 responses      ✓ 3,000 responses     ✓ Unlimited responses   │
│  ✓ 3 surveys          ✓ Unlimited surveys   ✓ Unlimited surveys     │
│  ✓ Basic templates    ✓ All templates       ✓ Custom templates      │
│  ✓ 1 WhatsApp number  ✓ 3 WhatsApp numbers  ✓ Unlimited numbers     │
│  ✓ Basic analytics    ✓ Advanced analytics  ✓ Custom dashboards     │
│  ✓ Email support      ✓ Priority support    ✓ Dedicated CSM         │
│  ✗ API access         ✓ API access          ✓ Custom integrations   │
│  ✗ Webhooks           ✓ Webhooks            ✓ SLA guarantee         │
│  ✗ White-label        ✗ White-label         ✓ White-label option    │
│                                                                      │
│  [Start Free]         [Start Trial]         [Contact Sales]         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Usage-Based Add-Ons

| Add-On                             | Price            |
| ---------------------------------- | ---------------- |
| Additional responses               | $0.02/response   |
| Additional WhatsApp numbers        | $20/number/month |
| AI sentiment analysis              | $0.01/response   |
| Premium support                    | $99/month        |
| Custom branding removal            | $49/month        |
| Advanced data retention (2+ years) | $29/month        |

### Revenue Projections

| Milestone | Customers | Avg MRR | Total MRR | ARR    |
| --------- | --------- | ------- | --------- | ------ |
| Month 6   | 50        | $80     | $4,000    | $48K   |
| Month 12  | 200       | $100    | $20,000   | $240K  |
| Month 18  | 500       | $110    | $55,000   | $660K  |
| Month 24  | 800       | $120    | $96,000   | $1.15M |
| Month 36  | 2,000     | $150    | $300,000  | $3.6M  |

### Unit Economics

| Metric                | Value    | Notes                      |
| --------------------- | -------- | -------------------------- |
| CAC                   | $150     | Content marketing focused  |
| LTV                   | $1,200   | 12-month average retention |
| LTV/CAC               | 8:1      | Healthy ratio              |
| Gross Margin          | 80%      | Low infrastructure costs   |
| Payback Period        | 2 months | Quick payback              |
| Net Revenue Retention | 110%     | Expansion from upgrades    |

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FLOWPULSE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Next.js   │───▶│    Elysia   │───▶│      PostgreSQL         │ │
│  │  Dashboard  │    │    API      │    │   (Multi-tenant)        │ │
│  └─────────────┘    └──────┬──────┘    └─────────────────────────┘ │
│                            │                                        │
│         ┌──────────────────┼──────────────────┐                    │
│         ▼                  ▼                  ▼                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │   Kapso     │    │   Redis     │    │ ClickHouse  │            │
│  │  WhatsApp   │    │  (Queue)    │    │ (Analytics) │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CUSTOMER WHATSAPP                         │   │
│  │                                                              │   │
│  │   Business A         Business B         Business C           │   │
│  │   (Own number)       (Own number)       (Own number)         │   │
│  │       │                  │                  │                 │   │
│  │       ▼                  ▼                  ▼                 │   │
│  │   [Survey Flow]     [Survey Flow]     [Survey Flow]          │   │
│  │       │                  │                  │                 │   │
│  │       └──────────────────┼──────────────────┘                 │   │
│  │                          ▼                                    │   │
│  │                   [Kapso Platform]                            │   │
│  │                          │                                    │   │
│  │                          ▼                                    │   │
│  │                   [FlowPulse API]                             │   │
│  │                          │                                    │   │
│  │                          ▼                                    │   │
│  │                   [Store & Analyze]                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer     | Technology  | Purpose                        |
| --------- | ----------- | ------------------------------ |
| Frontend  | Next.js 14  | Dashboard UI                   |
| API       | Elysia      | REST API + webhooks            |
| Database  | PostgreSQL  | Core data storage              |
| Cache     | Redis       | Queue, sessions, rate limiting |
| Analytics | ClickHouse  | High-volume response analytics |
| WhatsApp  | Kapso       | Flow management, messaging     |
| Auth      | Better Auth | Authentication                 |
| Payments  | Stripe      | Subscriptions, usage billing   |

### Multi-Tenant Data Model

```sql
-- Organizations (FlowPulse customers)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'starter',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{"responses": 500, "surveys": 3, "whatsapp_numbers": 1}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- WhatsApp connections per organization
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  kapso_config_id VARCHAR(255) NOT NULL,
  kapso_customer_id VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  phone_number_id VARCHAR(50),
  display_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Survey definitions
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'nps', 'csat', 'ces', 'custom'
  flow_id VARCHAR(255), -- Kapso/Meta Flow ID
  flow_json JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  thank_you_message TEXT,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Survey distributions (campaigns)
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID REFERENCES whatsapp_connections(id),
  name VARCHAR(255),
  trigger_type VARCHAR(50) NOT NULL, -- 'api', 'scheduled', 'webhook', 'manual'
  trigger_config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  total_sent INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual survey responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  distribution_id UUID REFERENCES distributions(id),
  whatsapp_connection_id UUID REFERENCES whatsapp_connections(id),
  respondent_phone VARCHAR(20) NOT NULL,
  respondent_name VARCHAR(255),
  respondent_metadata JSONB DEFAULT '{}',
  answers JSONB NOT NULL,
  -- Extracted scores for quick queries
  nps_score INTEGER,
  csat_score INTEGER,
  ces_score INTEGER,
  -- AI-generated fields
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  sentiment_score DECIMAL(3,2),
  keywords TEXT[],
  -- Tracking
  flow_token VARCHAR(255),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  time_to_complete_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for billing
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  responses_count INTEGER DEFAULT 0,
  surveys_count INTEGER DEFAULT 0,
  whatsapp_messages_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, period_start)
);

-- Indexes for performance
CREATE INDEX idx_responses_survey ON responses(survey_id, created_at DESC);
CREATE INDEX idx_responses_nps ON responses(survey_id, nps_score) WHERE nps_score IS NOT NULL;
CREATE INDEX idx_responses_phone ON responses(respondent_phone);
CREATE INDEX idx_responses_sentiment ON responses(survey_id, sentiment);
CREATE INDEX idx_distributions_status ON distributions(status, scheduled_at);
CREATE INDEX idx_surveys_org ON surveys(organization_id, is_active);
```

### API Endpoints

```typescript
// Survey Management
POST   /api/v1/surveys                    // Create survey
GET    /api/v1/surveys                    // List surveys
GET    /api/v1/surveys/:id                // Get survey details
PATCH  /api/v1/surveys/:id                // Update survey
DELETE /api/v1/surveys/:id                // Delete survey
POST   /api/v1/surveys/:id/publish        // Publish to WhatsApp
POST   /api/v1/surveys/:id/duplicate      // Clone survey

// Distribution
POST   /api/v1/surveys/:id/send           // Send to single recipient
POST   /api/v1/surveys/:id/send-bulk      // Send to multiple recipients
POST   /api/v1/distributions              // Create scheduled distribution
GET    /api/v1/distributions              // List distributions
PATCH  /api/v1/distributions/:id          // Update distribution
DELETE /api/v1/distributions/:id          // Cancel distribution

// Responses
GET    /api/v1/surveys/:id/responses      // Get survey responses
GET    /api/v1/responses/:id              // Get single response
GET    /api/v1/responses/export           // Export as CSV

// Analytics
GET    /api/v1/analytics/overview         // Dashboard metrics
GET    /api/v1/analytics/nps              // NPS trends
GET    /api/v1/analytics/responses        // Response rate trends
GET    /api/v1/analytics/keywords         // Top keywords

// WhatsApp
GET    /api/v1/whatsapp/connections       // List connections
POST   /api/v1/whatsapp/connections       // Add connection
DELETE /api/v1/whatsapp/connections/:id   // Remove connection

// Webhooks
POST   /webhooks/kapso/flow-response      // Receive flow completions
POST   /webhooks/kapso/message-status     // Delivery receipts
POST   /webhooks/stripe                   // Billing events
```

---

## Go-to-Market Strategy

### Phase 1: MVP & Validation (Months 1-3)

#### Product Development

- [ ] NPS + CSAT templates
- [ ] Basic survey builder
- [ ] Simple dashboard with key metrics
- [ ] Kapso integration
- [ ] Single WhatsApp number support

#### Validation

- [ ] 10-20 beta customers (from network)
- [ ] Focus on e-commerce and SaaS verticals
- [ ] Weekly feedback calls
- [ ] Iterate rapidly

#### Pricing Experiments

- [ ] Test $29, $49, $79 price points
- [ ] A/B test feature gating
- [ ] Identify willingness to pay

### Phase 2: Growth (Months 4-8)

#### Content Marketing

- [ ] "WhatsApp NPS Benchmarks 2025" report
- [ ] Case studies from beta customers
- [ ] SEO content: "WhatsApp surveys", "NPS via WhatsApp"
- [ ] YouTube tutorials
- [ ] Comparison pages (vs Delighted, Typeform)

#### Integrations

- [ ] Shopify app (top priority)
- [ ] Zapier integration
- [ ] HubSpot marketplace listing
- [ ] Segment integration

#### Self-Serve Improvements

- [ ] Free trial (14 days)
- [ ] In-app onboarding guides
- [ ] Template library expansion
- [ ] Help center / knowledge base

### Phase 3: Scale (Months 9-12)

#### Sales

- [ ] Hire first AE (mid-market focus)
- [ ] Industry vertical playbooks
- [ ] Outbound campaigns to target accounts

#### Enterprise Features

- [ ] White-label option
- [ ] SSO (SAML, OIDC)
- [ ] Custom SLAs
- [ ] Dedicated infrastructure option

#### Geographic Expansion

- [ ] Localized marketing (Portuguese, Spanish)
- [ ] Regional partnerships
- [ ] Compliance certifications (GDPR, LGPD)

### Marketing Channels

| Channel            | Priority | CAC Estimate | Notes                  |
| ------------------ | -------- | ------------ | ---------------------- |
| Content/SEO        | High     | $50          | Long-term, compounding |
| Shopify App Store  | High     | $30          | High-intent traffic    |
| Zapier Marketplace | Medium   | $40          | Integration discovery  |
| LinkedIn Ads       | Medium   | $150         | B2B targeting          |
| Google Ads         | Low      | $200         | Competitive keywords   |
| Affiliate          | Medium   | $100         | Partner commissions    |

---

## Competitive Landscape

| Competitor       | Strength                    | Weakness                 | Our Advantage                         |
| ---------------- | --------------------------- | ------------------------ | ------------------------------------- |
| **Delighted**    | NPS expertise, integrations | No WhatsApp, email-only  | WhatsApp-native, 5x response rates    |
| **Typeform**     | Beautiful forms, UX         | Web-only, low completion | In-chat experience, higher engagement |
| **SurveyMonkey** | Brand recognition           | Low mobile engagement    | Mobile-first, instant delivery        |
| **Qualtrics**    | Enterprise features         | Very complex, expensive  | Simple, SMB-friendly pricing          |
| **Medallia**     | Omnichannel, AI             | $100K+ contracts         | Accessible pricing, quick setup       |
| **Hotjar**       | Website feedback            | No outbound surveys      | Proactive feedback collection         |

### Our Competitive Moat

1. **Deep Kapso integration** - Encryption, flows, webhooks handled
2. **Purpose-built for WhatsApp** - Not adapted web forms
3. **SMB-friendly pricing** - $49-149 vs $500+ competitors
4. **LATAM/emerging market focus** - WhatsApp dominance
5. **Lean infrastructure** - Modern stack, low operational costs

### Defensibility

- **Network effects**: More responses → better benchmarks → more customers
- **Integration ecosystem**: Deep integrations hard to replicate
- **Data moat**: Historical NPS data valuable for trends
- **Brand**: First-mover in "WhatsApp NPS" category

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Multi-tenant database schema
- [ ] Organization management (create, invite, roles)
- [ ] Kapso connection per organization
- [ ] WhatsApp number management
- [ ] Basic auth and user management

### Phase 2: Survey Engine (Week 3-4)

- [ ] NPS flow template (Flow JSON)
- [ ] CSAT flow template
- [ ] CES flow template
- [ ] Flow publishing to Kapso
- [ ] Data endpoint for dynamic content
- [ ] Response webhook handling

### Phase 3: Distribution (Week 5-6)

- [ ] API trigger endpoint
- [ ] Scheduled distributions (cron)
- [ ] Webhook triggers from integrations
- [ ] CSV upload for manual campaigns
- [ ] Rate limiting and throttling
- [ ] Retry logic for failed sends

### Phase 4: Analytics (Week 7-8)

- [ ] Response aggregation
- [ ] NPS score calculation (real-time)
- [ ] Trend visualization
- [ ] Export functionality (CSV, Excel)
- [ ] Basic keyword extraction

### Phase 5: Dashboard & Polish (Week 9-10)

- [ ] Dashboard UI (Next.js)
- [ ] Survey builder UI
- [ ] Response viewer
- [ ] Settings pages
- [ ] Onboarding flow

### Phase 6: Integrations (Week 11-12)

- [ ] Webhook on response (outbound)
- [ ] Zapier integration
- [ ] Shopify app
- [ ] API documentation

### Phase 7: Billing & Launch (Week 13-14)

- [ ] Stripe integration
- [ ] Usage tracking
- [ ] Plan limits enforcement
- [ ] Marketing site
- [ ] Documentation
- [ ] Beta launch

---

## Resources

### Technical References

- **Kapso WhatsApp Flows**: https://docs.kapso.ai/docs/whatsapp/flows/overview
- **Meta Flow JSON Reference**: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
- **Kapso TypeScript SDK**: https://docs.kapso.ai/docs/whatsapp/typescript-sdk/flows

### NPS & Feedback Methodology

- **Net Promoter System**: https://www.netpromoter.com/know/
- **CSAT Best Practices**: https://www.qualtrics.com/experience-management/customer/customer-satisfaction/
- **CES Methodology**: https://www.gartner.com/en/customer-service-support/insights/customer-effort-score

### Market Research

- **WhatsApp Business Statistics**: https://www.statista.com/topics/2018/whatsapp/
- **Customer Feedback Market**: https://www.grandviewresearch.com/industry-analysis/voice-of-customer-market
- **NPS Benchmarks by Industry**: https://www.retently.com/blog/good-net-promoter-score/

---

## Changelog

| Date       | Version | Changes                                                       |
| ---------- | ------- | ------------------------------------------------------------- |
| 2025-12-24 | 1.1     | Standalone product - removed shared infrastructure references |
| 2025-12-24 | 1.0     | Initial FlowPulse business plan                               |

---

_FlowPulse is a standalone SaaS product that leverages Kapso WhatsApp Flows to address the broader customer feedback market with 5x higher response rates than traditional email surveys._
