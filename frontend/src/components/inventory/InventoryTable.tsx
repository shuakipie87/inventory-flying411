import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import ItemActionsMenu from './ItemActionsMenu';
import { useAuthStore } from '../../stores/authStore';

interface InventoryTableProps {
  listings: any[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  onDelete: (id: string) => void;
  formatPrice: (price: string | number) => string;
}

const columns = [
  { key: 'title', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'quantity', label: 'Qty', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
];

export default function InventoryTable({
  listings,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  sortField,
  sortDir,
  onSort,
  onDelete,
  formatPrice,
}: InventoryTableProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const allSelected = listings.length > 0 && selectedIds.size === listings.length;

  const getAriaSortValue = (field: string): 'ascending' | 'descending' | 'none' => {
    if (sortField !== field) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="inline ml-0.5" />
    ) : (
      <ChevronDown size={12} className="inline ml-0.5" />
    );
  };

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, listingId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggleSelect(listingId);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = e.currentTarget.nextElementSibling as HTMLElement | null;
        next?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
        prev?.focus();
      }
    },
    [onToggleSelect]
  );

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full" role="grid" aria-label="Inventory items">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100" role="row">
              <th className="w-12 px-4 py-3.5" role="columnheader">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-slate-300"
                  aria-label={allSelected ? 'Deselect all items' : 'Select all items'}
                />
              </th>
              <th className="w-16 px-2 py-3.5" role="columnheader" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  role="columnheader"
                  aria-sort={col.sortable ? getAriaSortValue(col.key) : undefined}
                  className={`px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-slate-600 select-none' : ''
                  }`}
                  onClick={() => col.sortable && onSort(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSort(col.key);
                    }
                  }}
                  tabIndex={col.sortable ? 0 : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon field={col.key} />}
                </th>
              ))}
              <th className="w-12 px-4 py-3.5" role="columnheader" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {listings.map((listing) => (
              <tr
                key={listing.id}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => handleRowKeyDown(e, listing.id)}
                className={`hover:bg-slate-50/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset ${
                  selectedIds.has(listing.id) ? 'bg-sky-50/30' : ''
                }`}
              >
                <td className="px-4 py-3" role="gridcell">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(listing.id)}
                    onChange={() => onToggleSelect(listing.id)}
                    className="rounded border-slate-300"
                    aria-label={`Select ${listing.title}`}
                  />
                </td>
                <td className="px-2 py-3" role="gridcell">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {listing.images?.[0] ? (
                      <img
                        src={`/uploads/${listing.images[0].filename}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={14} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3" role="gridcell">
                  <Link
                    to={`/inventory/${listing.id}/edit`}
                    className="text-sm font-medium text-navy-900 hover:text-sky-600 transition-colors"
                  >
                    {listing.title}
                  </Link>
                  {listing.partNumber && (
                    <p className="text-xs text-slate-400 mt-0.5">#{listing.partNumber}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600" role="gridcell">{listing.category}</td>
                <td className="px-4 py-3" role="gridcell">
                  <span
                    className={`text-sm font-medium ${
                      listing.quantity < 5 ? 'text-red-500' : 'text-slate-700'
                    }`}
                  >
                    {listing.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700" role="gridcell">
                  {formatPrice(listing.price)}
                </td>
                <td className="px-4 py-3" role="gridcell">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`badge badge-${listing.status?.toLowerCase()}`}>
                      {listing.status}
                    </span>
                    {isAdmin && listing.flying411ListingId && (
                      <span title="Synced to Flying411" className="text-sky-500">
                        <ExternalLink size={13} />
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap" role="gridcell">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3" role="gridcell">
                  <ItemActionsMenu
                    listingId={listing.id}
                    onDelete={() => onDelete(listing.id)}
                    listingStatus={listing.status}
                    listingCategory={listing.category}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
