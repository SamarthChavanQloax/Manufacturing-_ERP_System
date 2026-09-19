import React, { useState } from 'react';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalEntries,
  pageSize,
  onPageChange,
}) => {
  const [jumpInput, setJumpInput] = useState('');

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    // Page 1 always
    pages.push(1);

    if (currentPage > 4) {
      pages.push('...prev');
    }

    // Determine range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Near start
    if (currentPage <= 4) {
      start = 2;
      end = Math.min(5, totalPages - 1);
    }

    // Near end
    if (currentPage >= totalPages - 3) {
      start = Math.max(2, totalPages - 4);
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push('...next');
    }

    // Last page always
    pages.push(totalPages);

    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpInput('');
    }
  };

  const pageNumbers = getPageNumbers();

  const buttonBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '32px',
    fontSize: '13px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '13.5px',
      }}
    >
      <div style={{ color: '#4b5563' }}>
        Showing <strong style={{ color: '#111827' }}>{startEntry}</strong> to{' '}
        <strong style={{ color: '#111827' }}>{endEntry}</strong> of{' '}
        <strong style={{ color: '#111827' }}>{totalEntries}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {/* First Page Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First Page (1)"
          style={{
            ...buttonBaseStyle,
            padding: '0 8px',
            background: currentPage <= 1 ? '#f3f4f6' : '#ffffff',
            color: currentPage <= 1 ? '#9ca3af' : '#374151',
            border: '1px solid #d1d5db',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            ...buttonBaseStyle,
            padding: '0 10px',
            gap: '3px',
            background: currentPage <= 1 ? '#f3f4f6' : '#ffffff',
            color: currentPage <= 1 ? '#9ca3af' : '#374151',
            border: '1px solid #d1d5db',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        {/* Dynamic Page Buttons with Shifts */}
        {pageNumbers.map((p) => {
          if (typeof p === 'string') {
            const isPrevEllipsis = p === '...prev';
            return (
              <button
                key={p}
                type="button"
                title={isPrevEllipsis ? 'Jump 5 pages backward' : 'Jump 5 pages forward'}
                onClick={() =>
                  onPageChange(
                    isPrevEllipsis
                      ? Math.max(1, currentPage - 5)
                      : Math.min(totalPages, currentPage + 5)
                  )
                }
                style={{
                  ...buttonBaseStyle,
                  minWidth: '32px',
                  padding: '0 6px',
                  background: '#f9fafb',
                  color: '#6b7280',
                  border: '1px dashed #d1d5db',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                …
              </button>
            );
          }

          const pageNum = p;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              style={{
                ...buttonBaseStyle,
                minWidth: '34px',
                padding: '0 8px',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? '#007bff' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                border: `1px solid ${isActive ? '#007bff' : '#d1d5db'}`,
                boxShadow: isActive ? '0 1px 3px rgba(0, 123, 255, 0.3)' : 'none',
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            ...buttonBaseStyle,
            padding: '0 10px',
            gap: '3px',
            background: currentPage >= totalPages ? '#f3f4f6' : '#ffffff',
            color: currentPage >= totalPages ? '#9ca3af' : '#374151',
            border: '1px solid #d1d5db',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title={`Last Page (${totalPages})`}
          style={{
            ...buttonBaseStyle,
            padding: '0 8px',
            background: currentPage >= totalPages ? '#f3f4f6' : '#ffffff',
            color: currentPage >= totalPages ? '#9ca3af' : '#374151',
            border: '1px solid #d1d5db',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronsRight size={15} />
        </button>

        {/* Jump To Page Box */}
        {totalPages > 5 && (
          <form
            onSubmit={handleJump}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: '8px' }}
          >
            <span style={{ color: '#6b7280', fontSize: '13px' }}>Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="Page #"
              style={{
                width: '64px',
                height: '32px',
                padding: '2px 6px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                ...buttonBaseStyle,
                padding: '0 10px',
                height: '32px',
                background: '#007bff',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
              }}
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
