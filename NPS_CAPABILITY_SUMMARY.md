# NPS Capability Investigation Summary

**Date:** 2025-11-09
**Status:** ⏳ NPS Data Not Currently Available

---

## Current Status

### Database Check
- ❌ No NPS/Poll guides found in pendo_guides table
- ❌ No poll-related events in pendo_events table
- ❌ No pendo_polls table exists

### Conclusion
**Your Pendo account currently does not have any NPS surveys set up.** This is normal - NPS is a separate feature that needs to be configured in Pendo.

---

## What is NPS?

**Net Promoter Score (NPS)** is a metric used to measure customer satisfaction and loyalty.

- **Scale:** 0-10 (How likely are you to recommend this product?)
- **Calculation:** % Promoters (9-10) minus % Detractors (0-6)
- **Example:** 60% promoters - 20% detractors = NPS of 40

---

## How to Get NPS Data from Pendo

### Prerequisites

1. **Pendo Listen or Polls Feature**
   - May require additional Pendo license
   - Contact your Pendo Customer Success Manager

2. **Integration API Access** ✅ (Already have)
   - You already have an Integration API key
   - Verify at: https://app.pendo.io/settings/integrations

### Implementation Options

#### Option 1: Pendo Listen (Recommended)
Pendo Listen is their full-featured feedback platform with built-in NPS surveys.

**Setup:**
1. Go to Pendo → Listen
2. Create an NPS survey
3. Configure targeting rules
4. Schedule or trigger survey

**Benefits:**
- Pre-built NPS templates
- Automatic score calculation
- Trend analytics
- Follow-up questions

#### Option 2: Manual Poll Guide
Create a custom poll in Pendo Guides.

**Setup:**
1. Go to Pendo → Guides → Create Guide
2. Choose "Poll" type
3. Add NPS question (0-10 scale)
4. Add optional text question for feedback
5. Activate and target to users

**Benefits:**
- No additional license needed (if you have Guides)
- Full control over design and targeting
- Integrated with existing guide workflows

---

## API Integration (Once NPS is Set Up)

### Step 1: Find Your NPS Guide

In Pendo UI:
1. Navigate to the NPS guide
2. Copy the `guideId` from URL: `https://app.pendo.io/guides/xxx/details?guideId=YOUR_GUIDE_ID`

### Step 2: Fetch NPS Data via Aggregation API

**Endpoint:** `POST https://app.pendo.io/api/v1/aggregation`

**Headers:**
```
X-Pendo-Integration-Key: YOUR_INTEGRATION_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": {
          "pollEvents": null,
          "guideId": "YOUR_NPS_GUIDE_ID",
          "pollId": "YOUR_POLL_ID"
        }
      },
      {
        "identified": "visitorId"
      },
      {
        "timeSeries": {
          "period": "dayRange",
          "first": "2024-01-01T00:00:00.000Z",
          "count": 365
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "visitorId": "visitor123",
      "browserTime": "2025-01-15T10:30:00.000Z",
      "accountId": "account456",
      "quantitativeResponse": 9,  // NPS score 0-10
      "qualitativeResponse": "Great product!",
      "channel": "in-app"
    }
  ]
}
```

### Step 3: Calculate NPS Score

```javascript
// Categorize responses
const promoters = responses.filter(r => r.quantitativeResponse >= 9).length;
const passives = responses.filter(r => r.quantitativeResponse >= 7 && r.quantitativeResponse <= 8).length;
const detractors = responses.filter(r => r.quantitativeResponse <= 6).length;
const total = responses.length;

// Calculate percentages
const promoterPct = (promoters / total) * 100;
const detractorPct = (detractors / total) * 100;

// NPS = % Promoters - % Detractors
const npsScore = promoterPct - detractorPct;

console.log(`NPS Score: ${npsScore.toFixed(1)}`);
```

---

## Database Schema (For Future Implementation)

When ready to implement NPS tracking:

```sql
-- Create NPS responses table
CREATE TABLE pendo_nps_responses (
  id TEXT PRIMARY KEY,
  guide_id TEXT NOT NULL,
  poll_id TEXT NOT NULL,
  visitor_id TEXT,
  account_id TEXT,
  quantitative_response INTEGER CHECK (quantitative_response BETWEEN 0 AND 10),
  qualitative_response TEXT,
  browser_time TIMESTAMPTZ,
  channel TEXT CHECK (channel IN ('in-app', 'email')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (guide_id) REFERENCES pendo_guides(id)
);

-- Indexes for performance
CREATE INDEX idx_nps_guide ON pendo_nps_responses(guide_id);
CREATE INDEX idx_nps_score ON pendo_nps_responses(quantitative_response);
CREATE INDEX idx_nps_time ON pendo_nps_responses(browser_time);

-- View for overall NPS calculation
CREATE VIEW nps_summary AS
SELECT
  COUNT(*) AS total_responses,
  COUNT(*) FILTER (WHERE quantitative_response >= 9) AS promoters,
  COUNT(*) FILTER (WHERE quantitative_response BETWEEN 7 AND 8) AS passives,
  COUNT(*) FILTER (WHERE quantitative_response <= 6) AS detractors,
  ROUND(
    (COUNT(*) FILTER (WHERE quantitative_response >= 9) * 100.0 / NULLIF(COUNT(*), 0)) -
    (COUNT(*) FILTER (WHERE quantitative_response <= 6) * 100.0 / NULLIF(COUNT(*), 0)),
    1
  ) AS nps_score
FROM pendo_nps_responses
WHERE quantitative_response IS NOT NULL;
```

---

## Dashboard Integration Ideas

Once NPS data is available:

### 1. NPS Score Widget
Large number display showing current NPS score with trend indicator.

```
┌─────────────────┐
│   NPS SCORE     │
│                 │
│      +42        │
│   ↑ +5 vs Q3    │
└─────────────────┘
```

### 2. Response Breakdown
Donut or bar chart showing promoter/passive/detractor distribution.

```
Promoters (9-10):  60%  ███████████████
Passives (7-8):    20%  █████
Detractors (0-6):  20%  █████
```

### 3. NPS Trend Chart
Line chart showing NPS evolution over time (monthly/quarterly).

### 4. Recent Feedback
Table showing latest qualitative responses with sentiment.

---

## Next Steps

### Immediate (Before NPS Can Be Implemented)

1. **Check with Team:** Does Cin7 want to collect NPS feedback?
   - What user segments should we target?
   - When/how often should we ask?

2. **Pendo License Review:**
   - Check if current Pendo plan includes Polls or Listen
   - If not, contact Pendo CSM about adding NPS capability

3. **Create NPS Survey in Pendo:**
   - Set up survey in Pendo UI
   - Configure targeting and frequency
   - Test with internal users first

### Once NPS is Available

1. **Verify API Access:**
   - Test aggregation API with actual NPS guide ID
   - Confirm data structure matches expectations

2. **Implement Data Sync:**
   - Create `pendo_nps_responses` table
   - Add NPS sync to Edge Function
   - Include in 6-hour cronjob schedule

3. **Build Dashboard:**
   - Add NPS widgets to dashboard
   - Create NPS-specific page/tab
   - Add filtering by time period

---

## Resources

- **Pendo NPS Documentation:** https://support.pendo.io/hc/en-us/articles/360031864112
- **Pendo API Example:** https://github.com/pendo-io/pendo-Looker-NPS
- **Integration Keys:** https://app.pendo.io/settings/integrations

---

## Testing Checklist (When Ready)

- [ ] NPS survey created in Pendo
- [ ] Guide ID obtained
- [ ] API test successful (fetches responses)
- [ ] Database schema created
- [ ] Sync script working
- [ ] Dashboard widgets displaying correctly
- [ ] Cronjob including NPS sync
- [ ] Monitoring in place

---

**Summary:** NPS integration is **technically possible** but requires Pendo NPS/Polls feature to be set up first. Once surveys are active in Pendo, we can sync responses to Supabase and display on the dashboard using the same patterns as existing guide/feature analytics.
