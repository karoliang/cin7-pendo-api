# OpenRouter Quick Start Guide

## Overview

This guide will help you quickly migrate from GLM-4 to OpenRouter API in your Pendo Analytics application.

## Prerequisites

- OpenRouter API Key: `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`
- Node.js environment with Vite
- Existing Pendo Analytics frontend application

---

## 1. Quick Setup (5 minutes)

### Step 1: Environment Variables

The `.env` file has already been created with your API key. Verify it contains:

```bash
VITE_OPENROUTER_API_KEY=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
VITE_AI_MODEL=anthropic/claude-3.5-sonnet
```

### Step 2: Update the Hook

Edit `/frontend/src/hooks/useAISummary.ts`:

**Change this:**
```typescript
import { glmAPI } from '@/services/glm-api';
```

**To this:**
```typescript
import { openRouterAPI } from '@/services/openrouter-api';
```

**Change this:**
```typescript
const response = await glmAPI.generateSummary(request);
```

**To this:**
```typescript
const response = await openRouterAPI.generateSummary(request);
```

**Change this (in mutation):**
```typescript
const response = await glmAPI.generateSummary(request);
```

**To this:**
```typescript
const response = await openRouterAPI.generateSummary(request);
```

That's it! Your app will now use OpenRouter.

---

## 2. Test the Integration

### Test with curl:

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

### Test in your app:

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to any report detail page (Guides, Features, Pages, or Reports)

3. Look for the AI Summary section

4. Click "Generate AI Summary" or it should auto-generate

5. Check the browser console for logs:
   ```
   🤖 Generating AI summary with model: anthropic/claude-3.5-sonnet
   ✅ AI summary generated: { insights: 5, recommendations: 3, tokens: 2847, time: "2341ms" }
   ```

---

## 3. Verify Cost Tracking

The OpenRouter implementation includes automatic cost calculation:

```typescript
// Check console output
{
  model: "anthropic/claude-3.5-sonnet",
  tokensUsed: 2847,
  costEstimate: 0.018, // USD
  processingTime: 2341 // ms
}
```

**Expected costs:**
- Typical request: ~$0.01 - $0.02 (1-2 cents)
- 1,000 requests: ~$18/month
- 10,000 requests: ~$180/month

---

## 4. Optional: Try Different Models

You can easily switch models by updating your `.env` file:

### For fastest responses:
```bash
VITE_AI_MODEL=openai/gpt-4o
```

### For best quality (premium):
```bash
VITE_AI_MODEL=anthropic/claude-sonnet-4.5
```

### For budget-conscious (high volume):
```bash
VITE_AI_MODEL=deepseek/deepseek-r1
```

Restart your dev server after changing the model.

---

## 5. Side-by-Side Comparison (Optional)

If you want to compare GLM-4 vs OpenRouter before fully migrating:

### Option A: Manual Testing

1. Keep the old GLM implementation
2. Test a report with GLM, note the insights
3. Switch to OpenRouter (update the import)
4. Test the same report, compare insights

### Option B: Feature Flag

Add to `useAISummary.ts`:

```typescript
// At the top
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openrouter'; // or 'glm'

// In the queryFn
const api = AI_PROVIDER === 'openrouter' ? openRouterAPI : glmAPI;
const response = await api.generateSummary(request);
```

Add to `.env`:
```bash
VITE_AI_PROVIDER=openrouter  # or 'glm' to switch back
```

---

## 6. Common Issues & Solutions

### Issue: "Invalid API key"

**Solution:** Verify your `.env` file has the correct key:
```bash
VITE_OPENROUTER_API_KEY=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
```

Restart your dev server after changing environment variables.

---

### Issue: "Model not found"

**Solution:** Check the model identifier is correct:
```bash
# Correct
VITE_AI_MODEL=anthropic/claude-3.5-sonnet

# Incorrect (missing provider prefix)
VITE_AI_MODEL=claude-3.5-sonnet
```

Valid model identifiers:
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4o`
- `anthropic/claude-sonnet-4.5`
- `deepseek/deepseek-r1`

---

### Issue: "Request timeout"

**Solution:** The default timeout is 30 seconds. If you're getting timeouts:

1. Check your internet connection
2. Try a faster model (GPT-4o)
3. Or increase timeout in `openrouter-api.ts`:
   ```typescript
   timeout: 60000, // 60 seconds
   ```

---

### Issue: Empty or poor quality responses

**Solution:**
1. Check that your Pendo data is being passed correctly
2. Verify the data compression is working
3. Check console logs for the prompt being sent
4. Try a different model (Claude 3.5 Sonnet is recommended)

---

## 7. Production Deployment

### Security Warning

The current implementation exposes the API key in the frontend. Before production:

**Recommended: Use Netlify Functions**

Create `netlify/functions/ai-summary.ts`:

```typescript
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Validate request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // API key stored securely in Netlify environment
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  // Parse request
  const body = JSON.parse(event.body || '{}');

  // Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

Update frontend to call:
```typescript
const response = await fetch('/.netlify/functions/ai-summary', {
  method: 'POST',
  body: JSON.stringify(requestBody),
});
```

---

## 8. Monitoring

### What to Monitor:

1. **Response Times:** Should be 2-5 seconds typically
2. **Success Rate:** Should be >95%
3. **Token Usage:** Track to manage costs
4. **User Satisfaction:** Add thumbs up/down to summaries

### Add Logging:

In `openrouter-api.ts`, logs are already included:

```typescript
console.log(`🤖 Generating AI summary with model: ${model}`);
console.log('✅ AI summary generated:', {
  insights: response.insights.length,
  tokens: response.metadata.tokensUsed,
  cost: response.metadata.costEstimate,
  time: response.metadata.processingTime,
});
```

---

## 9. Model Comparison

### Quick Reference:

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| **Claude 3.5 Sonnet** ✅ | Fast | Excellent | $$ | Balanced (Recommended) |
| GPT-4o | Fastest | Very Good | $$$ | Speed-critical |
| Claude Sonnet 4.5 | Medium | Best | $$$$ | Premium quality |
| DeepSeek R1 | Fast | Good | $ | High volume |

### Cost Examples:

**Claude 3.5 Sonnet** (Recommended):
- Per request: ~$0.018
- 100 requests/day: ~$1.80/day = $54/month
- 1,000 requests/day: ~$18/day = $540/month

**DeepSeek R1** (Budget):
- Per request: ~$0.001
- 1,000 requests/day: ~$1/day = $30/month
- 10,000 requests/day: ~$10/day = $300/month

---

## 10. Next Steps

### Immediate:
- ✅ Test the integration in development
- ✅ Compare quality with GLM-4
- ✅ Monitor costs for first week

### This Week:
- ⏭️ Set up backend proxy for API key security
- ⏭️ Add cost tracking dashboard
- ⏭️ Deploy to staging environment

### This Month:
- ⏭️ Full production rollout
- ⏭️ Remove GLM implementation
- ⏭️ Add model selection UI for admins
- ⏭️ Implement usage analytics

---

## Support & Resources

### Documentation:
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Pricing Calculator](https://invertedstone.com/calculators/openrouter-pricing)

### Getting Help:
- OpenRouter Discord: [Join here](https://discord.gg/openrouter)
- Check console logs for detailed error messages
- Review the full migration plan: `OPENROUTER_MIGRATION_PLAN.md`

---

## Summary

**What you've done:**
1. ✅ Created OpenRouter API client
2. ✅ Added type definitions
3. ✅ Configured environment variables
4. ✅ Ready to test

**What to do next:**
1. Update `useAISummary.ts` hook (2 line changes)
2. Test in development
3. Compare with GLM-4
4. Deploy when satisfied

**Estimated time:** 10 minutes to update + 5 minutes to test

**Expected results:**
- Better quality insights
- Faster responses
- ~$18/month for 1,000 requests
- Easy to switch models

You're ready to go! 🚀
