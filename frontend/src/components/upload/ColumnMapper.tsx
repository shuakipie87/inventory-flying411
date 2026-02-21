import { ArrowRight, ChevronDown, GripVertical, X } from 'lucide-react';
import type { ColumnMapping } from '../../stores/uploadStore';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function confidenceColor(c: number): string {
  if (c >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (c >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'High';
  if (c >= 0.5) return 'Medium';
  return 'Low';
}

// ---------------------------------------------------------------------------
// Target fields definition
// ---------------------------------------------------------------------------

export const TARGET_FIELDS = [
  { value: 'partNumber', label: 'Part Number', required: true },
  { value: 'title', label: 'Title', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'category', label: 'Category', required: false },
  { value: 'condition', label: 'Condition', required: false },
  { value: 'price', label: 'Price', required: false },
  { value: 'quantity', label: 'Quantity', required: false },
  { value: 'location', label: 'Location', required: false },
  { value: 'manufacturer', label: 'Manufacturer', required: false },
  { value: 'model', label: 'Model', required: false },
  { value: 'serialNumber', label: 'Serial Number', required: false },
  { value: 'notes', label: 'Notes', required: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ColumnMapperProps {
  header: string;
  sampleValues: string[];
  mapping: ColumnMapping | undefined;
  usedTargets: Set<string>;
  onTargetChange: (sourceColumn: string, targetField: string) => void;
  onRemove: (sourceColumn: string) => void;
}

export default function ColumnMapper({
  header,
  sampleValues,
  mapping,
  usedTargets,
  onTargetChange,
  onRemove,
}: ColumnMapperProps) {
  const confidence = mapping?.confidence ?? 0;

  return (
    <div
      className="grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
      data-testid={`mapper-${header}`}
    >
      {/* Source column */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{header}</p>
            {sampleValues.length > 0 && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                e.g. {sampleValues.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight size={14} className="text-slate-300 shrink-0" />

      {/* Target dropdown */}
      <div className="relative">
        <select
          value={mapping?.targetField || ''}
          onChange={(e) => onTargetChange(header, e.target.value)}
          className="input py-2 text-sm w-full appearance-none pr-8"
          aria-label={`Map ${header} to target field`}
        >
          <option value="">-- Skip --</option>
          {TARGET_FIELDS.map((f) => (
            <option
              key={f.value}
              value={f.value}
              disabled={usedTargets.has(f.value) && mapping?.targetField !== f.value}
            >
              {f.label}{f.required ? ' *' : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Confidence */}
      <div className="w-20 text-center">
        {mapping?.targetField ? (
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${confidenceColor(confidence)}`}>
            {confidenceLabel(confidence)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">--</span>
        )}
      </div>

      {/* Remove button */}
      <div className="w-8 text-center">
        {mapping?.targetField ? (
          <button
            onClick={() => onRemove(header)}
            className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
            aria-label={`Remove mapping for ${header}`}
          >
            <X size={14} />
          </button>
        ) : (
          <span className="w-[14px] inline-block" />
        )}
      </div>
    </div>
  );
}
