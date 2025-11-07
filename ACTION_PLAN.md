# Pendo Data Sync - Action Plan
**Date:** November 8, 2025
**Priority:** HIGH - Missing 52% of pages and 45% of features

---

## 🎯 Problem Summary

Based on Pendo UI screenshots and API testing:

| Entity   | Pendo UI | Database | API Returns | Missing | % Missing |
|----------|----------|----------|-------------|---------|-----------|
| Pages    | **748**  | 358      | 358         | **390** | **52%**   |
| Features | **1,726**| 956      | 956         | **770** | **45%**   |
| Reports  | 495      | 485      | 485         | 10      | 2%        |

**Key Finding:** All API data comes from **one app ID: `-323232`**

---

## 🔍 Root Cause Analysis

### Evidence from Screenshots:
1. ✅ Pendo UI shows "**All Apps**" filter dropdown
2. ✅ Pendo UI shows "**All Accounts**" filter dropdown
3. ✅ Pendo UI shows "**All product areas**" filter dropdown

### Evidence from API Testing:
1. ✅ All 358 pages have `appId: -323232`
2. ✅ All 956 features have `appId: -323232`
3. ✅ API key cannot access `/app` or `/apps` endpoints (404 errors)
4. ✅ No archived/deleted flags found in API responses

### Conclusion:
**Your Pendo account has MULTIPLE APPS, but your API integration key only has access to ONE app (ID: -323232).**

The missing data is in other apps that your current API key cannot access.

---

## 📋 Action Items

### STEP 1: Verify Multiple Apps (5 min)
**Do this NOW in Pendo UI:**

1. Log into Pendo: https://app.pendo.io
2. Go to any page list (Pages, Features, etc.)
3. Click the **"All Apps"** dropdown filter (top of page)
4. Take a screenshot showing:
   - All available apps in the dropdown
   - Their names/IDs
   - Which ones are selected

**Expected Result:** You should see multiple apps listed, confirming our hypothesis.

---

### STEP 2: Check Your API Key Permissions (10 min)

1. Go to **Settings > Integrations** in Pendo
2. Find your current Integration Key
3. Check the settings:
   - ⚠️ Does it say "Single App" or "All Apps"?
   - ⚠️ Which app(s) is it scoped to?
4. Take screenshots for reference

---

### STEP 3: Contact Pendo Support (CRITICAL)

**Subject:** API Integration Key - Need Access to All Apps

**Email Template:**

```
Hi Pendo Support,

I'm using the Pendo API (Integration Key: [YOUR_KEY]) and have discovered
a significant discrepancy:

ISSUE:
- My Pendo UI shows 748 pages and 1,726 features
- My API returns only 358 pages and 956 features
- All API data has appId: -323232

QUESTION:
Do I have multiple apps in my Pendo account? If so:

1. How many apps do I have, and what are their IDs?
2. Does my current Integration Key have access to all apps?
3. How can I query data from ALL apps via the API?
4. Do I need separate API keys per app, or is there a way to access
   all apps with one key?

CONTEXT:
I'm building a dashboard that needs to show ALL Pendo data, not just
one app. Currently missing ~50% of our pages and features.

Please advise on how to get API access to all apps in our account.

Thank you!
```

---

### STEP 4: Temporary Workaround (While Waiting for Support)

If Pendo confirms multiple apps, you have two options:

#### Option A: Get API Keys for Each App
```bash
# Add to frontend/.env:
VITE_PENDO_API_KEY_APP1=xxx...
VITE_PENDO_API_KEY_APP2=xxx...
VITE_PENDO_API_KEY_APP3=xxx...
```

Then modify sync script to query each app separately.

#### Option B: Use Pendo's Bulk Export
1. Go to Settings > Data Pipeline or Export
2. Look for bulk data export options
3. Export all pages/features as CSV
4. Import directly to Supabase

---

### STEP 5: Update Sync Script (After Getting Access)

Once you have access to all apps, we'll need to:

1. **Get list of all app IDs** via API or Pendo support
2. **Modify sync script** to loop through all apps:

```javascript
// Pseudo-code
const appIds = ['-323232', 'other-app-id-1', 'other-app-id-2'];

for (const appId of appIds) {
  // Fetch pages for this app
  const pages = await fetchPagesForApp(appId);
  // Upsert to database with app_id
  await upsertPages(pages);
}
```

3. **Add `app_id` column** to database tables to track which app each record belongs to
4. **Update UI** to filter/display by app if needed

---

## 🚨 What NOT to Do

❌ Don't assume the data is missing - it's just in other apps
❌ Don't try to scrape Pendo UI - violates ToS and is unreliable
❌ Don't create workarounds before talking to Pendo - they may have a simple solution
❌ Don't modify the current sync script yet - wait for confirmation from Pendo

---

## 📊 Quick Diagnostic Commands

Run these to verify current state anytime:

```bash
# Check database counts vs API
node scripts/audit-database-counts.mjs

# Test API pagination
node scripts/test-pendo-pagination.mjs

# Check for multiple apps
node scripts/check-apps.mjs

# Test API filters
node scripts/test-api-filters.mjs
```

---

## 🎯 Success Criteria

You'll know the issue is resolved when:

1. ✅ Pendo API returns same counts as Pendo UI
2. ✅ Database has all 748 pages, 1,726 features
3. ✅ API queries work for ALL apps in your account
4. ✅ Data stays in sync going forward

---

## 📞 Support Resources

- **Pendo Support:** https://support.pendo.io
- **Pendo API Docs:** https://developers.pendo.io
- **Pendo Community:** https://community.pendo.io

---

## 📝 Progress Tracking

- [ ] Verified multiple apps exist in Pendo UI
- [ ] Identified all app IDs and names
- [ ] Checked current API key permissions
- [ ] Contacted Pendo support
- [ ] Received response from Pendo
- [ ] Obtained API access to all apps
- [ ] Updated sync script for multi-app support
- [ ] Re-synced all data
- [ ] Verified counts match UI
- [ ] Updated documentation

---

## 🔄 Estimated Timeline

- **Today:** Complete Steps 1-3 (verify & contact support)
- **1-3 business days:** Wait for Pendo support response
- **After response:** Implement solution (2-4 hours)
- **Total:** 3-5 business days to full resolution

---

**Next Action:** Go to Pendo UI and click the "All Apps" dropdown to see what apps you have!
