"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const aroundCurrent = pageNumbers.filter((page) => Math.abs(page - currentPage) <= 1);

  const shownPages = Array.from(new Set([1, ...aroundCurrent, totalPages])).sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <ul className="pagination-list">
        {shownPages.map((page, index) => {
          const previous = shownPages[index - 1];
          const shouldShowGap = previous && page - previous > 1;

          return (
            <li key={page}>
              {shouldShowGap ? <span className="pagination-gap">...</span> : null}
              <button
                type="button"
                className={`pagination-page ${page === currentPage ? "active" : ""}`}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
}
