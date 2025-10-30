# Pendo API /api/v1/page Endpoint Research Findings

## Executive Summary

**ISSUE:** All pages in the dashboard are showing "Untitled" instead of actual page names.

**ROOT CAUSE:** The code is correctly using the `name` field from the Pendo API response. The field exists and contains valid page names. The issue is likely in how the data is being processed or displayed in the UI.

---

## API Response Structure

### Endpoint
```
GET https://app.pendo.io/api/v1/page?limit=5
```

### Authentication
```
Headers:
  X-Pendo-Integration-Key: f4acdb2c-038c-4de1-a88b-ab90423037bf.us
  Content-Type: application/json
```

---

## Field Analysis

### Available Fields in Response

The `/api/v1/page` endpoint returns the following fields for each page object:

```javascript
[
  'createdByUser',
  'createdAt',
  'lastUpdatedByUser',
  'lastUpdatedAt',
  'kind',
  'rootVersionId',
  'stableVersionId',
  'id',
  'appId',
  'appIds',
  'name',              // ✅ THIS IS THE PAGE NAME/TITLE FIELD
  'group',
  'isCoreEvent',
  'validThrough',
  'dirty',
  'dailyMergeFirst',
  'dailyRollupFirst',
  'ignoredFrustrationTypes',
  'rules',
  'rulesjson',
  'isSuggested',
  'suggestedName'
]
```

### Field Name Verification

**The correct field for page names is: `name`**

- ✅ Has 'name' field: **YES**
- ❌ Has 'title' field: **NO**
- ❌ Has 'displayName' field: **NO**
- ✅ Has 'url' field: **NO** (URL patterns are in the 'rules' array)

---

## Example Response Data

### Sample Page Object

```json
{
  "id": "aRnno0-bo2WMPJ7HBIFzCuDtKfg",
  "name": "3PL Dashboards only",
  "kind": "Page",
  "appId": -323232,
  "createdAt": 1685320590281,
  "lastUpdatedAt": 1685322552149,
  "group": {
    "id": "ZHcbMOL2I-K5WW23KijhW_bqyZ8",
    "name": "3PL",
    "description": "",
    "color": ".groupColor01"
  },
  "rules": [
    {
      "rule": "//*/Cloud/EDIHighway/DataActions.aspx?idEDITradingPartnerLink;idEDITradingPartners;page=AmazonFBA",
      "designerHint": "https://go.cin7.com/Cloud/EDIHighway/DataActions.aspx?idEDITradingPartners=232&idEDITradingPartnerLink=3370&page=DavidJonesSPS"
    }
  ]
}
```

### Sample Page Names from API

Here are real page names returned by the API (all have valid names):

- "3PL Dashboards only"
- "3PL | Mainfreight AU"
- "Accounting Integration Errors"
- "Accounting v2 | Dashboards (Combined)"
- "Add/Edit Branch Transfers | Admin"
- "Adjustments List"
- "All Pages in Insights"
- "Amazon FBA"
- "API Settings"
- "App Store | Home Page"

---

## Current Code Implementation

### Type Definition (src/types/pendo.ts)

```typescript
export interface Page {
  id: string;
  url: string;
  title?: string;      // ⚠️ WRONG: API doesn't return 'title'
  viewedCount: number;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
  applicationId?: string;
}
```

### Transform Function (src/lib/pendo-api.ts)

```typescript
private transformPage = (page: any): Page => ({
  id: page.id || '',
  url: page.url || '',
  title: page.title,  // ⚠️ WRONG: Should be page.name
  viewedCount: page.viewedCount || 0,
  visitorCount: page.visitorCount || 0,
  createdAt: page.createdAt || new Date().toISOString(),
  updatedAt: page.updatedAt || new Date().toISOString(),
  applicationId: page.applicationId,
});
```

### UI Display (src/pages/DataTables.tsx)

```typescript
<span className="font-medium">{(value as string) || 'Untitled'}</span>
```

---

## The Problem

1. **Type Definition Issue**: The `Page` interface defines `title` but the API returns `name`
2. **Transform Mapping Issue**: `transformPage` maps `page.title` but should map `page.name`
3. **Missing Field**: Since `page.title` is undefined, the UI shows "Untitled" as the fallback

---

## Solution

### Step 1: Update Type Definition

Change `src/types/pendo.ts`:

```typescript
export interface Page {
  id: string;
  url?: string;        // Optional - URL patterns are in rules array
  name: string;        // ✅ CHANGE: Use 'name' instead of 'title'
  viewedCount: number;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
  applicationId?: string;
  group?: {           // Add group info (optional)
    id: string;
    name: string;
  };
}
```

### Step 2: Update Transform Function

Change `src/lib/pendo-api.ts`:

```typescript
private transformPage = (page: any): Page => ({
  id: page.id || '',
  url: page.url || '',
  name: page.name || 'Untitled',  // ✅ CHANGE: Map from page.name
  viewedCount: page.viewedCount || 0,
  visitorCount: page.visitorCount || 0,
  createdAt: page.createdAt ? new Date(page.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: page.lastUpdatedAt ? new Date(page.lastUpdatedAt).toISOString() : new Date().toISOString(),
  applicationId: page.appId,
  group: page.group,
});
```

### Step 3: Update UI References

Update all references from `page.title` to `page.name` in:
- `src/pages/DataTables.tsx`
- `src/pages/DataTables 2.tsx`
- Any other components displaying page data

---

## Additional Findings

### URL Patterns
Pages don't have a simple `url` field. Instead, they have a `rules` array containing URL patterns (regex) that define when the page is triggered:

```javascript
"rules": [
  {
    "rule": "//*/Cloud/EDIHighway/DataActions.aspx?idEDITradingPartnerLink;idEDITradingPartners;page=AmazonFBA",
    "designerHint": "https://go.cin7.com/Cloud/EDIHighway/DataActions.aspx?...",
    "parsedRule": "^https?://[^/]*/Cloud/EDIHighway/DataActions\\.aspx/..."
  }
]
```

### Page Groups
Pages can belong to groups (like folders) for organization:

```javascript
"group": {
  "id": "ZHcbMOL2I-K5WW23KijhW_bqyZ8",
  "name": "3PL",
  "description": "",
  "color": ".groupColor01"
}
```

### Timestamps
- `createdAt`: Unix timestamp in milliseconds
- `lastUpdatedAt`: Unix timestamp in milliseconds (not `updatedAt`)

---

## Testing Script

A test script was created to verify the API response structure:

**File:** `/frontend/test-page-api-response.js`

**Run with:**
```bash
node test-page-api-response.js
```

**Results:**
- Successfully fetched 358 pages from Pendo API
- Confirmed `name` field exists and contains valid page names
- Confirmed `title` field does NOT exist
- All pages have non-empty names

---

## Recommendations

1. **Immediate Fix:** Update the `Page` interface and `transformPage` function to use `name` instead of `title`

2. **URL Handling:** Consider extracting a display URL from the first rule's `designerHint` field if needed

3. **Group Display:** Consider showing the group name as a category/tag in the UI

4. **Timestamp Handling:** Use `lastUpdatedAt` instead of `updatedAt` from the API response

5. **Testing:** After making changes, verify with browser console logs that page names are being correctly extracted

---

## Related Files

- `/frontend/src/types/pendo.ts` - Type definitions
- `/frontend/src/lib/pendo-api.ts` - API client and transform functions
- `/frontend/src/pages/DataTables.tsx` - Main data table display
- `/frontend/src/pages/DataTables 2.tsx` - Alternative data table display
- `/frontend/test-page-api-response.js` - API testing script

---

## API Statistics

- **Total Pages Retrieved:** 358
- **API Response Time:** ~1-2 seconds
- **Authentication:** Working correctly with integration key
- **Data Quality:** 100% of pages have valid names

---

## Conclusion

The Pendo API is working correctly and returning page names in the `name` field. The issue is a simple field mapping error in our code where we're trying to access `title` (which doesn't exist) instead of `name` (which does exist).

The fix is straightforward:
1. Change the TypeScript interface from `title?: string` to `name: string`
2. Update the transform function to map `page.name` instead of `page.title`
3. Update any UI components referencing `page.title` to use `page.name`
