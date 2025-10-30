# Netlify Deployment Architecture

**Visual guide to understanding how your Vite + React app works on Netlify**

---

## 1. Project Structure

```
cin7-pendo-api/
├── netlify.toml                 # Main Netlify configuration (PROJECT ROOT)
├── NETLIFY_DEPLOYMENT_GUIDE.md  # Comprehensive deployment guide
├── DEPLOYMENT_CHECKLIST.md      # Pre-deployment checklist
├── QUICK_START_NETLIFY.md       # 5-minute quick start
├── RESEARCH_SUMMARY.md          # Research findings & best practices
│
└── frontend/                    # React app directory
    ├── vite.config.ts           # Vite build configuration
    ├── package.json             # Dependencies
    ├── .env                     # Local environment variables (git-ignored)
    ├── .env.example             # Example environment variables
    │
    ├── public/                  # Static assets (copied as-is)
    │   └── _redirects           # SPA routing fallback (backup method)
    │
    ├── src/                     # Source code
    │   ├── vite-env.d.ts        # Type-safe environment variables
    │   ├── main.tsx             # App entry point
    │   └── ...                  # Components, routes, etc.
    │
    └── dist/                    # Build output (after npm run build)
        ├── index.html           # Main HTML file (not cached)
        ├── _redirects           # Copied from public/
        ├── assets/              # Optimized assets with hashes
        │   ├── css/             # Minified CSS
        │   │   └── index.[hash].css
        │   └── js/              # Code-split JS bundles
        │       ├── react-vendor.[hash].js
        │       ├── ui-vendor.[hash].js
        │       ├── charts.[hash].js
        │       ├── state.[hash].js
        │       └── index.[hash].js
        └── vite.svg             # Other public files
```

---

## 2. Build Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Netlify receives git push or manual deploy               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Reads netlify.toml configuration                         │
│    - Build command: cd frontend && npm run build            │
│    - Publish directory: frontend/dist                       │
│    - Node version: 20                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Installs dependencies                                    │
│    - npm install (in frontend/ directory)                   │
│    - Uses package-lock.json for consistent versions         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Injects environment variables from Netlify Dashboard     │
│    - VITE_PENDO_API_KEY                                     │
│    - VITE_PENDO_API_BASE_URL                                │
│    - VITE_APP_ENV                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Runs TypeScript compilation (tsc -b)                     │
│    - Type checking                                          │
│    - Fails if TypeScript errors                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Runs Vite build                                          │
│    - Bundles React app                                      │
│    - Minifies code with esbuild                             │
│    - Code splitting (manualChunks)                          │
│    - Generates content hashes for filenames                 │
│    - CSS code splitting                                     │
│    - Copies public/ files to dist/                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Publishes frontend/dist/ to Netlify CDN                  │
│    - Distributes to global edge nodes                       │
│    - Applies headers from netlify.toml                      │
│    - Configures redirects                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Site is live! 🎉                                         │
│    - Accessible at your Netlify URL                         │
│    - Invalidates previous deploy cache                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Runtime Request Flow

### Scenario A: First Visit to Homepage

```
User Browser                    Netlify CDN                Your App
     │                              │                          │
     │  GET https://site.app/       │                          │
     ├──────────────────────────────>                          │
     │                              │                          │
     │       200 OK                 │                          │
     │       index.html             │                          │
     │  (Cache: max-age=0)          │                          │
     <──────────────────────────────┤                          │
     │                              │                          │
     │  Parse HTML, load assets     │                          │
     │                              │                          │
     │  GET /assets/js/react-vendor.[hash].js                  │
     ├──────────────────────────────>                          │
     │       200 OK                 │                          │
     │  (Cache: max-age=31536000)   │                          │
     <──────────────────────────────┤                          │
     │                              │                          │
     │  GET /assets/css/index.[hash].css                       │
     ├──────────────────────────────>                          │
     │       200 OK                 │                          │
     <──────────────────────────────┤                          │
     │                              │                          │
     │  Execute React app           │                          │
     ├──────────────────────────────────────────────────────────>
     │                              │                          │
     │  API call to Pendo           │                          │
     │  (using VITE_PENDO_API_KEY)  │                          │
     ├──────────────────────────────────────────────────────────>
     │                              │         200 OK           │
     <──────────────────────────────────────────────────────────┤
```

---

### Scenario B: Direct Navigation to Route (e.g., /dashboard)

```
User Browser                    Netlify CDN                Your App
     │                              │                          │
     │  GET https://site.app/dashboard                         │
     ├──────────────────────────────>                          │
     │                              │                          │
     │  Netlify checks redirect rules                          │
     │  /* -> /index.html (200)     │                          │
     │                              │                          │
     │       200 OK                 │                          │
     │       index.html             │                          │
     │  URL stays: /dashboard       │                          │
     <──────────────────────────────┤                          │
     │                              │                          │
     │  React Router reads URL      │                          │
     │  Renders Dashboard component │                          │
     ├──────────────────────────────────────────────────────────>
     │                              │      Dashboard           │
     <──────────────────────────────────────────────────────────┤
```

**Key Point:** Status 200 redirect is a REWRITE, not a redirect.
- URL stays as `/dashboard`
- React Router can read the URL and route correctly
- No additional HTTP request

---

### Scenario C: Page Refresh (Without Redirect Rule)

```
User Browser                    Netlify CDN
     │                              │
     │  GET /dashboard              │
     ├──────────────────────────────>
     │                              │
     │  Looks for dashboard.html    │
     │  File not found              │
     │                              │
     │       404 Not Found          │
     <──────────────────────────────┤
     │                              │
     │  😱 Error page               │
```

**This is why the redirect rule is CRITICAL!**

---

## 4. Caching Strategy Architecture

```
Asset Type          Cache Duration    Why?
─────────────────────────────────────────────────────────────
index.html          0 seconds         Always get latest HTML
                                      (references new hashed assets)

/assets/*.js        1 year            Content hash in filename
/assets/*.css       (immutable)       Hash changes when content changes
                                      Safe to cache forever

Images (.png, etc)  1 week            Reasonable cache time
                                      Can update by changing filename

Fonts (.woff2, etc) 1 year            Fonts rarely change
                                      Long cache safe
```

### Why This Works

```
Deploy 1:
  index.html      →  <script src="/assets/js/app.abc123.js">
                     (browser caches app.abc123.js for 1 year)

Code changes...

Deploy 2:
  index.html      →  <script src="/assets/js/app.def456.js">
                     (browser fetches NEW file, cache is valid)

Result:
  - Browser always gets latest HTML (no cache)
  - HTML references new hashed assets
  - Old cached assets not used (different hash)
  - New assets downloaded and cached
```

---

## 5. Security Headers Flow

```
┌─────────────────────────────────────────────────────────┐
│ User requests any page                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Netlify CDN intercepts request                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Applies headers from netlify.toml:                      │
│ - X-Frame-Options: DENY                                 │
│ - X-Content-Type-Options: nosniff                       │
│ - Content-Security-Policy: ...                          │
│ - Cache-Control: (based on file type)                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Browser receives response with security headers         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Browser enforces security policies:                     │
│ - Blocks framing (X-Frame-Options)                      │
│ - Enforces CSP (only load allowed resources)            │
│ - Respects cache headers                                │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Environment Variables Flow

### Local Development

```
.env file (local)
     ↓
Vite reads VITE_* variables
     ↓
Embedded in build as import.meta.env.VITE_*
     ↓
Accessible in React components
```

### Production (Netlify)

```
Netlify Dashboard
(Environment Variables section)
     ↓
Injected during build process
     ↓
Vite reads VITE_* variables
     ↓
Embedded in build as import.meta.env.VITE_*
     ↓
Deployed in production bundle
     ↓
Accessible in React components
```

**Important:** VITE_ variables are embedded in the client bundle.
Anyone can see them in the browser's Developer Tools.
Never use for sensitive secrets!

---

## 7. Code Splitting Architecture

### Before Code Splitting (Default)

```
Single bundle: app.js (500 KB)
     │
     ├─ React (93 KB)
     ├─ React Router (20 KB)
     ├─ Radix UI (84 KB)
     ├─ Recharts (349 KB)
     ├─ Zustand + React Query (33 KB)
     └─ Your app code (354 KB)

Problem: Users download EVERYTHING on first visit,
even if they never visit the analytics page (Recharts).
```

### After Code Splitting (Optimized)

```
Multiple chunks loaded on-demand:

First visit to homepage:
  ├─ index.html (1 KB)
  ├─ react-vendor.js (93 KB)     ✅ Cached
  ├─ ui-vendor.js (84 KB)        ✅ Cached
  ├─ state.js (33 KB)            ✅ Cached
  └─ index.js (your app, 354 KB) ✅ Cached

Navigate to analytics page:
  └─ charts.js (349 KB)          ✅ Lazy loaded

Benefits:
- Faster initial load (no charts bundle)
- Better caching (vendor code changes less)
- Parallel downloads (multiple chunks)
```

---

## 8. Deployment Contexts

```
┌──────────────────────────────────────────────────────────┐
│ Git Branch: main                                         │
│ Context: Production                                      │
│ URL: https://your-site.netlify.app                       │
│ Env vars: Production scope                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Pull Request: feature-branch                             │
│ Context: Deploy Preview                                  │
│ URL: https://deploy-preview-123--site.netlify.app        │
│ Env vars: Deploy Preview scope                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Git Branch: staging                                      │
│ Context: Branch Deploy                                   │
│ URL: https://staging--site.netlify.app                   │
│ Env vars: Branch Deploy scope                            │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Netlify CDN Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ User in Sydney                                              │
└─────────────────────────────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Netlify Edge Node (Sydney)                                  │
│ - Cached assets                                             │
│ - Low latency                                               │
└─────────────────────────────────────────────────────────────┘
            │
            │ (Cache miss)
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Netlify Origin                                              │
│ - Original files                                            │
│ - Distributed to edge nodes                                 │
└─────────────────────────────────────────────────────────────┘

Benefits:
- Fast global delivery
- Automatic CDN distribution
- DDoS protection
- Free SSL/TLS
```

---

## 10. File Processing Order

When a request comes in, Netlify processes in this order:

```
1. _headers file (if exists)
   ↓
2. _redirects file (if exists)  ← Processed FIRST
   ↓
3. netlify.toml headers
   ↓
4. netlify.toml redirects       ← Processed SECOND
   ↓
5. Serve file or 404
```

**Key Insight:** If you define the same redirect in both `_redirects` and `netlify.toml`, the `_redirects` version wins.

**Recommendation:** Use ONE method (prefer `netlify.toml` for all-in-one config).

---

## 11. Build Output Analysis

After running `npm run build`, you get:

```
dist/
├── index.html (0.87 KB)
│   Entry point, references all hashed assets
│
├── _redirects (312 B)
│   SPA routing fallback
│
├── assets/
│   ├── css/
│   │   └── index.DknTneFk.css (27.72 KB, gzipped: 5.57 KB)
│   │       All CSS, minified and gzipped
│   │
│   └── js/
│       ├── react-vendor.BxNMi5K0.js (93.50 KB, gzipped: 31.69 KB)
│       │   React core libraries
│       │
│       ├── ui-vendor.r1flM6jn.js (84.06 KB, gzipped: 29.10 KB)
│       │   Radix UI components
│       │
│       ├── charts.CT1DEM8d.js (349.35 KB, gzipped: 103.43 KB)
│       │   Recharts (lazy loaded)
│       │
│       ├── state.Do5MyC8M.js (33.57 KB, gzipped: 10.16 KB)
│       │   Zustand + React Query
│       │
│       └── index.CsMzFd5I.js (354.97 KB, gzipped: 95.73 KB)
│           Your app code
│
└── vite.svg (1.5 KB)
    Static asset from public/
```

**Total initial load (no charts):**
- HTML: 0.87 KB
- CSS: 5.57 KB (gzipped)
- JS: ~167 KB (gzipped, react + ui + state + app)
- **Total: ~173 KB gzipped** ✅

Charts load only when needed: +103 KB gzipped

---

## 12. Performance Optimization Summary

```
┌──────────────────────────────────────────────────────────┐
│ Optimization                   Impact                    │
├──────────────────────────────────────────────────────────┤
│ Code splitting                 -40% initial bundle       │
│ Gzip compression              -70% transfer size         │
│ Content hashing               Infinite cache validity    │
│ CDN distribution              -200ms latency             │
│ CSS code splitting            Parallel CSS loading       │
│ esbuild minification          -30% code size             │
│ Tree shaking                  Remove unused code         │
└──────────────────────────────────────────────────────────┘
```

---

## 13. Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: HTTPS (Automatic)                              │
│ - Free SSL/TLS certificate                              │
│ - Automatic renewal                                     │
│ - HTTP → HTTPS redirect                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Security Headers                               │
│ - CSP: Control resource loading                         │
│ - X-Frame-Options: Prevent clickjacking                 │
│ - X-Content-Type-Options: Prevent MIME sniffing         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: DDoS Protection (Netlify CDN)                  │
│ - Automatic mitigation                                  │
│ - Rate limiting                                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Application Security                           │
│ - No sensitive data in client code                      │
│ - API authentication via backend                        │
│ - Environment variables for config only                 │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Continuous Deployment Workflow

```
Developer                  GitHub                Netlify
    │                        │                      │
    │  1. Write code         │                      │
    │  2. git commit         │                      │
    │  3. git push origin main                      │
    ├───────────────────────>│                      │
    │                        │                      │
    │                        │  4. Webhook trigger  │
    │                        ├─────────────────────>│
    │                        │                      │
    │                        │    5. Clone repo     │
    │                        │<─────────────────────┤
    │                        │                      │
    │                        │    6. Build          │
    │                        │      (npm install)   │
    │                        │      (npm run build) │
    │                        │                      │
    │                        │    7. Deploy         │
    │                        │      (to CDN)        │
    │                        │                      │
    │                        │    8. Success        │
    │   9. Email notification                       │
    │<──────────────────────────────────────────────┤
    │                        │                      │
    │  10. Site is live! 🎉  │                      │
```

---

## Summary

Your Vite + React + React Router application on Netlify uses:

✅ **Optimized build** - Code splitting, minification, tree shaking
✅ **Smart caching** - Long-term cache for assets, fresh HTML
✅ **Global CDN** - Fast delivery worldwide
✅ **Security headers** - CSP, X-Frame-Options, etc.
✅ **SPA routing** - Rewrite rule for client-side routing
✅ **Environment variables** - Secure configuration management
✅ **Continuous deployment** - Automatic builds on git push
✅ **Deploy previews** - Test before merging PRs

All configured and ready to deploy! 🚀

---

**Related Documentation:**
- [QUICK_START_NETLIFY.md](./QUICK_START_NETLIFY.md) - 5-minute deployment guide
- [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md) - Comprehensive guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
