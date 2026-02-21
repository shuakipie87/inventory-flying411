import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Clock, CheckCircle, XCircle, Plus, ArrowRight, Eye,
  ChevronRight, DollarSign, AlertTriangle, Tag,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import StatusDistribution from '../components/dashboard/StatusDistribution';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import EmptyState from '../components/shared/EmptyState';
import { CardSkeleton } from '../components/shared/Skeleton';

const formatPrice = (price: string | number) => {
  const num = Number(price);
  if (num === 0.01) return 'Call For Price';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes, allRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/listings?limit=10'),
        api.get('/dashboard/listings?limit=1000'),
      ]);
      setStats(statsRes.data.data.stats);
      setListings(recentRes.data.data.listings || []);
      setAllListings(allRes.data.data.listings || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Computed stats from all listings
  const computed = useMemo(() => {
    const inStock = allListings.filter((l) => l.quantity > 0).length;
    const lowStock = allListings.filter((l) => l.quantity > 0 && l.quantity < 5);
    const totalValue = allListings.reduce((sum, l) => {
      const price = Number(l.price);
      if (price === 0.01) return sum;
      return sum + price * (l.quantity || 0);
    }, 0);
    const categories = new Set(allListings.map((l) => l.category).filter(Boolean)).size;
    const pendingCount = allListings.filter((l) => l.status === 'PENDING').length;

    return { inStock, lowStock, totalValue, categories, pendingCount };
  }, [allListings]);

  const statCards = [
    { label: 'Total Items', value: stats?.totalListings || 0, icon: Package, color: 'bg-navy-900' },
    { label: 'In Stock', value: computed.inStock, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Low Stock', value: computed.lowStock.length, icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'Pending Review', value: stats?.draftListings || 0, icon: Clock, color: 'bg-amber-500' },
    { label: 'Approved', value: stats?.approvedListings || 0, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Rejected', value: stats?.rejectedListings || 0, icon: XCircle, color: 'bg-red-500' },
    {
      label: 'Total Value',
      value: `$${computed.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'bg-sky-500',
    },
    { label: 'Categories', value: computed.categories, icon: Tag, color: 'bg-slate-500' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div>
          <div className="h-8 w-64 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
        </div>
        <CardSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif text-navy-900 mb-1">
            Welcome back, {user?.username}
          </h2>
          <p className="text-slate-500 text-sm">
            Here's your inventory overview &middot;{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-slate-100 hover:shadow-soft transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="text-white" size={16} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-serif text-navy-900 mb-0.5">
              {typeof stat.value === 'number' ? stat.value : stat.value}
            </p>
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/inventory/new" className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} />
          Add New Item
        </Link>
        <Link to="/inventory" className="btn-dark px-5 py-2.5 text-sm flex items-center gap-2">
          <Package size={16} />
          View All Items
        </Link>
      </div>

      {/* Two-Column Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h3 className="text-base font-serif text-navy-900 mb-5">Category Breakdown</h3>
          <CategoryBreakdown listings={allListings} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h3 className="text-base font-serif text-navy-900 mb-5">Status Distribution</h3>
          <StatusDistribution listings={allListings} />
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white p-6 rounded-xl border border-slate-100">
        <AlertsPanel lowStockItems={computed.lowStock} pendingCount={computed.pendingCount} />
      </div>

      {/* Recent Inventory Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-serif text-navy-900">Recent Items</h3>
          <Link
            to="/inventory"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-navy-900 transition-colors"
          >
            View all
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="p-3">
          {listings.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items yet"
              description="Add your first item to get started."
              actionLabel="Add New Item"
              actionTo="/inventory/new"
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/inventory/${listing.id}/edit`}
                  className="flex items-center gap-5 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                    {listing.images?.[0] ? (
                      <img
                        src={`/uploads/${listing.images[0].filename}`}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={16} strokeWidth={1} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-serif text-navy-900 truncate group-hover:text-sky-700 transition-colors">
                      {listing.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(listing.price)}</span>
                      <span className="text-xs text-slate-400">Qty: {listing.quantity}</span>
                      {listing.category && (
                        <span className="text-xs text-slate-400">{listing.category}</span>
                      )}
                      {listing.viewCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Eye size={11} /> {listing.viewCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + Arrow */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`badge badge-${listing.status?.toLowerCase()}`}>
                      {listing.status}
                    </span>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
