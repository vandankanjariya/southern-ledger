import { useEffect, useMemo, useState } from 'react';
import { cx } from '../../utils/format';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  className?: string;
  emptyMessage?: string;
  clientPagination?: boolean;
  initialRowsPerPage?: number;
}

const defaultRowsPerPageOptions = [10, 20, 50, 100];

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  className,
  emptyMessage = 'No rows match the current filters.',
  clientPagination = false,
  initialRowsPerPage = 20,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const displayRows = useMemo(() => {
    if (!clientPagination) {
      return rows;
    }

    return rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [clientPagination, page, rows, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [rows.length, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cx(
                    'whitespace-nowrap px-4 py-3 font-semibold text-slate-600',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {displayRows.length > 0 ? (
              displayRows.map((row) => (
                <tr key={getRowKey(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cx('whitespace-nowrap px-4 py-3 text-slate-700', column.align === 'right' ? 'text-right' : 'text-left')}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {clientPagination && rows.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, rows.length)} of {rows.length}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm"
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
              aria-label="Rows per page"
            >
              {defaultRowsPerPageOptions.map((option) => (
                <option key={option} value={option}>{option} / page</option>
              ))}
            </select>
            <button className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:text-slate-400" type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span className="px-1">Page {page} of {totalPages}</span>
            <button className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:text-slate-400" type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
