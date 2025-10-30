# Netlify Deployment Guide - Vite 7 + React + React Router v7

**Last Updated:** October 2025
**Technology Stack:**
- Vite 7.1.7
- React 19.1.1
- React Router v7.9.5
- TypeScript 5.9.3

This guide provides comprehensive best practices for deploying a modern Vite + React + React Router application to Netlify, based on official documentation and industry standards.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Netlify Configuration (netlify.toml)](#netlify-configuration)
3. [SPA Routing Setup](#spa-routing-setup)
4. [Build Optimization](#build-optimization)
5. [Environment Variables](#environment-variables)
6. [Security Headers](#security-headers)
7. [Caching Strategy](#caching-strategy)
8. [Deployment Methods](#deployment-methods)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18.14.0 or later
- npm or yarn package manager
- Git repository connected to GitHub
- Netlify account

### Installation

```bash
# Install Netlify Vite plugin (recommended)
npm install --save-dev @netlify/vite-plugin

# Install Netlify CLI for local testing
npm install -g netlify-cli
```

---

## Netlify Configuration

### Complete netlify.toml Configuration

Create a `netlify.toml` file in your **project root** (not in the frontend folder):

```toml
# Build configuration
[build]
  # Build command - TypeScript compilation + Vite build
  command = "cd frontend && npm run build"

  # Publish directory - where Vite outputs built files
  publish = "frontend/dist"

  # Node version (18.14.0 or later recommended)
  node_version = "20"

# Build environment variables
[build.environment]
  # Enable newer npm features
  NPM_FLAGS = "--legacy-peer-deps"

# SPA routing - redirect all requests to index.html (status 200 = rewrite)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  # Don't apply to actual files (images, CSS, JS, etc.)
  conditions = {Role = ["user"]}

# Security Headers - Modern security best practices
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking attacks
    X-Frame-Options = "DENY"

    # Prevent MIME type sniffing
    X-Content-Type-Options = "nosniff"

    # Enable XSS protection (legacy browsers)
    X-XSS-Protection = "1; mode=block"

    # Referrer policy for privacy
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Permissions policy (restrict browser features)
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

    # Content Security Policy (adjust based on your needs)
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://app.pendo.io https://data.pendo.io https://cdn.pendo.io;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    """

# Cache control for static assets (JS/CSS with hashes)
[[headers]]
  for = "/assets/*"
  [headers.values]
    # Long-term caching for hashed assets (1 year)
    Cache-Control = "public, max-age=31536000, immutable"

# Cache control for images
[[headers]]
  for = "/*.{jpg,jpeg,png,gif,svg,webp,ico}"
  [headers.values]
    # Cache images for 1 week
    Cache-Control = "public, max-age=604800"

# Cache control for fonts
[[headers]]
  for = "/*.{woff,woff2,ttf,eot}"
  [headers.values]
    # Cache fonts for 1 year
    Cache-Control = "public, max-age=31536000, immutable"

# Don't cache HTML files (always get latest version)
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Don't cache the main index.html
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Function settings (if using Netlify Functions)
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Development configuration
[dev]
  command = "cd frontend && npm run dev"
  targetPort = 5173
  autoLaunch = false
```

---

## SPA Routing Setup

### Option 1: Using netlify.toml (Recommended)

Already included in the configuration above:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Why status 200?**
- Status 200 is a **rewrite**, not a redirect
- The URL stays the same in the browser
- React Router can read the URL and route correctly
- No additional HTTP request is made

### Option 2: Using _redirects File

Create `frontend/public/_redirects`:

```
# SPA routing fallback
/*    /index.html   200
```

**Key Points:**
- Place in `public/` folder (Vite copies to `dist/` during build)
- Plain text file, no extension
- One rule per line
- Simpler syntax than netlify.toml
- Processed **before** netlify.toml rules

### Which Method to Use?

| Method | When to Use |
|--------|-------------|
| **netlify.toml** | ✅ Preferred - All configuration in one place, better version control, more features |
| **_redirects** | Simple projects, quick setup, when you don't need other Netlify features |

---

## Build Optimization

### Vite Configuration

Update your `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',

    // Generate sourcemaps for production debugging (optional)
    sourcemap: false,

    // Minification
    minify: 'esbuild', // faster than terser

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries chunk
          'ui-vendor': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            'lucide-react',
            '@heroicons/react'
          ],

          // Charts chunk (only loads on analytics pages)
          'charts': ['recharts'],

          // State management
          'state': ['zustand', '@tanstack/react-query'],
        },

        // Asset file naming with hash for cache busting
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    },

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Preview server configuration (for local testing)
  preview: {
    port: 4173,
    strictPort: false,
  },
})
```

### Advanced Optimization: Netlify Vite Plugin

Install and configure the official Netlify Vite plugin:

```bash
npm install --save-dev @netlify/vite-plugin
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import netlify from '@netlify/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    netlify(), // Adds Netlify platform features to dev server
  ],
  // ... rest of config
})
```

**Benefits:**
- Emulates Netlify's production environment locally
- Automatic CSS code splitting
- Async chunk loading optimization
- Better dev/prod parity

### Bundle Analysis

Install bundle visualizer to analyze bundle size:

```bash
npm install --save-dev rollup-plugin-visualizer
```

Update `vite.config.ts`:

```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Generate bundle analysis report
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

Run build and it will open a visualization showing bundle composition.

---

## Environment Variables

### Vite Environment Variable Rules

**CRITICAL:** Vite requires `VITE_` prefix for client-side variables.

```bash
# ✅ Exposed to client code
VITE_API_URL=https://api.example.com
VITE_PENDO_API_KEY=your-key

# ❌ NOT exposed to client code
API_URL=https://api.example.com
```

### Local Development (.env)

Create `frontend/.env`:

```bash
# Pendo API Configuration
VITE_PENDO_API_KEY=your-integration-key-here
VITE_PENDO_API_BASE_URL=https://app.pendo.io

# Environment
VITE_APP_ENV=development
```

### Production (Netlify Dashboard)

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add variables with `VITE_` prefix:
   - `VITE_PENDO_API_KEY`
   - `VITE_PENDO_API_BASE_URL`
   - `VITE_APP_ENV`

3. Set scopes (Production, Deploy Previews, Branch Deploys)

### Using Environment Variables

```typescript
// Access in your code
const apiKey = import.meta.env.VITE_PENDO_API_KEY
const apiUrl = import.meta.env.VITE_PENDO_API_BASE_URL
const isDev = import.meta.env.DEV // built-in Vite variable
const isProd = import.meta.env.PROD // built-in Vite variable

// Type-safe environment variables (optional)
// Create src/vite-env.d.ts:
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PENDO_API_KEY: string
  readonly VITE_PENDO_API_BASE_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Security Best Practices

**⚠️ WARNING:** Do NOT put sensitive secrets in VITE_ variables!

- Variables with `VITE_` prefix are embedded in the client bundle
- They are visible to anyone who inspects your JavaScript
- Only use for non-sensitive configuration (API URLs, public keys)
- For sensitive operations, use Netlify Functions or backend API

### Debugging Environment Variables

```bash
# In netlify.toml, add to build command:
[build]
  command = "env && cd frontend && npm run build"
```

This prints all environment variables before building.

---

## Security Headers

### Content Security Policy (CSP)

The CSP in the netlify.toml above is a **starting point**. Customize based on your needs:

```toml
Content-Security-Policy = """
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.pendo.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://app.pendo.io https://data.pendo.io https://cdn.pendo.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
"""
```

**Key Directives:**
- `default-src 'self'` - Only load resources from same origin by default
- `script-src` - Control where scripts can load from
- `style-src` - Control CSS sources
- `img-src` - Control image sources
- `connect-src` - Control AJAX/fetch/WebSocket endpoints
- `frame-ancestors 'none'` - Prevent clickjacking

### Testing CSP

**⚠️ Use Report-Only Mode First:**

```toml
# Test without blocking resources
Content-Security-Policy-Report-Only = "default-src 'self'; ..."
```

- Monitor browser console for violations
- Once confident, switch to `Content-Security-Policy`

### Advanced: Dynamic CSP with Nonces

For better security without `'unsafe-inline'`:

1. Install Netlify CSP Integration:
   ```bash
   netlify integration:install csp
   ```

2. It generates random nonces on each request
3. Scripts must include the nonce attribute to execute

**Trade-off:** More secure but requires additional setup.

### Security Headers Reference

```toml
# Prevent clickjacking
X-Frame-Options = "DENY"

# Prevent MIME type sniffing
X-Content-Type-Options = "nosniff"

# XSS protection for older browsers
X-XSS-Protection = "1; mode=block"

# Control referrer information
Referrer-Policy = "strict-origin-when-cross-origin"

# Restrict browser features
Permissions-Policy = "geolocation=(), microphone=(), camera=()"

# Force HTTPS (if using custom domain)
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

---

## Caching Strategy

### How Netlify Caching Works

**Netlify's CDN caching:**
- Static assets cached at edge nodes globally
- Automatic invalidation on new deploys
- Default cache: `Cache-Control: max-age=0, must-revalidate`

### Optimal Caching Configuration

Already included in netlify.toml above:

```toml
# 1. Long-term cache for hashed assets (immutable)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# 2. Cache images for 1 week
[[headers]]
  for = "/*.{jpg,jpeg,png,gif,svg,webp,ico}"
  [headers.values]
    Cache-Control = "public, max-age=604800"

# 3. Cache fonts for 1 year
[[headers]]
  for = "/*.{woff,woff2,ttf,eot}"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# 4. Never cache HTML (always fresh)
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Why This Strategy Works

1. **Hashed Assets (`/assets/*`)**
   - Vite generates filenames with content hashes: `app.a1b2c3d4.js`
   - Hash changes when content changes
   - Safe to cache forever (`immutable`)
   - Users always get latest version via new HTML

2. **HTML Files**
   - Never cached (always check server)
   - Contains references to new hashed assets
   - Ensures users get updated assets after deploy

3. **Images/Fonts**
   - Medium-term caching (1 week for images, 1 year for fonts)
   - Reduces bandwidth and load times
   - Can be updated by changing filename if needed

### Cache-Control Directives Explained

- `public` - Can be cached by browsers and CDNs
- `private` - Only cache in browser, not CDN
- `max-age=31536000` - Cache for 1 year (in seconds)
- `immutable` - Content will never change, don't revalidate
- `must-revalidate` - Check with server when stale

---

## Deployment Methods

### Method 1: Git-Based Continuous Deployment (Recommended)

**Best for:** Production sites, team collaboration, CI/CD workflows

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and authorize
   - Select your repository

3. **Configure Build Settings:**
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
   - (Netlify auto-detects from netlify.toml)

4. **Deploy:**
   - Click "Deploy site"
   - Every push to main triggers automatic deployment

**Benefits:**
- Automatic deployments on push
- Deploy previews for pull requests
- Rollback to previous deploys
- Branch deploys for staging

### Method 2: Netlify CLI Deployment

**Best for:** Quick deployments, testing, local development

1. **Install CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Initialize Site:**
   ```bash
   netlify init
   ```

4. **Deploy Draft:**
   ```bash
   # Build first
   cd frontend && npm run build && cd ..

   # Deploy draft (preview URL)
   netlify deploy
   ```

5. **Deploy to Production:**
   ```bash
   netlify deploy --prod
   ```

**Benefits:**
- Deploy from local machine
- Test before production
- Manual control over deploys

### Method 3: Manual Drag & Drop

**Best for:** Quick demos, one-off deployments

1. Build locally:
   ```bash
   cd frontend
   npm run build
   ```

2. Go to [Netlify Drop](https://app.netlify.com/drop)

3. Drag `frontend/dist` folder onto the page

**Limitations:**
- No automatic deployments
- No git history
- No environment variables from dashboard
- Not recommended for production

### Deploy Previews for Pull Requests

**Automatic with Git-based deployment:**

1. Create a pull request on GitHub
2. Netlify automatically builds and deploys a preview
3. Preview URL appears in PR comments
4. Test changes before merging
5. Merge to main → auto-deploy to production

**Configuration in netlify.toml:**

```toml
[context.deploy-preview]
  command = "cd frontend && npm run build"

[context.branch-deploy]
  command = "cd frontend && npm run build"
```

---

## Troubleshooting

### Issue 1: 404 on Page Refresh

**Symptom:** Direct navigation to routes (e.g., `/dashboard`) returns 404

**Cause:** Server tries to find `/dashboard.html` file which doesn't exist

**Solution:** Add SPA redirect rule (see [SPA Routing Setup](#spa-routing-setup))

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Issue 2: Environment Variables Not Working

**Symptom:** `import.meta.env.VITE_API_KEY` is undefined

**Checklist:**
1. ✅ Variable has `VITE_` prefix
2. ✅ Added to Netlify Dashboard → Environment Variables
3. ✅ Correct deployment context (Production/Deploy Preview)
4. ✅ Triggered new build after adding variable
5. ✅ No typos in variable name

**Debug:**
```bash
# Add to build command in netlify.toml
[build]
  command = "env | grep VITE_ && cd frontend && npm run build"
```

---

### Issue 3: Assets Not Loading (Mixed Content)

**Symptom:** Console errors about mixed content (HTTP on HTTPS site)

**Solution:** Ensure all asset URLs use relative paths or HTTPS

```typescript
// ❌ Bad
const apiUrl = 'http://api.example.com'

// ✅ Good
const apiUrl = import.meta.env.VITE_API_URL // Set to https://
```

---

### Issue 4: Build Fails on Netlify But Works Locally

**Common Causes:**

1. **Missing dependencies:**
   ```bash
   # Ensure all dependencies are in package.json
   npm install --save missing-package
   ```

2. **Node version mismatch:**
   ```toml
   # In netlify.toml
   [build]
     node_version = "20"
   ```

3. **TypeScript errors:**
   ```bash
   # Run locally to see errors
   npm run build
   ```

4. **Case-sensitive file paths:**
   ```typescript
   // ❌ May fail on Linux (Netlify)
   import Button from './components/button'

   // ✅ Match exact filename
   import Button from './components/Button'
   ```

---

### Issue 5: Slow Build Times

**Optimization strategies:**

1. **Enable build plugins caching:**
   ```toml
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Use `manualChunks` to split code:**
   (See [Build Optimization](#build-optimization))

3. **Limit bundle size:**
   - Remove unused dependencies
   - Use dynamic imports for large libraries
   - Analyze with rollup-plugin-visualizer

4. **Use Netlify's build image caching:**
   (Automatic, but ensure package-lock.json is committed)

---

### Issue 6: Headers Not Applied

**Checklist:**
1. ✅ `netlify.toml` in repository root
2. ✅ Correct `for` path patterns
3. ✅ TOML syntax valid (use [TOML validator](https://www.toml-lint.com/))
4. ✅ Deployed after adding headers

**Test headers:**
```bash
# Check response headers
curl -I https://your-site.netlify.app

# Or use browser DevTools → Network tab
```

---

### Issue 7: React Router Not Working After Deploy

**Symptom:** Routes work on dev server but not on Netlify

**Cause:** Missing SPA redirect or incorrect React Router setup

**Solution:**

1. Verify redirect rule in `netlify.toml`
2. Check React Router setup:

```typescript
// ✅ Correct - Use BrowserRouter
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Performance Checklist

Before deploying, verify:

- [ ] All images optimized (WebP, compressed)
- [ ] Code splitting configured (manualChunks)
- [ ] Environment variables use `VITE_` prefix
- [ ] `netlify.toml` in repository root
- [ ] SPA redirect rule configured
- [ ] Security headers configured
- [ ] Cache headers for static assets
- [ ] Build produces `dist` folder with hashed assets
- [ ] TypeScript compiles without errors
- [ ] No console errors in production build

---

## Additional Resources

### Official Documentation
- [Netlify Vite Framework Guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Netlify React Router Guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/react-router/)
- [Vite Production Build Guide](https://vite.dev/guide/build.html)
- [Netlify Redirects & Rewrites](https://docs.netlify.com/manage/routing/redirects/overview/)

### Tools
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [TOML Validator](https://www.toml-lint.com/)

### Community Resources
- [Netlify Community Forums](https://answers.netlify.com/)
- [Vite Discord](https://chat.vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)

---

## Next Steps

1. Create `netlify.toml` in project root
2. Configure environment variables in Netlify Dashboard
3. Update `vite.config.ts` with build optimizations
4. Test locally with `netlify dev`
5. Deploy with `netlify deploy --prod` or push to GitHub
6. Monitor build logs and fix any errors
7. Test all routes after deployment
8. Verify security headers with browser DevTools

---

**Questions or Issues?**

Check the [Netlify Support Forums](https://answers.netlify.com/) or review the [troubleshooting section](#troubleshooting) above.
