import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, X, LayoutGrid, List,
  ChevronLeft, ChevronRight, Package,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import InventoryTable from '../components/inventory/InventoryTable';
import BulkActionsBar from '../components/inventory/BulkActionsBar';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/Skeleton';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
  PAGINATION_DEFAULTS,
} from '../utils/constants';
import type { ListingStatus, SortDir } from '../utils/constants';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Facets {
  status?: Record<string, number>;
  category?: Record<string, number>;
  condition?: Record<string, number>;
}

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGINATION_DEFAULTS.LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [facets, setFacets] = useState<Facets>({});

  // Filter state from URL params
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const status = searchParams.get('status') || '';
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDir = (searchParams.get('dir') || 'desc') as SortDir;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || String(PAGINATION_DEFAULTS.LIMIT), 10);

  // Debounce timer for search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  // Sync search input from URL on external changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (condition) params.set('condition', condition);
      if (status) params.set('status', status);
      params.set('sort', sortField);
      params.set('dir', sortDir);
      params.set('page', String(page));
      params.set('limit', String(perPage));

      const res = await api.get(`/dashboard/listings?${params.toString()}`);
      const data = res.data.data;
      setListings(data.listings || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, condition, status, sortField, sortDir, page, perPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam('q', value);
    }, 300);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasFilters = search || category || condition || status;

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams);
    if (sortField === field) {
      params.set('dir', sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('dir', 'asc');
    }
    params.set('page', '1');
    setSearchParams(params);
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
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Item deleted');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchListings();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected items? This cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/listings/${id}`)));
      toast.success(`${selectedIds.size} items deleted`);
      setSelectedIds(new Set());
      fetchListings();
    } catch {
      toast.error('Failed to delete some items');
      fetchListings();
    }
  };

  const formatPrice = (price: string | number) => {
    const num = Number(price);
    if (num === 0.01) return 'Call For Price';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Helper: format facet count for display
  const facetLabel = (label: string, facetMap: Record<string, number> | undefined, key: string) => {
    const count = facetMap?.[key];
    return count != null ? `${label} (${count})` : label;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-slate-500 text-sm">Manage your parts and equipment</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-400'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-400'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Link to="/inventory/new" className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} />
            Add Item
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search items by name, category, or part number..."
          className="input pl-10 w-full"
          aria-label="Search inventory"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); updateParam('q', ''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="input py-2 text-sm w-auto min-w-[140px]"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {facetLabel(c, facets.category, c)}
            </option>
          ))}
        </select>

        <select
          value={condition}
          onChange={(e) => updateParam('condition', e.target.value)}
          className="input py-2 text-sm w-auto min-w-[140px]"
          aria-label="Filter by condition"
        >
          <option value="">All Conditions</option>
          {LISTING_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {facetLabel(c, facets.condition, c)}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="input py-2 text-sm w-auto min-w-[120px]"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {Object.entries(LISTING_STATUS).map(([key, val]) => (
            <option key={key} value={val}>
              {facetLabel(LISTING_STATUS_LABELS[val as ListingStatus], facets.status, val)}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto" aria-live="polite">
          Showing {listings.length} of {pagination.total} items
        </span>
      </div>

      {/* Bulk actions */}
      <BulkActionsBar
        count={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={perPage > 10 ? 10 : perPage} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items found"
          description={hasFilters ? 'Try adjusting your filters.' : 'Add your first item to get started.'}
          actionLabel={hasFilters ? undefined : 'Add New Item'}
          actionTo={hasFilters ? undefined : '/inventory/new'}
        />
      ) : viewMode === 'table' ? (
        <InventoryTable
          listings={listings}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onDelete={handleDelete}
          formatPrice={formatPrice}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/inventory/${listing.id}/edit`}
              className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-card-hover transition-all group"
            >
              <div className="aspect-[4/3] bg-slate-100 relative">
                {listing.images?.[0] ? (
                  <img
                    src={`/uploads/${listing.images[0].filename}`}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Package size={32} strokeWidth={1} />
                  </div>
                )}
                <span className={`absolute top-2 right-2 badge badge-${listing.status?.toLowerCase()}`}>
                  {listing.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-serif text-navy-900 truncate group-hover:text-sky-600 transition-colors">
                  {listing.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-slate-700">{formatPrice(listing.price)}</span>
                  <span className={`text-xs font-medium ${listing.quantity < 5 ? 'text-red-500' : 'text-slate-400'}`}>
                    Qty: {listing.quantity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{listing.category}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && !isLoading && (
        <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => updateParam('perPage', e.target.value)}
              className="input py-1.5 text-xs w-auto"
              aria-label="Items per page"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateParam('page', String(pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`dot-${i}`} className="px-1 text-slate-300 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === pagination.page
                        ? 'bg-navy-900 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    aria-label={`Page ${p}`}
                    aria-current={p === pagination.page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => updateParam('page', String(pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
