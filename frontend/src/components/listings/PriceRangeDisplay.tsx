import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import api from '../../services/api';

interface PriceRangeDisplayProps {
  partNumber: string;
  currentPrice?: number;
  compact?: boolean;
}

interface PriceRangeData {
  min: number;
  max: number;
  average: number;
  trend: 'rising' | 'falling' | 'stable';
  dataPoints: number;
  sources: number;
}

const formatPrice = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function getPosition(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

const trendConfig = {
  rising: { Icon: TrendingUp, color: 'text-emerald-500', label: 'Rising' },
  falling: { Icon: TrendingDown, color: 'text-red-500', label: 'Falling' },
  stable: { Icon: Minus, color: 'text-slate-400', label: 'Stable' },
} as const;

export default function PriceRangeDisplay({ partNumber, currentPrice, compact = false }: PriceRangeDisplayProps) {
  const [data, setData] = useState<PriceRangeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPriceRange() {
      setIsLoading(true);
      setError(false);
      setData(null);

      try {
        const response = await api.get(`/parts/${encodeURIComponent(partNumber)}/price-range`);
        if (!cancelled) {
          setData(response.data.data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPriceRange();

    return () => {
      cancelled = true;
    };
  }, [partNumber]);

  // --- Loading state ---
  if (isLoading) {
    return compact ? (
      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
    ) : (
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return <span className="text-sm text-slate-400">Unable to load pricing</span>;
  }

  // --- No data state ---
  if (!data) {
    return <span className="text-sm text-slate-400">No price data available</span>;
  }

  const { Icon: TrendIcon, color: trendColor, label: trendLabel } = trendConfig[data.trend];
  const avgPos = getPosition(data.average, data.min, data.max);

  // --- Compact mode ---
  if (compact) {
    return (
      <div className="relative group inline-flex items-center gap-1.5">
        <span className="text-sm text-slate-700">
          {formatPrice(data.min)} - {formatPrice(data.max)}
        </span>
        <TrendIcon size={14} className={trendColor} />

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-3 mb-1.5">
              <span>Min: {formatPrice(data.min)}</span>
              <span>Avg: {formatPrice(data.average)}</span>
              <span>Max: {formatPrice(data.max)}</span>
            </div>
            {currentPrice !== undefined && (
              <div className="mb-1.5">
                Your price: {formatPrice(currentPrice)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <TrendIcon size={12} className={trendColor} />
              <span>{trendLabel}</span>
              <span className="text-slate-400 ml-1">
                ({data.dataPoints} pts / {data.sources} sources)
              </span>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  // --- Full mode ---
  const currentPos = currentPrice !== undefined ? getPosition(currentPrice, data.min, data.max) : null;

  return (
    <div className="space-y-3" data-testid="price-range-display">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Market Price Range</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-xs font-medium ${trendColor}`}>{trendLabel}</span>
        </div>
      </div>

      {/* Range bar */}
      <div className="relative h-3 bg-slate-200 rounded-full">
        {/* Average marker (blue line) */}
        <div
          className="absolute top-0 h-full w-0.5 bg-sky-500 z-10"
          style={{ left: `${avgPos}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white shadow-sm" />
        </div>

        {/* Current price marker (orange dot) */}
        {currentPos !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-amber-500 z-20"
            style={{ left: `clamp(0%, ${currentPos}%, 100%)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Min {formatPrice(data.min)}</span>
        <span className="text-sky-600 font-medium">Avg {formatPrice(data.average)}</span>
        <span>Max {formatPrice(data.max)}</span>
      </div>

      {/* Current price callout */}
      {currentPrice !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-500">Your price:</span>
          <span className="font-semibold text-slate-700">{formatPrice(currentPrice)}</span>
        </div>
      )}

      {/* Data source info */}
      <p className="text-xs text-slate-400">
        Based on {data.dataPoints} data points from {data.sources} source{data.sources !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
