import React, { useState, useMemo } from 'react';
import {
  IndexTable,
  Card,
  TextField,
  Spinner,
  EmptyState,
  Icon,
  Badge,
} from '@shopify/polaris';
import {
  SearchIcon,
  RefreshIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from '@shopify/polaris-icons';
import { Cin7Pagination } from './Cin7Pagination';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, item: T) => React.ReactNode;
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

interface Cin7DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: Partial<PaginationState>) => void;
  onSort?: (sortBy: keyof T | string, sortOrder: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  onRefresh?: () => void;
  className?: string;
  title?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  paginationOptions?: number[];
}

export function Cin7DataTable<T extends Record<string, unknown>>({
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
}: Cin7DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          const value = item[column.key as string];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply sorting
    if (sortField && columns.find(col => col.key === sortField)?.sortable !== false) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField as string];
        const bValue = b[sortField as string];

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

  const handleSort = (field: keyof T | string) => {
    if (columns.find(col => col.key === field)?.sortable === false) return;

    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field as keyof T);
    setSortOrder(newOrder);
    onSort?.(field as keyof T, newOrder);
  };

  const resourceName = {
    singular: 'item',
    plural: 'items',
  };

  const headings = columns.map((column) => ({
    title: String(column.header),
    id: String(column.key),
  })) as [{ title: string; id: string }, ...{ title: string; id: string }[]]

  const rowMarkup = paginatedData.map((item, index) => (
    <IndexTable.Row
      id={String(index)}
      key={index}
      position={index}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => {
        const value = item[column.key as string];
        return (
          <IndexTable.Cell key={String(column.key)}>
            {column.render ? (
              column.render(value, item)
            ) : (
              <span>{String(value || '-')}</span>
            )}
          </IndexTable.Cell>
        );
      })}
    </IndexTable.Row>
  ));

  // Calculate total pages
  const totalPages = pagination
    ? Math.ceil(processedData.length / pagination.limit)
    : 1;

  return (
    <div className={className}>
      <Card>
        {/* Header with title and refresh button */}
        {(title || onRefresh) && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e1e3e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid #c9cccf',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <Icon source={RefreshIcon} tone="base" />
                Refresh
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        {searchable && (
          <div style={{ padding: '1rem 1.25rem' }}>
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={searchPlaceholder}
              prefix={<Icon source={SearchIcon} tone="base" />}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setSearchQuery('')}
            />
          </div>
        )}

        {/* Results Summary */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#637381',
            borderTop: '1px solid #e1e3e5',
          }}
        >
          <span>
            Showing {paginatedData.length} of {processedData.length} items
            {searchQuery && ` (filtered from ${data.length} total)`}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem',
            }}
          >
            <Spinner size="large" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div style={{ padding: '2rem' }}>
            <EmptyState
              heading={searchQuery ? 'No results found' : 'No data available'}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              {searchQuery ? (
                <p>Try adjusting your search to find what you're looking for.</p>
              ) : (
                <p>There is no data to display at the moment.</p>
              )}
            </EmptyState>
          </div>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={paginatedData.length}
            headings={headings}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
        )}

        {/* Pagination */}
        {pagination && !loading && paginatedData.length > 0 && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e1e3e5' }}>
            <Cin7Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={(page) => onPaginationChange?.({ page })}
              pageSize={pagination.limit}
              onPageSizeChange={(limit) => onPaginationChange?.({ limit, page: 1 })}
              pageSizeOptions={paginationOptions}
              totalItems={processedData.length}
              loading={loading}
            />
          </div>
        )}
      </Card>

      {/* Cin7 Branding Styles */}
      <style>{`
        /* Cin7 color overrides for Polaris */
        .Polaris-IndexTable__Table th {
          background-color: #f9fafb !important;
        }

        .Polaris-IndexTable-Row:hover {
          background-color: #f6f6f7 !important;
          cursor: ${onRowClick ? 'pointer' : 'default'} !important;
        }

        .Polaris-Badge {
          font-size: 0.75rem;
        }

        /* Ensure proper text colors */
        .Polaris-IndexTable__Cell {
          color: #202223;
        }
      `}</style>
    </div>
  );
}
