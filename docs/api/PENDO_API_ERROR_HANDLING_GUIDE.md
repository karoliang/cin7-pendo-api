# Pendo API Enhanced Error Handling Guide

**Implementation Date**: January 11, 2025
**Client Version**: Enhanced Pendo API Client v1.0
**React Version**: 19.1.1

---

## 🛡️ **Enhanced Error Handling Implementation**

This guide documents the comprehensive error handling, rate limiting, and resilience patterns implemented for the Pendo API integration.

---

## 🏗️ **Architecture Overview**

### **Core Components**

1. **Circuit Breaker Pattern** - Prevents cascade failures
2. **Rate Limiting with Token Bucket** - Respects API limits
3. **Exponential Backoff Retry** - Handles transient failures
4. **Intelligent Caching** - Reduces API load
5. **Comprehensive Metrics** - Monitors API health
6. **Type-Safe Error Handling** - Predictable error responses

### **Design Principles**

- **Fail Fast**: Detect issues early and respond appropriately
- **Graceful Degradation**: Provide fallbacks when API is unavailable
- **Self-Healing**: Automatic recovery from transient issues
- **Observable**: Comprehensive metrics for monitoring
- **Composable**: Modular design for easy testing and extension

---

## 🚦 **Circuit Breaker Pattern**

### **Configuration**

```typescript
const circuitBreakerConfig = {
  failureThreshold: 5,        // Trip after 5 failures
  recoveryTimeout: 30000,     // Wait 30s before retry
  monitoringPeriod: 60000,    // 1 minute monitoring window
};
```

### **States**

1. **CLOSED** (Normal Operation)
   - All requests pass through
   - Failures counted against threshold
   - Automatic recovery on success

2. **OPEN** (Failing Fast)
   - All requests immediately rejected
   - Prevents cascade failures
   - After timeout, transitions to HALF_OPEN

3. **HALF_OPEN** (Testing Recovery)
   - Limited requests allowed
   - Success transitions to CLOSED
   - Failure returns to OPEN

### **Usage Example**

```typescript
try {
  const guides = await enhancedPendoAPI.getGuides();
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    console.log('🚫 Circuit breaker is open - using cached data');
    return useCachedGuides();
  }
  throw error;
}
```

---

## ⏱️ **Rate Limiting Strategy**

### **Token Bucket Algorithm**

```typescript
const rateLimitConfig = {
  requestsPerSecond: 10,    // 10 RPS sustained rate
  requestsPerMinute: 600,   // 600 RPM maximum
  burstLimit: 20,          // Allow bursts up to 20 requests
};
```

### **Behavior**

- **Burst Handling**: Allows short bursts up to burstLimit
- **Sustained Rate**: Enforces long-term rate limits
- **Automatic Waiting**: Queues requests when limit reached
- **Graceful Failure**: Throws RateLimitError when exceeded

### **429 Response Handling**

```typescript
try {
  const data = await enhancedPendoAPI.getAggregationData(params);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Automatically respects Retry-After header
    console.log(`Rate limited, retry after ${error.retryAfter}ms`);
    // Retry logic handled automatically
  }
}
```

---

## 🔄 **Retry Mechanism**

### **Exponential Backoff Configuration**

```typescript
const retryConfig = {
  maxAttempts: 3,           // Maximum retry attempts
  baseDelay: 1000,          // Start with 1s delay
  maxDelay: 10000,          // Cap at 10s max delay
  backoffMultiplier: 2,     // Double delay each attempt
  retryableErrors: [408, 429, 500, 502, 503, 504],
};
```

### **Retry Logic**

1. **Identify Retryable Errors**
   - HTTP 408: Request Timeout
   - HTTP 429: Rate Limited
   - HTTP 500+: Server errors

2. **Calculate Delay**
   ```
   Attempt 1: 1s + jitter
   Attempt 2: 2s + jitter
   Attempt 3: 4s + jitter
   ```

3. **Jitter Addition**
   - Adds 10% random jitter
   - Prevents thundering herd
   - Distributes retry attempts

### **Selective Retry**

```typescript
// Only retry transient failures
const isRetryable = (error: Error): boolean => {
  return error instanceof RateLimitError ||
         (error instanceof PendoApiError && error.retryable);
};
```

---

## 💾 **Intelligent Caching**

### **Cache Strategy**

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;          // Time-to-live in milliseconds
  etag?: string;        // HTTP ETag support
}
```

### **Cache Behavior**

- **Default TTL**: 5 minutes for API responses
- **Automatic Invalidation**: Stale entries removed
- **Memory Efficient**: Map-based with size limits
- **ETag Support**: Conditional requests when available

### **Cache Key Generation**

```typescript
const generateCacheKey = (endpoint: string, params?: Record<string, unknown>): string => {
  return `${endpoint}:${JSON.stringify(params || {})}`;
};
```

### **Cache Management**

```typescript
// Clear all cache
enhancedPendoAPI.clearCache();

// Get cache statistics
const stats = enhancedPendoAPI.getCacheStats();
console.log(`Cache size: ${stats.size}, keys: ${stats.keys.length}`);
```

---

## 📊 **Metrics and Monitoring**

### **Collected Metrics**

```typescript
interface ApiMetrics {
  totalRequests: number;        // Total API calls
  successfulRequests: number;   // Successful responses
  failedRequests: number;       // Failed responses
  rateLimitHits: number;        // 429 responses
  circuitBreakerTrips: number;  // Circuit breaker activations
  averageResponseTime: number;  // Rolling average latency
  lastError?: Error;           // Most recent error
  lastResetTime: number;       // Metrics reset timestamp
}
```

### **Health Status**

```typescript
const healthStatus = enhancedPendoAPI.getHealthStatus();
// Returns:
// {
//   status: 'healthy' | 'degraded' | 'unhealthy',
//   circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
//   availableTokens: number,
//   successRate: number,
//   averageResponseTime: number,
// }
```

### **Health Thresholds**

- **Healthy**: Success rate ≥95%, response time ≤2s, circuit breaker CLOSED
- **Degraded**: Success rate ≥90%, response time ≤5s, circuit breaker HALF_OPEN
- **Unhealthy**: Success rate <90%, response time >5s, circuit breaker OPEN

---

## 🚨 **Error Types and Handling**

### **PendoApiError**

Base error class for all Pendo API errors.

```typescript
class PendoApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public retryable: boolean = false,
    public rateLimited: boolean = false
  );
}
```

### **RateLimitError**

Specific handling for rate limit exceeded.

```typescript
class RateLimitError extends PendoApiError {
  constructor(message: string, public retryAfter?: number);
  // statusCode: 429
  // retryable: true
  // rateLimited: true
}
```

### **CircuitBreakerError**

Circuit breaker is open and rejecting requests.

```typescript
class CircuitBreakerError extends PendoApiError {
  constructor(message: string);
  // statusCode: 503
  // retryable: false
  // rateLimited: false
}
```

---

## 🔧 **React Integration Patterns**

### **Custom Hook with Error Handling**

```typescript
import { useQuery } from '@tanstack/react-query';
import { enhancedPendoAPI, PendoApiError } from '@/lib/enhanced-pendo-api';

export const useGuides = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['guides', params],
    queryFn: () => enhancedPendoAPI.getGuides(params),
    retry: (failureCount, error) => {
      // Let the client handle retries, but allow React Query retry on network failures
      if (error instanceof PendoApiError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};
```

### **Error Boundary Integration**

```typescript
import { ErrorBoundary } from 'react-error-boundary';

const PendoErrorFallback = ({ error, resetErrorBoundary }) => {
  if (error instanceof CircuitBreakerError) {
    return (
      <div>
        <h2>🚫 Service Temporarily Unavailable</h2>
        <p>The Pendo API is currently experiencing issues. Please try again later.</p>
        <button onClick={resetErrorBoundary}>Retry</button>
      </div>
    );
  }

  if (error instanceof RateLimitError) {
    return (
      <div>
        <h2>⏱️ Rate Limit Exceeded</h2>
        <p>Too many requests. Please wait a moment and try again.</p>
        <button onClick={resetErrorBoundary}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>❌ Error Loading Data</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Retry</button>
    </div>
  );
};
```

### **Toast Notifications for Errors**

```typescript
import { toast } from 'react-hot-toast';

const handleApiError = (error: Error) => {
  if (error instanceof CircuitBreakerError) {
    toast.error('Pendo API temporarily unavailable');
  } else if (error instanceof RateLimitError) {
    toast.warning('Rate limit reached, retrying automatically...');
  } else if (error instanceof PendoApiError) {
    toast.error(`API Error: ${error.message}`);
  } else {
    toast.error('Unexpected error occurred');
  }
};
```

---

## 🧪 **Testing Strategies**

### **Mock Circuit Breaker**

```typescript
import { EnhancedPendoAPIClient } from '@/lib/enhanced-pendo-api';

const mockCircuitBreakerClient = () => {
  const client = EnhancedPendoAPIClient.getInstance();

  // Simulate circuit breaker trip
  jest.spyOn(client['circuitBreaker'], 'execute')
    .mockImplementationOnce(() => {
      throw new CircuitBreakerError('Circuit breaker open for testing');
    });

  return client;
};
```

### **Test Rate Limiting**

```typescript
test('should handle rate limit gracefully', async () => {
  const client = EnhancedPendoAPIClient.getInstance();

  // Mock 429 response
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
      headers: new Map([['Retry-After', '5']])
    });

  await expect(client.getGuides()).rejects.toThrow(RateLimitError);
});
```

### **Integration Tests**

```typescript
test('end-to-end error handling', async () => {
  const client = EnhancedPendoAPIClient.getInstance();

  // Test health check
  const health = await client.healthCheck();
  expect(health.healthy).toBeDefined();

  // Test metrics
  const metrics = client.getMetrics();
  expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
});
```

---

## 📈 **Performance Optimization**

### **Bundle Splitting**

```typescript
// Lazy load the enhanced API client
const loadEnhancedAPI = () => import('@/lib/enhanced-pendo-api')
  .then(module => module.enhancedPendoAPI);

// Use in components
const enhancedAPI = await loadEnhancedAPI();
```

### **Request Deduplication**

```typescript
// Prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();

const deduplicatedRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }

  const promise = requestFn().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
};
```

### **Optimistic Updates**

```typescript
const updateGuideOptimistically = async (guideId: string, updates: Partial<Guide>) => {
  // Update UI immediately
  queryClient.setQueryData(['guides'], (oldGuides: Guide[]) =>
    oldGuides.map(guide =>
      guide.id === guideId ? { ...guide, ...updates } : guide
    )
  );

  try {
    // Sync with API
    await enhancedPendoAPI.updateGuide(guideId, updates);
  } catch (error) {
    // Rollback on error
    queryClient.invalidateQueries(['guides']);
    throw error;
  }
};
```

---

## 🔒 **Security Considerations**

### **API Key Protection**

```typescript
// Use environment variables
const apiKey = process.env.NEXT_PUBLIC_PENDO_API_KEY;
if (!apiKey) {
  throw new Error('Pendo API key not configured');
}
```

### **Request Sanitization**

```typescript
const sanitizeParams = (params: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 1000) {
      console.warn(`Parameter ${key} too long, truncating`);
      sanitized[key] = value.substring(0, 1000);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};
```

### **Response Validation**

```typescript
const validateResponse = (response: unknown, expectedType: string): unknown => {
  if (!response || typeof response !== 'object') {
    throw new PendoApiError(`Invalid response: expected ${expectedType}`);
  }
  return response;
};
```

---

## 🚀 **Deployment and Monitoring**

### **Environment Configuration**

```typescript
// config/enhanced-pendo.config.ts
export const enhancedPendoConfig = {
  development: {
    rateLimitConfig: {
      requestsPerSecond: 5,
      requestsPerMinute: 100,
      burstLimit: 10,
    },
    circuitBreakerConfig: {
      failureThreshold: 3,
      recoveryTimeout: 10000,
    },
  },
  production: {
    rateLimitConfig: {
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      burstLimit: 20,
    },
    circuitBreakerConfig: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
    },
  },
};
```

### **Health Endpoint Integration**

```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  try {
    const health = await enhancedPendoAPI.healthCheck();
    const status = health.healthy ? 200 : 503;

    res.status(status).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      pendo_api: health.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### **Metrics Export**

```typescript
// Export metrics for monitoring systems
export const exportMetrics = (): string => {
  const metrics = enhancedPendoAPI.getMetrics();
  const health = enhancedPendoAPI.getHealthStatus();

  return JSON.stringify({
    pendo_api_requests_total: metrics.totalRequests,
    pendo_api_requests_success_total: metrics.successfulRequests,
    pendo_api_requests_failure_total: metrics.failedRequests,
    pendo_api_rate_limit_hits_total: metrics.rateLimitHits,
    pendo_api_circuit_breaker_trips_total: metrics.circuitBreakerTrips,
    pendo_api_response_time_seconds: metrics.averageResponseTime / 1000,
    pendo_api_success_rate: health.successRate,
    pendo_api_circuit_breaker_state: health.circuitBreakerState,
    pendo_api_available_tokens: health.availableTokens,
  }, null, 2);
};
```

---

## 📚 **Best Practices**

### **Error Handling Patterns**

1. **Specific Error Types**: Always check for specific error types
2. **Graceful Degradation**: Provide fallbacks when API is unavailable
3. **User Feedback**: Inform users about issues and retry attempts
4. **Logging**: Log errors with context for debugging
5. **Monitoring**: Set up alerts for high error rates

### **Performance Patterns**

1. **Request Batching**: Combine multiple requests when possible
2. **Pagination**: Use pagination for large datasets
3. **Caching**: Cache responses to reduce API load
4. **Lazy Loading**: Load data only when needed
5. **Request Deduplication**: Prevent duplicate requests

### **Security Patterns**

1. **API Key Protection**: Never expose keys in client code
2. **Input Validation**: Validate all parameters
3. **Response Validation**: Validate API responses
4. **Rate Limiting**: Respect API limits
5. **Error Sanitization**: Don't expose sensitive data in errors

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Circuit Breaker Won't Close**
```typescript
// Check failure threshold and timeout
const config = client['circuitBreakerConfig'];
console.log('Failure threshold:', config.failureThreshold);
console.log('Recovery timeout:', config.recoveryTimeout);

// Force reset circuit breaker
client['circuitBreaker'].failureCount = 0;
client['circuitBreaker'].state = 'CLOSED';
```

#### **Persistent Rate Limiting**
```typescript
// Check rate limit configuration
const rateLimit = client['rateLimitConfig'];
console.log('Requests per second:', rateLimit.requestsPerSecond);
console.log('Burst limit:', rateLimit.burstLimit);

// Check available tokens
const tokens = client.getHealthStatus().availableTokens;
console.log('Available tokens:', tokens);
```

#### **High Memory Usage**
```typescript
// Clear cache and check size
client.clearCache();
const stats = client.getCacheStats();
console.log('Cache entries:', stats.size);

// Reset metrics
client.resetMetrics();
```

### **Debug Logging**

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('API Request:', { endpoint, params, method });
  console.log('Circuit Breaker State:', client.getHealthStatus().circuitBreakerState);
  console.log('Available Tokens:', client.getHealthStatus().availableTokens);
}
```

---

## 📋 **Checklist**

### **Implementation Checklist**

- [x] Circuit breaker pattern implemented
- [x] Rate limiting with token bucket
- [x] Exponential backoff retry mechanism
- [x] Intelligent caching with TTL
- [x] Comprehensive error types
- [x] Metrics and monitoring
- [x] Health check endpoint
- [x] TypeScript type safety
- [x] React integration patterns
- [x] Test coverage for error scenarios
- [x] Security considerations
- [x] Performance optimizations

### **Monitoring Checklist**

- [ ] API success rate >95%
- [ ] Average response time <2s
- [ ] Circuit breaker trips <5 per hour
- [ ] Rate limit hits <10 per hour
- [ ] Cache hit rate >50%
- [ ] Error rates within acceptable thresholds
- [ ] Health endpoint responding correctly
- [ ] Metrics being collected and exported

---

**Enhanced Pendo API client successfully implemented with comprehensive error handling, rate limiting, and resilience patterns. The client provides enterprise-grade reliability for Pendo API integrations.**