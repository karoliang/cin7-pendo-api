# Pendo Listen Integration - Quick Start Guide

**TL;DR:** Pendo Listen has NO public API for AI features. Build hybrid solution using Pendo NPS data + our own AI analysis. Cost: ~$11/month vs. $2-5k/month Listen subscription.

---

## Key Findings Summary

### What We Discovered

✅ **Available:**
- Pendo Aggregation API (works great)
- NPS poll data extraction (numeric + text)
- Guide metadata access
- Current integration key valid

❌ **NOT Available:**
- Pendo Listen API (doesn't exist publicly)
- AI-generated themes from Listen
- Automated feedback categorization
- Sentiment analysis beyond NPS
- Cross-source aggregation from Listen

### What This Means

**Can't Access:** Pendo Listen's AI features via API
**Solution:** Build our own using OpenRouter/Claude (already integrated)
**Result:** Same functionality, full control, massive cost savings

---

## Recommended Approach: Hybrid

```
Pendo Aggregation API → NPS Data → Our AI Analysis → Dashboard Widget
     (Free)              (Free)     (~$11/month)      (Free)
```

### Data Flow

1. **Daily Sync** (2 AM UTC via cron)
   - Fetch NPS poll responses from Pendo
   - Store in Supabase

2. **AI Analysis** (weekly or when 10+ new responses)
   - Extract themes from qualitative feedback
   - Generate recommendations
   - Calculate sentiment

3. **Dashboard** (real-time)
   - Display Customer Voice widget
   - Show themes, NPS score, recommendations

---

## Implementation Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Database + API pipeline working |
| 2 | Data Sync | Automated daily NPS extraction |
| 3 | AI Analysis | Theme extraction + recommendations |
| 4 | Dashboard | Customer Voice widget live |
| 5 | Polish | Testing, docs, deployment |

**Total:** 5 weeks, 1 developer full-time

---

## Cost Analysis

### Option 1: Pendo Listen Subscription ❌
- Monthly: $2,000 - $5,000
- Annual: $24,000 - $60,000
- Limitations: No API, UI-only access

### Option 2: Build Hybrid Solution ✅
- Monthly: ~$11 (AI analysis)
- Annual: ~$132
- Benefits: Full control, automation, API access

**Savings:** $23,868 - $59,868 per year

---

## Technical Requirements

### Prerequisites
- ✅ Pendo integration key (already have)
- ✅ Supabase database (already set up)
- ✅ OpenRouter API key (already integrated)
- ✅ Netlify hosting (already deployed)

### New Infrastructure Needed
- [ ] 3 new database tables (pendo_nps_responses, pendo_nps_themes, pendo_ai_recommendations)
- [ ] 2 Supabase Edge Functions (sync-pendo-nps, analyze-nps-with-ai)
- [ ] 1 cron job (daily NPS sync)
- [ ] 1 dashboard widget component

---

## API Endpoints Tested

### ✅ Working
```bash
# Get all guides
GET https://app.pendo.io/api/v1/guide
Header: x-pendo-integration-key: [key]

# Get specific guide
GET https://app.pendo.io/api/v1/guide/{id}

# Aggregation pipeline
POST https://app.pendo.io/api/v1/aggregation
Body: { "pipeline": [...] }
```

### ❌ Not Found (404)
```bash
GET /api/v1/poll       # Use aggregation instead
GET /api/v1/feedback   # Use aggregation instead
GET /api/v1/nps        # Use aggregation instead
```

---

## NPS Data Structure

### Important: Two-Poll Architecture

NPS surveys are stored as **TWO separate polls**:
1. **Quantitative** - Numeric rating (0-10)
2. **Qualitative** - Text feedback

Must merge both in aggregation pipeline.

### Sample Pipeline Query

```json
{
  "pipeline": [
    {
      "source": {
        "pollEvents": {
          "guideId": "YOUR_GUIDE_ID",
          "pollId": "QUANT_POLL_ID"
        }
      }
    },
    {
      "timeSeries": {
        "period": "dayRange",
        "first": 30
      }
    },
    {
      "merge": {
        "pipeline": [
          {
            "source": {
              "pollEvents": {
                "guideId": "YOUR_GUIDE_ID",
                "pollId": "QUAL_POLL_ID"
              }
            }
          }
        ],
        "on": [{"left": "visitorId", "right": "visitorId"}]
      }
    },
    {
      "select": {
        "visitorId": "visitorId",
        "browserTime": "browserTime",
        "quantitativeResponse": "pollResponse",
        "qualitativeResponse": "merge.pollResponse"
      }
    }
  ]
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| visitorId | String | User identifier |
| browserTime | Epoch | Response timestamp |
| accountId | String | Account ID |
| quantitativeResponse | Number (0-10) | NPS score |
| qualitativeResponse | String | Text feedback |
| channel | String | "in-app" or "email" |

---

## NPS Score Calculation

```typescript
function calculateNPS(scores: number[]): number {
  const promoters = scores.filter(s => s >= 9).length;
  const detractors = scores.filter(s => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function calculateSentiment(score: number): string {
  if (score >= 9) return 'promoter';   // Positive
  if (score >= 7) return 'passive';    // Neutral
  return 'detractor';                  // Negative
}
```

**NPS Range:** -100 (all detractors) to +100 (all promoters)

---

## AI Analysis Approach

### Prompt Strategy

```typescript
const prompt = `Analyze NPS feedback for Cin7 (inventory management platform):

${feedbackTexts.join('\n')}

Provide JSON with:
- Top 5-7 themes (name, mentions, sentiment, priority, examples)
- 3-5 actionable recommendations
- Overall sentiment breakdown

Focus on product issues, feature requests, and pain points.`;
```

### Expected Output

```json
{
  "themes": [
    {
      "theme": "Inventory Sync Issues",
      "mentions": 15,
      "sentiment": "negative",
      "priority": "high",
      "examples": ["Sync is slow", "Lost inventory counts"]
    }
  ],
  "recommendations": [
    "Improve real-time sync reliability",
    "Add bulk edit workflows"
  ],
  "overallSentiment": {
    "positive": 30,
    "neutral": 20,
    "negative": 50
  }
}
```

---

## Dashboard Widget Preview

```
┌────────────────────────────────────────┐
│  Customer Voice (Last 30 Days)         │
│  NPS Score: +42  (156 responses)       │
├────────────────────────────────────────┤
│  Top Feedback Themes:                  │
│                                        │
│  🔴 Inventory Sync Issues              │
│     156 mentions | Negative | HIGH     │
│     "Sync reliability problems"        │
│                                        │
│  🟡 Reporting Gaps                     │
│     89 mentions | Neutral | MEDIUM     │
│     "Need custom reports"              │
│                                        │
│  🟢 Integration Quality                │
│     67 mentions | Positive | LOW       │
│     "Shopify works great"              │
├────────────────────────────────────────┤
│  AI Recommendations:                   │
│  • Focus on inventory sync reliability │
│  • Improve bulk edit workflows        │
│  • Add real-time notifications        │
└────────────────────────────────────────┘
```

---

## Quick Commands

### Extract NPS Guides
```bash
node scripts/extract-nps-guides.mjs
```

### Test NPS Sync
```bash
node scripts/test-nps-sync.mjs
```

### Trigger AI Analysis
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/analyze-nps-with-ai \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"periodDays": 30}'
```

### Check Cron Job Status
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%nps%';
```

### View Recent Responses
```sql
SELECT
  guide_name,
  COUNT(*) as responses,
  AVG(quantitative_score) as avg_score,
  COUNT(CASE WHEN sentiment = 'promoter' THEN 1 END) as promoters
FROM pendo_nps_responses
WHERE browser_time > NOW() - INTERVAL '30 days'
GROUP BY guide_name;
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API changes | Low | Medium | Monitor changelog, version calls |
| Low NPS volume | Medium | High | Promote surveys, add poll sources |
| AI hallucinations | Low | Medium | Validate outputs, human review |
| Cost overruns | Low | Low | Monitor usage, implement caching |

---

## Next Steps

### Immediate (This Week)
1. ✅ Review research report with stakeholders
2. [ ] Get approval for hybrid approach
3. [ ] Confirm no interest in Listen subscription
4. [ ] Assign developer for Sprint 1

### Week 1 (Sprint 1)
1. [ ] Create database tables
2. [ ] Extract NPS guide IDs and poll IDs
3. [ ] Build aggregation pipeline
4. [ ] Test data extraction

### Week 2-5
Follow implementation plan (see `PENDO_LISTEN_INTEGRATION_PLAN.md`)

---

## Decision: Build vs. Buy

### Build (Recommended) ✅
**Pros:**
- Cost: $11/month vs. $2-5k/month
- Full control and customization
- API access and automation
- Uses existing infrastructure

**Cons:**
- 5 weeks development time
- Maintain custom code
- No Pendo support for AI features

### Buy Pendo Listen ❌
**Pros:**
- Pendo's AI features included
- Cross-source aggregation (Salesforce, Zendesk)
- No development needed
- Pendo support

**Cons:**
- $2-5k/month cost
- No API access to AI features
- UI-only (can't automate)
- Limited customization

**Recommendation:** BUILD (hybrid approach)

---

## Success Metrics

**Technical:**
- Sync success rate: >95%
- Dashboard load time: <2s
- AI accuracy: >80% relevant themes

**Business:**
- Cost savings: $24k-60k/year
- Product team uses widget weekly
- 5-10 actionable themes per month
- Feature prioritization influenced by feedback

---

## Documentation Links

- [Full Research Report](./PENDO_LISTEN_RESEARCH_REPORT.md) - 24KB, comprehensive findings
- [Implementation Plan](./PENDO_LISTEN_INTEGRATION_PLAN.md) - 31KB, 5-week sprint plan
- [Product Improvements Plan](./PRODUCT_IMPROVEMENTS_PLAN.md) - Original requirements

---

## Questions?

**Technical Issues:**
- Check implementation plan for detailed code examples
- Review API endpoint reference in research report
- Test using provided scripts

**Business Questions:**
- Cost comparison: See "Cost Analysis" section
- Timeline: 5 weeks for MVP
- ROI: ~$24k-60k annual savings

**Need Help?**
- Review full research report for details
- Check implementation plan for step-by-step guide
- Contact development team for technical support

---

**Status:** Research Complete ✅ | Ready for Implementation
**Next Action:** Stakeholder approval to proceed with Sprint 1
**Owner:** Development Team
**Last Updated:** November 8, 2025
