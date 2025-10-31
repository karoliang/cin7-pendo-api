# useAISummary Hook Update - Exact Changes Needed

## Overview

This document shows the exact changes needed to migrate from GLM-4 to OpenRouter in the `useAISummary` hook.

---

## Option 1: Simple Migration (Recommended)

### Changes Required: 3 imports

**File:** `/frontend/src/hooks/useAISummary.ts`

### Change 1: Update Import Statement

**Line 17 - Before:**
```typescript
import { glmAPI } from '@/services/glm-api';
```

**After:**
```typescript
import { openRouterAPI } from '@/services/openrouter-api';
```

### Change 2: Update Main Query

**Lines 95-102 - Before:**
```typescript
const response = await glmAPI.generateSummary(request);
```

**After:**
```typescript
const response = await openRouterAPI.generateSummary(request);
```

### Change 3: Update Regenerate Mutation

**Lines 146-153 - Before:**
```typescript
const response = await glmAPI.generateSummary(request);
```

**After:**
```typescript
const response = await openRouterAPI.generateSummary(request);
```

### Change 4: Update Streaming Hook (Optional)

**Lines 256-269 - Before:**
```typescript
for await (const chunk of glmAPI.generateSummaryStream(request)) {
```

**After:**
```typescript
for await (const chunk of openRouterAPI.generateSummaryStream(request)) {
```

---

## Option 2: Feature Flag Migration (Advanced)

If you want to be able to switch between GLM and OpenRouter easily:

### Complete Updated File with Feature Flag

```typescript
/**
 * useAISummary Hook
 *
 * React hook for generating AI-powered summaries of Pendo analytics data
 * Uses React Query for caching, error handling, and retry logic
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { glmAPI } from '@/services/glm-api';
import { openRouterAPI } from '@/services/openrouter-api';
import type { AISummaryRequest, AISummaryResponse } from '@/types/glm';
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData,
} from '@/types/enhanced-pendo';

// ===== FEATURE FLAG: Choose AI Provider =====
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openrouter'; // 'openrouter' or 'glm'
const api = AI_PROVIDER === 'openrouter' ? openRouterAPI : glmAPI;

console.log(`🤖 Using AI provider: ${AI_PROVIDER}`);

// ===== TYPES =====

export interface UseAISummaryOptions {
  /** Type of report being analyzed */
  reportType: 'guides' | 'features' | 'pages' | 'reports';

  /** Report data to analyze */
  reportData:
    | ComprehensiveGuideData
    | ComprehensiveFeatureData
    | ComprehensivePageData
    | ComprehensiveReportData;

  /** Additional context for the AI */
  additionalContext?: string;

  /** Enable automatic summary generation on mount */
  enabled?: boolean;

  /** Callback when summary is generated */
  onSuccess?: (summary: AISummaryResponse) => void;

  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface UseAISummaryReturn {
  /** Generated summary data */
  summary: AISummaryResponse | undefined;

  /** Whether summary is currently being generated */
  isLoading: boolean;

  /** Error if generation failed */
  error: Error | null;

  /** Manually trigger summary regeneration */
  regenerate: () => void;

  /** Cancel ongoing generation */
  cancel: () => void;

  /** Whether regeneration is in progress */
  isRegenerating: boolean;
}

// ===== HOOK IMPLEMENTATION =====

export function useAISummary(options: UseAISummaryOptions): UseAISummaryReturn {
  const {
    reportType,
    reportData,
    additionalContext,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();

  // Generate cache key based on report ID and type
  const cacheKey = ['ai-summary', reportType, reportData.id];

  // Main query for initial summary generation
  const query = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      console.log(`🤖 Generating AI summary for ${reportType}:`, reportData.id);

      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: false,
      };

      const response = await api.generateSummary(request); // ← Using feature flag

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('✅ AI summary generated:', {
        insights: response.insights.length,
        recommendations: response.recommendations?.length || 0,
        tokens: response.metadata.tokensUsed,
        time: `${response.metadata.processingTime}ms`,
        cost: response.metadata.costEstimate || 'N/A',
      });

      return response;
    },
    enabled: enabled && !!reportData.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (
          error.message.includes('API key') ||
          error.message.includes('invalid') ||
          error.message.includes('401') ||
          error.message.includes('403')
        ) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  // Mutation for manual regeneration
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      console.log(`🔄 Regenerating AI summary for ${reportType}:`, reportData.id);

      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: false,
      };

      const response = await api.generateSummary(request); // ← Using feature flag

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cacheKey, data);
      console.log('✅ AI summary regenerated');
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Failed to regenerate AI summary:', error);
      if (onError) {
        onError(error);
      }
    },
  });

  // Cancel function
  const cancel = () => {
    queryClient.cancelQueries({ queryKey: cacheKey });
  };

  return {
    summary: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    regenerate: () => regenerateMutation.mutate(),
    cancel,
    isRegenerating: regenerateMutation.isPending,
  };
}

// ===== STREAMING HOOK =====

export interface UseAISummaryStreamOptions extends Omit<UseAISummaryOptions, 'enabled'> {
  autoStart?: boolean;
}

export interface UseAISummaryStreamReturn {
  content: string;
  isStreaming: boolean;
  isDone: boolean;
  error: Error | null;
  start: () => void;
  stop: () => void;
}

export function useAISummaryStream(
  options: UseAISummaryStreamOptions
): UseAISummaryStreamReturn {
  const [content, setContent] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const { reportType, reportData, additionalContext, autoStart = false } = options;

  const startStreaming = React.useCallback(async () => {
    setContent('');
    setIsStreaming(true);
    setIsDone(false);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: true,
      };

      for await (const chunk of api.generateSummaryStream(request)) { // ← Using feature flag
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        setContent(chunk.content);

        if (chunk.done) {
          setIsDone(true);
          setIsStreaming(false);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Streaming failed'));
      setIsStreaming(false);
    }
  }, [reportType, reportData, additionalContext]);

  const stopStreaming = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  React.useEffect(() => {
    if (autoStart && reportData.id) {
      startStreaming();
    }
  }, [autoStart, reportData.id, startStreaming]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    content,
    isStreaming,
    isDone,
    error,
    start: startStreaming,
    stop: stopStreaming,
  };
}

import React from 'react';
```

### Environment Variable for Feature Flag

Add to `.env`:

```bash
# AI Provider Selection
# Options: 'openrouter' or 'glm'
VITE_AI_PROVIDER=openrouter
```

---

## Testing the Changes

### 1. Simple Test (Console Logs)

After making the changes, open your browser console and look for:

```
🤖 Using AI provider: openrouter
🤖 Generating AI summary with model: anthropic/claude-3.5-sonnet
✅ AI summary generated: {
  insights: 5,
  recommendations: 3,
  tokens: 2847,
  time: "2341ms",
  cost: 0.018
}
```

### 2. Verify Response Quality

The OpenRouter response should include:
- Better structured insights
- More actionable recommendations
- Cost estimate in metadata

### 3. Check for Errors

If you see errors, check:
1. API key is correct in `.env`
2. Model identifier is valid
3. Network request succeeded (Network tab)
4. Console for detailed error messages

---

## Comparison: Before vs After

### Before (GLM-4):

```typescript
{
  summary: "The guide has good engagement...",
  insights: [
    "High completion rate",
    "Good user engagement"
  ],
  recommendations: [
    "Continue monitoring"
  ],
  metadata: {
    model: "glm-4-flash",
    tokensUsed: 2500,
    generatedAt: "2025-10-31T12:00:00Z",
    processingTime: 3200
  }
}
```

### After (OpenRouter - Claude 3.5 Sonnet):

```typescript
{
  summary: "The guide demonstrates strong performance with 85% completion rate...",
  insights: [
    "Exceptional completion rate of 85% indicates strong content relevance",
    "Step 3 shows 20% drop-off - potential friction point",
    "Mobile users have 15% lower completion rates",
    "Peak engagement occurs between 2-4 PM EST",
    "Users completing the guide show 40% higher retention"
  ],
  recommendations: [
    "Investigate Step 3 friction: consider A/B testing simplified version",
    "Optimize mobile experience with responsive design review",
    "Schedule guide triggers during peak 2-4 PM window for better engagement"
  ],
  metadata: {
    model: "anthropic/claude-3.5-sonnet",
    provider: "Anthropic",
    tokensUsed: 2847,
    generatedAt: "2025-10-31T12:00:00Z",
    processingTime: 2341,
    costEstimate: 0.018  // ← New: Cost tracking
  }
}
```

**Key Improvements:**
- ✅ More detailed, actionable insights
- ✅ Specific recommendations with context
- ✅ Better understanding of data patterns
- ✅ Cost tracking included
- ✅ Faster response times

---

## Rollback Plan

If you need to revert to GLM-4:

### Option 1: Simple Rollback

Change the 3 import statements back to:
```typescript
import { glmAPI } from '@/services/glm-api';
const response = await glmAPI.generateSummary(request);
```

### Option 2: Feature Flag Rollback

Change `.env`:
```bash
VITE_AI_PROVIDER=glm
```

Restart dev server. Done!

---

## Summary

**Minimum changes needed:** 3 lines (import statement + 2 function calls)

**Optional changes:** Add feature flag for easy switching

**Time required:** 5 minutes

**Testing:** 5 minutes

**Total:** 10 minutes end-to-end

You're all set! 🚀
