'use client';

import { useState } from 'react';

// Client-side pagination for bounded lists (master data, report rows). The data
// sets here are modest (trucks ~50, workers a few hundred), so we page in the UI
// rather than add limit/offset to every endpoint. For a large feed (e.g. an
// all-trips view over thousands of rows) use server-side paging instead.
export interface Paged<T> {
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  pageItems: T[];
  total: number;
  from: number; // 1-based index of first row shown (0 when empty)
  to: number; // 1-based index of last row shown
}

export function usePaged<T>(items: T[], pageSize = 20): Paged<T> {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Clamp in render (no setState-in-effect) so a shrinking list never strands
  // us on an empty page; callers reset to 1 when filters change.
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    setPage,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
  };
}
