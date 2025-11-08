import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { useCategoryAnalysis } from '@/hooks/useCategoryAnalysis';
import type { Feature } from '@/types/pendo';

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

interface FeatureCategoryChartProps {
  features: Feature[];
}

export function FeatureCategoryChart({ features }: FeatureCategoryChartProps) {
  const categories = useCategoryAnalysis(features);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedCategoryData = selectedCategory
    ? categories.find(c => c.name === selectedCategory)
    : null;

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle>Feature Usage by Category</Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={categories}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  setSelectedCategory(data.activeLabel);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalUsage" name="Total Usage">
                {categories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{categories.length}</div>
              <div className="text-sm text-blue-700">Categories</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {categories.reduce((sum, c) => sum + c.totalUsage, 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Usage</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-900">
                {categories.reduce((sum, c) => sum + c.featureCount, 0)}
              </div>
              <div className="text-sm text-amber-700">Total Features</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {(categories.reduce((sum, c) => sum + c.totalUsage, 0) / categories.length).toFixed(0)}
              </div>
              <div className="text-sm text-purple-700">Avg Usage/Category</div>
            </div>
          </div>

          {/* Category Details Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg/Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Users
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((cat, index) => (
                  <tr
                    key={cat.name}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cat.featureCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cat.totalUsage.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cat.avgUsagePerFeature.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cat.uniqueUsers.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Category Details */}
          {selectedCategoryData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedCategoryData.name} Features
                </h4>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>
              <div className="space-y-2">
                {selectedCategoryData.features
                  .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                  .map(feature => (
                    <div key={feature.id} className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm text-gray-700">{feature.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(feature.usageCount || 0).toLocaleString()} uses
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Cin7CardContent>
    </Cin7Card>
  );
}
