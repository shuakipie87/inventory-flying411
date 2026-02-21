interface CategoryBreakdownProps {
  listings: any[];
}

export default function CategoryBreakdown({ listings }: CategoryBreakdownProps) {
  const categories = listings.reduce((acc: Record<string, number>, item) => {
    const cat = item.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(categories).sort(([, a], [, b]) => b - a);
  const total = listings.length;

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">No category data available</div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(([name, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={name}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-slate-700">{name}</span>
              <span className="text-xs text-slate-400">{count} items ({Math.round(pct)}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
