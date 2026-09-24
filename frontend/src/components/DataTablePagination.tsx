import React from 'react';

interface DataTablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  const getPageItems = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const pageItems = getPageItems();

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {startEntry} to {endEntry} of {totalItems.toLocaleString()} entries
      </div>

      <div className="pagination-bar">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`}
        >
          Previous
        </button>

        {pageItems.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-btn disabled">
                {item}
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              className={`pagination-btn ${item === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
