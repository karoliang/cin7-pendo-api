# Pendo.io API Endpoints Documentation

## Base Configuration

- **Base URL**: `https://api.pendo.io`
- **Authentication**: Bearer token via integration key
- **Content-Type**: `application/json`
- **API Key**: `f4acdb2c-038c-4de1-a88b-ab90423037bf.us`

## Core API Categories

### 1. Campaign Management API

#### Campaign Operations
```
GET    /api/v1/campaigns              # List all campaigns
POST   /api/v1/campaigns              # Create new campaign
GET    /api/v1/campaigns/{id}         # Get specific campaign
PUT    /api/v1/campaigns/{id}         # Update campaign
DELETE /api/v1/campaigns/{id}         # Delete campaign
```

#### Campaign Targeting
```
GET    /api/v1/campaigns/{id}/targets     # Get campaign targets
POST   /api/v1/campaigns/{id}/targets     # Add campaign targets
DELETE /api/v1/campaigns/{id}/targets/{targetId}  # Remove target
```

#### Campaign Analytics
```
GET    /api/v1/campaigns/{id}/analytics   # Campaign performance data
GET    /api/v1/campaigns/{id}/metrics     # Engagement metrics
```

### 2. Analytics API

#### User Analytics
```
GET    /api/v1/analytics/users           # User behavior data
GET    /api/v1/analytics/users/{id}      # Specific user analytics
GET    /api/v1/analytics/features        # Feature adoption data
GET    /api/v1/analytics/pages           # Page view analytics
```

#### Custom Events
```
POST   /api/v1/events                   # Track custom events
GET    /api/v1/events                   # Retrieve event data
GET    /api/v1/events/aggregates        # Aggregated event data
```

#### Reports
```
GET    /api/v1/reports                  # List available reports
POST   /api/v1/reports                  # Create custom report
GET    /api/v1/reports/{id}             # Get specific report
```

### 3. Feedback API

#### Feedback Management
```
GET    /api/v1/feedback                 # List feedback submissions
POST   /api/v1/feedback                 # Submit feedback
GET    /api/v1/feedback/{id}            # Get specific feedback
PUT    /api/v1/feedback/{id}            # Update feedback
DELETE /api/v1/feedback/{id}            # Delete feedback
```

#### Sentiment Analysis
```
GET    /api/v1/feedback/sentiment       # Sentiment analysis data
GET    /api/v1/feedback/nps             # NPS scores and trends
```

### 4. Metadata Management

#### User Metadata
```
GET    /api/v1/users                    # List users
POST   /api/v1/users                    # Create/update user
GET    /api/v1/users/{id}               # Get specific user
PUT    /api/v1/users/{id}               # Update user metadata
DELETE /api/v1/users/{id}               # Delete user
```

#### Account Metadata
```
GET    /api/v1/accounts                 # List accounts
POST   /api/v1/accounts                 # Create/update account
GET    /api/v1/accounts/{id}            # Get specific account
PUT    /api/v1/accounts/{id}            # Update account metadata
```

#### Feature Flags
```
GET    /api/v1/features                 # List feature flags
POST   /api/v1/features                 # Create feature flag
GET    /api/v1/features/{id}            # Get specific feature
PUT    /api/v1/features/{id}            # Update feature flag
```

### 5. Guide Management

#### Guide Operations
```
GET    /api/v1/guides                   # List guides
POST   /api/v1/guides                   # Create guide
GET    /api/v1/guides/{id}              # Get specific guide
PUT    /api/v1/guides/{id}              # Update guide
DELETE /api/v1/guides/{id}              # Delete guide
```

#### Guide Analytics
```
GET    /api/v1/guides/{id}/analytics    # Guide performance data
GET    /api/v1/guides/{id}/views        # Guide view statistics
```

## Authentication

All API requests require authentication via the integration key:

```bash
curl -H "X-Pendo-Integration-Key: f4acdb2c-038c-4de1-a88b-ab90423037bf.us" \
     -H "Content-Type: application/json" \
     https://api.pendo.io/api/v1/campaigns
```

## Rate Limiting

- **Standard Rate**: 1000 requests per hour
- **Burst Rate**: 100 requests per minute
- **Retry-After**: Included in rate limit responses

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "perPage": 20
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed error description",
    "details": { ... }
  }
}
```

## Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Invalid endpoint or ID |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

---

*This documentation will be updated as we explore and test each endpoint.*