interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 8, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full" aria-hidden="true">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-12 px-4 py-3.5">
                <div className="w-4 h-4 rounded bg-slate-200 animate-pulse" />
              </th>
              <th className="w-16 px-2 py-3.5">
                <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
              </th>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3.5 text-left">
                  <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                </th>
              ))}
              <th className="w-12 px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <td className="px-4 py-3">
                  <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
                </td>
                <td className="px-2 py-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse" />
                </td>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <div
                      className="h-4 rounded bg-slate-100 animate-pulse"
                      style={{ width: `${50 + Math.random() * 40}%` }}
                    />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="w-6 h-6 rounded bg-slate-100 animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 8 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-slate-100"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="h-7 w-16 rounded bg-slate-200 animate-pulse mb-2" />
          <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
