import { Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({ count, onDelete, onClear }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="bg-navy-900 text-white rounded-xl px-5 py-3 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{count} selected</span>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
