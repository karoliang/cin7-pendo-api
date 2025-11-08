# Pendo Listen Integration - MVP Implementation Plan
**Version:** 1.0
**Date:** November 8, 2025
**Status:** Ready for Implementation

---

## Quick Reference

**Approach:** Hybrid (Pendo NPS Data + In-House AI Analysis)
**Timeline:** 5 weeks
**Cost:** ~$11/month (AI analysis) vs. $2-5k/month (Listen subscription)
**Complexity:** High but achievable

---

## Sprint 1: Foundation & Data Extraction (Week 1)

### Goals
- Set up database infrastructure
- Extract NPS guide metadata
- Build and test aggregation pipeline

### Tasks

#### 1.1 Database Schema Creation
```sql
-- File: supabase-migrations/003_add_nps_responses_table.sql

CREATE TABLE pendo_nps_responses (
  id BIGSERIAL PRIMARY KEY,
  guide_id TEXT NOT NULL,
  guide_name TEXT,
  visitor_id TEXT NOT NULL,
  account_id TEXT,
  browser_time TIMESTAMPTZ NOT NULL,
  quantitative_score INTEGER CHECK (quantitative_score BETWEEN 0 AND 10),
  qualitative_feedback TEXT,
  channel TEXT CHECK (channel IN ('in-app', 'email')),
  sentiment TEXT CHECK (sentiment IN ('promoter', 'passive', 'detractor')),
  raw_data JSONB, -- Store full API response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_nps_response UNIQUE(guide_id, visitor_id, browser_time)
);

-- Indexes for performance
CREATE INDEX idx_nps_guide_id ON pendo_nps_responses(guide_id);
CREATE INDEX idx_nps_sentiment ON pendo_nps_responses(sentiment);
CREATE INDEX idx_nps_browser_time ON pendo_nps_responses(browser_time DESC);
CREATE INDEX idx_nps_account_id ON pendo_nps_responses(account_id) WHERE account_id IS NOT NULL;

-- NPS themes and analysis results
CREATE TABLE pendo_nps_themes (
  id BIGSERIAL PRIMARY KEY,
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  theme_name TEXT NOT NULL,
  mentions INTEGER DEFAULT 0,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  example_quotes JSONB, -- Array of example feedback quotes
  source_breakdown JSONB, -- {"nps": count, "polls": count}
  ai_analysis JSONB, -- Full AI response
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_theme_period UNIQUE(analysis_period_start, analysis_period_end, theme_name)
);

CREATE INDEX idx_themes_period ON pendo_nps_themes(analysis_period_start, analysis_period_end);
CREATE INDEX idx_themes_priority ON pendo_nps_themes(priority);

-- AI recommendations
CREATE TABLE pendo_ai_recommendations (
  id BIGSERIAL PRIMARY KEY,
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  recommendation TEXT NOT NULL,
  supporting_themes JSONB, -- Array of theme IDs
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX idx_recommendations_period ON pendo_ai_recommendations(analysis_period_start, analysis_period_end);
CREATE INDEX idx_recommendations_status ON pendo_ai_recommendations(status);
```

#### 1.2 Extract NPS Guide Metadata

**File:** `scripts/extract-nps-guides.mjs`

```javascript
import fetch from 'node-fetch';

const PENDO_API_KEY = process.env.PENDO_API_KEY;

async function extractNPSGuides() {
  // 1. Get all guides
  const response = await fetch('https://app.pendo.io/api/v1/guide', {
    headers: {
      'x-pendo-integration-key': PENDO_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  const guides = await response.json();

  // 2. Filter for NPS/Poll guides
  const npsGuides = guides.filter(g =>
    g.name.toLowerCase().includes('nps') ||
    g.name.toLowerCase().includes('poll')
  );

  // 3. Extract poll IDs from each guide
  for (const guide of npsGuides) {
    console.log(`\nGuide: ${guide.name} (ID: ${guide.id})`);
    console.log(`State: ${guide.state}`);

    // Get detailed guide info to find poll IDs
    const detailResponse = await fetch(`https://app.pendo.io/api/v1/guide/${guide.id}`, {
      headers: {
        'x-pendo-integration-key': PENDO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const detail = await detailResponse.json();

    // Look for poll configuration in steps
    if (detail.steps) {
      detail.steps.forEach((step, idx) => {
        if (step.attributes?.poll) {
          console.log(`  Step ${idx}: Poll ID = ${step.attributes.poll.id}`);
        }
      });
    }
  }

  return npsGuides;
}

extractNPSGuides().catch(console.error);
```

**Run:** `node scripts/extract-nps-guides.mjs`

#### 1.3 Build Aggregation Pipeline Function

**File:** `supabase/functions/sync-pendo-nps/pendo-client.ts`

```typescript
interface NPSResponse {
  visitorId: string;
  browserTime: number;
  accountId?: string;
  quantitativeResponse?: number;
  qualitativeResponse?: string;
  channel: 'in-app' | 'email';
}

export async function fetchNPSData(
  guideId: string,
  quantPollId: string,
  qualPollId: string,
  days: number = 90
): Promise<NPSResponse[]> {
  const pipeline = {
    pipeline: [
      {
        source: {
          pollEvents: {
            guideId: guideId,
            pollId: quantPollId
          }
        }
      },
      {
        timeSeries: {
          period: "dayRange",
          first: days
        }
      },
      {
        identified: "visitorId"
      },
      {
        merge: {
          pipeline: [
            {
              source: {
                pollEvents: {
                  guideId: guideId,
                  pollId: qualPollId
                }
              }
            },
            {
              timeSeries: {
                period: "dayRange",
                first: days
              }
            }
          ],
          on: [
            {
              left: "visitorId",
              right: "visitorId"
            }
          ]
        }
      },
      {
        select: {
          visitorId: "visitorId",
          browserTime: "browserTime",
          accountId: "accountId",
          quantitativeResponse: "pollResponse",
          qualitativeResponse: "merge.pollResponse",
          channel: "channel"
        }
      }
    ]
  };

  const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
    method: 'POST',
    headers: {
      'x-pendo-integration-key': Deno.env.get('PENDO_API_KEY')!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pipeline)
  });

  if (!response.ok) {
    throw new Error(`Pendo API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.results || [];
}

export function calculateSentiment(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function calculateNPS(scores: number[]): number {
  const total = scores.length;
  if (total === 0) return 0;

  const promoters = scores.filter(s => s >= 9).length;
  const detractors = scores.filter(s => s <= 6).length;

  return Math.round(((promoters - detractors) / total) * 100);
}
```

### Deliverables (Week 1)
- ✅ Database tables created and deployed
- ✅ NPS guide IDs and poll IDs documented
- ✅ Working aggregation pipeline function
- ✅ Test data extraction successful

---

## Sprint 2: Data Sync & Storage (Week 2)

### Goals
- Implement full NPS data sync
- Store responses in Supabase
- Schedule automated daily sync

### Tasks

#### 2.1 Supabase Edge Function

**File:** `supabase/functions/sync-pendo-nps/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchNPSData, calculateSentiment, calculateNPS } from './pendo-client.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const NPS_GUIDES = [
  {
    id: 'LgCjViaZjwHPT8MWavf79f-33oU',
    name: 'Omni NPS Survey',
    quantPollId: 'POLL_ID_1', // Extract from guide metadata
    qualPollId: 'POLL_ID_2'
  }
  // Add more guides as discovered
];

serve(async (req) => {
  try {
    console.log('Starting Pendo NPS sync...');

    const stats = {
      guidesProcessed: 0,
      responsesInserted: 0,
      responsesDuplicate: 0,
      errors: []
    };

    for (const guide of NPS_GUIDES) {
      try {
        console.log(`Processing guide: ${guide.name}`);

        // Fetch NPS data from Pendo
        const responses = await fetchNPSData(
          guide.id,
          guide.quantPollId,
          guide.qualPollId,
          30 // Last 30 days for incremental sync
        );

        console.log(`Fetched ${responses.length} responses`);

        // Transform and insert
        for (const response of responses) {
          const sentiment = response.quantitativeResponse
            ? calculateSentiment(response.quantitativeResponse)
            : null;

          const { error } = await supabase
            .from('pendo_nps_responses')
            .upsert({
              guide_id: guide.id,
              guide_name: guide.name,
              visitor_id: response.visitorId,
              account_id: response.accountId,
              browser_time: new Date(response.browserTime),
              quantitative_score: response.quantitativeResponse,
              qualitative_feedback: response.qualitativeResponse,
              channel: response.channel,
              sentiment: sentiment,
              raw_data: response,
              updated_at: new Date()
            }, {
              onConflict: 'guide_id,visitor_id,browser_time'
            });

          if (error) {
            if (error.code === '23505') { // Duplicate
              stats.responsesDuplicate++;
            } else {
              stats.errors.push(`Insert error: ${error.message}`);
            }
          } else {
            stats.responsesInserted++;
          }
        }

        stats.guidesProcessed++;

      } catch (error) {
        console.error(`Error processing guide ${guide.name}:`, error);
        stats.errors.push(`${guide.name}: ${error.message}`);
      }
    }

    console.log('Sync complete:', stats);

    return new Response(JSON.stringify({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

#### 2.2 Schedule Cron Job

**File:** `supabase/migrations/004_add_nps_sync_cron.sql`

```sql
-- Schedule daily NPS sync at 2 AM UTC
SELECT cron.schedule(
  'sync-pendo-nps-daily',
  '0 2 * * *', -- 2 AM daily
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-pendo-nps',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify cron job
SELECT * FROM cron.job WHERE jobname = 'sync-pendo-nps-daily';
```

#### 2.3 Manual Test Script

**File:** `scripts/test-nps-sync.mjs`

```javascript
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testNPSSync() {
  console.log('Triggering NPS sync...');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-pendo-nps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });

  const result = await response.json();
  console.log('Sync result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Sync successful!');
    console.log(`  Guides processed: ${result.stats.guidesProcessed}`);
    console.log(`  Responses inserted: ${result.stats.responsesInserted}`);
    console.log(`  Duplicates skipped: ${result.stats.responsesDuplicate}`);

    if (result.stats.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      result.stats.errors.forEach(e => console.log(`  - ${e}`));
    }
  } else {
    console.log('\n❌ Sync failed:', result.error);
  }
}

testNPSSync().catch(console.error);
```

**Run:** `node scripts/test-nps-sync.mjs`

### Deliverables (Week 2)
- ✅ Supabase Edge Function deployed
- ✅ NPS data successfully stored in database
- ✅ Cron job scheduled and verified
- ✅ Manual test script works

---

## Sprint 3: AI Analysis Integration (Week 3)

### Goals
- Analyze qualitative feedback with AI
- Extract themes and sentiment
- Generate actionable recommendations

### Tasks

#### 3.1 AI Analysis Service

**File:** `supabase/functions/analyze-nps-with-ai/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!;

interface FeedbackAnalysis {
  themes: Array<{
    theme: string;
    mentions: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    priority: 'high' | 'medium' | 'low';
    examples: string[];
  }>;
  recommendations: string[];
  overallSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

async function analyzeWithAI(feedbackTexts: string[]): Promise<FeedbackAnalysis> {
  const prompt = `You are a product analyst analyzing customer NPS feedback for Cin7, an inventory management platform.

Analyze the following ${feedbackTexts.length} customer feedback responses and provide:

1. Top 5-7 recurring themes (topics/issues customers mention)
2. For each theme:
   - Count how many customers mentioned it
   - Overall sentiment (positive/negative/neutral)
   - Priority level based on impact and frequency
   - 2-3 example quotes
3. 3-5 actionable product recommendations based on the themes
4. Overall sentiment breakdown across all feedback

Customer Feedback:
${feedbackTexts.map((f, i) => `[${i + 1}] ${f}`).join('\n\n')}

Respond with valid JSON only (no markdown, no explanation):
{
  "themes": [
    {
      "theme": "Inventory Sync Issues",
      "mentions": 15,
      "sentiment": "negative",
      "priority": "high",
      "examples": ["quote 1", "quote 2"]
    }
  ],
  "recommendations": [
    "Improve real-time inventory sync reliability across all channels",
    "Add bulk editing capabilities for inventory adjustments"
  ],
  "overallSentiment": {
    "positive": 30,
    "neutral": 20,
    "negative": 50
  }
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cin7-pendo-api.netlify.app',
      'X-Title': 'Cin7 Pendo Analytics - NPS Analysis'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower for more consistent analysis
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON response
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI returned invalid JSON');
  }
}

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { periodDays = 30, minResponses = 10 } = await req.json();

    // Get recent qualitative feedback
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: responses, error } = await supabase
      .from('pendo_nps_responses')
      .select('qualitative_feedback, browser_time')
      .gte('browser_time', startDate.toISOString())
      .not('qualitative_feedback', 'is', null)
      .order('browser_time', { ascending: false });

    if (error) throw error;

    const feedbackTexts = responses
      .map(r => r.qualitative_feedback?.trim())
      .filter(f => f && f.length > 10); // Filter out empty/short responses

    console.log(`Found ${feedbackTexts.length} feedback responses`);

    if (feedbackTexts.length < minResponses) {
      return new Response(JSON.stringify({
        success: false,
        message: `Insufficient feedback (${feedbackTexts.length}/${minResponses} required)`,
        periodDays,
        feedbackCount: feedbackTexts.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Analyze with AI
    console.log('Analyzing with AI...');
    const analysis = await analyzeWithAI(feedbackTexts);

    // Store themes
    const periodStart = startDate;
    const periodEnd = new Date();

    for (const theme of analysis.themes) {
      await supabase
        .from('pendo_nps_themes')
        .upsert({
          analysis_period_start: periodStart,
          analysis_period_end: periodEnd,
          theme_name: theme.theme,
          mentions: theme.mentions,
          sentiment: theme.sentiment,
          priority: theme.priority,
          example_quotes: theme.examples,
          source_breakdown: { nps: theme.mentions, polls: 0 },
          ai_analysis: analysis
        }, {
          onConflict: 'analysis_period_start,analysis_period_end,theme_name'
        });
    }

    // Store recommendations
    for (const recommendation of analysis.recommendations) {
      await supabase
        .from('pendo_ai_recommendations')
        .insert({
          analysis_period_start: periodStart,
          analysis_period_end: periodEnd,
          recommendation: recommendation,
          supporting_themes: analysis.themes.map(t => t.theme),
          priority: 'medium', // Can be enhanced with more logic
          status: 'new'
        });
    }

    console.log('Analysis complete:', analysis);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      feedbackCount: feedbackTexts.length,
      periodDays,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

#### 3.2 Trigger AI Analysis After Sync

Update NPS sync function to trigger AI analysis if enough new responses:

```typescript
// In sync-pendo-nps/index.ts, add at the end:

if (stats.responsesInserted >= 10) {
  console.log('Triggering AI analysis...');

  const analysisResponse = await fetch(
    `${supabaseUrl}/functions/v1/analyze-nps-with-ai`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ periodDays: 30 })
    }
  );

  const analysisResult = await analysisResponse.json();
  console.log('AI analysis result:', analysisResult);
}
```

### Deliverables (Week 3)
- ✅ AI analysis Edge Function deployed
- ✅ Theme extraction working accurately
- ✅ Recommendations generated and stored
- ✅ Automatic trigger after sync implemented

---

## Sprint 4: Dashboard Widget (Week 4)

### Goals
- Design and implement Customer Voice widget
- Display themes and recommendations
- Add filtering and date ranges

### Tasks

#### 4.1 Widget Component

**File:** `frontend/src/components/dashboard/CustomerVoiceWidget.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Spinner, Badge, Text, Button } from '@/components/polaris';

interface Theme {
  theme_name: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  example_quotes: string[];
}

interface Recommendation {
  recommendation: string;
  priority: string;
  status: string;
}

export function CustomerVoiceWidget() {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [responseCount, setResponseCount] = useState(0);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [periodDays]);

  async function loadData() {
    setLoading(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get themes
      const { data: themesData } = await supabase
        .from('pendo_nps_themes')
        .select('*')
        .gte('analysis_period_start', startDate.toISOString())
        .order('priority', { ascending: true })
        .order('mentions', { ascending: false })
        .limit(5);

      setThemes(themesData || []);

      // Get recommendations
      const { data: recsData } = await supabase
        .from('pendo_ai_recommendations')
        .select('*')
        .gte('analysis_period_start', startDate.toISOString())
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecommendations(recsData || []);

      // Calculate NPS
      const { data: responses } = await supabase
        .from('pendo_nps_responses')
        .select('quantitative_score')
        .gte('browser_time', startDate.toISOString())
        .not('quantitative_score', 'is', null);

      if (responses && responses.length > 0) {
        const scores = responses.map(r => r.quantitative_score);
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const nps = Math.round(((promoters - detractors) / scores.length) * 100);

        setNpsScore(nps);
        setResponseCount(scores.length);
      }

    } catch (error) {
      console.error('Error loading customer voice data:', error);
    } finally {
      setLoading(false);
    }
  }

  const sentimentColors = {
    positive: 'success',
    neutral: 'warning',
    negative: 'critical'
  };

  const priorityEmojis = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  if (loading) {
    return (
      <Card title="Customer Voice">
        <div className="flex justify-center p-8">
          <Spinner size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Customer Voice">
      <div className="space-y-6">
        {/* NPS Score Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <Text variant="headingLg">
              NPS Score: {npsScore !== null ? npsScore : '--'}
            </Text>
            <Text variant="bodySm" color="subdued">
              {responseCount} responses in last {periodDays} days
            </Text>
          </div>

          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Themes */}
        <div>
          <Text variant="headingMd">Top Feedback Themes</Text>
          <div className="mt-3 space-y-3">
            {themes.length === 0 ? (
              <Text color="subdued">No themes identified yet</Text>
            ) : (
              themes.map((theme, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {priorityEmojis[theme.priority]}
                        </span>
                        <Text variant="headingSm">{theme.theme_name}</Text>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <Badge tone={sentimentColors[theme.sentiment]}>
                          {theme.sentiment}
                        </Badge>
                        <Text variant="bodySm" color="subdued">
                          {theme.mentions} mentions
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          {theme.priority.toUpperCase()} PRIORITY
                        </Text>
                      </div>

                      {theme.example_quotes && theme.example_quotes.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-300">
                          <Text variant="bodySm" color="subdued">
                            "{theme.example_quotes[0]}"
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="border-t pt-4">
          <Text variant="headingMd">AI Recommendations</Text>
          <ul className="mt-3 space-y-2">
            {recommendations.length === 0 ? (
              <Text color="subdued">No recommendations yet</Text>
            ) : (
              recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <Text>{rec.recommendation}</Text>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Refresh Button */}
        <div className="border-t pt-4">
          <Button onClick={loadData} loading={loading}>
            Refresh Data
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

#### 4.2 Add to Dashboard

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
import { CustomerVoiceWidget } from '@/components/dashboard/CustomerVoiceWidget';

// In Dashboard component, add:
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Existing widgets */}
  <TopPerformers />
  <EngagementTrends />

  {/* New widget */}
  <CustomerVoiceWidget />
</div>
```

### Deliverables (Week 4)
- ✅ Customer Voice widget implemented
- ✅ Themes displayed with sentiment/priority
- ✅ Recommendations shown
- ✅ NPS score calculation working
- ✅ Date range filtering functional

---

## Sprint 5: Polish & Deploy (Week 5)

### Goals
- End-to-end testing
- Performance optimization
- Error handling
- Documentation
- Production deployment

### Tasks

#### 5.1 Error Handling & Logging

Add comprehensive error handling to all functions:

```typescript
// Example: Enhanced error handling
try {
  const responses = await fetchNPSData(...);
} catch (error) {
  console.error('NPS fetch error:', {
    guideId: guide.id,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Log to Supabase for monitoring
  await supabase
    .from('sync_logs')
    .insert({
      sync_type: 'nps',
      status: 'error',
      error_message: error.message,
      metadata: { guideId: guide.id }
    });

  throw error; // Re-throw for upstream handling
}
```

#### 5.2 Performance Optimization

- Add caching for guide metadata (refresh daily)
- Batch database inserts (upsert in chunks of 100)
- Index optimization based on query patterns
- Lazy load widget data (paginate themes if > 10)

#### 5.3 Documentation

Create comprehensive docs:

**File:** `docs/NPS_INTEGRATION_GUIDE.md`

```markdown
# NPS Integration User Guide

## Overview
The Customer Voice widget aggregates NPS feedback and uses AI to identify themes and generate recommendations.

## Data Flow
1. Daily sync extracts NPS responses from Pendo (2 AM UTC)
2. AI analysis runs weekly or when 10+ new responses
3. Dashboard displays real-time data from Supabase

## Troubleshooting

### No data showing
- Check cron job status: `SELECT * FROM cron.job WHERE jobname LIKE '%nps%';`
- Verify last sync: `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;`
- Manual trigger: `node scripts/test-nps-sync.mjs`

### AI analysis not running
- Check response count: `SELECT COUNT(*) FROM pendo_nps_responses WHERE browser_time > NOW() - INTERVAL '7 days';`
- Manual trigger: `curl -X POST [edge-function-url]/analyze-nps-with-ai -H "Authorization: Bearer [key]" -d '{"periodDays": 30}'`

## Configuration

### Change sync frequency
Edit `supabase/migrations/004_add_nps_sync_cron.sql` and redeploy.

### Add new NPS guides
1. Run `node scripts/extract-nps-guides.mjs` to find guide IDs
2. Add to `NPS_GUIDES` array in `sync-pendo-nps/index.ts`
3. Redeploy edge function
```

#### 5.4 Testing Checklist

- [ ] NPS data sync works for all guides
- [ ] Duplicate responses are handled correctly
- [ ] AI analysis produces valid themes
- [ ] Recommendations are actionable
- [ ] Dashboard widget loads in < 2s
- [ ] Date filtering works correctly
- [ ] NPS score calculation is accurate
- [ ] Error handling prevents crashes
- [ ] Cron job runs reliably
- [ ] Manual sync script works

#### 5.5 Deployment

1. Deploy database migrations
2. Deploy Supabase Edge Functions
3. Verify cron jobs
4. Test in staging
5. Deploy frontend
6. Monitor for 24 hours
7. Communicate to stakeholders

### Deliverables (Week 5)
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Production deployment successful
- ✅ Monitoring in place
- ✅ Stakeholder demo completed

---

## Post-Launch Monitoring

### Week 1 After Launch
- Monitor cron job execution
- Check data quality (missing fields, duplicates)
- Validate AI analysis accuracy
- Gather user feedback

### Week 2-4 After Launch
- Optimize based on usage patterns
- Fine-tune AI prompts if needed
- Add requested features
- Plan Phase 2 enhancements

---

## Phase 2 Enhancements (Future)

### Month 2-3
- Add more data sources (support tickets, in-app polls)
- Sentiment trend visualization
- Export capabilities (PDF reports)
- Slack notifications for high-priority themes
- Collaborative features (mark recommendations as implemented)

### Month 4-6
- Predictive analytics (churn risk based on feedback)
- Theme correlation with product usage
- Automated response suggestions
- Custom AI prompts per department

---

## Success Criteria

### Technical
- ✅ Sync success rate > 95%
- ✅ Dashboard load time < 2s
- ✅ AI analysis accuracy > 80%
- ✅ Zero data loss

### Business
- ✅ Product team uses widget weekly
- ✅ Actionable insights generated monthly
- ✅ Cost < $50/month (target: $11/month)
- ✅ Positive user feedback

---

## Support & Maintenance

### Ongoing Tasks
- Weekly: Review AI analysis quality
- Monthly: Check data completeness
- Quarterly: Optimize AI prompts
- As needed: Add new NPS guides

### Escalation
- Technical issues: Development team
- Data quality: Product team
- AI accuracy: Review with stakeholders

---

**Plan Status:** Ready for Implementation ✅
**Estimated Effort:** 5 weeks (1 developer full-time)
**Next Step:** Stakeholder approval to begin Sprint 1
