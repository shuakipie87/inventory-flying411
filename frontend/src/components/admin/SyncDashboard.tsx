import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, Clock, Globe, Search, X, Package, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import SyncConfirmModal from './SyncConfirmModal';

interface SyncStats {
  totalSyncable: number;
  synced: number;
  unsynced: number;
  failed?: number;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  price: string;
  status: string;
  flying411ListingId: string | null;
  syncedAt: string | null;
  syncStatus: string;
  syncError: string | null;
  syncAttempts: number;
  lastSyncAttemptAt: string | null;
  images: { filename: string }[];
  user: { username: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SyncDashboard() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'unsynced'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'sync' | 'syncAll'>('sync');
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        api.get('/admin/sync/stats'),
        api.get('/admin/sync/health'),
      ]);
      setStats(statsRes.data.data);
      setApiHealthy(healthRes.data.data.healthy);
    } catch {
      // Stats fetch failure is non-critical
    }
  }, []);

  const fetchListings = useCallback(async (page = 1) => {
    try {
      const res = await api.get('/admin/sync/listings', {
        params: { syncStatus: syncFilter, search: searchQuery, page, limit: 20 },
      });
      setListings(res.data.data.listings);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load listings');
    }
  }, [syncFilter, searchQuery]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchListings()]);
      setIsLoading(false);
    };
    load();
  }, [fetchStats, fetchListings]);

  const handleSync = async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      await api.post(`/admin/sync/listings/${id}`);
      toast.success('Synced to Flying411');
      await Promise.all([fetchStats(), fetchListings(pagination.page)]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUnsync = async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      await api.delete(`/admin/sync/listings/${id}`);
      toast.success('Removed from Flying411');
      await Promise.all([fetchStats(), fetchListings(pagination.page)]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unsync failed');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkSync = () => {
    if (selectedIds.size === 0) return;
    setConfirmAction('sync');
    setShowConfirmModal(true);
  };

  const handleSyncAll = () => {
    setConfirmAction('syncAll');
    setShowConfirmModal(true);
  };

  const getCategoryBreakdown = (): Record<string, number> => {
    const items = confirmAction === 'syncAll'
      ? listings.filter((l) => !l.flying411ListingId)
      : listings.filter((l) => selectedIds.has(l.id));
    const breakdown: Record<string, number> = {};
    items.forEach((l) => { breakdown[l.category] = (breakdown[l.category] || 0) + 1; });
    return breakdown;
  };

  const getConfirmCount = () => {
    return confirmAction === 'syncAll' ? (stats?.unsynced || 0) : selectedIds.size;
  };

  const executeConfirmedSync = async () => {
    setIsBulkSyncing(true);
    try {
      if (confirmAction === 'syncAll') {
        const res = await api.post('/admin/sync/all');
        const { succeeded, failed } = res.data.data.summary;
        toast.success(`Synced ${succeeded} items${failed > 0 ? `, ${failed} failed` : ''}`);
      } else {
        const res = await api.post('/admin/sync/bulk', { listingIds: Array.from(selectedIds) });
        const { succeeded, failed } = res.data.data.summary;
        toast.success(`Synced ${succeeded} items${failed > 0 ? `, ${failed} failed` : ''}`);
      }
      setSelectedIds(new Set());
      setShowConfirmModal(false);
      await Promise.all([fetchStats(), fetchListings(pagination.page)]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk sync failed');
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  const formatPrice = (price: string | number) => {
    const num = parseFloat(String(price));
    if (num <= 0.01) return 'Call For Price';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const timeAgo = (date: string | null) => {
    if (!date) return '--';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="relative w-8 h-8 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Loading sync data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Syncable Items', value: stats?.totalSyncable || 0, icon: RefreshCw, color: 'bg-navy-900' },
          { label: 'Synced', value: stats?.synced || 0, icon: CheckCircle, color: 'bg-emerald-500' },
          { label: 'Not Synced', value: stats?.unsynced || 0, icon: Clock, color: 'bg-amber-500' },
          { label: 'Failed', value: stats?.failed || 0, icon: XCircle, color: 'bg-red-500' },
          {
            label: 'API Status',
            value: apiHealthy === null ? '...' : apiHealthy ? 'Connected' : 'Offline',
            icon: Globe,
            color: apiHealthy ? 'bg-sky-500' : 'bg-red-500',
          },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="text-white" size={18} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-3xl font-serif text-navy-900 mb-1">{item.value}</p>
            <p className="text-xs font-medium text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <select
          value={syncFilter}
          onChange={(e) => { setSyncFilter(e.target.value as any); setSelectedIds(new Set()); }}
          className="input w-auto text-sm"
        >
          <option value="all">All Items</option>
          <option value="synced">Synced</option>
          <option value="unsynced">Not Synced</option>
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="input pl-9 text-sm w-full"
          />
        </div>

        <div className="flex-1" />

        {(stats?.unsynced || 0) > 0 && (
          <button onClick={handleSyncAll} className="btn btn-primary gap-2 text-sm">
            <RefreshCw size={14} />
            Sync All Unsynced ({stats?.unsynced})
          </button>
        )}
      </div>

      {/* Listings Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={listings.length > 0 && selectedIds.size === listings.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="w-14 px-2 py-3.5" />
                <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Sync Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Synced</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Package className="mx-auto text-slate-200 mb-3" size={28} strokeWidth={1} />
                    <p className="text-sm text-slate-400">No syncable listings found.</p>
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const isSynced = !!listing.flying411ListingId;
                  const isSyncing = syncingIds.has(listing.id);

                  return (
                    <tr
                      key={listing.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        selectedIds.has(listing.id) ? 'bg-sky-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(listing.id)}
                          onChange={() => toggleSelect(listing.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-2 py-3">
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
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-navy-900">{listing.title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{listing.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{formatPrice(listing.price)}</td>
                      <td className="px-4 py-3">
                        {isSyncing ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                            <Loader2 size={12} className="animate-spin" />
                            Syncing...
                          </span>
                        ) : listing.syncStatus === 'SYNCED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                            <CheckCircle size={12} />
                            Synced
                          </span>
                        ) : listing.syncStatus === 'SYNC_FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-md cursor-help" title={listing.syncError || 'Unknown error'}>
                            <XCircle size={12} />
                            Failed{listing.syncAttempts > 1 ? ` (${listing.syncAttempts}x)` : ''}
                          </span>
                        ) : listing.syncStatus === 'SYNCING' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                            <Loader2 size={12} className="animate-spin" />
                            Syncing
                          </span>
                        ) : listing.syncStatus === 'PENDING_SYNC' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            Not Synced
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {timeAgo(listing.syncedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSync(listing.id)}
                            disabled={isSyncing}
                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50"
                            title={isSynced ? 'Re-sync' : 'Sync'}
                          >
                            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                          </button>
                          {isSynced && (
                            <button
                              onClick={() => handleUnsync(listing.id)}
                              disabled={isSyncing}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Remove from Flying411"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchListings(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy-900 text-white px-6 py-3 rounded-xl shadow-elevated flex items-center gap-4 z-40 animate-slide-up">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-300 hover:text-white transition-colors"
          >
            Clear
          </button>
          <div className="w-px h-5 bg-slate-600" />
          <button
            onClick={handleBulkSync}
            className="btn bg-sky-500 hover:bg-sky-600 text-white text-sm py-1.5 px-4 gap-2"
          >
            <RefreshCw size={14} />
            Sync Selected
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      <SyncConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeConfirmedSync}
        isLoading={isBulkSyncing}
        count={getConfirmCount()}
        categoryBreakdown={getCategoryBreakdown()}
        action={confirmAction}
      />
    </div>
  );
}
