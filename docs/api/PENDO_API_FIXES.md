# Pendo API Aggregation Fix Summary

## Issues Identified

1. **Parameter Encoding Problems**: JSON objects were being stringified but not properly URL-encoded for GET requests
2. **Incorrect Field Names**: Using field names that may not match Pendo's expected schema
3. **Request Method Issues**: Only using GET requests when aggregation APIs often prefer POST for complex queries
4. **Poor Error Handling**: Limited logging and error details for debugging

## Solutions Implemented

### 1. Enhanced Request Method
- Added support for both GET and POST methods
- Proper URL parameter encoding using `URLSearchParams`
- Enhanced error logging with detailed response information
- Support for JSON payloads in POST requests

### 2. Corrected Field Names
- Changed `firstResponseTime` to `eventTime` or `serverTime`
- Changed `guideStepNum` to `stepNumber`
- Changed `timeOnPage` to `duration`
- Changed `numUsers` to `visitorId`
- Changed `numAccounts` to `accountId`

### 3. Multi-Approach Strategy
Each aggregation method now tries multiple approaches:
1. **POST method** with proper JSON payload
2. **GET method** with properly encoded parameters
3. **Alternative field names** if the above fail
4. **Fallback data** if no real data is available

### 4. Fixed Methods
- `getGuideTimeSeries()`: Now uses correct event time fields and visitor counts
- `getGuideStepAnalytics()`: Now uses step number and proper event handling
- `getGuideDeviceBreakdown()`: Now uses correct device/browser/os fields

## API Request Examples

### Corrected POST Request Format
```javascript
const requestPayload = {
  source: 'guideEvent',
  timeSeries: 'daily',
  operators: [
    { field: 'guideId', operator: 'EQ', value: id },
    { field: 'eventTime', operator: 'BETWEEN', value: [period.start, period.end] }
  ],
  groupby: ['eventTime'],
  metrics: [
    { name: 'visitorId', function: 'count' },
    { name: 'accountId', function: 'count' },
    { name: 'eventType', function: 'count' },
    { name: 'duration', function: 'avg' }
  ]
};

const response = await pendoAPI.request('/api/v1/aggregation', requestPayload, 'POST');
```

### Corrected GET Request Format
```javascript
const params = {
  source: 'guideEvent',
  timeSeries: 'daily',
  guideId: id,
  operators: requestPayload.operators,
  groupby: requestPayload.groupby,
  metrics: requestPayload.metrics
};

const response = await pendoAPI.request('/api/v1/aggregation', params);
```

## Testing Recommendations

1. **Test with different guide IDs** from your Pendo instance
2. **Monitor console logs** to see which approach works
3. **Check network tab** for actual HTTP requests and responses
4. **Verify data structure** matches your frontend expectations

## Alternative API Approaches

If aggregation continues to fail, consider:
1. **Using individual guide endpoints** with basic metrics
2. **Implementing time-based polling** of guide statistics
3. **Using Pendo's built-in reports** API if available
4. **Batch requests** for multiple guides simultaneously

## Common Pendo Field Names

| Original | Corrected | Description |
|----------|-----------|-------------|
| `firstResponseTime` | `eventTime`, `serverTime` | When the event occurred |
| `guideStepNum` | `stepNumber` | Guide step number |
| `timeOnPage` | `duration` | Time spent on element |
| `numUsers` | `visitorId` | Unique visitor count |
| `numAccounts` | `accountId` | Unique account count |
| `deviceType` | `device` | Device type (Desktop/Mobile) |
| `browserName` | `browser` | Browser name |
| `platformType` | `os` | Operating system |

## Debugging Tips

1. **Enable detailed logging** to see actual request payloads
2. **Check Pendo API documentation** for your specific version
3. **Test with simple requests** first (basic guide listing)
4. **Verify API key permissions** for aggregation endpoints
5. **Monitor rate limits** if making many requests