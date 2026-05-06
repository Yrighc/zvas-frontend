import type { ReactNode } from 'react'

import { Pagination } from '@heroui/react'

export const DEFAULT_TABLE_PAGE_SIZE = 10
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

interface TablePaginationFooterProps {
  summary: ReactNode
  page: number
  total: number
  totalPages?: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
}

export function TablePaginationFooter({
  summary,
  page,
  total,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}: TablePaginationFooterProps) {
  const resolvedTotalPages = totalPages ?? Math.max(1, Math.ceil(total / pageSize))

  return (
    <div
      className={`flex flex-col gap-4 border-t border-white/5 bg-white/[0.01] px-6 py-4 md:flex-row md:items-center md:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">{summary}</div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        <label
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-apple-text-tertiary"
          htmlFor="table-page-size"
        >
          <span>每页条数</span>
          <select
            id="table-page-size"
            aria-label="每页条数"
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white outline-none transition-colors hover:bg-white/10 focus:border-apple-blue/50 focus:bg-white/10"
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {TABLE_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-apple-bg text-white">
                {option}
              </option>
            ))}
          </select>
        </label>

        {resolvedTotalPages > 1 ? (
          <Pagination
            disableAnimation
            showControls
            total={resolvedTotalPages}
            page={page}
            onChange={onPageChange}
            classNames={{
              wrapper: 'gap-2',
              item: 'h-10 min-w-[40px] rounded-xl border border-white/5 bg-white/5 font-bold text-apple-text-secondary transition-all hover:bg-white/10',
              cursor: 'rounded-xl bg-apple-blue font-black text-white shadow-lg shadow-apple-blue/30',
              prev: 'rounded-xl bg-white/5 text-white/50 hover:bg-white/10',
              next: 'rounded-xl bg-white/5 text-white/50 hover:bg-white/10',
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
