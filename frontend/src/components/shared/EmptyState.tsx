import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <Icon className="text-slate-200 mx-auto mb-4" size={36} strokeWidth={1} />
      <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
      {description && <p className="text-slate-400 text-xs mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary px-6 py-2.5 text-xs">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="btn-primary px-6 py-2.5 text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
