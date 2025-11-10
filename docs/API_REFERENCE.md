# 🔌 Pendo API Reference

## 📋 **OVERVIEW**

This document provides complete API reference for the Pendo.io integration, including available endpoints, data structures, and usage examples.

## 🔑 **AUTHENTICATION**

### **Integration Key Authentication**
All API requests require the Pendo integration key in the header:

```bash
curl -H "X-Pendo-Integration-Key: f4acdb4c-038c-4de1-a88b-ab90423037bf.us" \
  https://app.pendo.io/api/v1/endpoint
```

### **Current Access Level**
- **Type**: Read-only analytics
- **Scope**: Data retrieval and reporting
- **Rate Limits**: Standard API limits apply
- **Data Available**: 2,313+ records

## 📊 **AVAILABLE ENDPOINTS**

### **1. Status Endpoint**
```bash
GET https://app.pendo.io/api/v1/status
```
**Purpose**: Check API connectivity and authentication
**Response**: Connection status and authentication validation

### **2. Guides Analytics**
```bash
GET https://app.pendo.io/api/v1/guides
```
**Purpose**: Retrieve guide performance data
**Data Available**: 527 guides with analytics
**Key Metrics**:
- `lastShownCount`: Times guide was displayed
- `lastViewedCount`: Times guide was viewed
- `lastCompletedCount`: Times guide was completed

### **3. Features Analytics**
```bash
GET https://app.pendo.io/api/v1/features
```
**Purpose**: Retrieve feature adoption data
**Data Available**: 956 features with usage metrics
**Key Metrics**:
- `visitorCount`: Unique users using feature
- `usageCount`: Total feature usage events
- `pageViews`: Page views where feature appears

### **4. Pages Analytics**
```bash
GET https://app.pendo.io/api/v1/pages
```
**Purpose**: Retrieve page engagement data
**Data Available**: 356 pages with metrics
**Key Metrics**:
- `pageViews`: Total page views
- `uniqueVisitors`: Unique page visitors
- `timeOnPage`: Average time spent on page

### **5. Reports Analytics**
```bash
GET https://app.pendo.io/api/v1/reports
```
**Purpose**: Retrieve report metadata and analytics
**Data Available**: 474 pre-built reports
**Report Types**: Funnel analysis, cohort analysis, path analysis

### **6. Visitor Segments**
```bash
GET https://app.pendo.io/api/v1/segments
```
**Purpose**: Retrieve user segment definitions
**Data Available**: 328 user segments
**Use Cases**: Targeted guide delivery, analytics filtering

## 📈 **DATA STRUCTURES**

### **Guide Object**
```json
{
  "id": "guide_123",
  "name": "Onboarding Guide",
  "description": "Welcome guide for new users",
  "lastShownCount": 1250,
  "lastViewedCount": 890,
  "lastCompletedCount": 456,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T15:45:00Z",
  "state": "published",
  "stepCount": 5
}
```

### **Feature Object**
```json
{
  "id": "feature_456",
  "name": "Export to CSV",
  "description": "Export data functionality",
  "visitorCount": 342,
  "usageCount": 1580,
  "pageViews": 12500,
  "category": "Data Management",
  "created_at": "2024-01-10T09:15:00Z"
}
```

### **Page Object**
```json
{
  "id": "page_789",
  "name": "Dashboard",
  "url": "/dashboard",
  "pageViews": 45600,
  "uniqueVisitors": 8900,
  "timeOnPage": 145.5,
  "bounceRate": 0.23,
  "conversionRate": 0.08
}
```

### **Report Object**
```json
{
  "id": "report_101",
  "name": "User Funnel Analysis",
  "description": "Conversion funnel from signup to activation",
  "type": "funnel",
  "createdAt": "2024-01-05T14:20:00Z",
  "lastRunAt": "2024-01-25T11:30:00Z",
  "public": true,
  "charts": ["funnel", "time-series"]
}
```

### **Segment Object**
```json
{
  "id": "segment_202",
  "name": "Power Users",
  "description": "Users with high engagement",
  "visitorCount": 1250,
  "criteria": {
    "usage": "high",
    "loginFrequency": "daily",
    "featureAdoption": 0.8
  },
  "createdAt": "2024-01-08T16:45:00Z"
}
```

## 🛠️ **CLIENT IMPLEMENTATION**

### **React Frontend Integration**
```typescript
// src/services/pendo.ts
export class PendoClient {
  private apiKey: string;
  private baseUrl = 'https://app.pendo.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getGuides(): Promise<Guide[]> {
    const response = await fetch(`${this.baseUrl}/guides`, {
      headers: {
        'X-Pendo-Integration-Key': this.apiKey,
      },
    });
    return response.json();
  }

  async getFeatures(): Promise<Feature[]> {
    const response = await fetch(`${this.baseUrl}/features`, {
      headers: {
        'X-Pendo-Integration-Key': this.apiKey,
      },
    });
    return response.json();
  }
}
```

### **Usage in Components**
```typescript
// src/components/AnalyticsDashboard.tsx
import { PendoClient } from '../services/pendo';

export function AnalyticsDashboard() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    const client = new PendoClient(import.meta.env.VITE_PENDO_INTEGRATION_KEY);

    Promise.all([
      client.getGuides(),
      client.getFeatures(),
    ]).then(([guidesData, featuresData]) => {
      setGuides(guidesData);
      setFeatures(featuresData);
    });
  }, []);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <GuideMetrics guides={guides} />
      <FeatureAdoption features={features} />
    </div>
  );
}
```

## 📊 **ANALYTICS EXAMPLES**

### **1. Guide Performance Analysis**
```typescript
function analyzeGuidePerformance(guides: Guide[]) {
  return guides
    .filter(guide => guide.lastShownCount > 100)
    .map(guide => ({
      name: guide.name,
      completionRate: guide.lastCompletedCount / guide.lastShownCount,
      viewRate: guide.lastViewedCount / guide.lastShownCount,
      effectiveness: guide.lastCompletedCount / guide.lastViewedCount,
    }))
    .sort((a, b) => b.completionRate - a.completionRate);
}
```

### **2. Feature Adoption Tracking**
```typescript
function trackFeatureAdoption(features: Feature[]) {
  return features
    .map(feature => ({
      name: feature.name,
      adoptionRate: feature.visitorCount / totalUsers,
      usageIntensity: feature.usageCount / feature.visitorCount,
      category: feature.category,
    }))
    .filter(feature => feature.adoptionRate > 0.1);
}
```

### **3. Page Conversion Analysis**
```typescript
function analyzePageConversions(pages: Page[]) {
  return pages
    .map(page => ({
      url: page.url,
      conversionRate: page.conversionRate,
      bounceRate: page.bounceRate,
      engagement: page.timeOnPage / 60, // Convert to minutes
    }))
    .sort((a, b) => b.conversionRate - a.conpletionRate);
}
```

## 🚨 **ERROR HANDLING**

### **Common Error Responses**
```typescript
interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

// Example error responses
{
  "error": "Unauthorized",
  "message": "Invalid integration key",
  "statusCode": 401
}

{
  "error": "Rate Limited",
  "message": "API rate limit exceeded",
  "statusCode": 429
}
```

### **Error Handling Implementation**
```typescript
async function apiCall<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      headers: {
        'X-Pendo-Integration-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## 🔧 **ADVANCED FEATURES**

### **Data Aggregation**
```typescript
// Usage heatmap data (7 days x 24 hours)
function generateUsageHeatmap(events: Event[]): HeatmapData {
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

  events.forEach(event => {
    const day = new Date(event.timestamp).getDay();
    const hour = new Date(event.timestamp).getHours();
    heatmap[day][hour]++;
  });

  return heatmap;
}
```

### **Real-time Updates**
```typescript
// WebSocket connection for real-time updates
function setupRealTimeUpdates() {
  const ws = new WebSocket('wss://app.pendo.io/api/v1/stream');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateDashboard(data);
  };
}
```

## 📈 **PERFORMANCE OPTIMIZATION**

### **Caching Strategy**
```typescript
// React Query for efficient caching
import { useQuery } from '@tanstack/react-query';

function useGuides() {
  return useQuery({
    queryKey: ['guides'],
    queryFn: () => pendoClient.getGuides(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}
```

### **Batch Processing**
```typescript
// Batch API calls for efficiency
async function fetchAllData() {
  const [guides, features, pages, reports] = await Promise.all([
    pendoClient.getGuides(),
    pendoClient.getFeatures(),
    pendoClient.getPages(),
    pendoClient.getReports(),
  ]);

  return { guides, features, pages, reports };
}
```

## 🔍 **DEBUGGING & MONITORING**

### **API Request Logging**
```typescript
function logApiCall(endpoint: string, responseTime: number, success: boolean) {
  console.log(`API Call: ${endpoint}`, {
    responseTime,
    success,
    timestamp: new Date().toISOString(),
  });
}
```

### **Performance Monitoring**
```typescript
// Track API performance
function trackPerformance() {
  const startTime = performance.now();

  return {
    end: (endpoint: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 5000) {
        console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
      }

      return duration;
    },
  };
}
```

---

## 📚 **ADDITIONAL RESOURCES**

### **Pendo Documentation**
- [Pendo Developer Portal](https://developers.pendo.io)
- [API Reference](https://developers.pendo.io/docs/api)
- [Integration Guides](https://developers.pendo.io/docs/guides)

### **Support**
- **API Support**: api-support@pendo.io
- **Documentation Issues**: GitHub repository
- **Feature Requests**: Pendo developer forum

---

**API Version**: v1
**Last Updated**: 2025-11-11
**Access Level**: Read-only Analytics
**Data Available**: 2,313+ Records