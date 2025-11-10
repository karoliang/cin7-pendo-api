/**
 * Enhanced Pendo API Client with Rate Limiting, Circuit Breaker, and Comprehensive Error Handling
 * Implements compounding-engineering principles for robust API communication
 */

import type { Guide, Feature, Page, Report } from '@/types/pendo';

// Enhanced API interfaces for better type safety
interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstLimit: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: number[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  circuitBreakerTrips: number;
  averageResponseTime: number;
  lastError?: Error;
  lastResetTime: number;
}

// Enhanced error types
class PendoApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public retryable: boolean = false,
    public rateLimited: boolean = false
  ) {
    super(message);
    this.name = 'PendoApiError';
  }
}

class RateLimitError extends PendoApiError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429, 'RATE_LIMITED', true, true);
    this.name = 'RateLimitError';
  }
}

class CircuitBreakerError extends PendoApiError {
  constructor(message: string) {
    super(message, 503, 'CIRCUIT_BREAKER_OPEN', false, false);
    this.name = 'CircuitBreakerError';
  }
}

// Circuit breaker state machine
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker entering HALF_OPEN state');
      } else {
        throw new CircuitBreakerError('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('✅ Circuit breaker returning to CLOSED state');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' ||
        (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold)) {
      this.state = 'OPEN';
      console.warn('🚫 Circuit breaker tripped to OPEN state');
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// Rate limiter with token bucket algorithm
class RateLimiter {
  private tokens = 0;
  private lastRefill = Date.now();

  constructor(private config: RateLimitConfig) {
    this.tokens = config.burstLimit;
  }

  async requestToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Calculate wait time for next token
    const waitTime = Math.ceil(1000 / this.config.requestsPerSecond);
    console.warn(`⏳ Rate limit reached, waiting ${waitTime}ms`);

    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
    } else {
      throw new RateLimitError('Rate limit exceeded');
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.config.requestsPerSecond);

    this.tokens = Math.min(this.config.burstLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
}

// Retry mechanism with exponential backoff
class RetryHandler {
  constructor(private config: RetryConfig) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    isRetryable: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.maxAttempts || !isRetryable(lastError)) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`🔄 Retry attempt ${attempt}/${this.config.maxAttempts} after ${delay}ms delay: ${lastError.message}`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, this.config.maxDelay);
  }
}

// Enhanced API metrics collector
class ApiMetricsCollector {
  private metrics: ApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitHits: 0,
    circuitBreakerTrips: 0,
    averageResponseTime: 0,
    lastResetTime: Date.now(),
    responseTimes: []
  } as ApiMetrics & { responseTimes: number[] };

  recordRequest(responseTime: number, success: boolean, error?: Error): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.lastError = error;
    }

    if (error instanceof RateLimitError) {
      this.metrics.rateLimitHits++;
    }

    // Update average response time
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    this.metrics.averageResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
  }

  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    return this.metrics.totalRequests > 0 ? this.metrics.successfulRequests / this.metrics.totalRequests : 0;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      lastResetTime: Date.now(),
      responseTimes: []
    } as ApiMetrics & { responseTimes: number[] };
  }
}

// Main enhanced API client
export class EnhancedPendoAPIClient {
  private static instance: EnhancedPendoAPIClient;

  private readonly headers = {
    'X-Pendo-Integration-Key': process.env.NEXT_PUBLIC_PENDO_API_KEY || 'f4acdb2c-038c-4de1-a88b-ab90423037bf.us',
    'Content-Type': 'application/json',
    'User-Agent': 'Cin7-Pendo-API/1.0 (enhanced-client)',
  };

  private cache = new Map<string, CacheEntry<unknown>>();
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private retryHandler: RetryHandler;
  private metricsCollector: ApiMetricsCollector;

  // Configuration
  private readonly rateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 10,
    requestsPerMinute: 600,
    burstLimit: 20,
  };

  private readonly circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
  };

  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [408, 429, 500, 502, 503, 504],
  };

  private constructor() {
    this.rateLimiter = new RateLimiter(this.rateLimitConfig);
    this.circuitBreaker = new CircuitBreaker(this.circuitBreakerConfig);
    this.retryHandler = new RetryHandler(this.retryConfig);
    this.metricsCollector = new ApiMetricsCollector();
  }

  static getInstance(): EnhancedPendoAPIClient {
    if (!EnhancedPendoAPIClient.instance) {
      EnhancedPendoAPIClient.instance = new EnhancedPendoAPIClient();
    }
    return EnhancedPendoAPIClient.instance;
  }

  private generateCacheKey(endpoint: string, params?: Record<string, unknown>): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedResult<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof PendoApiError) {
      return this.retryConfig.retryableErrors.includes(error.statusCode || 0);
    }
    return false;
  }

  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    method: string = 'GET'
  ): Promise<T> {
    const startTime = Date.now();

    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.requestToken();

      const cacheKey = this.generateCacheKey(endpoint, params);
      const cachedResult = this.getCachedResult<T>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      return this.retryHandler.executeWithRetry(async () => {
        const url = `https://app.pendo.io${endpoint}`;
        const requestOptions: RequestInit = {
          method,
          headers: this.headers,
        };

        if (method === 'GET' && params) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          url.search = searchParams.toString();
        } else if (method === 'POST' && params) {
          requestOptions.body = JSON.stringify(params);
        }

        const response = await fetch(url.toString(), requestOptions);
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          let error: PendoApiError;

          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            error = new RateLimitError(
              `Rate limit exceeded: ${errorText}`,
              retryAfter ? parseInt(retryAfter) * 1000 : undefined
            );
          } else if (this.retryConfig.retryableErrors.includes(response.status)) {
            error = new PendoApiError(
              `Pendo API error: ${response.status} ${response.statusText} - ${errorText}`,
              response.status,
              'API_ERROR',
              true
            );
          } else {
            error = new PendoApiError(
              `Pendo API error: ${response.status} ${response.statusText} - ${errorText}`,
              response.status,
              'API_ERROR',
              false
            );
          }

          this.metricsCollector.recordRequest(responseTime, false, error);
          throw error;
        }

        const result = await response.json();
        this.metricsCollector.recordRequest(responseTime, true);
        this.setCachedResult(cacheKey, result);

        return result;
      }, this.isRetryableError.bind(this));
    });
  }

  // Public API methods with enhanced error handling
  async getGuides(params?: Record<string, unknown>): Promise<Guide[]> {
    try {
      const response = await this.makeRequest('/api/v1/guide', params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Enhanced API client: Failed to fetch guides:', error);
      throw new PendoApiError(`Failed to fetch guides: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'GUIDES_FETCH_FAILED');
    }
  }

  async getGuideById(id: string, includeAnalytics: boolean = false): Promise<Guide | null> {
    try {
      const params = includeAnalytics ? { includeAnalytics: true } : undefined;
      const guides = await this.getGuides(params);
      return guides.find(guide => guide.id === id) || null;
    } catch (error) {
      console.error(`Enhanced API client: Failed to fetch guide ${id}:`, error);
      throw new PendoApiError(`Failed to fetch guide ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'GUIDE_FETCH_FAILED');
    }
  }

  async getFeatures(params?: Record<string, unknown>): Promise<Feature[]> {
    try {
      const response = await this.makeRequest('/api/v1/feature', params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Enhanced API client: Failed to fetch features:', error);
      throw new PendoApiError(`Failed to fetch features: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'FEATURES_FETCH_FAILED');
    }
  }

  async getPages(params?: Record<string, unknown>): Promise<Page[]> {
    try {
      const response = await this.makeRequest('/api/v1/page', params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Enhanced API client: Failed to fetch pages:', error);
      throw new PendoApiError(`Failed to fetch pages: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'PAGES_FETCH_FAILED');
    }
  }

  async getReports(params?: Record<string, unknown>): Promise<Report[]> {
    try {
      const response = await this.makeRequest('/api/v1/report', params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Enhanced API client: Failed to fetch reports:', error);
      throw new PendoApiError(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'REPORTS_FETCH_FAILED');
    }
  }

  // Aggregation API with enhanced error handling
  async getAggregationData(params: Record<string, unknown>): Promise<unknown> {
    try {
      return await this.makeRequest('/api/v1/aggregation', params, 'POST');
    } catch (error) {
      console.error('Enhanced API client: Failed to fetch aggregation data:', error);
      throw new PendoApiError(`Failed to fetch aggregation data: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, 'AGGREGATION_FETCH_FAILED');
    }
  }

  // Metrics and monitoring methods
  getMetrics(): ApiMetrics {
    return this.metricsCollector.getMetrics();
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreakerState: string;
    availableTokens: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const metrics = this.metricsCollector.getMetrics();
    const successRate = this.metricsCollector.getSuccessRate();
    const availableTokens = this.rateLimiter.getAvailableTokens();
    const circuitBreakerState = this.circuitBreaker.getState();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (successRate < 0.9 || metrics.averageResponseTime > 5000 || circuitBreakerState === 'OPEN') {
      status = 'unhealthy';
    } else if (successRate < 0.95 || metrics.averageResponseTime > 2000 || circuitBreakerState === 'HALF_OPEN') {
      status = 'degraded';
    }

    return {
      status,
      circuitBreakerState,
      availableTokens,
      successRate,
      averageResponseTime: metrics.averageResponseTime,
    };
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 API cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Reset methods for recovery
  resetMetrics(): void {
    this.metricsCollector.reset();
  }

  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    try {
      const startTime = Date.now();
      await this.makeRequest('/api/v1/guide', { limit: 1 });
      const responseTime = Date.now() - startTime;

      const healthStatus = this.getHealthStatus();

      return {
        healthy: healthStatus.status === 'healthy',
        details: {
          ...healthStatus,
          responseTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

// Export singleton instance
export const enhancedPendoAPI = EnhancedPendoAPIClient.getInstance();

// Export error classes for error handling
export {
  PendoApiError,
  RateLimitError,
  CircuitBreakerError,
};

// Export types for TypeScript users
export type {
  RateLimitConfig,
  CircuitBreakerConfig,
  RetryConfig,
  ApiMetrics,
};