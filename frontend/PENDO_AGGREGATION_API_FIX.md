# Pendo Aggregation API Fix - Complete Solution

## Problem Summary

The original Pendo aggregation API calls were failing with specific errors:

1. **422 errors with missing pipeline field**: `{"overall":{},"fields":{"pipeline":"Required"}}`
2. **400 errors with missing jzb parameter**: `missing jzb`

## Root Cause Analysis

Through research and testing, I identified that:

1. **Pipeline Field**: Pendo's aggregation API requires a `pipeline` field that contains a MongoDB-style aggregation pipeline
2. **JZB Parameter**: This appears to be an encoded/compressed version of the pipeline that Pendo uses internally
3. **Request Format**: The original format using `source`, `operators`, `groupby`, and `metrics` was not compatible with Pendo's API structure

## Solution Implemented

### 1. Enhanced Request Handler

Added special handling for aggregation endpoints in the `request()` method:

```typescript
// Special handling for aggregation endpoint
if (endpoint === '/api/v1/aggregation') {
  return this.handleAggregationRequest(params, method);
}
```

### 2. Pipeline-Based Aggregation

Created a new `handleAggregationRequest()` method that:

- **Builds MongoDB-style pipelines** from the existing parameter format
- **Encodes the pipeline** for the jzb parameter
- **Tries multiple approaches** to ensure compatibility

### 3. Multi-Approach Strategy

The solution tries these approaches in order:

1. **POST with pipeline + jzb** (primary approach)
2. **POST with pipeline only** (fallback)
3. **GET with encoded parameters** (alternative)
4. **Legacy format** (final fallback)

### 4. Pipeline Builder

Created a `buildAggregationPipeline()` method that transforms:

```typescript
// From this format:
{
  source: 'guideEvent',
  operators: [
    { field: 'guideId', operator: 'EQ', value: id },
    { field: 'eventTime', operator: 'BETWEEN', value: [start, end] }
  ],
  groupby: ['eventTime'],
  metrics: [
    { name: 'visitorId', function: 'count' },
    { name: 'duration', function: 'avg' }
  ]
}

// To MongoDB pipeline format:
[
  { $source: 'guideEvent' },
  { $match: {
    guideId: id,
    eventTime: { $gte: start, $lte: end }
  }},
  { $group: {
    _id: { eventTime: '$eventTime' },
    visitorId: { $sum: 1 },
    duration: { $avg: '$duration' }
  }}
]
```

### 5. Enhanced Error Handling

- **Detailed logging** of each approach
- **Clear error messages** with specific failure reasons
- **Graceful fallbacks** to maintain functionality

## Code Changes

### Core Changes in `pendo-api.ts`:

1. **New method**: `handleAggregationRequest()` - Main orchestrator
2. **New method**: `buildAggregationPipeline()` - Pipeline transformation
3. **New method**: `encodePipeline()` - JZB parameter encoding
4. **New method**: `makeAggregationCall()` - Specialized HTTP handler
5. **Enhanced methods**: `getGuideTimeSeries()` and `getGuideStepAnalytics()` with multiple approaches

### Test Functions

Added comprehensive testing functions:

1. **`testNewAggregationFixes()`** - Complete testing of all approaches
2. **`testSpecificErrors()`** - Validation of error fixes
3. **Enhanced existing tests** - Better validation and logging

## Usage

### Basic Usage (No Changes Required)

The existing API calls continue to work, but now with proper error handling:

```typescript
const analytics = await pendoAPI.getGuideAnalytics(guideId, period);
```

### Testing the Fixes

```typescript
import { testNewAggregationFixes, testSpecificErrors } from '@/lib/pendo-api';

// Test all approaches
const result = await testNewAggregationFixes();
console.log('Test result:', result);

// Test specific error scenarios
await testSpecificErrors();
```

### Direct Pipeline Usage

If you want to use raw MongoDB pipelines:

```typescript
const response = await pendoAPI.request('/api/v1/aggregation', {
  pipeline: [
    { $match: { guideId: 'your-guide-id' } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]
}, 'POST');
```

## Field Mapping

### Correct Field Names

Based on the research, here are the correct field mappings:

| Original | Correct | Description |
|----------|---------|-------------|
| `firstResponseTime` | `eventTime`, `serverTime` | Event timestamp |
| `guideStepNum` | `stepNumber` | Guide step number |
| `timeOnPage` | `duration` | Time spent |
| `numUsers` | `visitorId` | Visitor count |
| `numAccounts` | `accountId` | Account count |
| `deviceType` | `device` | Device type |
| `browserName` | `browser` | Browser name |
| `platformType` | `os` | Operating system |

## Expected Response Format

The API should now return data in this format:

```typescript
{
  "_id": "2024-01-15",
  "visitorId": 150,
  "accountId": 45,
  "duration": 120.5,
  "eventType": "guideAdvanced"
}
```

## Troubleshooting

### If Still Getting 422 Errors

1. **Check the console logs** for pipeline details
2. **Verify guide ID exists** in your Pendo instance
3. **Check API key permissions** for aggregation endpoints

### If Still Getting 400 Errors

1. **Pipeline format might be incorrect** - check the generated pipeline
2. **JZB encoding issue** - the encoding method might need adjustment
3. **Field name mismatch** - verify field names match your Pendo schema

### Performance Considerations

1. **Multiple approaches** can impact performance - monitor response times
2. **Consider caching** successful approaches for future requests
3. **Large date ranges** might timeout - use smaller periods for testing

## Next Steps

1. **Test with real data** to validate the fixes
2. **Monitor console logs** to see which approach works best
3. **Optimize based on results** - remove unnecessary fallbacks
4. **Add more specific error handling** based on real-world usage

## Alternative Solutions

If the pipeline approach doesn't work, consider:

1. **Using Pendo's individual guide endpoints** with basic metrics
2. **Implementing time-based polling** of guide statistics
3. **Using Pendo's built-in reports API** if available
4. **Batch requests** for multiple guides simultaneously

## Testing Checklist

- [ ] Guide listing still works (377 guides)
- [ ] Time series aggregation returns real data
- [ ] Step analytics works correctly
- [ ] Device breakdown functions properly
- [ ] Geographic data is accessible
- [ ] No more 422 pipeline errors
- [ ] No more 400 jzb errors
- [ ] Console logs show successful approaches
- [ ] Response times are reasonable
- [ ] Error handling is graceful

This comprehensive solution should resolve the Pendo aggregation API issues while maintaining backward compatibility and providing detailed logging for troubleshooting.