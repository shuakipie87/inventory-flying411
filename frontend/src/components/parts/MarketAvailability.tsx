import { useState, useEffect, useCallback } from 'react';
import { Globe, Package, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface Vendor {
  vendorName: string;
  vendorCode: string;
  quantity: number;
  minPrice: number;
  maxPrice: number;
  condition: string;
  lastSeen: string;
}

interface MarketData {
  partNumber: string;
  totalQuantity: number;
  vendorCount: number;
  vendors: Vendor[];
  lastUpdated: string;
}

interface MarketAvailabilityProps {
  partNumber: string;
  compact?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

function getAvailabilityColor(totalQuantity: number): { bg: string; text: string } {
  if (totalQuantity > 10) return { bg: 'bg-green-100', text: 'text-green-800' };
  if (totalQuantity >= 1) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  return { bg: 'bg-gray-100', text: 'text-gray-600' };
}

export default function MarketAvailability({ partNumber, compact = false }: MarketAvailabilityProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(`/parts/${encodeURIComponent(partNumber)}/market-availability`);
      setData(response.data.data);
    } catch {
      setError('Unable to load market data');
    } finally {
      setIsLoading(false);
    }
  }, [partNumber]);

  useEffect(() => {
    setIsLoading(true);
    setData(null);
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.post(`/parts/${encodeURIComponent(partNumber)}/market-refresh`);
      await fetchData();
    } catch {
      setError('Unable to refresh market data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // --- Compact mode (badge for table cells) ---
  if (compact) {
    if (isLoading) {
      return <span className="inline-block w-28 h-5 bg-slate-100 rounded-full animate-pulse" />;
    }

    if (error || !data) {
      return <span className="text-xs text-slate-400">--</span>;
    }

    const colors = getAvailabilityColor(data.totalQuantity);

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}
        title={`${data.totalQuantity} units from ${data.vendorCount} vendor${data.vendorCount === 1 ? '' : 's'}`}
      >
        <Package size={12} />
        {data.totalQuantity} units ({data.vendorCount} vendor{data.vendorCount === 1 ? '' : 's'})
      </span>
    );
  }

  // --- Full mode (detail panel) ---
  if (isLoading) {
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-100 rounded animate-pulse" />
          <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-slate-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">No market data available</p>
      </div>
    );
  }

  const colors = getAvailabilityColor(data.totalQuantity);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-slate-400" />
          <h2 className="text-base font-serif text-navy-900">Market Availability</h2>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn text-xs py-1.5 px-3 border border-slate-200 text-slate-500 hover:bg-slate-50 gap-1.5 disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
          <Package size={12} />
          {data.totalQuantity} units
        </span>
        <span className="text-sm text-slate-500">
          available across {data.vendorCount} vendor{data.vendorCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Vendor Table */}
      {data.vendors.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Vendor</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Price Range</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Condition</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.vendors.map((vendor) => (
                <tr key={`${vendor.vendorCode}-${vendor.condition}`} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2">
                    <span className="font-medium text-slate-700">{vendor.vendorName}</span>
                    <span className="text-xs text-slate-400 ml-1.5">({vendor.vendorCode})</span>
                  </td>
                  <td className="py-2 px-2 text-slate-600">{vendor.quantity}</td>
                  <td className="py-2 px-2 text-slate-600">
                    {vendor.minPrice === vendor.maxPrice
                      ? formatCurrency(vendor.minPrice)
                      : `${formatCurrency(vendor.minPrice)} - ${formatCurrency(vendor.maxPrice)}`}
                  </td>
                  <td className="py-2 px-2">
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">
                      {vendor.condition}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-slate-400 whitespace-nowrap">
                    {formatRelativeTime(vendor.lastSeen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Last Updated */}
      {data.lastUpdated && (
        <p className="text-xs text-slate-400">
          Last updated {formatRelativeTime(data.lastUpdated)}
        </p>
      )}
    </div>
  );
}
