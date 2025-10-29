import React from 'react';
import {
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import type { Guide, Feature, Page, Report } from '@/types/pendo';

interface DetailModalProps {
  item: Guide | Feature | Page | Report | null;
  type: 'guide' | 'feature' | 'page' | 'report';
  isOpen: boolean;
  onClose: () => void;
}

export function DetailModal({ item, type, isOpen, onClose }: DetailModalProps) {
  if (!item || !isOpen) return null;

  const renderGuideDetails = (guide: Guide) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Status</h4>
          <p className="mt-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              guide.state === 'published'
                ? 'bg-green-100 text-green-800'
                : guide.state === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : guide.state === '_pendingReview_'
                ? 'bg-orange-100 text-orange-800'
                : guide.state === 'archived'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {guide.state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Type</h4>
          <p className="mt-1 text-sm text-gray-900">{guide.type || 'General'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <EyeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{guide.viewedCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Views</p>
        </div>
        <div className="text-center">
          <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{guide.completedCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Completions</p>
        </div>
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
            <span className="text-lg font-bold text-purple-600">
              {guide.viewedCount > 0
                ? Math.round((guide.completedCount / guide.viewedCount) * 100)
                : 0}%
            </span>
          </div>
          <p className="text-sm text-gray-500">Completion Rate</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
        <p className="text-sm text-gray-900">{guide.description || 'No description available'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Created</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(guide.createdAt).toLocaleDateString()} at {new Date(guide.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(guide.updatedAt).toLocaleDateString()} at {new Date(guide.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderFeatureDetails = (feature: Feature) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
          <p className="mt-1 text-sm text-gray-900">{feature.eventType}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Application ID</h4>
          <p className="mt-1 text-sm text-gray-900">{feature.applicationId || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{feature.visitorCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Unique Visitors</p>
        </div>
        <div className="text-center">
          <DocumentTextIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{feature.usageCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Usage</p>
        </div>
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
            <span className="text-lg font-bold text-purple-600">
              {feature.visitorCount > 0
                ? Math.round(feature.usageCount / feature.visitorCount)
                : 0}
            </span>
          </div>
          <p className="text-sm text-gray-500">Avg Usage/User</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
        <p className="text-sm text-gray-900">{feature.description || 'No description available'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Created</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(feature.createdAt).toLocaleDateString()} at {new Date(feature.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(feature.updatedAt).toLocaleDateString()} at {new Date(feature.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPageDetails = (page: Page) => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-500">URL</h4>
        <p className="mt-1 text-sm text-gray-900 font-mono break-all">{page.url}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500">Title</h4>
        <p className="mt-1 text-sm text-gray-900">{page.title || page.url}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <EyeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{page.viewedCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Views</p>
        </div>
        <div className="text-center">
          <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{page.visitorCount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Unique Visitors</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Application ID</h4>
          <p className="mt-1 text-sm text-gray-900">{page.applicationId || 'N/A'}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Avg. Views/Visitor</h4>
          <p className="mt-1 text-sm text-gray-900">
            {page.visitorCount > 0 ? (page.viewedCount / page.visitorCount).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Created</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(page.createdAt).toLocaleDateString()} at {new Date(page.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(page.updatedAt).toLocaleDateString()} at {new Date(page.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderReportDetails = (report: Report) => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-500">Report Name</h4>
        <p className="mt-1 text-lg text-gray-900">{report.name}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500">Description</h4>
        <p className="mt-1 text-sm text-gray-900">{report.description || 'No description available'}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${
            report.lastSuccessRunAt
              ? 'bg-green-500'
              : 'bg-gray-400'
          }`} />
          <span className="text-sm text-gray-900">
            {report.lastSuccessRunAt
              ? `Last run: ${new Date(report.lastSuccessRunAt).toLocaleDateString()} at ${new Date(report.lastSuccessRunAt).toLocaleTimeString()}`
              : 'Never run'
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Created</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(report.updatedAt).toLocaleDateString()} at {new Date(report.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {report.configuration && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Configuration</h4>
          <pre className="mt-1 p-3 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(report.configuration, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {type === 'guide' ? (item as Guide).name :
             type === 'feature' ? (item as Feature).name :
             type === 'page' ? (item as Page).title || (item as Page).url :
             (item as Report).name}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {type === 'guide' && renderGuideDetails(item as Guide)}
          {type === 'feature' && renderFeatureDetails(item as Feature)}
          {type === 'page' && renderPageDetails(item as Page)}
          {type === 'report' && renderReportDetails(item as Report)}
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}