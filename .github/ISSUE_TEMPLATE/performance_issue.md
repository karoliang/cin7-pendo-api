---
name: ⚡ Performance Issue
about: Report performance problems and optimization opportunities
title: "[PERF] "
labels: performance, needs-triage
assignees: ''
---

## Performance Issue Description
A clear description of the performance problem you're experiencing.

## Performance Metrics

### Current Performance
- **Page Load Time**: [Current load time in seconds]
- **Interaction Response**: [User interaction response time]
- **Memory Usage**: [Memory consumption]
- **Bundle Size**: [Current JavaScript bundle size]
- **Database Query Time**: [Slow database queries]

### Target Performance
- **Page Load Time**: [Target load time < 2 seconds]
- **Interaction Response**: [Target response time < 100ms]
- **Memory Usage**: [Target memory consumption]
- **Bundle Size**: [Target bundle size < 500KB]

## Component Information
- **Component**: `frontend/src/components/path/Component.tsx`
- **Hook**: `useHookName` if applicable
- **Route**: `[/route/path]`
- **Data Source**: [API endpoint, database query]

## Environment
- **Browser**: [Chrome/Firefox/Safari + Version]
- **Device**: [Desktop/Mobile + Specifications]
- **Network**: [WiFi/4G/3G + Speed]
- **Deployment**: [Development/Staging/Production]

## Performance Profiling Data

### React DevTools Profiler
```
[Paste React Profiler results here]
- Render time: [ms]
- Re-renders: [count]
- Expensive operations: [list]
```

### Chrome DevTools Performance
```
[Paste Lighthouse or Performance tab results]
- Performance Score: [0-100]
- Largest Contentful Paint: [ms]
- Total Blocking Time: [ms]
- Cumulative Layout Shift: [score]
```

### Bundle Analysis
```
[Paste bundle analyzer results]
- Total bundle size: [KB]
- Largest chunks: [list with sizes]
- Unused code: [percentage]
- Code splitting opportunities: [list]
```

## Issue Reproduction

### Steps to Reproduce
1. Navigate to `[route]`
2. Wait for page to load
3. Interact with `[component/element]`
4. Observe `[performance issue]`

### Consistency
- [ ] **Reproducible**: Issue occurs consistently
- [ ] **Intermittent**: Issue occurs sometimes
- [ ] **Environment-Specific**: Only occurs in certain environments
- [ ] **Data-Dependent**: Only with specific data sets

## Performance Problem Areas

### Rendering Performance
- **Component Renders**: [Excessive re-renders]
- **State Updates**: [Inefficient state management]
- **Memoization**: [Missing React.memo usage]
- **Virtual Lists**: [Large lists without virtualization]

### Data Fetching
- **API Calls**: [Multiple redundant API calls]
- **Caching**: [Poor or missing caching strategy]
- **Query Optimization**: [Slow database queries]
- **Data Transformation**: [Inefficient data processing]

### Bundle Size
- **Large Dependencies**: [Heavy libraries used]
- **Unused Code**: [Code shipped but not used]
- **Code Splitting**: [Missing lazy loading]
- **Asset Optimization**: [Unoptimized images/assets]

### Memory Leaks
- **Event Listeners**: [Unremoved event listeners]
- **Timers**: [Uncleared intervals/timeouts]
- **Subscriptions**: [Unsubscribed observables]
- **DOM References**: [Retained DOM nodes]

## Code Analysis

### Problematic Component
```tsx
// Example component with performance issues
export const ProblematicComponent: React.FC<Props> = ({ data }) => {
  const [processedData, setProcessedData] = useState([]);

  // Issue: Heavy computation on every render
  const expensiveCalculation = () => {
    return data.map(item => heavyProcessing(item));
  };

  // Issue: No memoization
  const items = expensiveCalculation();

  return <div>{/* Component JSX */}</div>;
};
```

### Optimized Version
```tsx
// Optimized component with performance improvements
export const OptimizedComponent: React.FC<Props> = React.memo(({ data }) => {
  const [processedData, setProcessedData] = useState([]);

  // Fix: Memoized expensive calculation
  const expensiveCalculation = useCallback(() => {
    return data.map(item => heavyProcessing(item));
  }, [data]);

  // Fix: Memoized result
  const items = useMemo(() => expensiveCalculation(), [expensiveCalculation]);

  return <div>{/* Component JSX */}</div>;
});
```

## Optimization Strategies

### React Performance
- [ ] **React.memo**: Implement for expensive components
- [ ] **useMemo**: Cache expensive calculations
- [ ] **useCallback**: Prevent function recreation
- [ ] **Code Splitting**: Lazy load routes and components
- [ ] **Virtual Lists**: Use react-window for large lists

### State Management
- [ ] **TanStack Query**: Optimize query caching and invalidation
- [ ] **Zustand**: Minimize state subscriptions
- [ ] **Context**: Split large contexts into smaller ones
- [ ] **Local State**: Use appropriate state granularity

### Data Fetching
- [ ] **Request Deduplication**: Prevent duplicate API calls
- [ ] **Prefetching**: Load data before needed
- [ ] **Pagination**: Implement for large data sets
- [ ] **Background Sync**: Sync data asynchronously

### Bundle Optimization
- [ ] **Tree Shaking**: Remove unused code
- [ ] **Dynamic Imports**: Load code on demand
- [ ] **Vendor Splitting**: Separate third-party code
- [ ] **Asset Optimization**: Compress and optimize assets

## Performance Testing

### Load Testing
- **Concurrent Users**: [Number of simultaneous users]
- **Request Rate**: [Requests per second]
- **Response Times**: [95th percentile]
- **Error Rates**: [Percentage of failed requests]

### Stress Testing
- **Peak Load**: [Maximum load before failure]
- **Recovery Time**: [Time to recover after overload]
- **Resource Usage**: [CPU, memory, network utilization]
- **Bottlenecks**: [Identified performance bottlenecks]

### Mobile Performance
- **Network Conditions**: [3G/4G/WiFi performance]
- **Device Constraints**: [Low-end device performance]
- **Battery Impact**: [Power consumption]
- **Memory Constraints**: [Mobile memory limitations]

## Monitoring & Measurement

### Key Performance Indicators
- **Core Web Vitals**: LCP, FID, CLS
- **User Experience**: Perceived performance
- **Business Metrics**: Conversion rates, bounce rates
- **Technical Metrics**: Error rates, uptime

### Monitoring Tools
- [ ] **React DevTools**: Component profiling
- [ ] **Chrome DevTools**: Performance analysis
- [ ] **Lighthouse**: Performance scoring
- [ ] **Bundle Analyzer**: Bundle size analysis
- [ ] **APM Tools**: Application performance monitoring

### Alerting Thresholds
- **Page Load**: Alert if > 3 seconds
- **Interaction Delay**: Alert if > 200ms
- **Memory Usage**: Alert if > 100MB
- **Error Rate**: Alert if > 1%

## Business Impact

### User Experience
- **Bounce Rate**: [Impact on user retention]
- **Conversion**: [Effect on goal completion]
- **Satisfaction**: [User satisfaction impact]
- **Accessibility**: [Performance impact on accessibility]

### Technical Impact
- **Server Load**: [Infrastructure cost impact]
- **Bandwidth**: [Data transfer costs]
- **SEO**: [Search engine ranking impact]
- **Compliance**: [Performance requirements]

## Implementation Plan

### Phase 1: Quick Wins (Week 1)
- [ ] Implement React.memo for expensive components
- [ ] Add basic caching for API calls
- [ ] Optimize images and static assets
- [ ] Remove unused dependencies

### Phase 2: Structural Changes (Week 2-3)
- [ ] Implement code splitting and lazy loading
- [ ] Add virtualization for large lists
- [ ] Optimize database queries
- [ ] Implement proper state management

### Phase 3: Advanced Optimization (Week 4)
- [ ] Add performance monitoring
- [ ] Implement advanced caching strategies
- [ ] Optimize bundle size further
- [ ] Add performance testing to CI/CD

## Success Metrics

### Performance Targets
- **Lighthouse Score**: > 90
- **Page Load Time**: < 2 seconds
- **Interaction Response**: < 100ms
- **Bundle Size**: < 500KB (gzipped)

### Business Metrics
- **Bounce Rate**: Reduce by [X]%
- **Conversion Rate**: Increase by [X]%
- **User Satisfaction**: Score > [X]/5
- **Support Tickets**: Reduce performance-related tickets by [X]%

## Additional Context
Add any other relevant performance information:
- Historical performance data
- User feedback on performance
- Related performance issues
- Performance budget constraints

---
**Performance Review Checklist**
- [ ] Performance metrics baseline established
- [ ] Root causes identified and prioritized
- [ ] Optimization strategies evaluated
- [ ] Implementation plan created
- [ ] Success metrics defined
- [ ] Monitoring and alerting set up
- [ ] Performance budget allocated
- [ ] Team training on performance best practices