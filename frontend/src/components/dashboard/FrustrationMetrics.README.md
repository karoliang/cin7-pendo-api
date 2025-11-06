# FrustrationMetrics Component

A comprehensive dashboard widget that displays aggregate frustration metrics across all monitored pages.

## Purpose

Provides a quick overview of user frustration indicators to help identify UX issues and areas that need improvement.

## Usage

```tsx
import { FrustrationMetrics } from '@/components/dashboard/FrustrationMetrics';
import type { ComprehensivePageData } from '@/types/enhanced-pendo';

// In your component
<FrustrationMetrics
  pages={pagesData}
  loading={isLoading}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pages` | `ComprehensivePageData[]` | Yes | Array of comprehensive page data |
| `loading` | `boolean` | No | Shows loading state. Default: `false` |

## Metrics Displayed

### 1. Rage Clicks (🤬)
Rapid repeated clicks on the same element indicating user frustration.

### 2. Dead Clicks (💀)
Clicks on non-interactive elements where users expected interaction.

### 3. Error Clicks (❌)
Clicks that resulted in errors or failed actions.

### 4. U-Turns (↩️)
Users who immediately navigated back after landing on a page.

### 5. Frustration Rate (📊)
Percentage calculated as: `(Total frustration events / Total page views) × 100`

## Data Sources

The component aggregates data from two possible sources (in order of preference):

1. **`page.frustrationMetrics`** - Pre-calculated summary object
2. **`page.eventBreakdown[]`** - Individual event records with frustration counts

### Expected Data Structure

```typescript
interface ComprehensivePageData {
  viewedCount: number;

  // Option 1: Pre-aggregated (preferred)
  frustrationMetrics?: {
    totalRageClicks: number;
    totalDeadClicks: number;
    totalUTurns: number;
    totalErrorClicks: number;
  };

  // Option 2: Event breakdown array
  eventBreakdown?: Array<{
    rageClicks?: number;
    deadClicks?: number;
    errorClicks?: number;
    uTurns?: number;
  }>;
}
```

## Visual Design

The component displays 5 metric cards in a responsive grid:
- **Desktop**: 5 columns (1 row)
- **Tablet**: 2 columns (3 rows)
- **Mobile**: 1 column (5 rows)

Each card includes:
- Icon representing the metric
- Metric label with tooltip
- Large formatted number
- Color-coded background based on severity

## Color Coding

### Frustration Rate
- **Green** (< 2%): Acceptable levels
- **Amber** (2-5%): Moderate concern
- **Red** (> 5%): High concern

### Count Metrics
- **Gray** (< 100): Low
- **Amber** (100-1000): Moderate
- **Red** (> 1000): High

## Tooltips

Each metric includes an informative tooltip explaining what the metric measures. Hover over the metric label to view.

## Integration Example

```tsx
import { Dashboard } from '@/pages/Dashboard';
import { FrustrationMetrics } from '@/components/dashboard/FrustrationMetrics';

export const Dashboard: React.FC = () => {
  const { pages, isLoading } = useDashboardOverview();

  return (
    <Layout>
      {/* Other components */}

      <FrustrationMetrics pages={pages} loading={isLoading} />

      {/* Other components */}
    </Layout>
  );
};
```

## Accessibility

- All icons include proper `aria-label` attributes
- Tooltips are keyboard accessible via Polaris Tooltip component
- Color is not the only indicator (icons + text labels provided)
- Semantic HTML structure for screen readers

## Dependencies

- `@/components/polaris` - Cin7 Polaris wrapper components
- `@shopify/polaris` - Tooltip component
- `@/types/enhanced-pendo` - TypeScript types for page data

## Notes

- Returns zero values when no pages data is available
- Automatically handles missing or undefined frustration metrics
- Safe to use with partial data (gracefully handles missing fields)
- Numbers are formatted with locale-appropriate separators (e.g., 1,234)
