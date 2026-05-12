import { useState, useMemo } from "react";

export function usePagination(data = [], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const reset = () => setPage(1);

  return {
    page,
    totalPages,
    paginated,
    goToPage,
    nextPage,
    prevPage,
    reset,
    pageSize,
  };
}
