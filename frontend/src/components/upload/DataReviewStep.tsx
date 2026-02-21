import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUploadStore, type UploadSessionRow } from '../../stores/uploadStore';
import RowEditModal from './RowEditModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowStatusColor(status: string): string {
  switch (status) {
    case 'matched':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'partial':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'unmatched':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'error':
      return 'bg-red-50 text-red-700 border-red-300';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DataReviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function DataReviewStep({ onNext, onBack }: DataReviewStepProps) {
  const {
    rows,
    rowsPagination,
    fetchRows,
    updateRow,
    importRows,
    currentSession,
    isLoading,
  } = useUploadStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [editingRow, setEditingRow] = useState<UploadSessionRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRows(1, 25, statusFilter || undefined);
  }, [statusFilter]);

  // Reset selection when rows change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [rows]);

  const totalRows = currentSession?.totalRows ?? 0;
  const matchedCount = rows.filter((r) => r.status === 'matched').length;
  const unmatchedCount = rows.filter((r) => r.status === 'unmatched').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  const handlePageChange = (page: number) => {
    fetchRows(page, rowsPagination.limit, statusFilter || undefined);
  };

  const handleImport = async () => {
    await importRows();
    const session = useUploadStore.getState().currentSession;
    if (session) {
      onNext();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const totalPages = Math.ceil(rowsPagination.total / rowsPagination.limit) || 1;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-display text-navy-900 mb-1">Review Your Data</h2>
        <p className="text-sm text-slate-500">
          {totalRows} rows: {matchedCount} matched, {unmatchedCount} unmatched, {errorCount} errors
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-navy-900">{totalRows}</p>
          <p className="text-xs text-slate-400 mt-1">Total Rows</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-600">{matchedCount}</p>
          <p className="text-xs text-emerald-500 mt-1">Matched</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-amber-600">{unmatchedCount}</p>
          <p className="text-xs text-amber-500 mt-1">Unmatched</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-red-600">{errorCount}</p>
          <p className="text-xs text-red-500 mt-1">Errors</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm text-slate-500 shrink-0">Filter:</span>
          {['', 'matched', 'unmatched', 'error'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`min-h-[44px] sm:min-h-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-sky-50 text-sky-600 border-sky-200'
                  : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {s || 'All'}
            </button>
          ))}

          {selectedIds.size > 0 && (
            <span className="text-xs text-sky-600 ml-auto shrink-0">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[700px] text-sm" data-testid="review-table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedIds.size === rows.length}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                  aria-label="Select all rows"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Row</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Part Number</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Condition</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Errors</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Loading rows...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No rows found.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const mapped = row.mappedData ?? row.rawData ?? {};
                return (
                  <tr
                    key={row.id}
                    onClick={() => setEditingRow(row)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    data-testid={`row-${row.rowNumber}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-slate-300"
                        aria-label={`Select row ${row.rowNumber}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{mapped.partNumber || '--'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{mapped.description || mapped.title || '--'}</td>
                    <td className="px-4 py-3 text-slate-500">{mapped.condition || '--'}</td>
                    <td className="px-4 py-3 text-slate-500">{mapped.price || '--'}</td>
                    <td className="px-4 py-3 text-slate-500">{mapped.quantity || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border capitalize ${rowStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.errors && row.errors.length > 0 ? (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {row.errors.length}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <nav className="flex items-center justify-center sm:justify-end gap-1 mt-4" aria-label="Row pagination">
          <button
            onClick={() => handlePageChange(rowsPagination.page - 1)}
            disabled={rowsPagination.page <= 1}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-500 px-2">
            Page {rowsPagination.page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(rowsPagination.page + 1)}
            disabled={rowsPagination.page >= totalPages}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* Row edit modal */}
      {editingRow && (
        <RowEditModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={async (data) => {
            await updateRow(editingRow.id, data);
            setEditingRow(null);
          }}
        />
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="min-h-[44px] px-5 py-2.5 text-sm text-slate-600 hover:text-navy-900 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="min-h-[44px] px-5 py-2.5 text-sm text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              Import Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="btn-primary min-h-[44px] px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="import-btn"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import All Matched
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
