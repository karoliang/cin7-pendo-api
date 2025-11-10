# Contributing to cin7-pendo-api

Thank you for your interest in contributing to the **cin7-pendo-api** project! This guide will help you get started with contributing to Cin7's advanced Pendo analytics platform.

## 🎯 Project Overview

**cin7-pendo-api** is a sophisticated analytics platform that integrates Pendo.io data with custom React/TypeScript applications to provide powerful insights for Cin7's business operations.

### Technology Stack
- **Frontend**: React 19.1.1 + TypeScript 5.9.3 + Vite
- **UI Libraries**: Shopify Polaris + Radix UI + Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Backend**: Python Pendo API client
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Deployment**: Netlify with Edge Functions
- **API Integration**: Pendo.io with integration key from environment variables

### Key Features
- **Real-time Analytics**: 2,313+ records across guides, features, pages, and reports
- **Interactive Dashboards**: Advanced data visualization with Recharts
- **Security-First**: Domain-restricted access (@cin7.com) with enterprise security
- **Performance Optimized**: Bundle splitting, lazy loading, and React.memo optimizations
- **Mobile Responsive**: Fully responsive design for all device types

---

## 🚀 Getting Started

### Prerequisites

#### Required Software
- **Node.js**: 18.14.0 or later (recommended: 20.x)
- **npm**: 9.0.0 or later
- **Git**: Latest stable version
- **VS Code**: Recommended IDE with extensions listed below

#### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-jest",
    "ms-playwright.playwright"
  ]
}
```

#### Required Knowledge
- **React Development**: Proficiency with React hooks and patterns
- **TypeScript**: Strong TypeScript skills and type safety
- **Modern CSS**: Tailwind CSS and responsive design
- **API Integration**: Experience with REST APIs and data fetching
- **Git Workflow**: Comfortable with branching and pull requests

### Setup Instructions

#### 1. Fork and Clone Repository
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cin7-pendo-api.git
cd cin7-pendo-api

# Add upstream remote
git remote add upstream https://github.com/karoliang/cin7-pendo-api.git
```

#### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Return to root directory
cd ..
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp frontend/.env.example frontend/.env

# Edit the .env file with your configuration
# Required variables:
VITE_PENDO_API_BASE_URL=https://app.pendo.io
VITE_PENDO_API_KEY=your_pendo_integration_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. Start Development Server
```bash
# Start frontend development server
cd frontend
npm run dev

# Application will be available at http://localhost:5173
```

#### 5. Verify Setup
- [ ] Application loads successfully at `http://localhost:5173`
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors or warnings
- [ ] API integration working (check browser console)
- [ ] Supabase connection established

---

## 🏗️ Development Workflow

### Branching Strategy

#### Main Branches
- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for feature development (if needed)

#### Feature Branches
```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/issue-description

# Create enhancement branch
git checkout -b enhancement/improvement-description
```

#### Branch Naming Conventions
- `feature/feature-name` - New features
- `fix/issue-description` - Bug fixes
- `enhancement/improvement` - Code improvements
- `docs/documentation-updates` - Documentation changes
- `refactor/code-cleanup` - Code refactoring

### Commit Standards

#### Commit Message Format
```bash
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(dashboard): add real-time analytics refresh
fix(api): resolve Pendo rate limiting issues
docs(readme): update installation instructions
perf(components): implement React.memo for dashboard cards
test(api): add integration tests for data fetching
```

### Development Process

#### 1. Create Issue
- Create detailed issue using appropriate template
- Include business context and acceptance criteria
- Assign appropriate labels and priority
- Link to related issues or documentation

#### 2. Setup Development Branch
```bash
# Ensure your main branch is up to date
git checkout main
git pull upstream main

# Create and switch to feature branch
git checkout -b feature/your-feature-name
```

#### 3. Development Guidelines
- Follow coding standards (see below)
- Write comprehensive tests
- Update documentation as needed
- Test across different browsers and devices

#### 4. Testing Requirements
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint:fix

# Run tests
npm run test

# Run test coverage
npm run test:coverage
```

#### 5. Submit Pull Request
- Use comprehensive PR template
- Include screenshots for UI changes
- Provide test results and coverage reports
- Request appropriate reviewers

---

## 📝 Coding Standards

### TypeScript Standards

#### Type Safety
```typescript
// Good: Comprehensive interfaces
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
  loading?: boolean;
  trendData?: number[];
}

// Bad: Using `any` type
interface BadProps {
  data: any;
  config: any;
}
```

#### Generic Types
```typescript
// Good: Proper generic usage
interface ApiResponse<T> {
  data: T;
  error: string | null;
  loading: boolean;
}

// Use in components
const DataComponent: React.FC<{ data: ApiResponse<GuideData> }> = ({ data }) => {
  return <div>{data.data}</div>;
};
```

#### Type Guards
```typescript
// Good: Type guards for runtime checking
function isGuideData(data: unknown): data is GuideData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'views' in data
  );
}

// Usage
if (isGuideData(response.data)) {
  // TypeScript knows response.data is GuideData
  console.log(response.data.name);
}
```

### React Standards

#### Component Structure
```typescript
// Good: Proper component structure
interface ComponentProps {
  // Props interface
}

export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // 1. Hooks (in order)
  const [state, setState] = useState(initialValue);
  const memoizedValue = useMemo(() => computeValue(state), [state]);
  const callback = useCallback(() => {
    // callback logic
  }, [memoizedValue]);

  // 2. Effects
  useEffect(() => {
    // effect logic
    return () => {
      // cleanup
    };
  }, [callback]);

  // 3. Event handlers
  const handleClick = () => {
    // handler logic
  };

  // 4. Render logic
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';
```

#### Performance Optimization
```typescript
// Good: Using React.memo for expensive components
export const ExpensiveComponent = React.memo<ExpensiveProps>(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item));
  }, [data]);

  const handleAction = useCallback((action: ActionType) => {
    onAction(action);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent key={item.id} item={item} onAction={handleAction} />
      ))}
    </div>
  );
});

// Good: Lazy loading for large components
const LazyChartComponent = lazy(() => import('./ChartComponent'));

// Usage with Suspense
<Suspense fallback={<InlineSpinner />}>
  <LazyChartComponent data={data} />
</Suspense>
```

#### Error Boundaries
```typescript
// Good: Error boundaries for component trees
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### CSS and Styling

#### Tailwind CSS Standards
```tsx
// Good: Semantic class usage
<div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
  <h3 className="text-lg font-semibold text-text-primary">
    {title}
  </h3>
  <Button variant="primary" onClick={handleAction}>
    Action
  </Button>
</div>

// Bad: Inline styles or utility overuse
<div style={{ display: 'flex', padding: '16px' }} className="flex p-4">
```

#### Responsive Design
```tsx
// Good: Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="w-full">
      <CardHeader>
        <h3 className="text-sm font-medium truncate">{item.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-subdued line-clamp-2">
          {item.description}
        </p>
      </CardContent>
    </Card>
  ))}
</div>
```

#### Dark Mode Support
```tsx
// Good: Dark mode compatible classes
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
  <h3 className="text-gray-900 dark:text-white">
    Title
  </h3>
</div>
```

### API Integration Standards

#### TanStack Query Usage
```typescript
// Good: Proper TanStack Query implementation
export const useGuideData = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['guides', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const response = await pendoAPI.getAggregation('guide', 'views', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Good: Mutation with optimistic updates
export const useUpdateGuideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guideData: GuideUpdateData) => {
      return pendoAPI.updateGuide(guideData);
    },
    onMutate: async (newGuideData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['guides'] });

      // Snapshot the previous value
      const previousGuides = queryClient.getQueryData(['guides']);

      // Optimistically update to the new value
      queryClient.setQueryData(['guides'], (old: Guide[] = []) =>
        old.map(guide =>
          guide.id === newGuideData.id ? { ...guide, ...newGuideData } : guide
        )
      );

      return { previousGuides };
    },
    onError: (err, newGuideData, context) => {
      // Rollback on error
      queryClient.setQueryData(['guides'], context?.previousGuides);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });
};
```

#### Error Handling
```typescript
// Good: Comprehensive error handling
interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export const useApiCall = <T>(endpoint: string) => {
  return useQuery<T, ApiError>({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${endpoint}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        throw error;
      }
    },
    retry: (failureCount, error: ApiError) => {
      // Retry on network errors but not on 4xx errors
      if (error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
```

---

## 🧪 Testing Standards

### Unit Testing

#### Component Testing
```typescript
// Good: Comprehensive component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPICard } from './KPICard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('KPICard', () => {
  it('renders title and value correctly', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <KPICard title="Total Guides" value="1234" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Total Guides')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('displays change information when provided', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <KPICard
          title="Active Users"
          value="567"
          change={12}
          changeType="increase"
          description="vs last month"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('↑ 12%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <KPICard title="Loading Metric" value="..." loading />
      </QueryClientProvider>
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('handles click events when provided', async () => {
    const handleClick = jest.fn();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <KPICard title="Clickable Card" value="100" onClick={handleClick} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

#### Hook Testing
```typescript
// Good: Custom hook testing
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGuideData } from './useGuideData';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useGuideData', () => {
  it('fetches guide data successfully', async () => {
    const { result } = renderHook(() => useGuideData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });
  });

  it('handles loading state', () => {
    const { result } = renderHook(() => useGuideData(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles errors gracefully', async () => {
    // Mock API to return error
    jest.spyOn(pendoAPI, 'getAggregation').mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useGuideData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### Integration Testing

#### API Integration Testing
```typescript
// Good: API integration test
describe('Pendo API Integration', () => {
  it('fetches real guide data from Pendo API', async () => {
    // Test with actual API (in CI environment)
    if (process.env.CI) {
      const response = await pendoAPI.getAggregation('guide', 'totalViews');

      expect(response).toHaveProperty('results');
      expect(Array.isArray(response.results)).toBe(true);

      if (response.results.length > 0) {
        expect(response.results[0]).toHaveProperty('id');
        expect(response.results[0]).toHaveProperty('value');
      }
    }
  });

  it('handles rate limiting gracefully', async () => {
    // Test rate limiting behavior
    const promises = Array.from({ length: 10 }, () =>
      pendoAPI.getAggregation('guide', 'totalViews')
    );

    const results = await Promise.allSettled(promises);

    // Should have some successful requests and some rate limited
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful.length + failed.length).toBe(10);
  });
});
```

### E2E Testing

#### Playwright Testing
```typescript
// Good: E2E test example
import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('displays dashboard with analytics data', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');

    // Check for KPI cards
    await expect(page.locator('[data-testid="kpi-card"]')).toHaveCount(4);

    // Check for charts
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });

  test('filters data by date range', async ({ page }) => {
    // Open date range selector
    await page.click('[data-testid="date-range-selector"]');

    // Select custom date range
    await page.fill('[data-testid="start-date"]', '2024-01-01');
    await page.fill('[data-testid="end-date"]', '2024-01-31');
    await page.click('[data-testid="apply-filters"]');

    // Wait for data to update
    await page.waitForLoadState('networkidle');

    // Verify data updated
    await expect(page.locator('[data-testid="data-updated-indicator"]')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/pendo/guides', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Failed to load analytics data'
    );

    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
```

### Test Coverage Requirements

#### Coverage Standards
- **Minimum Coverage**: 90% for new code
- **Branch Coverage**: 85% minimum
- **Function Coverage**: 95% minimum
- **Line Coverage**: 90% minimum

#### Coverage Script
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

#### Coverage Exclusions
```typescript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90,
    },
  },
};
```

---

## 🔒 Security Standards

### API Security

#### Pendo API Key Management
```typescript
// Good: Secure API key usage
const PENDO_API_KEY = import.meta.env.VITE_PENDO_API_KEY;

if (!PENDO_API_KEY) {
  throw new Error('Pendo API key is required');
}

export const pendoAPI = {
  async getAggregation(type: string, aggregation: string, params?: object) {
    const response = await fetch(`${PENDO_API_BASE_URL}/api/v1/aggregation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pendo-Integration-Key': PENDO_API_KEY,
      },
      body: JSON.stringify({
        type,
        aggregation,
        ...params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pendo API Error: ${response.status}`);
    }

    return response.json();
  },
};
```

#### Input Validation
```typescript
// Good: Input validation for API calls
interface APIParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

const validateAPIParams = (params: APIParams): APIParams => {
  const validated: APIParams = {};

  if (params.startDate) {
    if (!isValidDate(params.startDate)) {
      throw new Error('Invalid startDate format');
    }
    validated.startDate = params.startDate;
  }

  if (params.endDate) {
    if (!isValidDate(params.endDate)) {
      throw new Error('Invalid endDate format');
    }
    validated.endDate = params.endDate;
  }

  if (params.limit !== undefined) {
    if (params.limit < 1 || params.limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }
    validated.limit = params.limit;
  }

  return validated;
};
```

### Data Security

#### Supabase Row Level Security
```sql
-- Example RLS policy for user-specific data
CREATE POLICY "Users can view their own guide data" ON pendo_guides
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = ANY (
      SELECT jsonb_array_elements_text(metadata->'access_users')
      FROM pendo_guides
      WHERE id = pendo_guides.id
    )
  );

-- Policy for user-specific updates
CREATE POLICY "Users can update their own guide data" ON pendo_guides
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = ANY (
      SELECT jsonb_array_elements_text(metadata->'access_users')
      FROM pendo_guides
      WHERE id = pendo_guides.id
    )
  );
```

#### Client-Side Security
```typescript
// Good: Client-side data sanitization
import DOMPurify from 'dompurify';

export const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

// Usage in components
const UserContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useMemo(() => sanitizeUserInput(content), [content]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
```

### Content Security Policy

#### CSP Headers
```typescript
// netlify.toml CSP configuration
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.pendo.io;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://app.pendo.io https://data.pendo.io https://cdn.pendo.io https://your-project.supabase.co;
      frame-ancestors 'none';
    """
```

---

## 📊 Performance Standards

### Bundle Optimization

#### Code Splitting
```typescript
// Good: Lazy loading for routes
import { lazy, Suspense } from 'react';
import { InlineSpinner } from '@/components/ui/Spinner';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DataTables = lazy(() => import('@/pages/DataTables'));
const Reports = lazy(() => import('@/pages/Reports'));

export const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <Suspense fallback={<InlineSpinner />}>
          <Dashboard />
        </Suspense>
      }
    />
    <Route
      path="/data-tables"
      element={
        <Suspense fallback={<InlineSpinner />}>
          <DataTables />
        </Suspense>
      }
    />
    <Route
      path="/reports"
      element={
        <Suspense fallback={<InlineSpinner />}>
          <Reports />
        </Suspense>
      }
    />
  </Routes>
);
```

#### Bundle Analysis
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@shopify/polaris', '@radix-ui/react-dialog'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### React Performance

#### Component Optimization
```typescript
// Good: Performance monitoring
import { useProfiler } from 'react';

interface PerformanceMetricsProps {
  children: React.ReactNode;
  id: string;
}

export const PerformanceMonitor: React.FC<PerformanceMetricsProps> = ({
  children,
  id
}) => {
  const { onRender } = useProfiler(id, {
    onRender: (id, phase, actualDuration) => {
      if (actualDuration > 16) { // More than one frame
        console.warn(`Slow render detected in ${id}: ${actualDuration}ms`);
      }

      // Send to monitoring service in production
      if (import.meta.env.PROD) {
        sendPerformanceMetrics({
          componentId: id,
          phase,
          duration: actualDuration,
        });
      }
    },
  });

  return <>{children}</>;
};
```

#### State Optimization
```typescript
// Good: Optimized state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AnalyticsStore {
  // Selectors
  guides: Guide[];
  features: Feature[];
  isLoading: boolean;

  // Actions
  setGuides: (guides: Guide[]) => void;
  setFeatures: (features: Feature[]) => void;
  setLoading: (loading: boolean) => void;

  // Computed selectors
  totalGuides: () => number;
  activeGuides: () => Guide[];
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  subscribeWithSelector((set, get) => ({
    guides: [],
    features: [],
    isLoading: false,

    setGuides: (guides) => set({ guides }),
    setFeatures: (features) => set({ features }),
    setLoading: (isLoading) => set({ isLoading }),

    totalGuides: () => get().guides.length,
    activeGuides: () => get().guides.filter(g => g.isActive),
  }))
);

// Memoized selectors
export const useTotalGuides = () => useAnalyticsStore(state => state.totalGuides());
export const useActiveGuides = () => useAnalyticsStore(state => state.activeGuides());
```

---

## 📱 Accessibility Standards

### WCAG 2.1 AA Compliance

#### Semantic HTML
```tsx
// Good: Semantic and accessible markup
<main role="main" aria-labelledby="dashboard-title">
  <h1 id="dashboard-title">Analytics Dashboard</h1>

  <section aria-labelledby="kpi-section">
    <h2 id="kpi-section" className="sr-only">Key Performance Indicators</h2>
    <div role="region" aria-label="Analytics metrics">
      <KPICard
        title="Total Users"
        value="1,234"
        change={12}
        changeType="increase"
        aria-label={`Total Users: 1,234, increased by 12% from last period`}
      />
    </div>
  </section>

  <section aria-labelledby="charts-section">
    <h2 id="charts-section">Analytics Charts</h2>
    <div role="region" aria-label="Data visualizations">
      <AnalyticsChart
        data={chartData}
        aria-label="User activity over time chart"
      />
    </div>
  </section>
</main>
```

#### Keyboard Navigation
```tsx
// Good: Keyboard accessible components
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};
```

#### Screen Reader Support
```tsx
// Good: Screen reader announcements
import { useAnnouncer } from '@/hooks/useAnnouncer';

export const DataLoadingIndicator = () => {
  const announce = useAnnouncer();

  useEffect(() => {
    announce('Loading analytics data');
  }, [announce]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      Loading analytics data...
    </div>
  );
};

// Usage in data fetching
export const DataComponent = () => {
  const { data, isLoading, error } = useGuideData();
  const announce = useAnnouncer();

  useEffect(() => {
    if (data) {
      announce(`Loaded ${data.length} guide records`);
    }
    if (error) {
      announce('Failed to load data');
    }
  }, [data, error, announce]);

  // Component JSX
};
```

### Color Contrast and Design

#### Contrast Standards
```css
/* Good: High contrast colors */
.text-primary {
  color: #1a1a1a; /* 16.17:1 contrast ratio */
  background: #ffffff;
}

.text-secondary {
  color: #4a5568; /* 7.24:1 contrast ratio */
  background: #ffffff;
}

.focus-visible:focus {
  outline: 2px solid #3b82f6; /* 4.5:1 minimum contrast */
  outline-offset: 2px;
}
```

#### Responsive Design
```tsx
// Good: Touch-friendly interface
const TouchButton = ({ children, onClick, size = 'medium' }) => {
  const sizeClasses = {
    small: 'px-3 py-2 text-sm min-h-[44px]',  /* iOS touch target: 44px */
    medium: 'px-4 py-3 text-base min-h-[48px]', /* Android touch target: 48px */
    large: 'px-6 py-4 text-lg min-h-[52px]',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        font-medium
        rounded-lg
        bg-blue-600
        text-white
        hover:bg-blue-700
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        transition-colors
        disabled:opacity-50
        disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
};
```

---

## 🚀 Deployment Standards

### Build Process

#### Environment Configuration
```typescript
// Good: Environment-specific configurations
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    logLevel: 'debug',
    mockData: true,
  },
  staging: {
    apiUrl: 'https://staging-api.cin7-pendo.netlify.app',
    logLevel: 'info',
    mockData: false,
  },
  production: {
    apiUrl: 'https://api.cin7-pendo.netlify.app',
    logLevel: 'error',
    mockData: false,
  },
}[import.meta.env.MODE];

export default config;
```

#### Build Optimization
```bash
# Build command with optimizations
npm run build

# Production build includes:
# - TypeScript compilation with strict mode
# - Bundle optimization and code splitting
# - Asset minification and compression
# - Source map generation for debugging
# - Tree shaking to remove unused code
```

### Deployment Checklist

#### Pre-deployment
```bash
#!/bin/bash
# pre-deploy.sh

echo "🔍 Running pre-deployment checks..."

# 1. Type checking
echo "Checking TypeScript types..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found"
  exit 1
fi

# 2. Linting
echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found"
  exit 1
fi

# 3. Tests
echo "Running tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 4. Coverage
echo "Checking test coverage..."
npm run test:coverage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 90" | bc -l) )); then
  echo "❌ Test coverage below 90%"
  exit 1
fi

# 5. Bundle analysis
echo "Analyzing bundle size..."
npm run build:analyze
BUNDLE_SIZE=$(du -k dist/assets/vendor.*.js | cut -f1)
if [ $BUNDLE_SIZE -gt 500 ]; then
  echo "❌ Bundle size too large: ${BUNDLE_SIZE}KB"
  exit 1
fi

echo "✅ All pre-deployment checks passed!"
```

#### Post-deployment
```bash
#!/bin/bash
# post-deploy.sh

echo "🔍 Running post-deployment verification..."

# 1. Health check
echo "Checking application health..."
curl -f https://cin7-pendo.netlify.app/health
if [ $? -ne 0 ]; then
  echo "❌ Health check failed"
  exit 1
fi

# 2. API connectivity
echo "Testing API connectivity..."
curl -f https://cin7-pendo.netlify.app/api/health
if [ $? -ne 0 ]; then
  echo "❌ API health check failed"
  exit 1
fi

# 3. Lighthouse audit
echo "Running Lighthouse audit..."
npx lighthouse https://cin7-pendo.netlify.app \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags='--headless'

SCORE=$(cat lighthouse-report.json | jq '.categories.performance.score * 100')
if (( $(echo "$SCORE < 80" | bc -l) )); then
  echo "❌ Lighthouse performance score too low: ${SCORE}"
  exit 1
fi

echo "✅ All post-deployment checks passed!"
```

---

## 📋 Pull Request Guidelines

### PR Template Usage

Always use the comprehensive PR template at `.github/PULL_REQUEST_TEMPLATE.md` and ensure:

#### Required Sections
- [ ] **Description**: Clear description of changes
- [ ] **Type of Change**: Proper classification (bug fix, feature, etc.)
- [ ] **Testing**: Test coverage and results
- [ ] **Screenshots**: Visual evidence for UI changes
- [ ] **Documentation**: Updated documentation as needed

#### Review Requirements
- [ ] **Self-Review**: Code reviewed by author before submission
- [ ] **Code Quality**: Follows all coding standards
- [ ] **TypeScript**: All types properly defined
- [ ] **Tests**: New functionality has adequate test coverage
- [ ] **Performance**: No performance regressions
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Accessibility**: WCAG 2.1 AA compliant changes

### Review Process

#### Reviewer Responsibilities
1. **Code Quality**: Verify adherence to coding standards
2. **Functionality**: Ensure feature works as expected
3. **Testing**: Validate test coverage and quality
4. **Performance**: Check for performance impact
5. **Security**: Review for security implications
6. **Documentation**: Ensure documentation is accurate

#### Approval Requirements
- **Code Review**: At least one reviewer approval
- **Test Coverage**: Minimum 90% coverage maintained
- **Performance**: No performance regressions
- **Security**: Security review for sensitive changes
- **Documentation**: Documentation updates for API changes

---

## 🤝 Community Guidelines

### Code of Conduct

Our community follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/):

#### Expected Behavior
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

#### Unacceptable Behavior
- Harassing, abusive, or discriminatory language
- Public or private harassment
- Publishing private information without permission
- Any other conduct inappropriate for professional environment

### Communication Standards

#### GitHub Issues
- Use appropriate issue templates
- Provide clear, reproducible bug reports
- Include business context and impact
- Be respectful and constructive in discussions

#### Pull Requests
- Follow PR template requirements
- Provide thorough descriptions of changes
- Respond promptly to review feedback
- Be open to suggestions and improvements

#### Discussions
- Stay on topic and relevant to the project
- Provide helpful and constructive feedback
- Share knowledge and experience generously
- Respect different opinions and approaches

---

## 📚 Resources and Learning

### Documentation
- [Project README](./README.md) - Main project overview
- [API Documentation](./docs/API_REFERENCE.md) - Complete API reference
- [Component Library](./frontend/docs/components.md) - React component documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions

### External Resources
- [React Documentation](https://react.dev/) - Official React docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Shopify Polaris](https://polaris.shopify.com/) - UI component library
- [TanStack Query](https://tanstack.com/query/latest/) - Data fetching library
- [Supabase Docs](https://supabase.com/docs) - Database and auth platform
- [Netlify Docs](https://docs.netlify.com/) - Deployment platform

### Learning Paths

#### For New Contributors
1. **Read**: Complete this contributing guide
2. **Explore**: Review existing code and issues
3. **Start**: Pick up a "good first issue"
4. **Learn**: Study our coding standards and patterns
5. **Contribute**: Submit your first pull request

#### For Experienced Developers
1. **Architecture**: Study our system architecture
2. **Patterns**: Learn our specific implementation patterns
3. **Performance**: Understand our performance optimization strategies
4. **Security**: Review our security practices and requirements
5. **Scale**: Consider scalability and maintainability implications

---

## 🆘 Getting Help

### Support Channels

#### Technical Questions
- **GitHub Discussions**: Use for questions and ideas
- **GitHub Issues**: Use for bug reports and feature requests
- **Code Reviews**: Request reviews from maintainers

#### Development Issues
- **Setup Problems**: Check troubleshooting section
- **Build Errors**: Review build and deployment logs
- **Test Failures**: Examine test output and coverage reports

#### Process Questions
- **Contribution Guidelines**: Refer to this guide
- **PR Process**: Follow pull request guidelines
- **Code Review**: Understand review requirements

### Common Issues

#### Setup Problems
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Build Issues
```bash
# Check TypeScript version
npx tsc --version

# Update dependencies
npm update

# Rebuild
npm run build
```

#### Test Issues
```bash
# Run specific test file
npm test -- --testPathPattern=filename

# Run tests in watch mode
npm run test:watch

# Update snapshots
npm test -- --updateSnapshot
```

---

## 📈 Recognition and Appreciation

### Contributor Recognition
- **GitHub Contributors**: All contributors listed in README
- **Release Notes**: Contributors acknowledged in release notes
- **Community**: Active contributors invited to maintainership discussions
- **Learning**: Shared knowledge and growth opportunities

### Success Metrics
- **Contributor Growth**: Number of active contributors
- **Quality Standards**: Code quality and test coverage
- **Community Engagement**: Discussion participation and support
- **Impact**: Business value and user satisfaction improvements

---

## 📄 Legal and Licensing

### License
This project is licensed under the [MIT License](./LICENSE). By contributing, you agree that your contributions will be licensed under the same license.

### Contributor License Agreement
By submitting a pull request, you agree to:
- License your contribution under the MIT License
- Grant project maintainers the right to use your contribution
- Ensure you have the right to contribute the code
- Follow all applicable laws and regulations

### Intellectual Property
- **Original Work**: Ensure your contribution is original
- **Third-Party Code**: Properly attribute and license third-party code
- **Patents**: Disclose any potential patent implications
- **Confidentiality**: Do not contribute confidential information

---

## 🚀 Next Steps

Thank you for reading our contributing guide! We're excited to have you join our community.

### Ready to Contribute?
1. **Fork** the repository
2. **Set up** your development environment
3. **Find** an issue to work on
4. **Create** your feature branch
5. **Submit** your pull request

### Questions?
- Check our [FAQ](./docs/FAQ.md)
- Start a [GitHub Discussion](https://github.com/karoliang/cin7-pendo-api/discussions)
- Contact the maintainers

---

**Happy Contributing! 🎉**

*This contributing guide is maintained by the cin7-pendo-api team. Last updated: January 2025*

---

## 📞 Contact Information

### Project Maintainers
- **[Lead Maintainer]**: [Email] - Technical oversight and architecture
- **[Community Manager]**: [Email] - Community support and engagement
- **[Security Lead]**: [Email] - Security reviews and vulnerability response

### Business Contact
- **Cin7 Analytics Team**: analytics@cin7.com
- **Product Management**: product@cin7.com
- **Engineering Leadership**: engineering@cin7.com

---

*This document is part of the cin7-pendo-api project documentation. For the most up-to-date version, please visit the [GitHub repository](https://github.com/karoliang/cin7-pendo-api).*