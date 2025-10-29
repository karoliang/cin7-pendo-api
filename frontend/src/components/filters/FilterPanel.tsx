import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FilterState } from '@/types/pendo';
import { X, Calendar, Search, Filter } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Mock data for filter options
  const guideTypes = ['onboarding', 'tutorial', 'announcement', 'training'];
  const featureCategories = ['Core - Ecommerce', '3PL', 'Reporting / Insights', 'Core - Trial Workflow'];
  const pageTypes = ['Dashboard', 'Reports', 'Settings', 'Integration'];
  const statusOptions = ['published', 'draft', 'archived', '_pendingReview_'];
  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'viewedCount', label: 'View Count' },
    { value: 'completedCount', label: 'Completion Count' }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="text-sm font-normal text-gray-500">
                ({Object.keys(filters).length} active)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Active Filters */}
      {hasActiveFilters && (
        <CardContent className="pb-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                <Search className="h-3 w-3" />
                Search: "{filters.searchQuery}"
                <button
                  onClick={() => removeFilter('searchQuery')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.status && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                Status: {filters.status.join(', ')}
                <button
                  onClick={() => removeFilter('status')}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.guideTypes && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm">
                Guide Types: {filters.guideTypes.join(', ')}
                <button
                  onClick={() => removeFilter('guideTypes')}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.dateRange && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm">
                <Calendar className="h-3 w-3" />
                Date Range
                <button
                  onClick={() => removeFilter('dateRange')}
                  className="ml-1 hover:text-orange-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.sortBy && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                Sort: {filters.sortBy} ({filters.sortOrder})
                <button
                  onClick={() => removeFilter('sortBy')}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Filter Options */}
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Search className="h-4 w-4" />
                Search
              </label>
              <Input
                placeholder="Search by name or description..."
                value={filters.searchQuery || ''}
                onChange={(e) => updateFilter('searchQuery', e.target.value || undefined)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) => updateFilter('status', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guide Types Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Guide Types</label>
              <Select
                value={filters.guideTypes?.[0] || ''}
                onValueChange={(value) => updateFilter('guideTypes', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select guide type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {guideTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Feature Categories Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Feature Categories</label>
              <Select
                value={filters.featureCategories?.[0] || ''}
                onValueChange={(value) => updateFilter('featureCategories', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {featureCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Types Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Page Types</label>
              <Select
                value={filters.pageTypes?.[0] || ''}
                onValueChange={(value) => updateFilter('pageTypes', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Page Types</SelectItem>
                  {pageTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy || ''}
                  onValueChange={(value) => updateFilter('sortBy', value || undefined)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortOrder || ''}
                  onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value || undefined)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Start date"
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value) : undefined;
                    const currentRange = filters.dateRange || { start: undefined, end: undefined };
                    updateFilter('dateRange', { ...currentRange, start });
                  }}
                />
                <Input
                  type="date"
                  placeholder="End date"
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value) : undefined;
                    const currentRange = filters.dateRange || { start: undefined, end: undefined };
                    updateFilter('dateRange', { ...currentRange, end });
                  }}
                />
              </div>
            </div>

          </div>
        </CardContent>
      )}
    </Card>
  );
};