import type { Guide, Feature, Page, Report } from '@/types/pendo';

const PENDO_BASE_URL = 'https://app.pendo.io';
const PENDO_API_KEY = 'f4acdb2c-038c-4de1-a88b-ab90423037bf.us';

class PendoAPIClient {
  private headers = {
    'X-Pendo-Integration-Key': PENDO_API_KEY,
    'Content-Type': 'application/json',
  };

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${PENDO_BASE_URL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Pendo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getGuides(params?: {
    limit?: number;
    offset?: number;
    state?: string;
  }): Promise<Guide[]> {
    try {
      const response = await this.request<any[]>('/api/v1/guide', params);
      return response.map(this.transformGuide);
    } catch (error) {
      console.error('Error fetching guides:', error);
      // Return mock data for now
      return this.getMockGuides();
    }
  }

  async getFeatures(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Feature[]> {
    try {
      const response = await this.request<any[]>('/api/v1/feature', params);
      return response.map(this.transformFeature);
    } catch (error) {
      console.error('Error fetching features:', error);
      return this.getMockFeatures();
    }
  }

  async getPages(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Page[]> {
    try {
      const response = await this.request<any[]>('/api/v1/page', params);
      return response.map(this.transformPage);
    } catch (error) {
      console.error('Error fetching pages:', error);
      return this.getMockPages();
    }
  }

  async getReports(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    try {
      const response = await this.request<any[]>('/api/v1/report', params);
      return response.map(this.transformReport);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return this.getMockReports();
    }
  }

  private transformGuide = (guide: any): Guide => ({
    id: guide.id || '',
    name: guide.name || '',
    state: guide.state || 'draft',
    lastShownCount: guide.lastShownCount || 0,
    viewedCount: guide.viewedCount || 0,
    completedCount: guide.completedCount || 0,
    createdAt: guide.createdAt || new Date().toISOString(),
    updatedAt: guide.updatedAt || new Date().toISOString(),
    publishedAt: guide.publishedAt,
    description: guide.description,
    audience: guide.audience,
    type: guide.type,
  });

  private transformFeature = (feature: any): Feature => ({
    id: feature.id || '',
    name: feature.name || '',
    visitorCount: feature.visitorCount || 0,
    accountCount: feature.accountCount || 0,
    usageCount: feature.usageCount || 0,
    eventType: feature.eventType || '',
    createdAt: feature.createdAt || new Date().toISOString(),
    updatedAt: feature.updatedAt || new Date().toISOString(),
    description: feature.description,
    applicationId: feature.applicationId,
    elementId: feature.elementId,
  });

  private transformPage = (page: any): Page => ({
    id: page.id || '',
    url: page.url || '',
    title: page.title,
    viewedCount: page.viewedCount || 0,
    visitorCount: page.visitorCount || 0,
    createdAt: page.createdAt || new Date().toISOString(),
    updatedAt: page.updatedAt || new Date().toISOString(),
    applicationId: page.applicationId,
  });

  private transformReport = (report: any): Report => ({
    id: report.id || '',
    name: report.name || '',
    description: report.description,
    lastSuccessRunAt: report.lastSuccessRunAt,
    configuration: report.configuration,
    createdAt: report.createdAt || new Date().toISOString(),
    updatedAt: report.updatedAt || new Date().toISOString(),
  });

  // Mock data methods for development
  private getMockGuides = (): Guide[] => [
    {
      id: '1',
      name: 'Getting Started Guide',
      state: 'published',
      lastShownCount: 1250,
      viewedCount: 890,
      completedCount: 456,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      publishedAt: '2024-01-16T09:00:00Z',
      description: 'Introduction for new users',
      type: 'onboarding',
    },
    {
      id: '2',
      name: 'Advanced Features',
      state: 'published',
      lastShownCount: 890,
      viewedCount: 567,
      completedCount: 234,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-22T11:15:00Z',
      description: 'Advanced product features',
      type: 'tutorial',
    },
    {
      id: '3',
      name: 'Welcome Campaign',
      state: 'published',
      lastShownCount: 2100,
      viewedCount: 1543,
      completedCount: 890,
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-25T14:20:00Z',
      publishedAt: '2024-01-06T08:00:00Z',
      description: 'Welcome campaign for new users',
      type: 'announcement',
    },
    {
      id: '4',
      name: 'Public Feature Launch',
      state: 'published',
      lastShownCount: 3450,
      viewedCount: 2890,
      completedCount: 1234,
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-24T16:45:00Z',
      publishedAt: '2024-01-09T10:00:00Z',
      description: 'Public announcement for new features',
      type: 'announcement',
    },
    {
      id: '5',
      name: 'Draft Campaign',
      state: 'draft',
      lastShownCount: 0,
      viewedCount: 0,
      completedCount: 0,
      createdAt: '2024-01-20T13:00:00Z',
      updatedAt: '2024-01-25T09:15:00Z',
      description: 'Draft campaign waiting for review',
      type: 'training',
    },
    {
      id: '6',
      name: 'Paused Campaign',
      state: 'archived',
      lastShownCount: 567,
      viewedCount: 234,
      completedCount: 89,
      createdAt: '2024-01-12T15:00:00Z',
      updatedAt: '2024-01-23T11:30:00Z',
      publishedAt: '2024-01-13T14:00:00Z',
      description: ' temporarily paused campaign',
      type: 'onboarding',
    },
  ];

  private getMockFeatures = (): Feature[] => [
    {
      id: '1',
      name: 'Dashboard Analytics',
      visitorCount: 2340,
      accountCount: 156,
      usageCount: 5678,
      eventType: 'click',
      createdAt: '2024-01-05T12:00:00Z',
      updatedAt: '2024-01-25T09:30:00Z',
      description: 'Analytics dashboard access',
    },
    {
      id: '2',
      name: 'Export Reports',
      visitorCount: 1234,
      accountCount: 89,
      usageCount: 2345,
      eventType: 'feature_used',
      createdAt: '2024-01-08T14:00:00Z',
      updatedAt: '2024-01-24T16:45:00Z',
      description: 'Report export functionality',
    },
  ];

  private getMockPages = (): Page[] => [
    {
      id: '1',
      url: '/dashboard',
      title: 'Dashboard',
      viewedCount: 5678,
      visitorCount: 1234,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-25T12:00:00Z',
    },
    {
      id: '2',
      url: '/reports',
      title: 'Reports',
      viewedCount: 2345,
      visitorCount: 890,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-24T15:30:00Z',
    },
  ];

  private getMockReports = (): Report[] => [
    {
      id: '1',
      name: 'Weekly Usage Report',
      description: 'Weekly user engagement and feature usage',
      lastSuccessRunAt: '2024-01-25T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
    },
    {
      id: '2',
      name: 'Feature Adoption Analysis',
      description: 'Feature adoption trends and insights',
      lastSuccessRunAt: '2024-01-24T16:30:00Z',
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-24T16:30:00Z',
    },
  ];
}

export const pendoAPI = new PendoAPIClient();