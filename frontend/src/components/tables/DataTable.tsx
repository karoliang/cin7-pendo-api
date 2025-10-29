import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: Partial<PaginationState>) => void;
  onSort?: (sortBy: keyof T, sortOrder: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  onRefresh?: () => void;
  className?: string;
  title?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  paginationOptions?: number[];
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  onSort,
  onRowClick,
  onRefresh,
  className,
  title,
  searchPlaceholder = "Search...",
  searchable = true,
  paginationOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          const value = item[column.key];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply sorting
    if (sortField && columns.find(col => col.key === sortField)?.sortable !== false) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        // Handle number comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle date comparison
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortOrder === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // Default comparison
        return sortOrder === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtered;
  }, [data, searchQuery, sortField, sortOrder, columns, searchable]);

  // Calculate pagination for processed data
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;

    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return processedData.slice(start, end);
  }, [processedData, pagination]);

  const handleSort = (field: keyof T) => {
    if (columns.find(col => col.key === field)?.sortable === false) return;

    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  const renderSortIcon = (field: keyof T) => {
    if (sortField !== field) {
      return (
        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
      );
    }

    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search Bar */}
        {searchable && (
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {paginatedData.length} of {processedData.length} items
            {searchQuery && ` (filtered from ${data.length} total)`}
          </span>
          {pagination && (
            <select
              value={pagination.limit}
              onChange={(e) => onPaginationChange?.({ limit: parseInt(e.target.value), page: 1 })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {paginationOptions.map(option => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`
                      px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                      ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}
                      ${column.width || ''}
                    `}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable !== false && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    `}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-sm text-gray-900">
                            {String(item[column.key] || '-')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && !loading && paginatedData.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {Math.ceil(processedData.length / pagination.limit)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPaginationChange?.({ page: pagination.page - 1 })}
                disabled={!pagination.hasPrevious}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPaginationChange?.({ page: pagination.page + 1 })}
                disabled={!pagination.hasNext}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}