export interface Guide {
  id: string;
  name: string;
  state: 'published' | 'draft' | 'archived' | '_pendingReview_' | 'public' | 'staging' | 'disabled';
  lastShownCount: number;
  viewedCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  description?: string;
  audience?: string[];
  type?: string;
}

export interface Feature {
  id: string;
  name: string;
  visitorCount: number;
  accountCount: number;
  usageCount: number;
  eventType: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  applicationId?: string;
  elementId?: string;
}

export interface Page {
  id: string;
  url: string;
  title?: string;
  viewedCount: number;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
  applicationId?: string;
}

export interface ReportConfiguration {
  [key: string]: string | number | boolean | null | ReportConfiguration | ReportConfiguration[];
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  lastSuccessRunAt?: string;
  configuration?: ReportConfiguration;
  createdAt: string;
  updatedAt: string;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface FilterState {
  dateRange?: DateRange;
  guideTypes?: string[];
  featureCategories?: string[];
  pageTypes?: string[];
  searchQuery?: string;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Page-specific feature and guide interfaces
export interface PageFeature {
  featureId: string;
  name: string;
  eventCount: number;
  deadClicks?: number;
  errorClicks?: number;
  rageClicks?: number;
}

export interface PageGuide {
  guideId: string;
  name: string;
  productArea?: string;
  segment?: string;
  status: string;
}