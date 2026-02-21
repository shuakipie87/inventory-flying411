interface StatusDistributionProps {
  listings: any[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-400',
  PENDING: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
};

export default function StatusDistribution({ listings }: StatusDistributionProps) {
  const statuses = listings.reduce((acc: Record<string, number>, item) => {
    const status = item.status || 'DRAFT';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(statuses).sort(([, a], [, b]) => b - a);
  const total = listings.length;

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">No status data available</div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(([status, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={status}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-slate-700 capitalize">{status.toLowerCase()}</span>
              <span className="text-xs text-slate-400">{count} ({Math.round(pct)}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${statusColors[status] || 'bg-slate-400'} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
