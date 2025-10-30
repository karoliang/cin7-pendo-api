// Enhanced comprehensive Pendo data interfaces based on full API capabilities

// ===== COMPREHENSIVE GUIDE INTERFACES =====

export interface GuideStep {
  id: string;
  name: string;
  order: number;
  content: string;
  elementType: string;
  viewedCount: number;
  completedCount: number;
  timeSpent: number; // Average time in seconds
  dropOffCount: number;
  dropOffRate: number;
  elementPath?: string;
}

export interface GuideSegment {
  segmentName: string;
  segmentId: string;
  viewedCount: number;
  completedCount: number;
  completionRate: number;
  averageTimeToComplete: number;
  engagementRate: number;
  dropOffRate: number;
}

export interface GuideDeviceAnalytics {
  device: string;
  platform: string;
  browser: string;
  users: number;
  percentage: number;
  completionRate: number;
  averageTimeSpent: number;
  [key: string]: string | number;
}

export interface GuideTimeAnalytics {
  date: string;
  hour?: number;
  views: number;
  completions: number;
  uniqueVisitors: number;
  averageTimeSpent: number;
  dropOffRate: number;
  [key: string]: string | number | undefined;
}

export interface GuideGeographic {
  region: string;
  country: string;
  city?: string;
  users: number;
  percentage: number;
  completionRate: number;
  language: string;
  [key: string]: string | number | undefined;
}

export interface GuidePoll {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'rating' | 'nps';
  responseCount: number;
  averageRating?: number;
  responses: PollResponse[];
}

export interface PollResponse {
  option: string;
  count: number;
  percentage: number;
}

export interface ComprehensiveGuideData {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  state: 'published' | 'draft' | 'archived' | '_pendingReview_';
  type: string;
  kind: string;

  // Basic Metrics
  lastShownCount: number;
  viewedCount: number;
  completedCount: number;

  // Calculated Metrics
  completionRate: number;
  engagementRate: number;
  averageTimeToComplete: number;
  dropOffRate: number;

  // Advanced Analytics
  steps: GuideStep[];
  segmentPerformance: GuideSegment[];
  deviceBreakdown: GuideDeviceAnalytics[];
  geographicDistribution: GuideGeographic[];
  dailyStats: GuideTimeAnalytics[];
  hourlyEngagement: GuideTimeAnalytics[];
  weeklyTrends: GuideTimeAnalytics[];

  // User Behavior
  timeToFirstInteraction: number;
  averageSessionDuration: number;
  returnUserRate: number;
  shares: number;

  // A/B Testing
  variant?: string;
  variantPerformance?: {
    variant: string;
    conversionRate: number;
    engagementScore: number;
    userCount: number;
  }[];

  // Content Analytics
  polls?: GuidePoll[];
  clickThroughRate: number;
  formInteractions: number;

  // Timing Data
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  lastShownAt?: string;

  // Configuration
  audience?: object;
  launchMethod: string;
  isMultiStep: boolean;
  stepCount: number;
  autoAdvance: boolean;

  // Performance
  loadTime: number;
  errorRate: number;
  retryCount: number;
}

// ===== COMPREHENSIVE FEATURE INTERFACES =====

export interface FeatureCohort {
  cohort: string;
  cohortSize: number;
  activeUsers: number;
  retentionRate: number;
  averageUsagePerUser: number;
  dropOffRate: number;
  period: string;
}

export interface FeatureCorrelation {
  featureName: string;
  featureId: string;
  correlationStrength: number;
  usageCount: number;
  jointUsageCount: number;
  liftPercentage: number;
}

export interface FeatureUsagePattern {
  pattern: string;
  description: string;
  userCount: number;
  percentage: number;
  averageUsage: number;
  timeOfDay: number[];
  daysOfWeek: number[];
}

export interface FeatureAdoption {
  period: string;
  newUsers: number;
  adoptingUsers: number;
  cumulativeAdoptionRate: number;
  adoptionVelocity: number;
  timeToAdoption: number;
}

export interface ComprehensiveFeatureData {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  type: string;
  eventType: string;
  elementId?: string;
  elementPath?: string;

  // Basic Metrics
  visitorCount: number;
  accountCount: number;
  usageCount: number;
  uniqueUsers: number;

  // Calculated Metrics
  adoptionRate: number;
  usageFrequency: number;
  retentionRate: number;
  stickinessIndex: number;
  powerUserPercentage: number;

  // Advanced Analytics
  cohortAnalysis: FeatureCohort[];
  relatedFeatures: FeatureCorrelation[];
  usagePatterns: FeatureUsagePattern[];
  adoptionMetrics: FeatureAdoption[];
  dailyUsage: GuideTimeAnalytics[];
  hourlyUsage: GuideTimeAnalytics[];

  // User Segmentation
  userSegments: {
    segment: string;
    users: number;
    usageCount: number;
    adoptionRate: number;
    averageFrequency: number;
  }[];

  // Geographic & Device
  geographicDistribution: GuideGeographic[];
  deviceBreakdown: GuideDeviceAnalytics[];

  // Performance Analytics
  errorRate: number;
  responseTime: number;
  successRate: number;

  // Business Impact
  conversionEvents: number;
  revenueImpact?: number;
  productivityGain?: number;

  // Timing Data
  createdAt: string;
  updatedAt: string;
  firstUsedAt?: string;
  lastUsedAt?: string;

  // Configuration
  appWide: boolean;
  pageId?: string;
  applicationId?: string;
  isCoreEvent: boolean;
  isSuggested: boolean;
}

// ===== COMPREHENSIVE PAGE INTERFACES =====

export interface NavigationPath {
  path: string[];
  pathName: string;
  userCount: number;
  conversionRate: number;
  averageTimeSpent: number;
  dropOffRate: number;
  entryRate: number;
  exitRate: number;
}

export interface TrafficSource {
  source: string;
  medium?: string;
  campaign?: string;
  visitors: number;
  percentage: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
  pagesPerSession: number;
  [key: string]: string | number | undefined;
}

export interface EntryPoint {
  page: string;
  pageType: string;
  entries: number;
  percentage: number;
  averageSessionDuration: number;
  conversionRate: number;
  bounceRate: number;
}

export interface ExitPoint {
  page: string;
  exits: number;
  percentage: number;
  exitRate: number;
  averageTimeOnPage: number;
  lastPageRate: number;
}

export interface PagePerformance {
  metric: string;
  value: number;
  benchmark: number;
  status: 'good' | 'fair' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
}

export interface SearchAnalytics {
  keyword: string;
  searchVolume: number;
  clickThroughRate: number;
  averagePosition: number;
  conversionRate: number;
  landingPage: string;
}

export interface ComprehensivePageData {
  // Core Identity
  id: string;
  url: string;
  title?: string;
  name: string;
  type: string;

  // Basic Metrics
  viewedCount: number;
  visitorCount: number;
  uniqueVisitors: number;

  // Engagement Metrics
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  conversionRate: number;

  // Advanced Analytics
  navigationPaths: NavigationPath[];
  trafficSources: TrafficSource[];
  entryPoints: EntryPoint[];
  exitPoints: ExitPoint[];
  dailyTraffic: GuideTimeAnalytics[];
  hourlyTraffic: GuideTimeAnalytics[];

  // Content Analytics
  scrollDepth: {
    depth: number; // 25%, 50%, 75%, 100%
    users: number;
    percentage: number;
  }[];

  // Performance Metrics
  performanceMetrics: PagePerformance[];

  // Search Analytics
  searchAnalytics: SearchAnalytics[];
  organicKeywords: string[];

  // User Behavior
  newVsReturning: {
    new: number;
    returning: number;
  };
  devicePerformance: GuideDeviceAnalytics[];
  geographicPerformance: GuideGeographic[];

  // Business Impact
  goalCompletions: number;
  conversionValue?: number;
  assistedConversions: number;

  // Technical
  loadTime: number;
  interactionLatency: number;
  errorRate: number;
  accessibilityScore: number;

  // Content Analysis
  wordCount: number;
  readingTime: number;
  mediaElements: number;
  formFields: number;

  // Timing Data
  createdAt: string;
  updatedAt: string;
  firstIndexedAt?: string;
  lastModifiedAt?: string;

  // SEO & Discovery
  searchRankings: {
    keyword: string;
    position: number;
    url: string;
    traffic: number;
  }[];

  // Configuration
  rules: object;
  isCoreEvent: boolean;
  isSuggested: boolean;

  // New Real Data from Pendo API
  topVisitors?: PageVisitor[];
  topAccounts?: PageAccount[];
  eventBreakdown?: PageEventRow[];
  featuresTargeting?: PageFeature[];
  guidesTargeting?: PageGuide[];

  // New calculated summaries from event data
  frustrationMetrics?: FrustrationMetricsSummary;
  geographicDistribution?: GeographicDistribution[];
  deviceBrowserBreakdown?: DeviceBrowserBreakdown[];
  dailyTimeSeries?: DailyTimeSeries[];
}

// Page-specific interfaces for new data
export interface PageVisitor {
  visitorId: string;
  email?: string;
  name?: string;
  viewCount: number;
}

export interface PageAccount {
  accountId: string;
  name?: string;
  arr?: number;
  planlevel?: string;
  viewCount: number;
}

export interface PageEventRow {
  // Existing fields
  visitorId: string;
  accountId?: string;
  date: string;
  totalViews: number;
  uTurns?: number;
  deadClicks?: number;
  errorClicks?: number;
  rageClicks?: number;
  serverName?: string;
  browserName?: string;
  browserVersion?: string;

  // Extended fields from Pendo API
  numMinutes?: number;
  firstTime?: number;
  lastTime?: number;

  // Geographic data
  latitude?: number;
  longitude?: number;
  region?: string;
  country?: string;

  // Device/Browser (raw)
  userAgent?: string;

  // Recording data
  recordingId?: string;
  recordingSessionId?: string;

  // Time dimensions
  week?: number;
  month?: number;
  quarter?: number;
}

export interface PageFeature {
  featureId: string;
  name: string;
  eventCount: number;
}

export interface PageGuide {
  guideId: string;
  name: string;
  segment?: string;
  status: string;
}

// New summary interfaces for aggregated data
export interface FrustrationMetricsSummary {
  totalRageClicks: number;
  totalDeadClicks: number;
  totalUTurns: number;
  totalErrorClicks: number;
  frustrationRate: number; // Percentage of sessions with frustration
  avgFrustrationPerSession: number;
  topFrustratedVisitors: Array<{
    visitorId: string;
    email?: string;
    rageClicks: number;
    deadClicks: number;
    uTurns: number;
    errorClicks: number;
    totalFrustration: number;
  }>;
}

export interface GeographicDistribution {
  region: string;
  country: string;
  visitors: number;
  views: number;
  avgTimeOnPage: number;
  percentage: number;
}

export interface DeviceBrowserBreakdown {
  device: string; // Desktop, Mobile, Tablet
  deviceType?: string; // Specific model if available
  os: string; // Windows, macOS, iOS, Android
  osVersion?: string;
  browser: string; // Chrome, Safari, Firefox, Edge
  browserVersion?: string;
  users: number;
  percentage: number;
}

export interface DailyTimeSeries {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
  avgTimeOnPage: number;
  frustrationCount: number;
  [key: string]: string | number; // Index signature for chart compatibility
}

// ===== COMPREHENSIVE REPORT INTERFACES =====

export interface ReportSection {
  sectionName: string;
  sectionType: string;
  views: number;
  averageTimeSpent: number;
  interactionCount: number;
  shares: number;
  downloads: number;
  completionRate: number;
  popularity: number;
}

export interface UserFeedback {
  userId: string;
  userName: string;
  rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  comments?: string;
  timestamp: string;
  helpfulVotes: number;
  reportSections: string[];
}

export interface ReportUsagePattern {
  pattern: string;
  userCount: number;
  sessionDuration: number;
  viewDepth: number;
  interactionLevel: 'light' | 'medium' | 'deep';
  timeOfDay: number[];
  dayOfWeek: number[];
}

export interface CollaborationMetric {
  userId: string;
  userName: string;
  role: string;
  sharesInitiated: number;
  sharesReceived: number;
  commentsCount: number;
  annotationsCount: number;
  collaborationScore: number;
}

export interface FilterUsage {
  filterName: string;
  filterType: string;
  usageCount: number;
  uniqueUsers: number;
  averageApplicationTime: number;
  popularValues: string[];
  conversionImpact: number;
}

export interface ComprehensiveReportData {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  type: string;
  kind: string;
  level: string;

  // Basic Metrics
  totalViews: number;
  uniqueViewers: number;
  shares: number;
  downloads: number;
  averageRating: number;

  // Engagement Metrics
  averageTimeSpent: number;
  engagementScore: number;
  returnVisitorRate: number;

  // Advanced Analytics
  sectionEngagement: ReportSection[];
  userFeedback: UserFeedback[];
  usagePatterns: ReportUsagePattern[];
  collaborationMetrics: CollaborationMetric[];
  filterUsage: FilterUsage[];
  dailyEngagement: GuideTimeAnalytics[];

  // Content Analytics
  chartInteractions: {
    chartType: string;
    interactions: number;
    averageTimeSpent: number;
    drillDowns: number;
    exports: number;
  }[];

  // Sharing & Distribution
  shareNetwork: {
    userId: string;
    shareCount: number;
    viewCount: number;
    conversionRate: number;
  }[];

  // Performance Analytics
  loadTime: number;
  errorRate: number;
  renderingTime: number;

  // Business Impact
  decisionInfluence: number;
  timeSaved: number;
  productivityGain: number;

  // User Segmentation
  userEngagement: {
    segment: string;
    users: number;
    views: number;
    averageTimeSpent: number;
    feedbackScore: number;
  }[];

  // Geographic Distribution
  geographicDistribution: GuideGeographic[];

  // Device Analytics
  deviceBreakdown: GuideDeviceAnalytics[];

  // Timing Data
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  lastSharedAt?: string;

  // Configuration
  shared: boolean;
  share: object;
  ownedByUser: object;
  isTemplate: boolean;

  // AI & Insights
  insights: {
    type: string;
    title: string;
    description: string;
    confidence: number;
    timestamp: string;
  }[];

  recommendations: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
    implementation: string;
  }[];
}

// ===== AGGREGATE ANALYTICS INTERFACES =====

export interface CrossEntityCorrelation {
  entity1Type: 'guide' | 'feature' | 'page';
  entity1Id: string;
  entity1Name: string;
  entity2Type: 'guide' | 'feature' | 'page';
  entity2Id: string;
  entity2Name: string;
  correlationStrength: number;
  jointUsageCount: number;
  liftPercentage: number;
  recommendation: string;
}

export interface UserJourney {
  userId: string;
  journeyName: string;
  touchpoints: {
    entityType: 'guide' | 'feature' | 'page' | 'report';
    entityId: string;
    entityName: string;
    timestamp: string;
    action: string;
    duration?: number;
  }[];
  totalDuration: number;
  conversionEvents: number;
  satisfactionScore?: number;
}

export interface SystemInsights {
  period: string;
  totalEngagement: number;
  activeUsers: number;
  topPerformingEntities: {
    type: string;
    entityId: string;
    name: string;
    score: number;
  }[];
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
  }[];
  anomalies: {
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}