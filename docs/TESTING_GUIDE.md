# Testing Guide for Cin7 Pendo API

## Overview

This comprehensive testing guide covers all aspects of testing the Cin7 Pendo API project, including unit tests, integration tests, performance testing, and end-to-end testing strategies.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Setup](#testing-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [API Testing](#api-testing)
6. [Component Testing](#component-testing)
7. [Performance Testing](#performance-testing)
8. [End-to-End Testing](#end-to-end-testing)
9. [Test Data Management](#test-data-management)
10. [Continuous Integration](#continuous-integration)
11. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Testing Pyramid

Our testing approach follows the industry-standard testing pyramid:

```
    E2E Tests (5%)
   ─────────────────
  Integration Tests (15%)
 ─────────────────────────
Unit Tests (80%)
```

### Key Principles

1. **Fast Feedback**: Unit tests should run in milliseconds
2. **Isolation**: Tests should not depend on each other
3. **Deterministic**: Same input should always produce same output
4. **Comprehensive Coverage**: Aim for 90%+ code coverage
5. **Realistic**: Tests should mirror real-world scenarios

---

## Testing Setup

### Prerequisites

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event @testing-library/dom
npm install --save-dev @types/jest ts-jest jest-environment-jsdom
npm install --save-dev msw @mswjs/data
```

### Configuration Files

#### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
```

#### Testing Library Setup (`src/setupTests.ts`)

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after tests are done
afterAll(() => server.close());
```

---

## Unit Testing

### API Client Testing

```typescript
// src/lib/__tests__/pendo-api.test.ts
import { PendoAPIClient } from '../pendo-api';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://app.pendo.io/api/v1/page/:pageId', (req, res, ctx) => {
    const { pageId } = req.params;
    return res(
      ctx.json({
        id: pageId,
        name: 'Test Page',
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
      })
    );
  }),

  rest.post('https://app.pendo.io/api/v1/aggregation', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            totalViews: 100,
            uniqueVisitors: 50,
            totalTimeOnPage: 300,
          },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PendoAPIClient', () => {
  let client: PendoAPIClient;

  beforeEach(() => {
    client = new PendoAPIClient('test-api-key');
  });

  describe('getPage', () => {
    it('should fetch page data successfully', async () => {
      const pageData = await client.getPage('test-page-id');

      expect(pageData).toEqual({
        id: 'test-page-id',
        name: 'Test Page',
        createdAt: expect.any(Number),
        lastUpdatedAt: expect.any(Number),
      });
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('https://app.pendo.io/api/v1/page/:pageId', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Page not found' }));
        })
      );

      await expect(client.getPage('invalid-id')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      server.use(
        rest.get('https://app.pendo.io/api/v1/page/:pageId', (req, res, ctx) => {
          return res(ctx.delay(10000)); // 10 second delay
        })
      );

      const timeoutClient = new PendoAPIClient('test-key', 1000); // 1 second timeout
      await expect(timeoutClient.getPage('test-id')).rejects.toThrow('timeout');
    });
  });

  describe('getPageTotals', () => {
    it('should return aggregated page statistics', async () => {
      const totals = await client.getPageTotals('test-page-id', 30);

      expect(totals).toEqual({
        viewedCount: 100,
        visitorCount: 50,
        uniqueVisitors: 50,
        totalTimeOnPage: 300,
      });
    });

    it('should use default days back when not specified', async () => {
      await client.getPageTotals('test-page-id');

      const lastRequest = server.listRequests().pop();
      const requestBody = JSON.parse(lastRequest?.body as string);

      expect(requestBody.request.pipeline[0].source.timeSeries.count).toBe(-30);
    });

    it('should cap days back at 30 for performance', async () => {
      await client.getPageTotals('test-page-id', 90);

      const lastRequest = server.listRequests().pop();
      const requestBody = JSON.parse(lastRequest?.body as string);

      expect(requestBody.request.pipeline[0].source.timeSeries.count).toBe(-30);
    });
  });
});
```

### Utility Function Testing

```typescript
// src/lib/__tests__/utils.test.ts
import {
  extractUrlFromRules,
  transformPageData,
  calculateTimeMetrics,
  validateApiResponse
} from '../utils';

describe('Utility Functions', () => {
  describe('extractUrlFromRules', () => {
    it('should extract URL from designerHint when available', () => {
      const rules = [
        {
          rule: '.*test.*',
          designerHint: 'https://example.com/test-page'
        }
      ];

      const result = extractUrlFromRules(rules);
      expect(result).toBe('https://example.com/test-page');
    });

    it('should return empty string when no rules provided', () => {
      const result = extractUrlFromRules([]);
      expect(result).toBe('');
    });

    it('should handle malformed rules gracefully', () => {
      const rules = [{ invalid: 'data' }];
      const result = extractUrlFromRules(rules);
      expect(result).toBe('');
    });
  });

  describe('transformPageData', () => {
    it('should transform API response to internal format', () => {
      const apiData = {
        id: 'test-id',
        name: 'Test Page',
        createdAt: 1634567890123,
        lastUpdatedAt: 1634567890123,
        group: { id: 'group-1', name: 'Test Group' }
      };

      const result = transformPageData(apiData);

      expect(result).toEqual({
        id: 'test-id',
        name: 'Test Page',
        createdAt: '2021-10-19T01:24:50.123Z',
        updatedAt: '2021-10-19T01:24:50.123Z',
        group: { id: 'group-1', name: 'Test Group' }
      });
    });
  });

  describe('calculateTimeMetrics', () => {
    it('should calculate average time on page', () => {
      const events = [
        { numMinutes: 5 },
        { numMinutes: 10 },
        { numMinutes: 15 }
      ];

      const result = calculateTimeMetrics(events);
      expect(result.averageTimeOnPage).toBe(10);
    });

    it('should handle empty events array', () => {
      const result = calculateTimeMetrics([]);
      expect(result.averageTimeOnPage).toBe(0);
    });
  });
});
```

---

## Integration Testing

### API Integration Testing

```typescript
// src/__tests__/api-integration.test.ts
import { PendoAPIClient } from '../lib/pendo-api';

// These tests run against a test/staging API endpoint
describe('API Integration Tests', () => {
  let client: PendoAPIClient;

  beforeAll(() => {
    client = new PendoAPIClient(process.env.REACT_APP_PENDO_API_KEY!);
  });

  describe('Page Data Integration', () => {
    it('should fetch real page data from Pendo API', async () => {
      // Use a known test page ID
      const pageData = await client.getPage('test-page-id');

      expect(pageData).toHaveProperty('id');
      expect(pageData).toHaveProperty('name');
      expect(pageData).toHaveProperty('createdAt');
      expect(pageData).toHaveProperty('lastUpdatedAt');
      expect(typeof pageData.name).toBe('string');
      expect(pageData.name.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout for real API calls

    it('should handle authentication errors with real API', async () => {
      const invalidClient = new PendoAPIClient('invalid-key');

      await expect(invalidClient.getPage('test-id')).rejects.toThrow();
    });
  });

  describe('Aggregation Integration', () => {
    it('should get real analytics data', async () => {
      const totals = await client.getPageTotals('test-page-id', 7); // Last 7 days

      expect(totals).toHaveProperty('viewedCount');
      expect(totals).toHaveProperty('visitorCount');
      expect(totals).toHaveProperty('uniqueVisitors');
      expect(typeof totals.viewedCount).toBe('number');
    }, 30000); // 30 second timeout for aggregation queries
  });
});
```

### Database Integration Testing

```typescript
// src/__tests__/database-integration.test.ts
import { supabase } from '../lib/supabase';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Set up test data
    await supabase
      .from('test_pages')
      .upsert({
        id: 'test-integration-page',
        name: 'Integration Test Page',
        test_data: true
      });
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('test_pages')
      .delete()
      .eq('test_data', true);
  });

  it('should store and retrieve page analytics', async () => {
    const testData = {
      page_id: 'test-integration-page',
      viewed_count: 100,
      visitor_count: 50,
      analytics_date: new Date().toISOString().split('T')[0]
    };

    // Store data
    const { error: insertError } = await supabase
      .from('page_analytics')
      .insert(testData);

    expect(insertError).toBeNull();

    // Retrieve data
    const { data, error: selectError } = await supabase
      .from('page_analytics')
      .select('*')
      .eq('page_id', 'test-integration-page')
      .single();

    expect(selectError).toBeNull();
    expect(data).toMatchObject(testData);
  });
});
```

---

## API Testing

### Manual API Testing Scripts

```typescript
// scripts/test-api-endpoints.ts
import { PendoAPIClient } from '../src/lib/pendo-api';

async function testAPIEndpoints() {
  const client = new PendoAPIClient(process.env.REACT_APP_PENDO_API_KEY!);

  console.log('🧪 Testing Pendo API Endpoints...\n');

  try {
    // Test 1: Get all pages
    console.log('1️⃣ Testing getAllPages...');
    const pages = await client.getAllPages(5);
    console.log(`✅ Retrieved ${pages.length} pages`);
    console.log('Sample page:', pages[0]);

    // Test 2: Get specific page
    console.log('\n2️⃣ Testing getPage...');
    if (pages.length > 0) {
      const page = await client.getPage(pages[0].id);
      console.log(`✅ Retrieved page: ${page.name}`);
    }

    // Test 3: Get page totals
    console.log('\n3️⃣ Testing getPageTotals...');
    if (pages.length > 0) {
      const totals = await client.getPageTotals(pages[0].id, 7);
      console.log(`✅ Page totals:`, totals);
    }

    // Test 4: Get time series data
    console.log('\n4️⃣ Testing getTimeSeries...');
    if (pages.length > 0) {
      const timeSeries = await client.getPageTimeSeries(pages[0].id, 7);
      console.log(`✅ Time series points: ${timeSeries.length}`);
    }

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  testAPIEndpoints();
}
```

### Load Testing

```typescript
// scripts/load-test-api.ts
import { PendoAPIClient } from '../src/lib/pendo-api';

async function loadTestAPI() {
  const client = new PendoAPIClient(process.env.REACT_APP_PENDO_API_KEY!);
  const concurrentRequests = 10;
  const totalRequests = 50;

  console.log(`🚀 Load testing: ${totalRequests} requests, ${concurrentRequests} concurrent\n`);

  const results = {
    success: 0,
    errors: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
  };

  const promises: Promise<void>[] = [];

  for (let i = 0; i < totalRequests; i++) {
    promises.push(
      (async (requestNum: number) => {
        const startTime = Date.now();

        try {
          // Alternate between different API calls
          if (requestNum % 3 === 0) {
            await client.getAllPages(10);
          } else if (requestNum % 3 === 1) {
            await client.getPageTotals('test-page-id', 7);
          } else {
            await client.getPageTimeSeries('test-page-id', 7);
          }

          const duration = Date.now() - startTime;
          results.success++;
          results.totalTime += duration;
          results.minTime = Math.min(results.minTime, duration);
          results.maxTime = Math.max(results.maxTime, duration);

          console.log(`✅ Request ${requestNum}: ${duration}ms`);

        } catch (error) {
          results.errors++;
          console.log(`❌ Request ${requestNum}: ${error}`);
        }
      })(i)
    );

    // Limit concurrent requests
    if (promises.length >= concurrentRequests) {
      await Promise.allSettled(promises.splice(0, concurrentRequests));
    }
  }

  // Wait for remaining requests
  await Promise.allSettled(promises);

  // Print results
  console.log('\n📊 Load Test Results:');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Success Rate: ${((results.success / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${(results.totalTime / results.success).toFixed(2)}ms`);
  console.log(`Min Response Time: ${results.minTime}ms`);
  console.log(`Max Response Time: ${results.maxTime}ms`);
}

if (require.main === module) {
  loadTestAPI();
}
```

---

## Component Testing

### React Component Testing

```typescript
// src/components/__tests__/PageAnalytics.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageAnalytics } from '../PageAnalytics';
import { PendoAPIClient } from '../../lib/pendo-api';

// Mock the API client
jest.mock('../../lib/pendo-api');
const mockPendoClient = PendoAPIClient as jest.MockedClass<typeof PendoAPIClient>;

describe('PageAnalytics Component', () => {
  const mockPageData = {
    id: 'test-page-id',
    name: 'Test Page',
    viewedCount: 100,
    visitorCount: 50,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPendoClient.prototype.getPage = jest.fn().mockResolvedValue(mockPageData);
    mockPendoClient.prototype.getPageTotals = jest.fn().mockResolvedValue({
      viewedCount: 100,
      visitorCount: 50,
      uniqueVisitors: 45,
      totalTimeOnPage: 500,
    });
  });

  it('should display loading state initially', () => {
    render(<PageAnalytics pageId="test-page-id" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display page data when loaded', async () => {
    render(<PageAnalytics pageId="test-page-id" />);

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // viewedCount
      expect(screen.getByText('50')).toBeInTheDocument(); // visitorCount
    });
  });

  it('should handle API errors gracefully', async () => {
    mockPendoClient.prototype.getPage.mockRejectedValue(new Error('API Error'));

    render(<PageAnalytics pageId="invalid-page-id" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<PageAnalytics pageId="test-page-id" />);

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Verify API was called again
    expect(mockPendoClient.prototype.getPage).toHaveBeenCalledTimes(2);
  });

  it('should display analytics metrics correctly', async () => {
    render(<PageAnalytics pageId="test-page-id" />);

    await waitFor(() => {
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
      expect(screen.getByText('Average Time on Page')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/5.*minutes/)).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// src/hooks/__tests__/usePendoData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { usePendoData } from '../usePendoData';
import { PendoAPIClient } from '../../lib/pendo-api';

jest.mock('../../lib/pendo-api');
const mockPendoClient = PendoAPIClient as jest.MockedClass<typeof PendoAPIClient>;

describe('usePendoData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => usePendoData('test-page-id'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch and return data successfully', async () => {
    const mockData = {
      page: { id: 'test-page-id', name: 'Test Page' },
      analytics: { viewedCount: 100, visitorCount: 50 },
    };

    mockPendoClient.prototype.getPage = jest.fn().mockResolvedValue(mockData.page);
    mockPendoClient.prototype.getPageTotals = jest.fn().mockResolvedValue(mockData.analytics);

    const { result } = renderHook(() => usePendoData('test-page-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle errors and return error state', async () => {
    const mockError = new Error('Failed to fetch data');
    mockPendoClient.prototype.getPage.mockRejectedValue(mockError);

    const { result } = renderHook(() => usePendoData('test-page-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(mockError);
    });
  });

  it('should refetch data when pageId changes', async () => {
    const mockGetPage = jest.fn()
      .mockResolvedValueOnce({ id: 'page1', name: 'Page 1' })
      .mockResolvedValueOnce({ id: 'page2', name: 'Page 2' });

    mockPendoClient.prototype.getPage = mockGetPage;

    const { result, rerender } = renderHook(
      ({ pageId }) => usePendoData(pageId),
      { initialProps: { pageId: 'page1' } }
    );

    await waitFor(() => {
      expect(result.current.data?.page.name).toBe('Page 1');
    });

    rerender({ pageId: 'page2' });

    await waitFor(() => {
      expect(result.current.data?.page.name).toBe('Page 2');
    });

    expect(mockGetPage).toHaveBeenCalledTimes(2);
  });
});
```

---

## Performance Testing

### Performance Benchmark Tests

```typescript
// src/__tests__/performance.test.ts
import { performance } from 'perf_hooks';
import { PendoAPIClient } from '../lib/pendo-api';

describe('Performance Tests', () => {
  let client: PendoAPIClient;

  beforeEach(() => {
    client = new PendoAPIClient('test-key');
  });

  describe('API Response Times', () => {
    it('should getPage in under 2 seconds', async () => {
      const start = performance.now();

      // Mock implementation
      client.getPage = jest.fn().mockResolvedValue({
        id: 'test',
        name: 'Test Page'
      });

      await client.getPage('test-id');

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should handle batch requests efficiently', async () => {
      const pageIds = Array.from({ length: 10 }, (_, i) => `page-${i}`);

      client.getPage = jest.fn().mockImplementation((id) =>
        Promise.resolve({ id, name: `Page ${id}` })
      );

      const start = performance.now();

      // Execute in parallel
      const promises = pageIds.map(id => client.getPage(id));
      await Promise.all(promises);

      const duration = performance.now() - start;

      // Should be much faster than sequential execution
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 requests
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated calls', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      client.getPageTotals = jest.fn().mockResolvedValue({
        viewedCount: 100,
        visitorCount: 50
      });

      // Make many calls
      for (let i = 0; i < 1000; i++) {
        await client.getPageTotals('test-id');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

### Frontend Performance Tests

```typescript
// src/__tests__/frontend-performance.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageList } from '../components/PageList';

describe('Frontend Performance Tests', () => {
  it('should render large page lists efficiently', () => {
    const largePageList = Array.from({ length: 1000 }, (_, i) => ({
      id: `page-${i}`,
      name: `Page ${i}`,
      viewedCount: Math.floor(Math.random() * 1000),
      visitorCount: Math.floor(Math.random() * 500),
    }));

    const startTime = performance.now();

    render(<PageList pages={largePageList} />);

    const renderTime = performance.now() - startTime;

    // Should render within 100ms even with 1000 items
    expect(renderTime).toBeLessThan(100);
    expect(screen.getAllByRole('row')).toHaveLength(1000);
  });

  it('should handle search filtering efficiently', () => {
    const largePageList = Array.from({ length: 1000 }, (_, i) => ({
      id: `page-${i}`,
      name: `Page ${i} with search terms`,
      viewedCount: Math.floor(Math.random() * 1000),
      visitorCount: Math.floor(Math.random() * 500),
    }));

    const { rerender } = render(<PageList pages={largePageList} searchFilter="Page 1" />);

    const startTime = performance.now();
    rerender(<PageList pages={largePageList} searchFilter="Page 1" />);

    const filterTime = performance.now() - startTime;

    // Filtering should be very fast
    expect(filterTime).toBeLessThan(50);
  });
});
```

---

## End-to-End Testing

### Cypress E2E Tests

```typescript
// cypress/e2e/user-journeys.cy.ts
describe('User Journeys', () => {
  beforeEach(() => {
    // Login and set up test data
    cy.login('test@example.com', 'password');
    cy.visit('/dashboard');
  });

  it('should view page analytics dashboard', () => {
    // Navigate to analytics
    cy.get('[data-testid="analytics-nav"]').click();
    cy.url().should('include', '/analytics');

    // Wait for data to load
    cy.get('[data-testid="loading-spinner"]').should('not.exist');

    // Verify dashboard components
    cy.get('[data-testid="page-count"]').should('contain', 'Pages');
    cy.get('[data-testid="total-views"]').should('be.visible');
    cy.get('[data-testid="visitor-chart"]').should('be.visible');

    // Test page filtering
    cy.get('[data-testid="page-search"]').type('Test Page');
    cy.get('[data-testid="page-table"]').should('contain', 'Test Page');

    // Test date range selection
    cy.get('[data-testid="date-range-picker"]').click();
    cy.get('[data-testid="last-7-days"]').click();
    cy.get('[data-testid="apply-date-range"]').click();

    // Verify data refreshes
    cy.get('[data-testid="refresh-button"]').click();
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('should export analytics data', () => {
    cy.get('[data-testid="analytics-nav"]').click();

    // Test CSV export
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-csv"]').click();

    // Verify download (intercept the request)
    cy.intercept('GET', '/api/analytics/export/csv').as('csvExport');
    cy.wait('@csvExport').its('response.statusCode').should('eq', 200);

    // Test PDF export
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-pdf"]').click();

    cy.intercept('GET', '/api/analytics/export/pdf').as('pdfExport');
    cy.wait('@pdfExport').its('response.statusCode').should('eq', 200);
  });

  it('should handle API errors gracefully', () => {
    // Simulate API error
    cy.intercept('GET', '/api/pages', { forceNetworkError: true }).as('apiError');

    cy.get('[data-testid="analytics-nav"]').click();
    cy.wait('@apiError');

    // Verify error handling
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Failed to load data');

    // Test retry functionality
    cy.get('[data-testid="retry-button"]').click();

    // Restore normal API behavior
    cy.intercept('GET', '/api/pages', { fixture: 'pages.json' }).as('apiSuccess');
    cy.wait('@apiSuccess');

    // Verify recovery
    cy.get('[data-testid="page-table"]').should('be.visible');
  });
});
```

---

## Test Data Management

### Mock Data Generation

```typescript
// src/mocks/data-generators.ts
import { Page, PageAnalytics, TimeSeriesData } from '../types/pendo';

export function generateMockPage(overrides: Partial<Page> = {}): Page {
  return {
    id: `page-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Page ${Math.floor(Math.random() * 1000)}`,
    url: `https://example.com/page-${Math.random().toString(36).substr(2, 9)}`,
    viewedCount: Math.floor(Math.random() * 10000),
    visitorCount: Math.floor(Math.random() * 5000),
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    group: {
      id: `group-${Math.random().toString(36).substr(2, 9)}`,
      name: `Group ${Math.floor(Math.random() * 10)}`
    },
    ...overrides,
  };
}

export function generateMockPages(count: number): Page[] {
  return Array.from({ length: count }, () => generateMockPage());
}

export function generateMockAnalytics(overrides: Partial<PageAnalytics> = {}): PageAnalytics {
  return {
    pageId: `page-${Math.random().toString(36).substr(2, 9)}`,
    viewedCount: Math.floor(Math.random() * 10000),
    visitorCount: Math.floor(Math.random() * 5000),
    uniqueVisitors: Math.floor(Math.random() * 3000),
    totalTimeOnPage: Math.floor(Math.random() * 50000),
    averageTimeOnPage: Math.floor(Math.random() * 300),
    bounceRate: Math.random() * 100,
    conversionRate: Math.random() * 10,
    ...overrides,
  };
}

export function generateMockTimeSeries(days: number): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 1000),
      uniqueVisitors: Math.floor(Math.random() * 500),
      averageTimeOnPage: Math.floor(Math.random() * 300),
    });
  }

  return data;
}
```

### Test Fixtures

```typescript
// cypress/fixtures/pages.json
[
  {
    "id": "test-page-1",
    "name": "Homepage",
    "url": "https://example.com",
    "viewedCount": 15000,
    "visitorCount": 8000,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-12-01T00:00:00Z"
  },
  {
    "id": "test-page-2",
    "name": "Product Page",
    "url": "https://example.com/products",
    "viewedCount": 12000,
    "visitorCount": 6000,
    "createdAt": "2023-02-01T00:00:00Z",
    "updatedAt": "2023-12-01T00:00:00Z"
  }
]
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration
      env:
        REACT_APP_PENDO_API_KEY: ${{ secrets.PENDO_API_KEY }}

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Start application
      run: npm start &

    - name: Wait for application
      run: npx wait-on http://localhost:3000

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CYPRESS_baseUrl: http://localhost:3000

    - name: Upload screenshots
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
```

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:performance": "jest --testPathPattern=performance",
    "test:api": "node scripts/test-api-endpoints.ts",
    "test:load": "node scripts/load-test-api.ts"
  }
}
```

---

## Troubleshooting

### Common Test Issues

#### 1. Mock API Not Working

**Problem:** Tests failing because real API calls are being made instead of mocks.

**Solution:**
```typescript
// Make sure MSW server is set up correctly
import { server } from './mocks/server';

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after tests are done
afterAll(() => server.close());
```

#### 2. Async Test Timeouts

**Problem:** Tests timing out waiting for async operations.

**Solution:**
```typescript
// Use waitFor for async DOM updates
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
}, { timeout: 5000 }); // Increase timeout if needed
```

#### 3. Memory Leaks in Tests

**Problem:** Tests consuming too much memory or not cleaning up properly.

**Solution:**
```typescript
// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Clear any global state
  if (global.gc) {
    global.gc();
  }
});
```

#### 4. Flaky Tests

**Problem:** Tests that pass sometimes and fail other times.

**Solution:**
```typescript
// Add proper waits and mocks
test('handles async operations correctly', async () => {
  // Wait for specific conditions instead of fixed timeouts
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });

  // Use fake timers for consistent timing
  jest.useFakeTimers();

  // Advance timers step by step
  jest.advanceTimersByTime(1000);

  // Clean up
  jest.useRealTimers();
});
```

### Debugging Tools

#### 1. Test Debugging

```typescript
// Debug test failures
test('debugging example', () => {
  // Log the component state
  screen.debug(); // Prints current DOM

  // Log specific elements
  console.log(screen.getByRole('button').innerHTML);

  // Check for specific elements
  expect(screen.queryByTestId('missing-element')).toBeNull();
});
```

#### 2. Performance Profiling

```typescript
// Profile test performance
test('performance check', () => {
  const start = performance.now();

  // Your test code here

  const duration = performance.now() - start;
  console.log(`Test duration: ${duration}ms`);

  expect(duration).toBeLessThan(1000); // 1 second max
});
```

---

## Best Practices Summary

### Writing Good Tests

1. **Test One Thing**: Each test should verify a single behavior
2. **Use Descriptive Names**: Test names should clearly describe what they test
3. **Arrange-Act-Assert**: Structure tests in three clear phases
4. **Avoid Implementation Details**: Test behavior, not implementation
5. **Use Realistic Data**: Mock data should resemble production data

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to organize tests
2. **Setup and Teardown**: Use `beforeEach`/`afterEach` for common setup
3. **Shared Fixtures**: Use helper functions for common test data
4. **Test Utilities**: Create reusable test utilities and helpers

### Performance Considerations

1. **Mock External Dependencies**: Avoid real API calls in unit tests
2. **Parallel Execution**: Design tests to run in parallel
3. **Resource Cleanup**: Clean up resources after each test
4. **Efficient Assertions**: Use specific assertions rather than generic ones

This testing guide provides a comprehensive foundation for maintaining high-quality, reliable tests for the Cin7 Pendo API project.