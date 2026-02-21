import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import api from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PricePoint {
  date: string;
  price: number;
  source: string;
  vendorName?: string;
}

interface PriceHistoryChartProps {
  partNumber: string;
  months?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<string, string> = {
  Internal: '#3b82f6',   // blue-500
  Flying411: '#8b5cf6',  // violet-500
  Market: '#10b981',     // emerald-500
};

const DEFAULT_COLOR = '#94a3b8'; // slate-400

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: {
      date: string;
      vendorName?: string;
      [key: string]: unknown;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const data = point.payload;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-sm">
      <p className="text-xs text-slate-400 mb-1">{formatDate(data.date)}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: SOURCE_COLORS[entry.dataKey] ?? DEFAULT_COLOR }}
          />
          <span className="text-slate-600">{entry.dataKey}:</span>
          <span className="font-semibold text-slate-800">{formatPrice(entry.value)}</span>
        </div>
      ))}
      {data.vendorName && (
        <p className="text-xs text-slate-400 mt-1">Vendor: {data.vendorName}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="bg-white border border-slate-100 rounded-xl flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-slate-300 mb-2" />
        <p className="text-xs text-slate-400">Loading price history...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PriceHistoryChart({
  partNumber,
  months = 12,
  height = 300,
}: PriceHistoryChartProps) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(false);
      try {
        const { data: res } = await api.get(`/parts/${encodeURIComponent(partNumber)}/price-timeline`, {
          params: { months },
        });
        if (!cancelled) {
          setData(res.data ?? []);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [partNumber, months]);

  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  if (error || data.length === 0) {
    return (
      <div
        className="bg-white border border-slate-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <TrendingUp size={24} strokeWidth={1} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">
            {error ? 'Failed to load price history' : 'No price history available'}
          </p>
        </div>
      </div>
    );
  }

  // Determine which sources are present in the data
  const sources = [...new Set(data.map((d) => d.source))];

  // Transform data: pivot so each source becomes its own key for multi-line chart
  const dateMap = new Map<string, Record<string, unknown>>();

  for (const point of data) {
    const key = point.date;
    if (!dateMap.has(key)) {
      dateMap.set(key, { date: key, vendorName: point.vendorName });
    }
    const entry = dateMap.get(key)!;
    entry[point.source] = point.price;
    if (point.vendorName) {
      entry.vendorName = point.vendorName;
    }
  }

  const chartData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );

  return (
    <div
      className="bg-white border border-slate-100 rounded-xl p-4"
      data-testid="price-history-chart"
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: '#64748b' }}
          />
          {sources.map((source) => (
            <Line
              key={source}
              type="monotone"
              dataKey={source}
              stroke={SOURCE_COLORS[source] ?? DEFAULT_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: SOURCE_COLORS[source] ?? DEFAULT_COLOR }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
