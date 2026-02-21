import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface SyncConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  count: number;
  categoryBreakdown?: Record<string, number>;
  action: 'sync' | 'syncAll';
}

export default function SyncConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  count,
  categoryBreakdown,
  action,
}: SyncConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="sync-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elevated max-w-md w-full mx-4 p-6 animate-slide-down">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-amber-500" size={20} />
          </div>
          <div>
            <h3 id="sync-modal-title" className="text-lg font-serif text-navy-900">
              {action === 'syncAll' ? 'Sync All Unsynced Items' : 'Sync Selected Items'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {count} item{count !== 1 ? 's' : ''} will be published to Flying411.com
            </p>
          </div>
        </div>

        {categoryBreakdown && Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Category Breakdown</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryBreakdown).map(([category, num]) => (
                <span key={category} className="text-sm text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-100">
                  {category} ({num})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-amber-700">
            This will publish these items on flying411.com. They will be visible to the public marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn btn-primary flex-1 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Syncing...
              </>
            ) : (
              `Sync ${count} Item${count !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
