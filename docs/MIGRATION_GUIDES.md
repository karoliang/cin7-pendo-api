# Migration Guides

This document contains comprehensive migration guides for upgrading between versions of the Cin7 Pendo API project, migrating from legacy systems, and handling breaking changes.

## Table of Contents

1. [Version Migration](#version-migration)
   - [v1.0 to v2.0 Migration](#v10-to-v20-migration)
   - [v0.9 to v1.0 Migration](#v09-to-v10-migration)
   - [Legacy to Modern Migration](#legacy-to-modern-migration)
2. [Platform Migration](#platform-migration)
   - [Webpack to Vite Migration](#webpack-to-vite-migration)
   - [Create React App Migration](#create-react-app-migration)
3. [API Migration](#api-migration)
   - [Legacy Pendo API Migration](#legacy-pendo-api-migration)
   - [Supabase Migration](#supabase-migration)
4. [Database Migration](#database-migration)
5. [Frontend Migration](#frontend-migration)
6. [Rollback Procedures](#rollback-procedures)

---

## Version Migration

### v1.0 to v2.0 Migration

#### Overview
Version 2.0 introduces significant improvements in performance, type safety, and API design. This migration guide helps you upgrade from v1.0 to v2.0 smoothly.

#### Breaking Changes

##### 1. API Client Redesign

**v1.0 API Client:**
```typescript
// Old approach - multiple clients
const pendoAPI = new PendoAPI(apiKey);
const aggregationAPI = new AggregationAPI(apiKey);

await pendoAPI.getPage(pageId);
await aggregationAPI.getPageTotals(pageId);
```

**v2.0 API Client:**
```typescript
// New unified client
const pendoClient = new PendoAPIClient(apiKey);

await pendoClient.getPage(pageId);
await pendoClient.getPageTotals(pageId);
```

**Migration Steps:**
1. Replace multiple API clients with single `PendoAPIClient`
2. Update import statements
3. Update method calls to use new unified interface

```typescript
// Migration script
function migrateAPIClient() {
  // Find all files using old API clients
  const files = findFilesContaining(['new PendoAPI(', 'new AggregationAPI(']);

  files.forEach(file => {
    let content = readFile(file);

    // Replace imports
    content = content.replace(
      /import.*PendoAPI.*from.*/g,
      "import { PendoAPIClient } from './lib/pendo-api';"
    );

    // Replace instantiations
    content = content.replace(
      /new PendoAPI\((.*?)\)/g,
      "new PendoAPIClient($1)"
    );

    content = content.replace(
      /new AggregationAPI\((.*?)\)/g,
      "" // Remove aggregation API instantiation
    );

    writeFile(file, content);
  });
}
```

##### 2. TypeScript Interface Changes

**v1.0 Interfaces:**
```typescript
interface Page {
  id: string;
  title?: string;        // Changed to 'name'
  url: string;
  viewedCount: number;
  visitorCount: number;
}

interface AnalyticsData {
  pageId: string;
  metrics: {
    views: number;
    visitors: number;
  };
}
```

**v2.0 Interfaces:**
```typescript
interface Page {
  id: string;
  name: string;          // Required field now
  url?: string;          // Optional
  viewedCount: number;
  visitorCount: number;
  uniqueVisitors: number;  // New field
  createdAt: string;     // ISO dates
  updatedAt: string;
  group?: {             // New nested object
    id: string;
    name: string;
  };
}

interface PageAnalytics {
  pageId: string;
  viewedCount: number;
  visitorCount: number;
  uniqueVisitors: number;
  totalTimeOnPage: number;  // New field
  averageTimeOnPage: number; // New field
}
```

**Migration Steps:**
1. Update all references from `title` to `name`
2. Add handling for new optional fields
3. Update date handling to use ISO strings
4. Add support for new analytics metrics

```typescript
// Data transformation utility
function migratePageData(oldPage: any): Page {
  return {
    id: oldPage.id,
    name: oldPage.title || oldPage.name || 'Untitled',
    url: oldPage.url,
    viewedCount: oldPage.viewedCount || 0,
    visitorCount: oldPage.visitorCount || 0,
    uniqueVisitors: oldPage.uniqueVisitors || oldPage.visitorCount || 0,
    createdAt: oldPage.createdAt ? new Date(oldPage.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: oldPage.updatedAt ? new Date(oldPage.updatedAt).toISOString() : new Date().toISOString(),
    group: oldPage.group
  };
}
```

##### 3. React Hook Changes

**v1.0 Hooks:**
```typescript
// Multiple hooks for different data
const { page, loading, error } = usePage(pageId);
const { analytics, loading: analyticsLoading, error: analyticsError } = usePageAnalytics(pageId);
```

**v2.0 Hooks:**
```typescript
// Unified hook
const { page, analytics, loading, error } = usePendoPage(pageId);
```

**Migration Steps:**
1. Replace multiple hook calls with single unified hook
2. Update loading state handling
3. Consolidate error handling

```typescript
// Hook migration utility
function migrateHookUsage(componentCode: string): string {
  // Replace multiple hooks with unified hook
  return componentCode
    .replace(
      /const\s+{\s*page[^}]*}\s*=\s*usePage\([^)]+\);?\s*const\s+{\s*analytics[^}]*}\s*=\s*usePageAnalytics\([^)]+\);?/g,
      'const { page, analytics, loading, error } = usePendoPage(pageId);'
    )
    .replace(
      /loading:\s*analyticsLoading/g,
      'loading'
    )
    .replace(
      /error:\s*analyticsError/g,
      'error'
    );
}
```

#### Migration Checklist

- [ ] **Backup current codebase** before starting migration
- [ ] **Update dependencies** in package.json
- [ ] **Replace API client instances** with new unified client
- [ ] **Update TypeScript interfaces** and type definitions
- [ ] **Migrate React components** to use new hooks
- [ ] **Update error handling** for new error structure
- [ ] **Run test suite** and fix any failing tests
- [ ] **Update documentation** with new API patterns
- [ ] **Test in staging environment** before production deployment
- [ ] **Monitor performance** after migration

### v0.9 to v1.0 Migration

#### Overview
Migration from v0.9 (beta) to v1.0 (stable) focuses on API stabilization, improved error handling, and production readiness.

#### Breaking Changes

##### 1. Error Handling Standardization

**v0.9 Error Handling:**
```typescript
try {
  const data = await pendoAPI.getPage(pageId);
} catch (error) {
  console.error(error); // Generic error handling
  setError('Failed to load page');
}
```

**v1.0 Error Handling:**
```typescript
try {
  const data = await pendoAPI.getPage(pageId);
} catch (error) {
  if (error instanceof PendoAPIError) {
    switch (error.code) {
      case 'NOT_FOUND':
        setError('Page not found');
        break;
      case 'TIMEOUT_ERROR':
        setError('Request timed out');
        break;
      case 'RATE_LIMIT_ERROR':
        setError('Too many requests. Please try again later.');
        break;
      default:
        setError(`API Error: ${error.message}`);
    }
  }
}
```

##### 2. Configuration Changes

**v0.9 Configuration:**
```javascript
// .env
REACT_APP_PENDO_API_KEY=your-key
REACT_APP_PENDO_TIMEOUT=10000
```

**v1.0 Configuration:**
```javascript
// .env
REACT_APP_PENDO_API_KEY=your-key
REACT_APP_PENDO_API_TIMEOUT=30000
REACT_APP_PENDO_CACHE_TTL=900000
REACT_APP_PENDO_RATE_LIMIT_ENABLED=true
```

#### Migration Steps

1. **Update error handling** throughout the application
2. **Update configuration files** with new environment variables
3. **Implement proper error boundaries** in React components
4. **Add retry logic** for failed requests
5. **Update monitoring** to track new error types

---

## Platform Migration

### Webpack to Vite Migration

#### Overview
This migration guide helps you move from a Webpack-based build system to Vite for faster development and improved performance.

#### Migration Benefits
- 🚀 **Faster development server** (10-100x faster startup)
- ⚡ **Instant Hot Module Replacement** (HMR)
- 📦 **Optimized production builds**
- 🛠️ **Simplified configuration**
- 🔧 **Better TypeScript integration**

#### Step-by-Step Migration

##### 1. Install Vite and Dependencies

```bash
# Remove Create React App dependencies
npm uninstall react-scripts @types/react @types/react-dom

# Install Vite and React plugin
npm install --save-dev vite @vitejs/plugin-react

# Install TypeScript support
npm install --save-dev @vitejs/plugin-react-swc
```

##### 2. Create Vite Configuration

**Create `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    'process.env': process.env,
  },
});
```

##### 3. Update Environment Variables

**Move `public/index.html` to `index.html`:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cin7 Pendo API</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Create `src/main.tsx`:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

##### 4. Update Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "serve": "vite preview"
  }
}
```

##### 5. Update Environment Variable Usage

**Replace `process.env` with `import.meta.env`:**

```typescript
// Before
const apiKey = process.env.REACT_APP_PENDO_API_KEY;

// After
const apiKey = import.meta.env.VITE_PENDO_API_KEY;
```

**Update `.env` file:**
```bash
# Before
REACT_APP_PENDO_API_KEY=your-key

# After
VITE_PENDO_API_KEY=your-key
```

##### 6. Update Import Statements

**Absolute imports work out of the box:**
```typescript
// No need for webpack aliases configuration
import { PendoAPIClient } from '@/lib/pendo-api';
import { PageAnalytics } from '@/components/PageAnalytics';
```

##### 7. Handle Path Resolution Issues

**Update TypeScript configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Create `vite-env.d.ts`:**
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PENDO_API_KEY: string;
  readonly VITE_PENDO_API_TIMEOUT: string;
  readonly VITE_PENDO_CACHE_TTL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### Common Issues and Solutions

##### Issue 1: Module Resolution Problems

**Problem:** Import aliases not working after migration.

**Solution:** Ensure both Vite config and TypeScript config are updated consistently.

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

##### Issue 2: Environment Variables Not Loading

**Problem:** Environment variables are `undefined` in the browser.

**Solution:** Ensure all environment variables are prefixed with `VITE_`.

```bash
# .env
VITE_PENDO_API_KEY=your-key
VITE_API_BASE_URL=https://api.example.com
```

##### Issue 3: CSS Import Issues

**Problem:** CSS modules or CSS imports not working correctly.

**Solution:** Update CSS import paths and ensure proper CSS processing.

```typescript
// CSS modules are supported by default
import styles from './Component.module.css';

// Regular CSS imports work
import './styles.css';
```

#### Migration Checklist

- [ ] **Backup project** before starting migration
- [ ] **Install Vite dependencies**
- [ ] **Create Vite configuration** file
- [ ] **Move index.html** to project root
- [ ] **Create main.tsx entry point**
- [ ] **Update package.json scripts**
- [ ] **Migrate environment variables**
- [ ] **Update import statements**
- [ ] **Configure TypeScript paths**
- [ ] **Test development server**
- [ ] **Test production build**
- [ ] **Update CI/CD pipeline** if applicable
- [ ] **Deploy and monitor** application

---

## API Migration

### Legacy Pendo API Migration

#### Overview
This guide helps migrate from legacy Pendo API endpoints to the current Aggregation API with improved performance and features.

#### Legacy API Structure
```typescript
// Legacy approach - multiple API endpoints
const pageData = await fetch('/api/page/' + pageId);
const analyticsData = await fetch('/api/analytics/' + pageId);
const timeSeriesData = await fetch('/api/timeseries/' + pageId);
```

#### Modern API Structure
```typescript
// Modern approach - unified aggregation API
const client = new PendoAPIClient(apiKey);
const [pageData, analyticsData, timeSeriesData] = await Promise.all([
  client.getPage(pageId),
  client.getPageTotals(pageId),
  client.getPageTimeSeries(pageId)
]);
```

#### Migration Steps

##### 1. Replace Multiple Endpoints with Unified Client

**Before:**
```typescript
class LegacyPendoAPI {
  private baseURL = 'https://app.pendo.io/api/v1';

  async getPage(id: string) {
    const response = await fetch(`${this.baseURL}/page/${id}`, {
      headers: { 'x-pendo-integration-key': this.apiKey }
    });
    return response.json();
  }

  async getAnalytics(id: string) {
    // Custom aggregation logic
    const request = {
      response: { mimeType: "application/json" },
      request: { pipeline: [/* complex pipeline */] }
    };
    // ... implementation
  }
}
```

**After:**
```typescript
// Modern unified client
const pendoClient = new PendoAPIClient(apiKey);

// Single method calls
const page = await pendoClient.getPage(pageId);
const analytics = await pendoClient.getPageTotals(pageId);
const timeSeries = await pendoClient.getPageTimeSeries(pageId);
```

##### 2. Update Error Handling

**Before:**
```typescript
try {
  const data = await legacyAPI.getPage(pageId);
} catch (error) {
  if (error.status === 404) {
    // Handle 404
  } else if (error.status === 500) {
    // Handle 500
  }
}
```

**After:**
```typescript
try {
  const data = await pendoClient.getPage(pageId);
} catch (error) {
  if (error instanceof PendoAPIError) {
    switch (error.code) {
      case 'NOT_FOUND':
        // Handle 404
        break;
      case 'SERVICE_ERROR':
        // Handle 500
        break;
      case 'RATE_LIMIT_ERROR':
        // Handle 429
        break;
    }
  }
}
```

##### 3. Implement Caching and Rate Limiting

**Modern client includes built-in caching:**
```typescript
const pendoClient = new PendoAPIClient(apiKey, {
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 100
  },
  rateLimiting: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 minute
  }
});

// Caching is automatic
const page1 = await pendoClient.getPage('page1'); // API call
const page2 = await pendoClient.getPage('page1'); // From cache
```

### Supabase Migration

#### Overview
This guide covers migrating from local storage or other database solutions to Supabase for data persistence.

#### Migration Benefits
- 🗄️ **Managed PostgreSQL database**
- 🔐 **Built-in authentication**
- 📡 **Real-time subscriptions**
- 🎯 **Row-level security**
- 📊 **Auto-generated APIs**

#### Migration Steps

##### 1. Set Up Supabase Project

1. **Create Supabase account** and new project
2. **Get project URL and anon key**
3. **Set up environment variables**

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

##### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
npm install --save-dev @supabase/auth-helpers-react
```

##### 3. Initialize Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

##### 4. Create Database Schema

```sql
-- pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pendo_page_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- page_analytics table
CREATE TABLE page_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  viewed_count INTEGER DEFAULT 0,
  visitor_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_time_on_page INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id, analytics_date)
);

-- Create indexes
CREATE INDEX idx_pages_pendo_id ON pages(pendo_page_id);
CREATE INDEX idx_analytics_date ON page_analytics(analytics_date);
CREATE INDEX idx_analytics_page_date ON page_analytics(page_id, analytics_date);
```

##### 5. Replace Local Storage Calls

**Before:**
```typescript
// Local storage approach
const savePageData = (pageId: string, data: any) => {
  localStorage.setItem(`page_${pageId}`, JSON.stringify(data));
};

const getPageData = (pageId: string) => {
  const data = localStorage.getItem(`page_${pageId}`);
  return data ? JSON.parse(data) : null;
};
```

**After:**
```typescript
// Supabase approach
const savePageData = async (pendoPageId: string, data: any) => {
  const { error } = await supabase
    .from('pages')
    .upsert({
      pendo_page_id: pendoPageId,
      name: data.name,
      url: data.url,
      metadata: data
    });

  if (error) throw error;
};

const getPageData = async (pendoPageId: string) => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('pendo_page_id', pendoPageId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Not found is ok
  return data;
};
```

##### 6. Add Real-time Updates

```typescript
// Real-time subscriptions for live updates
const subscribeToPageUpdates = (pageId: string, callback: Function) => {
  return supabase
    .channel(`page_${pageId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'page_analytics',
        filter: `page_id=eq.${pageId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();
};

// Usage in React component
useEffect(() => {
  const subscription = subscribeToPageUpdates(pageId, (payload) => {
    if (payload.eventType === 'UPDATE') {
      setAnalyticsData(payload.new);
    }
  });

  return () => subscription.unsubscribe();
}, [pageId]);
```

---

## Database Migration

### Schema Migration

#### Overview
This guide covers migrating database schemas and data between different versions or platforms.

#### Migration Script

```typescript
// scripts/migrate-database.ts
import { supabase } from '../src/lib/supabase';

interface MigrationStep {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: MigrationStep[] = [
  {
    version: '1.0.0',
    description: 'Initial schema',
    up: async () => {
      // Create initial tables
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS pages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            pendo_page_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      if (error) throw error;
    },
    down: async () => {
      const { error } = await supabase.rpc('execute_sql', {
        sql: 'DROP TABLE IF EXISTS pages;'
      });
      if (error) throw error;
    }
  },
  {
    version: '1.1.0',
    description: 'Add analytics table',
    up: async () => {
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS page_analytics (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
            analytics_date DATE NOT NULL,
            viewed_count INTEGER DEFAULT 0,
            visitor_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      if (error) throw error;
    },
    down: async () => {
      const { error } = await supabase.rpc('execute_sql', {
        sql: 'DROP TABLE IF EXISTS page_analytics;'
      });
      if (error) throw error;
    }
  }
];

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Get current migration version
  const { data: currentVersion } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const lastVersion = currentVersion?.version || '0.0.0';

  for (const migration of migrations) {
    if (migration.version > lastVersion) {
      console.log(`📦 Running migration ${migration.version}: ${migration.description}`);

      try {
        await migration.up();

        // Record migration
        await supabase
          .from('schema_migrations')
          .insert({ version: migration.version });

        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        process.exit(1);
      }
    }
  }

  console.log('🎉 All migrations completed successfully!');
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}
```

---

## Frontend Migration

### React Version Migration

#### Overview
This guide covers migrating between React versions, particularly the major changes in React 18.

#### React 18 Migration

##### 1. Update Dependencies

```bash
# Update to React 18
npm install react@18 react-dom@18

# Update TypeScript types
npm install --save-dev @types/react@18 @types/react-dom@18
```

##### 2. Update Rendering API

**Before (React 17):**
```typescript
import ReactDOM from 'react-dom';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

**After (React 18):**
```typescript
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

##### 3. Update State Management for Concurrent Features

**Add loading states for better UX with concurrent features:**
```typescript
// Components can now provide loading states during transitions
import { startTransition } from 'react';

const handleFilterChange = (newFilter: string) => {
  startTransition(() => {
    setFilter(newFilter);
  });
};
```

---

## Rollback Procedures

### Emergency Rollback Guide

#### Overview
This guide provides procedures for rolling back changes if issues arise during migration.

#### Pre-Rollback Checklist
- [ ] **Identify the issue** and its impact
- [ ] **Communicate with stakeholders** about the rollback
- [ ] **Back up current state** before rolling back
- [ ] **Schedule rollback** during low-traffic period
- [ ] **Prepare rollback plan** and test it

#### Database Rollback

```typescript
// scripts/rollback-migration.ts
async function rollbackMigration(targetVersion: string) {
  console.log(`🔄 Rolling back to version ${targetVersion}...`);

  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion)
    .reverse();

  for (const migration of migrationsToRollback) {
    console.log(`⏪ Rolling back ${migration.version}: ${migration.description}`);

    try {
      await migration.down();

      // Remove migration record
      await supabase
        .from('schema_migrations')
        .delete()
        .eq('version', migration.version);

      console.log(`✅ Rollback ${migration.version} completed`);
    } catch (error) {
      console.error(`❌ Rollback ${migration.version} failed:`, error);
      throw error;
    }
  }

  console.log('🎉 Rollback completed successfully!');
}
```

#### Application Rollback

```bash
# Git rollback to previous commit
git checkout [previous-stable-commit]

# Revert to previous deployment
git revert [current-deployment-commit]

# Force push rollback (emergency only)
git push --force-with-lease origin main
```

#### Frontend Rollback

```typescript
// Feature flags for emergency rollback
const FEATURES = {
  NEW_API_CLIENT: import.meta.env.VITE_ENABLE_NEW_API_CLIENT === 'true',
  NEW_UI_COMPONENTS: import.meta.env.VITE_ENABLE_NEW_UI === 'true',
  NEW_ANALYTICS: import.meta.env.VITE_ENABLE_NEW_ANALYTICS === 'true'
};

// Component with rollback capability
export const PageAnalytics = ({ pageId }: { pageId: string }) => {
  if (FEATURES.NEW_ANALYTICS) {
    return <ModernPageAnalytics pageId={pageId} />;
  } else {
    return <LegacyPageAnalytics pageId={pageId} />;
  }
};
```

#### Post-Rollback Verification

1. **Verify application functionality**
2. **Check API integrations**
3. **Test critical user flows**
4. **Monitor error rates**
5. **Confirm data integrity**
6. **Document rollback reasons**

---

## Migration Best Practices

### General Guidelines

1. **Plan Ahead**
   - Create detailed migration plan
   - Schedule migrations during low-traffic periods
   - Communicate changes to all stakeholders

2. **Backup Everything**
   - Database backups
   - Code snapshots
   - Configuration files
   - Environment variables

3. **Test Thoroughly**
   - Staging environment testing
   - Integration testing
   - Performance testing
   - User acceptance testing

4. **Monitor Closely**
   - Application performance
   - Error rates
   - User feedback
   - System resources

5. **Document Changes**
   - Migration procedures
   - Configuration changes
   - Known issues
   - Rollback procedures

### Risk Mitigation

1. **Feature Flags**
   - Enable/disable features without deployment
   - Gradual rollouts
   - Emergency rollback capability

2. **Canary Deployments**
   - Deploy to small subset of users
   - Monitor for issues
   - Gradual expansion

3. **Blue-Green Deployment**
   - Maintain two production environments
   - Switch traffic between environments
   - Instant rollback capability

4. **Monitoring and Alerting**
   - Real-time monitoring
   - Automated alerts
   - Performance thresholds
   - Error rate tracking

This comprehensive migration guide should help ensure smooth transitions between versions and platforms while minimizing risks and downtime.