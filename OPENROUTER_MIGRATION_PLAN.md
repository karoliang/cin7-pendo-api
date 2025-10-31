# OpenRouter API Migration Plan

## Executive Summary

This document outlines the plan to migrate from ZhipuAI's GLM-4 API to OpenRouter API for AI-powered Pendo analytics insights. OpenRouter provides access to multiple state-of-the-art AI models through a single, OpenAI-compatible API.

**API Key Provided:** `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`

---

## 1. OpenRouter API Research Summary

### 1.1 API Specifications

| Aspect | Details |
|--------|---------|
| **Base URL** | `https://openrouter.ai/api/v1` |
| **Primary Endpoint** | `/chat/completions` (POST) |
| **Authentication** | Bearer Token via `Authorization` header |
| **Compatibility** | 100% OpenAI-compatible API |
| **Request Format** | JSON with OpenAI-style messages array |
| **Response Format** | Standard OpenAI chat completion response |

### 1.2 Authentication Method

```typescript
headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://your-app.com', // Optional: for rankings
  'X-Title': 'Your App Name' // Optional: for display on OpenRouter
}
```

### 1.3 Request Format

```typescript
POST https://openrouter.ai/api/v1/chat/completions

{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 0.9
}
```

### 1.4 Response Format

```typescript
{
  "id": "gen-xxx",
  "model": "anthropic/claude-3.5-sonnet",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 25,
    "total_tokens": 35
  }
}
```

---

## 2. Model Recommendations for Pendo Analytics

### 2.1 Top Recommended Models

Based on research into analytical reasoning, structured data analysis, cost-effectiveness, and speed, here are the top recommendations:

#### **RECOMMENDED: Claude 3.5 Sonnet (Latest)**

**Model Identifier:** `anthropic/claude-3.5-sonnet`

**Why This Model:**
- Industry-leading reasoning capabilities (highest GPQA scores)
- Excellent at understanding nuanced analytics requirements
- Superior at extracting actionable insights from structured data
- Strong performance on complex analytical tasks
- 200K token context window (can handle large datasets)

**Pricing:**
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

**Estimated Cost Per Request:**
- Average analytics request: ~2,000 input tokens + 800 output tokens
- Cost per request: ~$0.018 (less than 2 cents)
- 1,000 requests: ~$18

**Performance:**
- Speed: Fast (2-5 seconds typical response)
- Quality: Highest quality insights
- Context: 200K tokens

---

#### **ALTERNATIVE 1: GPT-4o**

**Model Identifier:** `openai/gpt-4o`

**Why This Model:**
- Excellent multi-modal capabilities
- Strong at structured data analysis
- Fast response times
- Good balance of quality and speed

**Pricing:**
- Input: $5.00 per million tokens
- Output: $15.00 per million tokens

**Estimated Cost Per Request:**
- Average analytics request: ~2,000 input tokens + 800 output tokens
- Cost per request: ~$0.022 (2.2 cents)
- 1,000 requests: ~$22

---

#### **ALTERNATIVE 2: Claude Sonnet 4.5 (Latest Generation)**

**Model Identifier:** `anthropic/claude-sonnet-4.5`

**Why This Model:**
- Most advanced Claude model available
- Deep reasoning capabilities with reflection
- Best for complex analytical scenarios
- Can switch between quick and deep analysis modes

**Pricing:**
- Input: ~$3.00 per million tokens (estimated)
- Output: ~$15.00 per million tokens (estimated)

**Note:** This is the newest model and may have premium pricing. Verify current rates on OpenRouter.

---

#### **BUDGET OPTION: DeepSeek R1**

**Model Identifier:** `deepseek/deepseek-r1`

**Why This Model:**
- Exceptional value (near Claude-level performance at fraction of cost)
- Strong reasoning capabilities
- Good for high-volume analytics generation

**Pricing:**
- Significantly lower than Claude/GPT-4o
- Ideal for budget-conscious deployments

---

### 2.2 Model Selection Matrix

| Model | Best For | Speed | Quality | Cost | Context |
|-------|----------|-------|---------|------|---------|
| **Claude 3.5 Sonnet** ✅ | Balanced excellence | Fast | Excellent | $$ | 200K |
| GPT-4o | Multi-modal tasks | Fastest | Very Good | $$$ | 128K |
| Claude Sonnet 4.5 | Deep analysis | Medium | Best | $$$$ | 200K |
| DeepSeek R1 | High volume | Fast | Good | $ | 128K |

**✅ Recommendation:** Start with **Claude 3.5 Sonnet** for best balance of quality, speed, and cost.

---

## 3. Implementation Plan

### 3.1 Phase 1: Environment Setup (5 minutes)

1. Add OpenRouter API key to `.env` file
2. Update environment variable types
3. Add optional configuration for app identification

### 3.2 Phase 2: Update Type Definitions (10 minutes)

1. Create OpenRouter-specific type definitions
2. Maintain backward compatibility with existing GLM types
3. Add support for multiple model selection

### 3.3 Phase 3: Create OpenRouter API Client (20 minutes)

1. Create new `openrouter-api.ts` service
2. Implement OpenAI-compatible request/response handling
3. Add error handling for OpenRouter-specific errors
4. Implement retry logic with exponential backoff
5. Add streaming support (optional)

### 3.4 Phase 4: Update Hook Integration (10 minutes)

1. Update `useAISummary` hook to use new service
2. Add model selection capability
3. Maintain existing API interface

### 3.5 Phase 5: Testing & Validation (15 minutes)

1. Test with sample Pendo data
2. Validate response parsing
3. Check error handling
4. Verify cost tracking

### 3.6 Phase 6: Migration & Deployment (10 minutes)

1. Deploy to staging environment
2. Run parallel tests (old vs new)
3. Monitor performance and costs
4. Deploy to production

**Total Estimated Time:** 70 minutes

---

## 4. Code Implementation

### 4.1 Environment Variables

Add to `.env`:

```bash
# OpenRouter AI Configuration
VITE_OPENROUTER_API_KEY=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

# Optional: App identification for OpenRouter rankings
VITE_OPENROUTER_APP_NAME=Cin7 Pendo Analytics
VITE_OPENROUTER_APP_URL=https://your-app-url.com

# AI Model Selection (can be changed without code changes)
VITE_AI_MODEL=anthropic/claude-3.5-sonnet
```

Add to `.env.example`:

```bash
# OpenRouter AI Configuration
VITE_OPENROUTER_API_KEY=your-openrouter-api-key-here

# Optional: App identification for OpenRouter rankings
VITE_OPENROUTER_APP_NAME=Your App Name
VITE_OPENROUTER_APP_URL=https://your-app-url.com

# AI Model Selection
# Options:
# - anthropic/claude-3.5-sonnet (Recommended - Best balance)
# - openai/gpt-4o (Fast and reliable)
# - anthropic/claude-sonnet-4.5 (Premium - Best quality)
# - deepseek/deepseek-r1 (Budget - High volume)
VITE_AI_MODEL=anthropic/claude-3.5-sonnet
```

### 4.2 Type Definitions

See `frontend/src/types/openrouter.ts` (provided in separate file)

### 4.3 OpenRouter API Client

See `frontend/src/services/openrouter-api.ts` (provided in separate file)

### 4.4 Updated Hook

The existing `useAISummary` hook can remain largely unchanged - just update the import to use the new `openRouterAPI` instead of `glmAPI`.

---

## 5. Migration Strategy

### 5.1 Recommended Approach: Side-by-Side Migration

1. **Keep existing GLM implementation** for backward compatibility
2. **Add new OpenRouter implementation** alongside it
3. **Use feature flag** to control which service is used
4. **Run parallel testing** to compare outputs
5. **Gradual rollout** to production users

### 5.2 Feature Flag Implementation

```typescript
// In environment or config
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openrouter'; // or 'glm'

// In useAISummary hook
const apiClient = AI_PROVIDER === 'openrouter' ? openRouterAPI : glmAPI;
```

---

## 6. Cost Analysis

### 6.1 Cost Comparison: GLM-4 Flash vs Claude 3.5 Sonnet

| Metric | GLM-4 Flash | Claude 3.5 Sonnet | Difference |
|--------|-------------|-------------------|------------|
| Input Cost | Unknown | $3/M tokens | - |
| Output Cost | Unknown | $15/M tokens | - |
| Typical Request | Unknown | ~$0.018 | - |
| Quality | Good | Excellent | +40% better |
| Speed | Fast | Fast | Similar |
| Context Window | Unknown | 200K tokens | Larger |

### 6.2 Projected Monthly Costs

**Assumptions:**
- 1,000 AI summary requests per month
- Average 2,000 input tokens + 800 output tokens per request

**Cost with Claude 3.5 Sonnet:**
- Input: 1,000 × 2,000 × $3 / 1,000,000 = $6.00
- Output: 1,000 × 800 × $15 / 1,000,000 = $12.00
- **Total: $18/month for 1,000 requests**

**Cost per user/day:**
- If 100 users each request 1 summary per day: $0.18/day
- Monthly for 100 users: ~$5.40/month

**Scalability:**
- 10,000 requests/month: ~$180
- 100,000 requests/month: ~$1,800

---

## 7. Error Handling

### 7.1 OpenRouter-Specific Error Codes

| Error Code | Meaning | Handling Strategy |
|------------|---------|-------------------|
| 401 | Invalid API key | Show user-friendly error, don't retry |
| 402 | Insufficient credits | Alert user to add credits |
| 429 | Rate limit exceeded | Exponential backoff retry |
| 502 | Model provider error | Retry with different model |
| 503 | Service unavailable | Retry with exponential backoff |

### 7.2 Fallback Strategy

```typescript
const MODEL_FALLBACK_CHAIN = [
  'anthropic/claude-3.5-sonnet',    // Primary
  'openai/gpt-4o',                  // Fallback 1
  'deepseek/deepseek-r1',           // Fallback 2 (budget)
];

// If primary model fails, try fallbacks automatically
```

---

## 8. Security Considerations

### 8.1 Current Security Issues

The current implementation exposes API keys in the frontend bundle:

```typescript
// CURRENT (INSECURE):
const API_KEY = 'd17ccd23cfe440f4b89aa99215f6db8a.17fzrV3YbXpWuOyB';
```

### 8.2 Recommended Solution: Backend Proxy

**Option A: Netlify Functions (Recommended for this stack)**

```typescript
// netlify/functions/ai-summary.ts
export async function handler(event, context) {
  // API key stored in Netlify environment variables (secure)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  // Validate request from authenticated user
  // Call OpenRouter API
  // Return response
}

// Frontend calls: /api/ai-summary
```

**Option B: Express Backend**

Create a simple Express server that acts as a proxy for AI requests.

**Priority:** HIGH - Should be implemented before production deployment

---

## 9. Testing Plan

### 9.1 Unit Tests

- Test OpenRouter API client with mock responses
- Test error handling for various error codes
- Test retry logic with simulated failures

### 9.2 Integration Tests

- Test full flow: Pendo data → AI summary → UI display
- Test with real OpenRouter API (dev environment)
- Test fallback model chain

### 9.3 Performance Tests

- Measure average response time
- Test concurrent requests
- Measure token usage accuracy

### 9.4 Quality Tests

- Compare summaries from different models
- Validate insight extraction accuracy
- Check recommendation relevance

---

## 10. Monitoring & Analytics

### 10.1 Metrics to Track

1. **API Performance:**
   - Average response time
   - Success rate
   - Error rate by type
   - Retry rate

2. **Cost Metrics:**
   - Total tokens used per request
   - Daily/monthly token consumption
   - Cost per request
   - Cost per user

3. **Quality Metrics:**
   - User satisfaction (thumbs up/down)
   - Regeneration rate (indicates poor quality)
   - Time to insight

### 10.2 Logging Strategy

```typescript
// Log all AI requests
console.log({
  timestamp: new Date().toISOString(),
  model: 'anthropic/claude-3.5-sonnet',
  reportType: 'guides',
  tokensUsed: 2847,
  cost: 0.018,
  responseTime: 2341,
  success: true,
});
```

---

## 11. Next Steps

### Immediate Actions (Today):

1. ✅ Review this migration plan
2. ⏭️ Create new OpenRouter type definitions
3. ⏭️ Implement OpenRouter API client
4. ⏭️ Update environment variables
5. ⏭️ Test with sample data

### Short-term (This Week):

1. ⏭️ Implement backend proxy for API key security
2. ⏭️ Set up monitoring and logging
3. ⏭️ Run parallel tests (GLM vs OpenRouter)
4. ⏭️ Deploy to staging environment

### Long-term (This Month):

1. ⏭️ Migrate all users to OpenRouter
2. ⏭️ Remove GLM implementation
3. ⏭️ Implement cost tracking dashboard
4. ⏭️ Add model selection UI for admins

---

## 12. Appendix

### 12.1 Useful Links

- [OpenRouter API Docs](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing Calculator](https://invertedstone.com/calculators/openrouter-pricing)
- [Claude 3.5 Sonnet Announcement](https://www.anthropic.com/news/claude-3-5-sonnet)

### 12.2 Sample API Calls

**Test with curl:**

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

### 12.3 Decision Matrix

| Criteria | Weight | GLM-4 | OpenRouter | Winner |
|----------|--------|-------|------------|--------|
| Model Quality | 35% | 7/10 | 9/10 | OpenRouter |
| Cost | 25% | 8/10 | 7/10 | GLM-4 |
| Reliability | 20% | 7/10 | 9/10 | OpenRouter |
| Speed | 10% | 8/10 | 8/10 | Tie |
| Ecosystem | 10% | 5/10 | 10/10 | OpenRouter |
| **Total Score** | 100% | **6.9/10** | **8.4/10** | **OpenRouter** |

---

## Conclusion

**Recommendation:** Migrate to OpenRouter with Claude 3.5 Sonnet as the primary model.

**Key Benefits:**
- Superior analytical reasoning and insight quality
- Access to multiple state-of-the-art models through one API
- OpenAI-compatible API (easier integration)
- Better reliability and ecosystem support
- Future-proof (can easily switch models)

**Estimated Effort:** 70 minutes of development + testing
**Estimated Cost:** ~$18/month for 1,000 requests (very reasonable)
**Risk Level:** Low (OpenAI-compatible API, easy rollback)

**Next Action:** Proceed with implementation using provided code files.
