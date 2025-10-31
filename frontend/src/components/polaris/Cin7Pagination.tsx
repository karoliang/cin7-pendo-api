import React from 'react';
import { Pagination } from '@shopify/polaris';

interface Cin7PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  totalItems: number;
  loading?: boolean;
}

export const Cin7Pagination: React.FC<Cin7PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  loading = false,
}) => {
  // Calculate showing range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    // Always show first page
    pages.push(1);

    if (currentPage <= 4) {
      // Near the beginning: 1 2 3 4 5 ... last
      for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > 6) {
        pages.push('ellipsis');
      }
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - 3) {
      // Near the end: 1 ... n-4 n-3 n-2 n-1 n
      pages.push('ellipsis');
      for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: 1 ... current-1 current current+1 ... last
      pages.push('ellipsis');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="cin7-pagination">
      <style>{`
        .cin7-pagination {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          padding: 1rem 0;
        }

        .cin7-pagination-info {
          font-size: 0.875rem;
          color: #637381;
          text-align: center;
        }

        .cin7-pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cin7-pagination-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0.5rem;
          border: 1px solid #c9cccf;
          border-radius: 0.5rem;
          background: white;
          color: #202223;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cin7-pagination-button:hover:not(:disabled) {
          background: #f6f6f7;
          border-color: #8c9196;
        }

        .cin7-pagination-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cin7-pagination-button.active {
          background: #005bd3;
          border-color: #005bd3;
          color: white;
        }

        .cin7-pagination-button.active:hover {
          background: #004a9c;
          border-color: #004a9c;
        }

        .cin7-pagination-ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          height: 2.5rem;
          color: #637381;
          font-size: 0.875rem;
        }

        .cin7-pagination-pagesize {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: 1rem;
          padding-left: 1rem;
          border-left: 1px solid #e1e3e5;
        }

        .cin7-pagination-pagesize label {
          font-size: 0.875rem;
          color: #637381;
          white-space: nowrap;
        }

        .cin7-pagination-pagesize select {
          padding: 0.5rem;
          border: 1px solid #c9cccf;
          border-radius: 0.5rem;
          background: white;
          color: #202223;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .cin7-pagination-pagesize select:hover {
          border-color: #8c9196;
        }

        .cin7-pagination-pagesize select:focus {
          outline: none;
          border-color: #005bd3;
          box-shadow: 0 0 0 1px #005bd3;
        }

        @media (max-width: 640px) {
          .cin7-pagination-controls {
            flex-direction: column;
            width: 100%;
          }

          .cin7-pagination-pagesize {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            border-top: 1px solid #e1e3e5;
            padding-top: 0.5rem;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* Showing X-Y of Z items */}
      <div className="cin7-pagination-info">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>

      {/* Pagination controls */}
      <div className="cin7-pagination-controls">
        {/* Previous button */}
        <button
          className="cin7-pagination-button"
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          aria-label="Previous page"
        >
          Previous
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="cin7-pagination-ellipsis">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`cin7-pagination-button ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              disabled={loading}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          className="cin7-pagination-button"
          onClick={handleNext}
          disabled={currentPage === totalPages || loading || totalPages === 0}
          aria-label="Next page"
        >
          Next
        </button>

        {/* Page size selector */}
        <div className="cin7-pagination-pagesize">
          <label htmlFor="pageSize">Items per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Polaris Pagination (fallback/alternative) */}
      <div style={{ display: 'none' }}>
        <Pagination
          hasPrevious={currentPage > 1}
          onPrevious={handlePrevious}
          hasNext={currentPage < totalPages}
          onNext={handleNext}
        />
      </div>
    </div>
  );
};
