import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AlertsPanelProps {
  lowStockItems: any[];
  pendingCount: number;
}

export default function AlertsPanel({ lowStockItems, pendingCount }: AlertsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const hasAlerts = lowStockItems.length > 0 || pendingCount > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="text-sm font-medium text-emerald-700">All clear! No alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <ChevronRight
          size={14}
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        Alerts ({lowStockItems.length + (pendingCount > 0 ? 1 : 0)})
      </button>

      {expanded && (
        <div className="space-y-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5">
              <Clock className="text-amber-500 shrink-0" size={16} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending review
                </p>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors shrink-0"
              >
                View
              </Link>
            </div>
          )}

          {lowStockItems.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5">
              <AlertTriangle className="text-red-500 shrink-0" size={16} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 truncate">{item.title}</p>
                <p className="text-xs text-red-600">
                  Qty: {item.quantity} remaining
                </p>
              </div>
              <Link
                to={`/inventory/${item.id}/edit`}
                className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors shrink-0"
              >
                View
              </Link>
            </div>
          ))}

          {lowStockItems.length > 5 && (
            <p className="text-xs text-slate-400 px-1">
              +{lowStockItems.length - 5} more low stock items
            </p>
          )}
        </div>
      )}
    </div>
  );
}
