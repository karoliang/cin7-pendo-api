import { useEffect } from 'react';

interface PageTitleOptions {
  title: string;
  description?: string;
}

const APP_NAME = 'Cin7 Pendo Analytics';
const DEFAULT_DESCRIPTION = 'Product analytics dashboard for Cin7 powered by Pendo';

export const usePageTitle = ({ title, description }: PageTitleOptions) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }
  }, [title, description]);
};

// Page title constants for consistency
export const PAGE_TITLES = {
  LOGIN: 'Sign In',
  DASHBOARD: 'Dashboard',
  DATA_TABLES: 'Data Explorer',
  GUIDES: 'Guides',
  FEATURES: 'Features',
  PAGES: 'Pages',
  REPORTS: 'Reports',
  REPORT_DETAILS: 'Report Details',
} as const;

// Page descriptions for SEO
export const PAGE_DESCRIPTIONS = {
  LOGIN: 'Sign in to access Cin7 product analytics and insights',
  DASHBOARD: 'Overview of product usage metrics, guides, features, and page analytics',
  DATA_TABLES: 'Explore detailed analytics data for guides, features, pages, and reports',
  GUIDES: 'In-app guide performance metrics and analytics',
  FEATURES: 'Feature adoption and usage analytics',
  PAGES: 'Page visit analytics and user behavior insights',
  REPORTS: 'Custom reports and analytics insights',
  REPORT_DETAILS: 'Detailed analytics for individual guides, features, and pages',
} as const;
