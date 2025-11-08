import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { InlineSpinner } from '@/components/ui/Spinner';
import { useSegments } from '@/hooks/useSegments';
import { usePageTitle } from '@/hooks/usePageTitle';

export const SegmentsDashboard: React.FC = () => {
  usePageTitle({
    title: 'User Segments',
    description: 'Analyze user segmentation and engagement patterns'
  });

  const { data, isLoading, error } = useSegments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const filteredSegments = useMemo(() => {
    if (!data?.segments) return [];

    return data.segments.filter(segment =>
      segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.segments, searchQuery]);

  const selectedSegmentData = selectedSegment
    ? data?.segments.find(s => s.id === selectedSegment)
    : null;

  if (error) {
    return (
      <Layout>
        <Cin7Card>
          <Cin7CardContent>
            <p className="text-red-600">Error loading segments: {(error as Error).message}</p>
          </Cin7CardContent>
        </Cin7Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">
                  {isLoading ? '...' : data?.totalCount || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Total Segments</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>

          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-900">
                  {isLoading ? '...' : filteredSegments.length}
                </div>
                <div className="text-sm text-gray-600 mt-2">Filtered Results</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>

          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-900">
                  {isLoading ? '...' : selectedSegment ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600 mt-2">Selected</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>
        </div>

        {/* Search and Segments List */}
        <Cin7Card>
          <Cin7CardHeader>
            <Cin7CardTitle>User Segments</Cin7CardTitle>
          </Cin7CardHeader>
          <Cin7CardContent>
            {isLoading ? (
              <InlineSpinner message="Loading segments..." />
            ) : (
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search segments
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                {/* Segments Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Segment Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSegments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            {searchQuery ? 'No segments match your search' : 'No segments found'}
                          </td>
                        </tr>
                      ) : (
                        filteredSegments.map((segment) => (
                          <tr
                            key={segment.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedSegment(segment.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {segment.name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-md truncate">
                                {segment.description || 'No description'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {segment.createdByUser?.username || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {segment.lastUpdatedAt
                                ? new Date(segment.lastUpdatedAt).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Info */}
                <div className="text-sm text-gray-500 text-center">
                  Showing {filteredSegments.length} of {data?.totalCount || 0} segments
                </div>
              </div>
            )}
          </Cin7CardContent>
        </Cin7Card>

        {/* Selected Segment Details */}
        {selectedSegmentData && (
          <Cin7Card>
            <Cin7CardHeader>
              <div className="flex justify-between items-start">
                <Cin7CardTitle>Segment Details: {selectedSegmentData.name}</Cin7CardTitle>
                <button
                  onClick={() => setSelectedSegment(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>
            </Cin7CardHeader>
            <Cin7CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Description</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSegmentData.description || 'No description available'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Created By</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSegmentData.createdByUser?.username || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Created At</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSegmentData.createdAt
                        ? new Date(selectedSegmentData.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Segment ID</h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {selectedSegmentData.id}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Use segments to target specific user groups with tailored guides</li>
                    <li>• Compare engagement metrics across different segments</li>
                    <li>• Identify high-value user segments for prioritization</li>
                  </ul>
                </div>
              </div>
            </Cin7CardContent>
          </Cin7Card>
        )}
      </div>
    </Layout>
  );
};
