# Quick Start: Deploy to Netlify

**5-Minute Deployment Guide**

This guide gets your Vite + React + React Router app deployed to Netlify in minutes.

---

## Prerequisites

- Git repository pushed to GitHub
- Netlify account ([sign up free](https://app.netlify.com/signup))
- Node.js 18+ installed

---

## Step 1: Verify Configuration Files

All necessary files are already set up in this repository:

✅ `/netlify.toml` - Main configuration
✅ `/frontend/vite.config.ts` - Optimized build settings
✅ `/frontend/public/_redirects` - SPA routing fallback

No changes needed - skip to Step 2!

---

## Step 2: Set Up Environment Variables

### Option A: Using Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. After connecting your site (Step 3), go to:
   - **Site Settings** → **Environment Variables**
3. Add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `VITE_PENDO_API_KEY` | Your Pendo integration key | `abc123...` |
| `VITE_PENDO_API_BASE_URL` | Pendo API base URL | `https://app.pendo.io` |
| `VITE_APP_ENV` | Environment | `production` |

4. Set scope: **Production** and **Deploy Previews**

### Option B: Local Development (.env file)

Create `/frontend/.env`:

```bash
VITE_PENDO_API_KEY=your-key-here
VITE_PENDO_API_BASE_URL=https://app.pendo.io
VITE_APP_ENV=development
```

**Important:** Never commit `.env` to git (already in `.gitignore`)

---

## Step 3: Deploy to Netlify

### Method 1: Git-Based (Recommended - Automatic Deployments)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Netlify deployment configuration"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **GitHub**
   - Authorize Netlify to access your repositories
   - Select your repository: `cin7-pendo-api`

3. **Configure Build Settings:**

   Netlify should auto-detect from `netlify.toml`, but verify:

   - **Base directory:** (leave empty)
   - **Build command:** `cd frontend && npm run build`
   - **Publish directory:** `frontend/dist`

   Click **"Deploy site"**

4. **Wait for deployment:**
   - Build typically takes 1-3 minutes
   - Progress shows in real-time
   - You'll get a random URL like `https://random-name-123.netlify.app`

5. **Done!** Your site is live 🎉

---

### Method 2: Netlify CLI (Manual Deployment)

**Install CLI:**
```bash
npm install -g netlify-cli
```

**Login:**
```bash
netlify login
```

**Initialize:**
```bash
# From project root
netlify init
```

Follow prompts:
- Create new site or link existing
- Choose team
- Site name (optional)

**Deploy Draft (Preview):**
```bash
# Build first
cd frontend && npm run build && cd ..

# Deploy draft
netlify deploy
```

You'll get a preview URL to test.

**Deploy to Production:**
```bash
netlify deploy --prod
```

---

## Step 4: Verify Deployment

Visit your deployed site and test:

1. **Homepage loads** ✅
2. **Navigate to different routes** ✅
3. **Refresh on a route** (should NOT 404) ✅
4. **Check browser console** (no errors) ✅
5. **Test API calls** (environment variables working) ✅

---

## Step 5: Custom Domain (Optional)

1. In Netlify Dashboard → **Domain Settings**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `analytics.yourdomain.com`)
4. Follow DNS configuration instructions
5. HTTPS is automatically enabled

---

## Automatic Deployments

With Git-based deployment, every push to `main` automatically deploys:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Netlify automatically builds and deploys!
```

---

## Deploy Previews for Pull Requests

When you create a pull request:

1. Netlify automatically builds a preview
2. Preview URL appears in PR comments
3. Test changes before merging
4. Merge to main → auto-deploy to production

---

## Common Issues & Quick Fixes

### Issue: 404 on Page Refresh

**Fix:** Already configured in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

If still happening, check that `netlify.toml` is in the project root (not in frontend/).

---

### Issue: Environment Variables Not Working

**Checklist:**
- ✅ Variables have `VITE_` prefix
- ✅ Added to Netlify Dashboard → Environment Variables
- ✅ Triggered new build after adding variables
- ✅ No typos in variable names

**Debug:**
Check build logs for "VITE_" variables being set.

---

### Issue: Build Fails

**Check:**
1. Build works locally: `cd frontend && npm run build`
2. All dependencies in `package.json`
3. TypeScript compiles without errors
4. Node version in `netlify.toml` matches local

**View logs:**
Netlify Dashboard → Deploys → Click failed deploy → View logs

---

## Performance Tips

Your site is already optimized with:

✅ **Automatic code splitting** - Separate chunks for React, UI libs, charts
✅ **Long-term caching** - Hashed asset filenames cached for 1 year
✅ **Security headers** - CSP, X-Frame-Options, etc.
✅ **Optimized build** - esbuild minification, CSS splitting

**Test performance:**
- Run Lighthouse in Chrome DevTools
- Aim for >90 in all categories
- Monitor in Netlify Analytics (optional, paid)

---

## Next Steps

1. ✅ **Set up monitoring** - Add error tracking (Sentry, LogRocket)
2. ✅ **Configure alerts** - Get notified of failed deploys
3. ✅ **Add team members** - Invite collaborators in Netlify
4. ✅ **Review security headers** - Adjust CSP based on your needs
5. ✅ **Set up staging** - Use branch deploys for testing

---

## Useful Commands

```bash
# Local development
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Preview production build locally
cd frontend && npm run preview

# Test with Netlify Dev (emulates production)
netlify dev

# Deploy from CLI
netlify deploy --prod

# View deployment status
netlify status

# Open Netlify dashboard
netlify open
```

---

## Documentation

- **Comprehensive Guide:** [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Research Summary:** [RESEARCH_SUMMARY.md](./RESEARCH_SUMMARY.md)

---

## Support

- **Netlify Docs:** https://docs.netlify.com/
- **Netlify Forums:** https://answers.netlify.com/
- **Vite Docs:** https://vite.dev/
- **React Router Docs:** https://reactrouter.com/

---

**Deployed in under 5 minutes?** ⏱️

If you ran into issues, check the [troubleshooting section](#common-issues--quick-fixes) or see the comprehensive guide.

**Happy deploying!** 🚀
