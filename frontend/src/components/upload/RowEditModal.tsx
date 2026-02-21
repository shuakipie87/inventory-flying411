import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { UploadSessionRow } from '../../stores/uploadStore';
import MissingInfoPrompt from './MissingInfoPrompt';
import { TARGET_FIELDS } from './ColumnMapper';

interface RowEditModalProps {
  row: UploadSessionRow;
  onClose: () => void;
  onSave: (data: Record<string, string>) => Promise<void>;
}

export default function RowEditModal({ row, onClose, onSave }: RowEditModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    row.mappedData ?? row.rawData ?? {}
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  // Determine which required/important fields are missing
  const missingFields = TARGET_FIELDS
    .filter((f) => f.required)
    .map((f) => f.value)
    .filter((field) => !formData[field]?.trim());

  const showMissingPrompt =
    missingFields.length > 0 ||
    (row.matchConfidence != null && row.matchConfidence < 0.5);

  const handleSelectPart = (partId: string) => {
    setFormData((prev) => ({ ...prev, matchedPartId: partId }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit row"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-display text-navy-900">
              Edit Row {row.rowNumber}
            </h3>
            {row.matchedPartId && (
              <p className="text-xs text-slate-400 mt-0.5">
                Matched part: {row.matchedPartId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {key}
                {TARGET_FIELDS.some((f) => f.value === key && f.required) && (
                  <span className="text-red-400 ml-0.5">*</span>
                )}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="input w-full py-2 text-sm"
              />
            </div>
          ))}

          {/* Errors */}
          {row.errors && row.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                Errors
              </p>
              <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                {row.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing info prompt */}
          {showMissingPrompt && (
            <MissingInfoPrompt
              missingFields={missingFields}
              matchConfidence={row.matchConfidence}
              onSelectPart={handleSelectPart}
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-navy-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
              data-testid="save-row-btn"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
