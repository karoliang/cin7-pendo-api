# Netlify Deployment Checklist

Use this checklist to ensure your Vite + React + React Router application is properly configured for Netlify deployment.

## Pre-Deployment Setup

### 1. Configuration Files

- [ ] `netlify.toml` exists in project root (not in frontend/)
- [ ] Build command is correct: `cd frontend && npm run build`
- [ ] Publish directory is correct: `frontend/dist`
- [ ] Node version is set to 18 or later
- [ ] SPA redirect rule is configured (status 200)

### 2. Environment Variables

- [ ] All client-side variables have `VITE_` prefix
- [ ] Environment variables added to Netlify Dashboard
- [ ] Variables set for correct deployment contexts (Production, Deploy Previews)
- [ ] No sensitive secrets in `VITE_` variables
- [ ] `.env.example` file created for team reference

### 3. Build Configuration

- [ ] `vite.config.ts` includes build optimizations
- [ ] Manual chunk splitting configured for vendor libraries
- [ ] Asset naming includes content hashes
- [ ] CSS code splitting enabled
- [ ] TypeScript compiles without errors (`npm run build`)

### 4. Security Headers

- [ ] Content Security Policy (CSP) configured
- [ ] CSP includes necessary domains (e.g., Pendo CDN)
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured

### 5. Caching Strategy

- [ ] Long-term caching for hashed assets (`/assets/*`)
- [ ] No caching for HTML files
- [ ] Appropriate caching for images and fonts
- [ ] `immutable` directive used for content-hashed files

### 6. React Router Setup

- [ ] Using `BrowserRouter` (not HashRouter)
- [ ] All routes defined correctly
- [ ] Routes tested in development
- [ ] No hardcoded absolute URLs in navigation

## Build & Test Locally

### 7. Local Build Test

```bash
cd frontend
npm run build
```

- [ ] Build completes without errors
- [ ] `dist/` folder created
- [ ] `dist/index.html` exists
- [ ] `dist/assets/` contains hashed JS/CSS files

### 8. Local Preview Test

```bash
npm run preview
```

- [ ] Preview server starts at http://localhost:4173
- [ ] Homepage loads correctly
- [ ] All routes work (test direct navigation)
- [ ] No console errors
- [ ] Images and assets load

### 9. Netlify CLI Test (Optional)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Test locally with Netlify Dev
netlify dev

# Deploy draft
netlify deploy

# Deploy to production
netlify deploy --prod
```

- [ ] `netlify dev` works correctly
- [ ] Draft deploy successful
- [ ] Draft URL works as expected

## Netlify Dashboard Setup

### 10. Site Configuration

- [ ] Repository connected to Netlify
- [ ] Build settings match `netlify.toml`
- [ ] Deploy hooks configured (if needed)
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled (automatic with Netlify)

### 11. Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

- [ ] `VITE_PENDO_API_KEY` added
- [ ] `VITE_PENDO_API_BASE_URL` added
- [ ] `VITE_APP_ENV` added (if used)
- [ ] Scopes set correctly (Production, Deploy Previews, Branch Deploys)
- [ ] Values match `.env` file (for local development)

### 12. Deploy Settings

- [ ] Auto-deploy enabled for main/production branch
- [ ] Deploy previews enabled for pull requests
- [ ] Build notifications configured (email, Slack, etc.)

## Post-Deployment Verification

### 13. Production Testing

Visit your deployed site and verify:

- [ ] Homepage loads correctly
- [ ] All routes work (test direct navigation)
- [ ] Refresh on any route works (no 404)
- [ ] Environment variables are working
- [ ] API calls succeed (check Network tab)
- [ ] No console errors
- [ ] Images and fonts load
- [ ] CSS styles applied

### 14. Performance Testing

- [ ] Test with Lighthouse (aim for >90 in all categories)
- [ ] Check bundle size (should have multiple small chunks)
- [ ] Verify assets are cached (check Response Headers)
- [ ] Test on mobile devices
- [ ] Test on slow 3G connection

### 15. Security Testing

Check response headers (DevTools → Network → select any file → Headers):

- [ ] `Content-Security-Policy` present
- [ ] `X-Frame-Options` present
- [ ] `X-Content-Type-Options` present
- [ ] `Cache-Control` headers correct for different file types
- [ ] HTTPS enforced

### 16. Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Continuous Integration

### 17. Deploy Previews

- [ ] Create a test pull request
- [ ] Deploy preview builds automatically
- [ ] Preview URL appears in PR comments
- [ ] Preview works correctly
- [ ] Merge to main triggers production deploy

### 18. Rollback Plan

- [ ] Know how to rollback to previous deploy (Netlify Dashboard → Deploys)
- [ ] Previous deploys are preserved
- [ ] Can quickly rollback if issues occur

## Monitoring & Maintenance

### 19. Set Up Monitoring

- [ ] Enable Netlify Analytics (optional, paid feature)
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring

### 20. Documentation

- [ ] README updated with deployment instructions
- [ ] Team knows how to deploy
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

## Optional Optimizations

### 21. Advanced Features

- [ ] Set up branch deploys for staging
- [ ] Configure split testing (A/B testing)
- [ ] Enable build plugins for optimization
- [ ] Set up serverless functions (if needed)
- [ ] Configure form handling (if using forms)

### 22. SEO & Meta Tags

- [ ] Meta tags in `index.html`
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Favicon configured
- [ ] robots.txt configured (if needed)
- [ ] sitemap.xml configured (if needed)

## Common Issues Checklist

If deployment fails, check:

- [ ] Build command runs successfully locally
- [ ] All dependencies in `package.json`
- [ ] No TypeScript errors
- [ ] Node version compatible
- [ ] File paths are case-sensitive
- [ ] No absolute file system paths in code
- [ ] Environment variables set correctly

If routes don't work:

- [ ] SPA redirect rule is configured
- [ ] Using BrowserRouter, not HashRouter
- [ ] No typos in route paths
- [ ] `netlify.toml` in project root

If environment variables don't work:

- [ ] Variables have `VITE_` prefix
- [ ] Added to Netlify Dashboard
- [ ] New build triggered after adding variables
- [ ] Correct deployment context

---

## Quick Reference

### Key Files

- `/netlify.toml` - Main configuration file
- `/frontend/vite.config.ts` - Build configuration
- `/frontend/public/_redirects` - Alternative redirect config
- `/frontend/.env` - Local environment variables (git-ignored)
- `/frontend/.env.example` - Example environment variables (committed)

### Key Commands

```bash
# Local development
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Deploy to Netlify (CLI)
netlify deploy --prod

# Test with Netlify Dev
netlify dev
```

### Key Netlify Dashboard Pages

- **Deploys** - View deploy history and logs
- **Site Settings → Build & Deploy** - Configure build settings
- **Site Settings → Environment Variables** - Manage environment variables
- **Site Settings → Domain Management** - Configure custom domains

---

**Last Updated:** October 2025

For detailed information, see [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)
