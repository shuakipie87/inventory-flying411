import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadStore, type ColumnMapping } from '../../stores/uploadStore';
import ColumnMapper from './ColumnMapper';

interface ColumnMappingStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ColumnMappingStep({ onNext, onBack }: ColumnMappingStepProps) {
  const {
    parsedHeaders,
    sampleRows,
    columnMappings,
    getAIMappings,
    saveMapping,
    runMatching,
    isLoading,
  } = useUploadStore();

  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>(columnMappings);

  // Sync from store when AI mappings arrive
  useEffect(() => {
    if (columnMappings.length > 0) {
      setLocalMappings(columnMappings);
    }
  }, [columnMappings]);

  const handleTargetChange = (sourceColumn: string, targetField: string) => {
    setLocalMappings((prev) => {
      const existing = prev.find((m) => m.sourceColumn === sourceColumn);
      if (existing) {
        return prev.map((m) =>
          m.sourceColumn === sourceColumn ? { ...m, targetField, confidence: 1 } : m
        );
      }
      return [...prev, { sourceColumn, targetField, confidence: 1 }];
    });
  };

  const handleRemove = (sourceColumn: string) => {
    setLocalMappings((prev) =>
      prev.map((m) => (m.sourceColumn === sourceColumn ? { ...m, targetField: '', confidence: 0 } : m))
    );
  };

  const getMapping = (header: string): ColumnMapping | undefined =>
    localMappings.find((m) => m.sourceColumn === header);

  const requiredMapped = localMappings.some(
    (m) => m.targetField === 'partNumber' && m.sourceColumn
  );

  const usedTargets = new Set(localMappings.map((m) => m.targetField).filter(Boolean));

  // Split headers into mapped and unmapped
  const mappedHeaders = parsedHeaders.filter((h) => {
    const m = getMapping(h);
    return m && m.targetField;
  });
  const unmappedHeaders = parsedHeaders.filter((h) => {
    const m = getMapping(h);
    return !m || !m.targetField;
  });

  const handleConfirm = async () => {
    if (!requiredMapped) {
      toast.error('Part Number must be mapped to a column');
      return;
    }
    const validMappings = localMappings.filter((m) => m.targetField);
    await saveMapping(validMappings);
    await runMatching();
    onNext();
  };

  // Get sample values for a given header
  const getSampleValues = (header: string): string[] =>
    sampleRows.map((row) => row[header]).filter(Boolean).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display text-navy-900 mb-1">Map Your Columns</h2>
          <p className="text-sm text-slate-500">
            Match your file columns to inventory fields. AI suggestions are pre-filled.
          </p>
        </div>
        <button
          onClick={() => getAIMappings()}
          disabled={isLoading}
          className="min-h-[44px] text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          data-testid="ai-suggest-btn"
        >
          <Sparkles size={14} />
          {isLoading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
        </button>
      </div>

      {/* Required field notice */}
      {!requiredMapped && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm mb-4">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>Part Number is required. Please map it to a column from your file.</span>
        </div>
      )}

      {/* Mapped columns */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-x-auto -mx-4 sm:mx-0 mb-4">
        <div className="min-w-[540px] grid grid-cols-[1fr_auto_1fr_auto_auto] gap-0 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span>Source Column</span>
          <span />
          <span>Target Field</span>
          <span>Confidence</span>
          <span />
        </div>

        {mappedHeaders.length > 0 ? (
          mappedHeaders.map((header) => (
            <ColumnMapper
              key={header}
              header={header}
              sampleValues={getSampleValues(header)}
              mapping={getMapping(header)}
              usedTargets={usedTargets}
              onTargetChange={handleTargetChange}
              onRemove={handleRemove}
            />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No columns mapped yet. Use AI suggestions or map columns below.
          </div>
        )}
      </div>

      {/* Unmapped columns section */}
      {unmappedHeaders.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-x-auto -mx-4 sm:mx-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unmapped Columns ({unmappedHeaders.length})
            </span>
            <span className="text-xs text-slate-400">Assign a target field or leave to skip</span>
          </div>

          {unmappedHeaders.map((header) => (
            <ColumnMapper
              key={header}
              header={header}
              sampleValues={getSampleValues(header)}
              mapping={getMapping(header)}
              usedTargets={usedTargets}
              onTargetChange={handleTargetChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="min-h-[44px] px-5 py-2.5 text-sm text-slate-600 hover:text-navy-900 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!requiredMapped || isLoading}
          className="btn-primary min-h-[44px] px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="confirm-mapping-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm Mapping
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
