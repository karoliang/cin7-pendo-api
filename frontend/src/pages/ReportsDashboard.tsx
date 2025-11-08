import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Layout } from '@/components/layout/Layout';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { InlineSpinner } from '@/components/ui/Spinner';
import { useReports } from '@/hooks/useReports';
import { usePageTitle } from '@/hooks/usePageTitle';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const ReportsDashboard: React.FC = () => {
  usePageTitle({
    title: 'Reports Analytics',
    description: 'Analyze pre-built reports and usage patterns'
  });

  const { data, isLoading, error } = useReports();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const typeOptions = useMemo(() => {
    if (!data?.byType) return [{ label: 'All Types', value: 'all' }];

    return [
      { label: 'All Types', value: 'all' },
      ...Object.keys(data.byType)
        .sort()
        .map(type => ({ label: `${type} (${data.byType[type]})`, value: type }))
    ];
  }, [data?.byType]);

  const filteredReports = useMemo(() => {
    if (!data?.reports) return [];

    return data.reports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           report.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || report.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [data?.reports, searchQuery, filterType]);

  const pieChartData = useMemo(() => {
    if (!data?.byType) return [];

    return Object.entries(data.byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data?.byType]);

  const selectedReportData = selectedReport
    ? data?.reports.find(r => r.id === selectedReport)
    : null;

  const staleReports = useMemo(() => {
    if (!data?.reports) return 0;

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return data.reports.filter(r => {
      if (!r.lastSuccessRunAt) return true;
      const lastRunTime = new Date(r.lastSuccessRunAt).getTime();
      return lastRunTime < thirtyDaysAgo;
    }).length;
  }, [data?.reports]);

  if (error) {
    return (
      <Layout>
        <Cin7Card>
          <Cin7CardContent>
            <p className="text-red-600">Error loading reports: {(error as Error).message}</p>
          </Cin7CardContent>
        </Cin7Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">
                  {isLoading ? '...' : data?.totalCount || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Total Reports</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>

          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-900">
                  {isLoading ? '...' : Object.keys(data?.byType || {}).length}
                </div>
                <div className="text-sm text-gray-600 mt-2">Report Types</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>

          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-900">
                  {isLoading ? '...' : staleReports}
                </div>
                <div className="text-sm text-gray-600 mt-2">Stale Reports (30+ days)</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>

          <Cin7Card>
            <Cin7CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-900">
                  {isLoading ? '...' : filteredReports.length}
                </div>
                <div className="text-sm text-gray-600 mt-2">Filtered Results</div>
              </div>
            </Cin7CardContent>
          </Cin7Card>
        </div>

        {/* Report Types Distribution */}
        <Cin7Card>
          <Cin7CardHeader>
            <Cin7CardTitle>Report Types Distribution</Cin7CardTitle>
          </Cin7CardHeader>
          <Cin7CardContent>
            {isLoading ? (
              <InlineSpinner message="Loading chart..." />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Cin7CardContent>
        </Cin7Card>

        {/* Reports List */}
        <Cin7Card>
          <Cin7CardHeader>
            <Cin7CardTitle>Reports Library</Cin7CardTitle>
          </Cin7CardHeader>
          <Cin7CardContent>
            {isLoading ? (
              <InlineSpinner message="Loading reports..." />
            ) : (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search reports
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reports Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Run
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            {searchQuery || filterType !== 'all' ? 'No reports match your filters' : 'No reports found'}
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report) => {
                          const isStale = !report.lastSuccessRunAt ||
                            (Date.now() - new Date(report.lastSuccessRunAt).getTime()) > (30 * 24 * 60 * 60 * 1000);

                          return (
                            <tr
                              key={report.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedReport(report.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {report.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {report.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {report.lastSuccessRunAt
                                  ? new Date(report.lastSuccessRunAt).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  isStale ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {isStale ? 'Stale' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Info */}
                <div className="text-sm text-gray-500 text-center">
                  Showing {filteredReports.length} of {data?.totalCount || 0} reports
                </div>
              </div>
            )}
          </Cin7CardContent>
        </Cin7Card>

        {/* Selected Report Details */}
        {selectedReportData && (
          <Cin7Card>
            <Cin7CardHeader>
              <div className="flex justify-between items-start">
                <Cin7CardTitle>Report Details: {selectedReportData.name}</Cin7CardTitle>
                <button
                  onClick={() => setSelectedReport(null)}
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
                    {selectedReportData.description || 'No description available'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Type</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedReportData.type}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Created By</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedReportData.createdByUser?.username || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Last Run</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedReportData.lastSuccessRunAt
                        ? new Date(selectedReportData.lastSuccessRunAt).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Report ID</h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {selectedReportData.id}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Reports provide pre-built analytics insights without custom queries</li>
                    <li>• Stale reports (30+ days) may need review or archival</li>
                    <li>• Different report types serve specific analytical needs</li>
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
