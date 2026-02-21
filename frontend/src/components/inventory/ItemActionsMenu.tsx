import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const SYNCABLE_CATEGORIES = ['Aircraft', 'Engines', 'Parts'];

interface ItemActionsMenuProps {
  listingId: string;
  onDelete: () => void;
  listingStatus?: string;
  listingCategory?: string;
  onUpdate?: () => void;
}

export default function ItemActionsMenu({ listingId, onDelete, listingStatus, listingCategory, onUpdate }: ItemActionsMenuProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-slate-300 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-elevated py-1 z-50 animate-slide-down">
          <Link
            to={`/inventory/${listingId}/edit`}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil size={14} />
            Edit
          </Link>
          {user?.role === 'ADMIN' &&
            listingStatus === 'APPROVED' &&
            listingCategory &&
            SYNCABLE_CATEGORIES.includes(listingCategory) && (
              <button
                onClick={async () => {
                  setOpen(false);
                  try {
                    await api.post(`/admin/sync/listings/${listingId}`);
                    toast.success('Synced to Flying411');
                    onUpdate?.();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Sync failed');
                  }
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-sky-600 hover:bg-sky-50 transition-colors"
              >
                <RefreshCw size={14} />
                Sync to Flying411
              </button>
            )}
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
