export interface Guide {
  id: string;
  name: string;
  state: 'published' | 'draft' | 'archived' | '_pendingReview_';
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

export interface Report {
  id: string;
  name: string;
  description?: string;
  lastSuccessRunAt?: string;
  configuration?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  dateRange?: {
    start: Date;
    end: Date;
  };
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