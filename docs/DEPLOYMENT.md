# 🚀 Complete Deployment Guide

## 📋 **OVERVIEW**

This guide covers all deployment aspects for the Pendo.io Analytics Integration project, including database setup, frontend deployment, and environment configuration.

## 🗄️ **DATABASE SETUP (SUPABASE)**

### **1. Create Supabase Project**
1. Visit https://supabase.com
2. Create new project
3. Note project URL and anon key
4. Set up database tables

### **2. Apply Required Migrations**

#### **Migration 1: Usage Heatmap Function**
```sql
-- File: supabase-migrations/003_add_usage_heatmap_function.sql
CREATE OR REPLACE FUNCTION get_usage_heatmap_data()
RETURNS TABLE (
  hour_of_day INTEGER,
  day_of_week INTEGER,
  total_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    EXTRACT(DOW FROM created_at) as day_of_week,
    COUNT(*) as total_events
  FROM pendo_events
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY hour_of_day, day_of_day
  ORDER BY day_of_week, hour_of_day;
END;
$$ LANGUAGE plpgsql;
```

### **3. Environment Variables**
Add to your `.env` file:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Pendo Configuration
VITE_PENDO_INTEGRATION_KEY=your-pendo-key
```

## 🌐 **FRONTEND DEPLOYMENT**

### **1. Local Development**
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### **2. Production Build**
```bash
cd frontend
npm install
npm run build
# Output: dist/ directory
```

### **3. Deployment Options**

#### **Option A: Netlify (Recommended)**
1. Connect repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/dist`
4. Add environment variables in Netlify dashboard

#### **Option B: Vercel**
1. Import repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Configure environment variables

#### **Option C: Static Hosting**
```bash
# Build and upload
cd frontend
npm run build
# Upload dist/ contents to your hosting provider
```

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# Pendo API
VITE_PENDO_INTEGRATION_KEY=your-pendo-integration-key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics
VITE_ENABLE_ANALYTICS=true
```

### **Security Notes**
- Never commit `.env` file to version control
- Use environment-specific keys for different deployments
- Rotate keys regularly for security

## 📊 **DATA SYNC SETUP**

### **1. Edge Functions**
Deploy Supabase Edge Functions for data synchronization:

```bash
# Sync all Pendo data
curl -X POST 'https://your-project.supabase.co/functions/v1/sync-all-analytics' \
  -H 'Authorization: Bearer your-service-role-key'

# Check sync status
curl 'https://your-project.supabase.co/rest/v1/sync_status' \
  -H 'Authorization: Bearer your-anon-key'
```

### **2. Scheduled Sync (Recommended)**
Set up cronjobs for regular data updates:

```bash
# Hourly sync (for real-time data)
0 * * * * curl -X POST 'your-edge-function-url/sync-recent-data'

# Daily full sync (for comprehensive data)
0 2 * * * curl -X POST 'your-edge-function-url/sync-all-data'
```

## 🔍 **HEALTH CHECKS & MONITORING**

### **1. API Health Check**
```bash
# Check Pendo API connectivity
curl -H "X-Pendo-Integration-Key: your-key" https://app.pendo.io/api/v1/status
```

### **2. Database Health**
```sql
-- Check data freshness
SELECT
  MAX(created_at) as last_sync,
  COUNT(*) as total_records
FROM pendo_events;
```

### **3. Frontend Health**
```bash
# Check deployment status
curl -I https://your-deployed-url.com

# Monitor for errors
# Check browser console and Supabase logs
```

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **API Connection Issues**
```bash
# Symptoms: No data loading
# Solutions:
1. Verify Pendo integration key
2. Check network connectivity
3. Review API rate limits
4. Check Supabase Edge Function logs
```

#### **Database Connection Issues**
```bash
# Symptoms: Database errors
# Solutions:
1. Verify Supabase URL and keys
2. Check Row Level Security policies
3. Review database permissions
4. Check migration status
```

#### **Build/Deploy Issues**
```bash
# Symptoms: Build failures
# Solutions:
1. Check Node.js version (18+ recommended)
2. Clear node_modules and reinstall
3. Verify environment variables
4. Check for missing dependencies
```

## 📈 **PERFORMANCE OPTIMIZATION**

### **1. Database Optimizations**
- Implement proper indexing on timestamp columns
- Use materialized views for complex aggregations
- Set up connection pooling
- Monitor query performance

### **2. Frontend Optimizations**
- Enable code splitting
- Implement lazy loading for charts
- Use React.memo for expensive components
- Optimize bundle size with tree shaking

### **3. Caching Strategy**
- Cache API responses in Supabase
- Implement browser caching for static assets
- Use CDN for global distribution
- Cache database query results

## 🔐 **SECURITY BEST PRACTICES**

### **1. API Security**
- Use HTTPS everywhere
- Implement rate limiting
- Validate all inputs
- Monitor for unusual activity

### **2. Database Security**
- Use Row Level Security (RLS)
- Implement proper user authentication
- Rotate keys regularly
- Audit access logs

### **3. Frontend Security**
- Sanitize user inputs
- Implement CSP headers
- Use secure cookies
- Validate data on both client and server

## 📞 **SUPPORT & MAINTENANCE**

### **Monitoring**
- Set up error tracking (Sentry recommended)
- Monitor API usage and limits
- Track database performance metrics
- Set up uptime monitoring

### **Regular Maintenance**
- Weekly: Review error logs and performance
- Monthly: Update dependencies and security patches
- Quarterly: Review and rotate API keys
- Annually: Complete security audit

### **Contact Resources**
- **Pendo Support**: support@pendo.io
- **Supabase Support**: support@supabase.io
- **Project Issues**: GitHub repository issues

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Local testing completed
- [ ] Security review performed

### **Deployment**
- [ ] Frontend build successful
- [ ] Assets deployed to hosting
- [ ] Environment variables set in production
- [ ] DNS configured correctly

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Data synchronization working
- [ ] User authentication functional
- [ ] Analytics dashboard loading correctly

### **Monitoring Setup**
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Backup processes verified
- [ ] Alert systems configured

---

**Deployment Status**: ✅ Production Ready
**Last Updated**: 2025-11-11
**Maintainer**: Development Team