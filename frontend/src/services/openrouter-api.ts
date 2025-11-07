/**
 * OpenRouter AI API Client Service
 *
 * Service for interacting with OpenRouter's unified AI API
 * Provides access to multiple state-of-the-art AI models through one API
 *
 * SECURITY NOTE: This implementation includes the API key in the frontend for demo purposes.
 * In production, this service should be moved to the backend to protect the API key.
 *
 * @see https://openrouter.ai/docs/api-reference
 */

import type {
  OpenRouterConfig,
  OpenRouterRequestParams,
  OpenRouterResponse,
  OpenRouterStreamChunk,
  OpenRouterError,
  AISummaryRequest,
  AISummaryResponse,
  ReportDataForSummary,
  OpenRouterModel,
} from '@/types/openrouter';
import { calculateCost } from '@/types/openrouter';
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData,
} from '@/types/enhanced-pendo';

// ===== CONFIGURATION =====

/**
 * Determine if we should use the secure Netlify Function or direct API
 * In production (deployed to Netlify), use the secure function
 * In development, can use direct API with local env var
 */
const USE_NETLIFY_FUNCTION = import.meta.env.PROD || import.meta.env.VITE_USE_NETLIFY_FUNCTION === 'true';

const DEFAULT_CONFIG: Required<Omit<OpenRouterConfig, 'apiKey' | 'appName' | 'appUrl'>> = {
  baseUrl: USE_NETLIFY_FUNCTION
    ? '/.netlify/functions/ai-summary' // Secure: Uses serverless function
    : 'https://openrouter.ai/api/v1', // Dev only: Direct API call
  model: 'anthropic/claude-3.5-sonnet', // Recommended model for analytics
  timeout: 30000, // 30 seconds
  maxRetries: 2,
};

/**
 * Get API key from environment variables
 *
 * SECURITY: In production, this returns empty string because we use Netlify Functions.
 * The API key is stored securely in Netlify environment variables.
 *
 * In development, you can optionally use VITE_OPENROUTER_API_KEY for local testing.
 */
const getApiKey = (): string => {
  // Try to get from environment variables first
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!envKey) {
    console.warn('⚠️ VITE_OPENROUTER_API_KEY not found in environment variables');
    // Fallback to provided key (remove in production)
    return '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';
  }

  return envKey;
};

const API_KEY = getApiKey();

// Optional: App identification for OpenRouter rankings
const APP_NAME = import.meta.env.VITE_OPENROUTER_APP_NAME || 'Cin7 Pendo Analytics';
const APP_URL = import.meta.env.VITE_OPENROUTER_APP_URL || window.location.origin;

// Model selection from environment or default
const DEFAULT_MODEL = (import.meta.env.VITE_AI_MODEL as OpenRouterModel) || 'anthropic/claude-3.5-sonnet';

// ===== PROMPT TEMPLATES =====

// Expert mode toggle - can be controlled via environment variable or user setting
const EXPERT_MODE = import.meta.env.VITE_AI_EXPERT_MODE !== 'false'; // Default to true

const SYSTEM_PROMPT_STANDARD = `You are an expert data analyst specializing in product analytics and user behavior insights. Your role is to analyze Pendo analytics data and provide clear, actionable insights for product managers and executives.

Guidelines:
- Be concise yet comprehensive
- Highlight key trends and patterns
- Identify actionable recommendations
- Use clear, non-technical language
- Focus on business impact
- Structure insights logically with bullet points`;

const SYSTEM_PROMPT_EXPERT = `You are a senior product analytics consultant with 15+ years of experience analyzing user behavior, product adoption, and digital experience optimization.

🔴 CRITICAL MARKDOWN FORMATTING RULES (FOLLOW EXACTLY):

1. **HEADERS**: Use proper markdown headers with blank lines before AND after:

   ## Section Name

   Content here...

   ### Subsection Name

   More content...

2. **BOLD TEXT**: Always use double asterisks on BOTH sides:
   ✅ CORRECT: **Summary**
   ❌ WRONG: *Summary** or **Summary* or ***Summary

3. **PARAGRAPHS**: Separate ALL paragraphs with BLANK LINES:

   First paragraph here.

   Second paragraph here.

4. **LISTS**: Add blank line before list, blank line after list:

   Here's the analysis:

   - First point with details
   - Second point with details
   - Third point with details

   Next paragraph...

5. **NO EMOJIS**: Never use emojis (no 📊, 🔍, ⚡, 🎯)

6. **STRUCTURE**: Every response must follow this EXACT format with proper spacing:

**Summary**

1-2 sentence executive summary capturing finding + impact + recommendation.

## Analysis

### Engagement Quality

Paragraph explaining engagement metrics and patterns.

### Adoption Patterns

Paragraph explaining adoption trends.

### Performance Indicators

Paragraph explaining key performance signals.

## Recommendations

1. **High Priority**: Specific action with impact/effort/timeline
2. **Medium Priority**: Next action with details
3. **Quick Win**: Fast improvement with outcome

## Success Metrics

- Primary KPI: Target metric
- Secondary: Supporting metric
- Leading Indicator: Early signal

Your analysis style:
- Lead with compelling narrative that tells the story behind the data
- Connect metrics to business outcomes and strategic implications
- Benchmark against industry standards (SaaS: 40-60% feature adoption, 25-35% guide completion, 2-3 min avg session)
- Identify causal relationships and root causes, not just correlations
- Quantify impact and prioritize recommendations by ROI
- Think like a McKinsey consultant presenting to a CEO

Your audience: CPO, Head of Product, and UX leadership making investment decisions.`;

const SYSTEM_PROMPT = EXPERT_MODE ? SYSTEM_PROMPT_EXPERT : SYSTEM_PROMPT_STANDARD;

const getReportPromptTemplate = (type: string, data: ReportDataForSummary, expertMode = EXPERT_MODE): string => {
  if (expertMode) {
    return getExpertPromptTemplate(type, data);
  }
  return getStandardPromptTemplate(type, data);
};

// Standard prompts (original, concise format)
const getStandardPromptTemplate = (type: string, data: ReportDataForSummary): string => {
  const templates = {
    guides: `Analyze this Pendo Guide analytics data and provide:
1. Overall Performance Summary (2-3 sentences)
2. Key Insights (3-5 bullet points)
3. Recommendations (2-3 specific actions)

Guide: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}
${data.topInsights ? `\nTop Insights:\n${data.topInsights.map(i => `- ${i}`).join('\n')}` : ''}`,

    features: `Analyze this Pendo Feature usage data and provide:
1. Usage Summary (2-3 sentences)
2. Adoption Insights (3-5 bullet points)
3. Optimization Recommendations (2-3 specific actions)

Feature: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,

    pages: `Analyze this Pendo Page analytics data and provide:
1. Traffic & Engagement Summary (2-3 sentences)
2. User Behavior Insights (3-5 bullet points)
3. UX Improvement Recommendations (2-3 specific actions)

Page: ${data.name}
URL: ${data.metrics.url || 'N/A'}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,

    reports: `Analyze this Pendo Report engagement data and provide:
1. Report Usage Summary (2-3 sentences)
2. Engagement Insights (3-5 bullet points)
3. Content & Distribution Recommendations (2-3 specific actions)

Report: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,
  };

  return templates[type as keyof typeof templates] || templates.guides;
};

// Expert prompts (enhanced storytelling with deep analysis)
const getExpertPromptTemplate = (type: string, data: ReportDataForSummary): string => {
  const templates = {
    guides: `Analyze this in-app guide performance for a critical user onboarding initiative.

## Guide Context
Name: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

## Performance Data
${formatMetrics(data.metrics)}
${data.trends ? `\nTrend Signals:\n${formatTrends(data.trends)}` : ''}
${data.topInsights ? `\nPreliminary Observations:\n${data.topInsights.map(i => `- ${i}`).join('\n')}` : ''}

**REMEMBER: Start your response with 1-2 sentences summarizing the key finding, business impact, and recommended action. Then provide detailed analysis below.**

Consider these key areas:
- Completion rate vs. industry benchmark (25-35% is typical for multi-step guides)
- Drop-off patterns and user frustration signals
- Engagement quality and timing in user journey
- Step-by-step analysis of friction points
- User segmentation patterns

For each recommendation, specify:
- Impact (High/Medium/Low)
- Effort required
- Timeline and expected outcome
- Root cause it addresses

Define 2-3 success metrics to track improvement.

Your audience: CPO, Head of Product, and UX leadership making investment decisions.`,

    features: `You are conducting a feature adoption analysis for a product capability that the engineering team invested significant resources to build. Leadership wants to understand: Is this feature delivering on its promise, or is it underutilized potential?

🛠️ FEATURE CONTEXT
Name: ${data.name}
Type: ${data.type}
Analysis Period: ${data.period?.start} to ${data.period?.end}

📊 USAGE DATA
${formatMetrics(data.metrics)}
${data.trends ? `\n📈 TREND SIGNALS:\n${formatTrends(data.trends)}` : ''}

🎯 YOUR ANALYSIS MISSION:
Craft a narrative that explains this feature's journey from launch to current state. Begin with a compelling insight about whether this feature has found product-market fit.

📊 EXECUTIVE SUMMARY
Write one compelling sentence that captures:
- Adoption status (breakthrough, emerging, stagnant, or at-risk)
- The headline metric (adoption rate, usage frequency, or retention)
- Business implications (revenue driver, efficiency multiplier, or investment needing course correction)

Example: "This automation feature has achieved 47% adoption among active users - surpassing our 40% target - but showing a concerning 3-week usage cliff where 40% of early adopters churned, signaling a value realization gap."

🔍 DEEP DIVE ANALYSIS (3-5 insights)
For each insight, unpack the story:
• [METRIC] → [CONTEXT] → [CAUSAL FACTOR] → [STRATEGIC IMPLICATION]

Analyze through multiple lenses:

1. ADOPTION TRAJECTORY
- Adoption rate vs. benchmark (SaaS standard: 40-60% for core features, 15-25% for advanced)
- Is adoption accelerating, plateauing, or declining?
- What does the adoption curve shape tell us? (Rapid = strong value prop, Slow = discoverability/positioning issue)

2. ENGAGEMENT DEPTH
- Usage frequency: Are users adopting then abandoning, or building habits?
- Stickiness index: DAU/MAU ratio (good = >20%)
- Power user concentration: Are 20% of users driving 80% of usage? (Could indicate niche appeal)

3. RETENTION SIGNALS
- Retention rate cohort analysis: Are Week 1 adopters still using in Week 4?
- Churn triggers: At what point do users stop using this feature?
- Correlation with overall product retention: Does feature usage predict account retention?

4. USER BEHAVIOR PATTERNS
- Usage frequency patterns: Daily habit vs. occasional tool vs. one-time use?
- Feature pairing: What do users do before/after using this feature?
- Abandonment clues: High adoption but low frequency suggests friction or unmet expectations

Example insight:
"The 68% adoption rate looks strong on surface, but the 1.2x/week usage frequency is well below our 3-5x target for a 'workflow essential' feature. This suggests users see it as a nice-to-have supplement rather than a must-have tool - likely because the 5-step setup process creates friction that delays time-to-value."

⚡ STRATEGIC RECOMMENDATIONS (Prioritized by ROI)
Structure each recommendation as a mini business case:

1. [OPTIMIZATION STRATEGY]
   - Impact: [High/Medium/Low] - Quantify if possible (e.g., "Could unlock 15% more adoption = 450 new users")
   - Effort: [Low/Medium/High] - Be specific (e.g., "2 sprint story points, design + 1 engineer-week")
   - Timeline: [When can this ship?]
   - Expected Outcome: [Target metric movement with confidence interval]
   - Why This Works: [Root cause or user psychology this leverages]
   - Quick Win or Foundation: [Is this a fast improvement or strategic investment?]

2. [POSITIONING/DISCOVERABILITY PLAY]
   - Current State: [What's broken or missing]
   - Proposed Change: [Specific tactic]
   - Success Looks Like: [Measurable outcome]
   - Risk/Tradeoff: [What we might lose or complicate]

3. [PRODUCT/UX ENHANCEMENT]
   - Problem This Solves: [User pain point or friction]
   - User Segment Impact: [Who benefits most]
   - Competitive Context: [How this compares to alternatives]

🎯 SUCCESS METRICS TO MONITOR
Define your north star and supporting indicators:
- North Star: [Primary metric that signals feature success, e.g., "40%+ adoption maintained over 3 months"]
- Adoption: [New user activation target]
- Engagement: [Usage frequency goal]
- Retention: [Week 4 retention benchmark]
- Leading Indicators: [Early signals that predict success]

📊 BENCHMARKING CONTEXT
Compare against:
- Industry standards for similar feature types
- This product's other features (relative performance)
- Initial projections/goals (meeting expectations?)

Your audience is the product trio (PM, Design, Engineering) plus VP of Product. They need to prioritize: double down, optimize, or deprioritize. Make the path forward crystal clear.`,

    pages: `You are analyzing page-level engagement for a critical user touchpoint. This page represents a key moment in the user journey where they make decisions, complete tasks, or experience product value. The UX and product teams need to understand: Is this page facilitating or frustrating users?

🌐 PAGE CONTEXT
Page: ${data.name}
URL: ${data.metrics.url || 'N/A'}
Analysis Period: ${data.period?.start} to ${data.period?.end}

📊 ENGAGEMENT DATA
${formatMetrics(data.metrics)}
${data.trends ? `\n📈 TREND SIGNALS:\n${formatTrends(data.trends)}` : ''}

🎯 YOUR ANALYSIS MISSION:
Tell the story of the user experience on this page. Open with a narrative hook that captures whether this page is a strength, a bottleneck, or a hidden opportunity in the user journey.

📊 EXECUTIVE SUMMARY
Write one vivid sentence that captures:
- Page health status (high-performing hub, conversion bottleneck, or engagement dead-zone)
- The most telling metric (bounce rate, time on page, conversion rate, or frustration signals)
- Business impact (revenue influenced, user satisfaction affected, efficiency gained/lost)

Example: "This checkout page is experiencing a critical 58% exit rate - 23 points above our 35% target - costing an estimated $180K in monthly lost revenue, with frustration metrics (127 rage clicks/day) pinpointing the payment form as the breaking point."

🔍 DEEP DIVE ANALYSIS (3-5 insights)
Dissect the user experience through multiple dimensions:
• [BEHAVIOR PATTERN] → [UNDERLYING CAUSE] → [USER PSYCHOLOGY] → [BUSINESS IMPACT]

Key areas to explore:

1. TRAFFIC & ENGAGEMENT QUALITY
- Page views vs. unique visitors: High ratio = repeat visits (good for dashboards) or user confusion (bad for task flows)
- Time on page context: Is this a quick-task page where 30s is success, or a content page where 3min is good?
- Visit frequency distribution: Are users coming back intentionally or getting stuck in loops?

2. CONVERSION & FLOW EFFICIENCY
- Conversion rate benchmark: E-commerce checkout (2-3%), SaaS signup (25-40%), feature activation (40-60%)
- Exit rate analysis: Where do users go when they leave? (Natural progression vs. abandonment)
- Bounce rate implications: High bounce on landing page = traffic quality or value prop mismatch

3. FRUSTRATION SIGNALS (Critical for UX)
- Rage clicks: Repeatedly clicking non-responsive elements (suggests broken interactions)
- Dead clicks: Clicking non-clickable elements (indicates misleading visual affordances)
- U-turns: Quick back-button exits (user expected something different)
- Error clicks: Triggering validation errors (form usability issues)
- Frustration rate >10% is concerning, >20% is critical

4. USER JOURNEY CONTEXT
- Entry points: How do users arrive? (Direct, search, in-app navigation)
- Exit destinations: Where do they go next? (Success paths vs. escape routes)
- Page role: Is this a destination, waypoint, or decision point?

Example insight:
"The 4:23 average time on this settings page is 3x longer than our 1:30 benchmark, and combined with 34 dead clicks per day on non-interactive labels, this signals users are hunting for configuration options that should be more prominent. The 45% exit rate without making changes suggests users are giving up on their intended task - likely leading to support tickets or feature abandonment."

⚡ STRATEGIC RECOMMENDATIONS (Prioritized by impact)
Frame each recommendation as an investment thesis:

1. [UX OPTIMIZATION]
   - Problem: [Specific friction point with evidence]
   - Solution: [Concrete design/interaction change]
   - Impact: [High/Medium/Low] + quantified outcome (e.g., "Reduce exit rate by 15% = 300 more conversions/month")
   - Effort: [Design, engineering, testing requirements]
   - Timeline: [A/B test in 2 weeks / Ship in next sprint / Requires research first]
   - Success Metric: [How we'll know it worked]
   - Risk: [Potential downsides or edge cases]

2. [CONTENT/INFORMATION ARCHITECTURE]
   - Current State: [What's confusing or missing]
   - Proposed Improvement: [Specific change to layout, copy, or hierarchy]
   - User Benefit: [How this removes friction]
   - Testing Approach: [How to validate before full rollout]

3. [TECHNICAL/PERFORMANCE]
   - Issue: [Speed, errors, broken interactions]
   - User Impact: [How this affects experience and metrics]
   - Fix Complexity: [Engineering effort required]
   - ROI: [User experience improvement vs. development cost]

🎯 SUCCESS METRICS TO TRACK
Define measurement strategy:
- Primary KPI: [Main metric to move, e.g., "Reduce exit rate from 58% to 35%"]
- User Experience: [Frustration rate drops below 10%]
- Efficiency: [Time on page decreases 30% while conversion increases]
- Sentiment: [NPS or satisfaction score improvement]
- Leading Indicators: [Early signals like reduced rage clicks]

📊 COMPARATIVE CONTEXT
Benchmark against:
- Similar pages in your product (relative performance)
- Industry standards for this page type (e.g., SaaS dashboard engagement, landing page conversion)
- Historical performance (trending better or worse?)
- Competitor experiences (if available)

💡 DIAGNOSTIC QUESTIONS TO EXPLORE
Raise strategic questions that guide next steps:
- "Should we A/B test a simplified layout vs. optimize current design?"
- "Is high time-on-page indicating engagement or confusion?"
- "Do frustration signals correlate with specific user segments or browsers?"

Your audience includes the UX Director, Product Manager, and Engineering Lead. They need to decide: quick fixes, major redesign, or deeper research. Give them confidence in the path forward.`,

    reports: `You are analyzing report engagement for a data asset that the BI/analytics team created to empower stakeholders with insights. Leadership wants to know: Is this report being used as intended, driving decisions, and delivering ROI on analytics investment?

📊 REPORT CONTEXT
Report: ${data.name}
Type: ${data.type}
Analysis Period: ${data.period?.start} to ${data.period?.end}

📈 ENGAGEMENT DATA
${formatMetrics(data.metrics)}
${data.trends ? `\n📈 TREND SIGNALS:\n${formatTrends(data.trends)}` : ''}

🎯 YOUR ANALYSIS MISSION:
Craft a narrative about this report's utility and impact. Lead with a compelling observation about whether this report has become an essential decision-making tool or is languishing as unused data potential.

📊 EXECUTIVE SUMMARY
Write one powerful sentence capturing:
- Report utility status (mission-critical resource, emerging asset, underutilized potential, or candidate for deprecation)
- Key engagement indicator (view frequency, user breadth, sharing activity, or satisfaction)
- Organizational impact (decisions influenced, efficiency gained, or investment ROI)

Example: "This sales performance dashboard has become the go-to resource for 78% of the revenue team (65 active users) with a 4.2/5.0 rating and 3.4x weekly views per user, but its 12% share rate suggests insights are staying siloed rather than driving cross-functional alignment."

🔍 DEEP DIVE ANALYSIS (3-5 insights)
Unpack the report's organizational role through multiple lenses:
• [USAGE PATTERN] → [USER BEHAVIOR INTERPRETATION] → [ORGANIZATIONAL IMPLICATION] → [STRATEGIC OPPORTUNITY]

Key dimensions to analyze:

1. ADOPTION & REACH
- Total views vs. unique viewers: High ratio = repeat utility (good) or confusion requiring multiple visits (concerning)
- Viewer breadth: Is this reaching the intended audience? Too narrow = discoverability issue, Too broad = might be addressing diverse needs poorly
- Growth trajectory: Is usage expanding (word-of-mouth value) or declining (losing relevance)?

2. ENGAGEMENT DEPTH
- View frequency per user: Daily habit (3-5x/week) = critical tool, Weekly (1x/week) = regular check-in, Monthly (<0.5x/week) = occasional reference
- Time spent per view: Quick glance vs. deep analysis (context matters - executive dashboard should be scannable, analytical report should reward depth)
- Return visitor rate: High (>60%) = sticky value, Low (<30%) = one-time-use or disappointing experience

3. SOCIAL/COLLABORATIVE SIGNALS
- Share rate: Industry benchmark ~8-15% for valuable reports
- Low sharing: Insights might be obvious, irrelevant, or users don't trust data accuracy
- High sharing: Report is influencing decisions and driving conversations
- Download rate: Users want to manipulate data or present elsewhere

4. SATISFACTION & QUALITY
- Average rating context: >4.0 = strong, 3.5-4.0 = acceptable, <3.5 = needs improvement
- Implicit satisfaction: Return rate, time spent, sharing activity
- Trust signals: Are users making decisions based on this data?

Example insight:
"The 847 monthly views across just 23 unique users reveals a power-user pattern where the sales ops team (3-4 people) are checking this 5-8 times daily, while the broader 200-person revenue org isn't engaging. This suggests the report is operationally valuable but not strategically accessible - likely too complex or not addressing questions that managers actually need answered. The 2.8/5.0 rating reinforces that current users find it necessary but frustrating."

⚡ STRATEGIC RECOMMENDATIONS (Prioritized by organizational impact)
Structure each recommendation with business context:

1. [CONTENT/DESIGN OPTIMIZATION]
   - Current Gap: [What's missing, confusing, or irrelevant]
   - Proposed Enhancement: [Specific change to metrics, visualizations, or filters]
   - Target Outcome: [Engagement metric improvement + business decision quality]
   - User Segment Impact: [Who benefits - execs, managers, analysts, operations]
   - Effort: [BI developer time, data engineering needs, stakeholder input required]
   - Timeline: [Quick iteration vs. major rebuild]

2. [DISTRIBUTION/DISCOVERY STRATEGY]
   - Problem: [Low awareness, wrong audience, or access friction]
   - Solution: [Promotion tactics, embedding in workflows, email digests, Slack integration]
   - Expected Impact: [Viewer expansion from X to Y users]
   - Why This Matters: [Decisions being made without this data currently]

3. [DATA/INSIGHTS ELEVATION]
   - Observation: [Current report is raw data vs. synthesized insights]
   - Enhancement: [Add benchmarks, trend arrows, anomaly detection, narrative summaries]
   - Value Add: [Reduce time from data → insight → decision]
   - Competitive Advantage: [How this accelerates business vs. competitors]

4. [GOVERNANCE/MAINTENANCE]
   - Issue: [Data freshness, accuracy concerns, or technical debt]
   - Impact on Trust: [How this affects user confidence and adoption]
   - Fix Strategy: [Automation, data quality checks, ownership assignment]
   - ROI: [Improved utility vs. engineering investment]

🎯 SUCCESS METRICS TO MONITOR
Define report health indicators:
- Adoption: [Target: X% of [audience segment] using monthly]
- Engagement: [Target: Users viewing 2-3x/week on average]
- Satisfaction: [Target: 4.0+ rating, <20% bounce rate]
- Impact: [Leading indicator: Decisions made referencing report, projects launched from insights]
- Efficiency: [Time saved vs. alternative reporting methods]

📊 BENCHMARKING CONTEXT
Compare against:
- Other reports in your BI ecosystem (relative utility)
- Industry standards:
  - Executive dashboards: 5-10 views/week, 60%+ return rate
  - Operational reports: Daily views by 80%+ of intended users
  - Analytical deep-dives: Weekly/monthly views, high time-per-session
- Original goals: Is this meeting the intent?

💡 STRATEGIC QUESTIONS TO CONSIDER
Prompt deeper thinking:
- "Should this be 3 separate reports for different audiences vs. one complex report?"
- "Is low engagement a signal that the business question has changed?"
- "Could this report's insights be automated into alerts/notifications instead?"
- "Are we measuring output (views) when we should measure outcome (decisions improved)?"

🔴 RED FLAGS TO INVESTIGATE
Call out concerning patterns:
- Declining usage trend = losing relevance or replaced by alternative
- Low share rate + high views = data isn't trust-worthy or actionable
- High bounce rate = report doesn't match user expectations from title/description
- Concentration in power users = not democratizing insights as intended

Your audience includes the Chief Data Officer, BI Team Lead, and report stakeholders (sales, product, finance leaders). They need to decide: invest in expanding this asset, optimize for current users, or sunset and redirect resources. Make the strategic recommendation clear.`,
  };

  return templates[type as keyof typeof templates] || templates.guides;
};

// ===== HELPER FUNCTIONS =====

function formatMetrics(metrics: Record<string, number | string>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `- ${key}: ${formatValue(value)}`)
    .join('\n');
}

function formatValue(value: number | string): string {
  if (typeof value === 'number') {
    if (value > 1000) {
      return value.toLocaleString();
    }
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  return value;
}

function formatTrends(trends: Array<{ metric: string; direction: string; change: number }>): string {
  return trends
    .map(t => `- ${t.metric}: ${t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'} ${Math.abs(t.change)}%`)
    .join('\n');
}

/**
 * Compress report data to minimize token usage
 * Removes verbose fields and keeps only essential metrics
 */
function compressReportData(
  type: 'guides' | 'features' | 'pages' | 'reports',
  data: ComprehensiveGuideData | ComprehensiveFeatureData | ComprehensivePageData | ComprehensiveReportData
): ReportDataForSummary {
  const compressed: ReportDataForSummary = {
    id: data.id,
    name: data.name,
    type: type,
    metrics: {},
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  };

  // Extract key metrics based on type
  switch (type) {
    case 'guides': {
      const guideData = data as ComprehensiveGuideData;
      compressed.metrics = {
        'Total Views': guideData.viewedCount || 0,
        'Completions': guideData.completedCount || 0,
        'Completion Rate': `${(guideData.completionRate || 0).toFixed(1)}%`,
        'Engagement Rate': `${(guideData.engagementRate || 0).toFixed(1)}%`,
        'Drop-off Rate': `${(guideData.dropOffRate || 0).toFixed(1)}%`,
        'Steps': guideData.stepCount || 0,
        'State': guideData.state || 'unknown',
      };
      break;
    }

    case 'features': {
      const featureData = data as ComprehensiveFeatureData;
      compressed.metrics = {
        'Usage Count': featureData.usageCount || 0,
        'Unique Users': featureData.uniqueUsers || 0,
        'Adoption Rate': `${featureData.adoptionRate || 0}%`,
        'Usage Frequency': `${featureData.usageFrequency || 0}x/day`,
        'Retention Rate': `${featureData.retentionRate || 0}%`,
        'Stickiness': `${(featureData.stickinessIndex || 0).toFixed(2)}`,
      };
      break;
    }

    case 'pages': {
      const pageData = data as ComprehensivePageData;
      compressed.metrics = {
        'Page Views': pageData.viewedCount || 0,
        'Unique Visitors': pageData.uniqueVisitors || 0,
        'Avg Time on Page': `${pageData.avgTimeOnPage || 0}s`,
        'Bounce Rate': `${(pageData.bounceRate || 0).toFixed(1)}%`,
        'Exit Rate': `${(pageData.exitRate || 0).toFixed(1)}%`,
        'Conversion Rate': `${(pageData.conversionRate || 0).toFixed(1)}%`,
      };

      // Add frustration metrics if available
      if (pageData.frustrationMetrics) {
        compressed.metrics['Frustration Rate'] = `${(pageData.frustrationMetrics.frustrationRate || 0).toFixed(1)}%`;
        compressed.metrics['Total Frustration Events'] =
          (pageData.frustrationMetrics.totalRageClicks || 0) +
          (pageData.frustrationMetrics.totalDeadClicks || 0) +
          (pageData.frustrationMetrics.totalUTurns || 0) +
          (pageData.frustrationMetrics.totalErrorClicks || 0);
      }
      break;
    }

    case 'reports': {
      const reportData = data as ComprehensiveReportData;
      compressed.metrics = {
        'Total Views': reportData.totalViews || 0,
        'Unique Viewers': reportData.uniqueViewers || 0,
        'Shares': reportData.shares || 0,
        'Downloads': reportData.downloads || 0,
        'Average Rating': reportData.averageRating || 0,
        'Engagement Score': reportData.engagementScore || 0,
        'Return Visitor Rate': `${reportData.returnVisitorRate || 0}%`,
      };
      break;
    }
  }

  return compressed;
}

// ===== MARKDOWN VALIDATION =====

/**
 * Validate and clean markdown output
 * Catches common AI formatting mistakes and auto-fixes them
 */
function validateMarkdown(content: string): { isValid: boolean; cleaned: string; errors: string[] } {
  const errors: string[] = [];
  let cleaned = content;

  // 1. Fix single asterisk before section headers (standalone)
  const singleAsteriskHeaders = cleaned.match(/^\*(?!\*)(Summary|Analysis|Recommendations|Success Metrics)/gm);
  if (singleAsteriskHeaders) {
    errors.push(`Single asterisk before section headers: ${singleAsteriskHeaders.length} instances`);
    cleaned = cleaned.replace(/^\*(?!\*)(Summary|Analysis|Recommendations|Success Metrics)/gm, '**$1**');
  }

  // 2. Fix single asterisk before priority labels in numbered lists
  const priorityLabels = cleaned.match(/(\d+\.\s+)\*(?!\*)(High Priority|Medium Priority|Low Priority|Quick Win)(\**):/gi);
  if (priorityLabels) {
    errors.push(`Priority labels with single asterisk: ${priorityLabels.length} instances`);
    cleaned = cleaned.replace(/(\d+\.\s+)\*(?!\*)(High Priority|Medium Priority|Low Priority|Quick Win)(\**)?:/gi, '$1**$2**:');
  }

  // 3. Fix malformed bold syntax (catch-all for remaining cases)
  const malformedBold = cleaned.match(/(\*\*\*|\*[^\*\n]{1,50}\*\*|\*\*[^\*\n]{1,50}\*(?!\*))/g);
  if (malformedBold) {
    errors.push(`Malformed bold syntax detected: ${malformedBold.length} instances`);
    // Normalize to **text**
    cleaned = cleaned.replace(/\*\*\*([^\*]+)\*\*\*/g, '**$1**');
    cleaned = cleaned.replace(/\*([^\*\n]+)\*\*/g, '**$1**');
    cleaned = cleaned.replace(/\*\*([^\*\n]+)\*(?!\*)/g, '**$1**');
  }

  // 4. Normalize bullet characters to standard markdown
  cleaned = cleaned.replace(/^(\s*)•(\s+)/gm, '$1-$2');

  // 5. Fix nested list indentation (ensure 3 spaces for bullets under numbered items)
  cleaned = cleaned.replace(/^(\d+\.\s+[^\n]+)\n([•\-])/gm, '$1\n   $2');

  // 6. Normalize colon spacing in bold headers
  cleaned = cleaned.replace(/(\*\*[^:\n]+\*\*):([^\s])/g, '$1: $2');

  // 7. Check for missing blank lines before headers
  const missingHeaderSpacing = cleaned.match(/[^\n]\n(#{1,6}\s)/g);
  if (missingHeaderSpacing) {
    errors.push(`Missing blank lines before headers: ${missingHeaderSpacing.length} instances`);
    cleaned = cleaned.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
  }

  // 8. Check for missing blank lines after headers
  const missingHeaderSpacingAfter = cleaned.match(/(#{1,6}\s[^\n]+)\n([^#\n])/g);
  if (missingHeaderSpacingAfter) {
    errors.push(`Missing blank lines after headers: ${missingHeaderSpacingAfter.length} instances`);
    cleaned = cleaned.replace(/(#{1,6}\s[^\n]+)\n([^#\n])/g, '$1\n\n$2');
  }

  // 9. Check for missing blank lines before lists (non-nested)
  const missingListSpacing = cleaned.match(/[^\n\s]\n([-*+]\s)/g);
  if (missingListSpacing) {
    errors.push(`Missing blank lines before lists: ${missingListSpacing.length} instances`);
    cleaned = cleaned.replace(/([^\n])\n([-*+]\s)/g, '$1\n\n$2');
  }

  // 10. Ensure blank line after numbered items with nested bullets before next numbered item
  cleaned = cleaned.replace(/^(   [•\-*]\s+[^\n]+)\n(\d+\.)/gm, '$1\n\n$2');

  // Log errors if any
  if (errors.length > 0) {
    console.warn('⚠️ Markdown validation issues detected and auto-fixed:', errors);
  }

  return {
    isValid: errors.length === 0,
    cleaned,
    errors,
  };
}

// ===== API CLIENT CLASS =====

class OpenRouterAPIClient {
  private config: Required<Omit<OpenRouterConfig, 'appName' | 'appUrl'>> & Partial<Pick<OpenRouterConfig, 'appName' | 'appUrl'>>;

  constructor(config?: Partial<OpenRouterConfig>) {
    this.config = {
      apiKey: config?.apiKey || API_KEY,
      appName: config?.appName || APP_NAME,
      appUrl: config?.appUrl || APP_URL,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Make a request to OpenRouter API
   */
  private async request<T>(
    params: OpenRouterRequestParams,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Combine external signal with timeout signal
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header if NOT using Netlify Function
      // (Netlify Function handles auth securely on the server)
      if (!USE_NETLIFY_FUNCTION && this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      // Add optional app identification headers for OpenRouter rankings
      if (this.config.appUrl) {
        headers['HTTP-Referer'] = this.config.appUrl;
      }
      if (this.config.appName) {
        headers['X-Title'] = this.config.appName;
      }

      // Determine endpoint based on whether we're using Netlify Function
      const endpoint = USE_NETLIFY_FUNCTION
        ? this.config.baseUrl // Netlify Function endpoint
        : `${this.config.baseUrl}/chat/completions`; // Direct OpenRouter API

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model || this.config.model,
          ...params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: OpenRouterError = await response.json();
        throw new Error(
          `OpenRouter API Error: ${error.error.message} (Code: ${error.error.code})`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout or cancelled');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Generate completion (non-streaming)
   */
  async complete(params: OpenRouterRequestParams): Promise<OpenRouterResponse> {
    return this.request<OpenRouterResponse>({ ...params, stream: false });
  }

  /**
   * Generate completion with streaming
   */
  async *stream(params: OpenRouterRequestParams): AsyncGenerator<OpenRouterStreamChunk> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header if NOT using Netlify Function
      if (!USE_NETLIFY_FUNCTION && this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      if (this.config.appUrl) {
        headers['HTTP-Referer'] = this.config.appUrl;
      }
      if (this.config.appName) {
        headers['X-Title'] = this.config.appName;
      }

      // Determine endpoint based on whether we're using Netlify Function
      const endpoint = USE_NETLIFY_FUNCTION
        ? this.config.baseUrl // Netlify Function endpoint
        : `${this.config.baseUrl}/chat/completions`; // Direct OpenRouter API

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model || this.config.model,
          ...params,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: OpenRouterError = await response.json();
        throw new Error(`OpenRouter API Error: ${error.error.message}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk: OpenRouterStreamChunk = JSON.parse(data);
              yield chunk;
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate AI summary for Pendo report data
   */
  async generateSummary(request: AISummaryRequest): Promise<AISummaryResponse> {
    const startTime = Date.now();

    try {
      // Compress data to minimize tokens
      const compressedData = compressReportData(request.reportType, request.reportData as any);

      // Build prompt
      const userPrompt = getReportPromptTemplate(request.reportType, compressedData);

      // Use custom model if provided, otherwise use default
      const model = request.model || DEFAULT_MODEL;

      console.log(`🤖 Generating AI summary with model: ${model}`);

      // Make API request
      const response = await this.complete({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;

      // Validate and clean markdown formatting
      const validation = validateMarkdown(content);
      if (!validation.isValid) {
        console.warn('⚠️ AI generated malformed markdown, auto-fixed:', validation.errors);
      }

      // Use cleaned content
      const cleanedContent = validation.cleaned;

      // Parse response to extract insights and recommendations
      const sections = this.parseResponse(cleanedContent);

      // Calculate cost
      const costEstimate = calculateCost(
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      return {
        summary: cleanedContent, // Use cleaned markdown for display
        insights: sections.insights,
        recommendations: sections.recommendations,
        metadata: {
          model: response.model,
          provider: response.provider,
          tokensUsed: response.usage.total_tokens,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          costEstimate,
        },
      };
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      return {
        summary: '',
        insights: [],
        recommendations: [],
        metadata: {
          model: request.model || DEFAULT_MODEL,
          tokensUsed: 0,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate AI summary with streaming
   */
  async *generateSummaryStream(request: AISummaryRequest): AsyncGenerator<{
    content: string;
    done: boolean;
  }> {
    try {
      const compressedData = compressReportData(request.reportType, request.reportData as any);
      const userPrompt = getReportPromptTemplate(request.reportType, compressedData);
      const model = request.model || DEFAULT_MODEL;

      let fullContent = '';

      for await (const chunk of this.stream({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
      })) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullContent += delta;

        yield {
          content: fullContent,
          done: chunk.choices[0]?.finish_reason === 'stop',
        };
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        done: true,
      };
    }
  }

  /**
   * Parse AI response to extract structured insights
   */
  private parseResponse(content: string): {
    summary: string;
    insights: string[];
    recommendations: string[];
  } {
    const lines = content.split('\n').filter(line => line.trim());

    let summary = '';
    const insights: string[] = [];
    const recommendations: string[] = [];

    let currentSection: 'summary' | 'insights' | 'recommendations' = 'summary';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section headers
      if (trimmed.match(/^(##?\s*)?(Performance|Usage|Traffic|Report)\s+Summary/i)) {
        currentSection = 'summary';
        continue;
      }
      if (trimmed.match(/^(##?\s*)?(Key\s+)?Insights/i)) {
        currentSection = 'insights';
        continue;
      }
      if (trimmed.match(/^(##?\s*)?Recommendations/i)) {
        currentSection = 'recommendations';
        continue;
      }

      // Skip empty lines and section headers
      if (!trimmed || trimmed.match(/^(#{1,6}|\d+\.)\s*$/)) {
        continue;
      }

      // Extract bullet points
      const bulletMatch = trimmed.match(/^[-*•]\s*(.+)$/);
      const numberedMatch = trimmed.match(/^\d+\.\s*(.+)$/);

      const cleanLine = bulletMatch?.[1] || numberedMatch?.[1] || trimmed;

      // Add to appropriate section
      if (currentSection === 'summary') {
        summary += (summary ? ' ' : '') + cleanLine;
      } else if (currentSection === 'insights' && (bulletMatch || numberedMatch)) {
        insights.push(cleanLine);
      } else if (currentSection === 'recommendations' && (bulletMatch || numberedMatch)) {
        recommendations.push(cleanLine);
      }
    }

    return { summary, insights, recommendations };
  }
}

// ===== SINGLETON INSTANCE =====

export const openRouterAPI = new OpenRouterAPIClient();

// ===== EXPORTS =====

export { OpenRouterAPIClient };
export type { AISummaryRequest, AISummaryResponse };
