import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
  RotateCcw,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadStore } from '../stores/uploadStore';
import { CameraCapture } from '../components/shared/CameraCapture';
import ColumnMappingStep from '../components/upload/ColumnMappingStep';
import DataReviewStep from '../components/upload/DataReviewStep';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = ['Upload File', 'Column Mapping', 'Review Data', 'Import Results'] as const;

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls', '.pdf', '.pages'];
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const ACCEPT_STRING = ACCEPTED_TYPES.join(',');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Upload progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <li key={label} className="flex items-center gap-2 flex-1 last:flex-initial">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isComplete ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium whitespace-nowrap hidden sm:inline ${
                    isCurrent ? 'text-navy-900' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    isComplete ? 'bg-emerald-300' : 'bg-slate-100'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step 0: File Upload
// ---------------------------------------------------------------------------

interface FileUploadStepProps {
  onNext: () => void;
}

function FileUploadStep({ onNext }: FileUploadStepProps) {
  const { createSession, parseFile, isLoading } = useUploadStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !IMAGE_TYPES.includes(ext)) {
      toast.error(`Unsupported file type. Accepted: ${[...ACCEPTED_TYPES, ...IMAGE_TYPES].join(', ')}`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleCameraCapture = (file: File) => {
    setSelectedFile(file);
    setShowCamera(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await createSession(selectedFile);
    const session = useUploadStore.getState().currentSession;
    if (session) {
      await parseFile();
      onNext();
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl font-display text-navy-900 mb-2">Upload Your Inventory File</h2>
        <p className="text-sm text-slate-500">
          Upload a CSV, Excel, or PDF file containing your parts and equipment data.
        </p>
      </div>

      {/* Mobile scan option - visible below md breakpoint */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowCamera(true)}
          className="w-full min-h-[48px] flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 active:scale-[0.98] transition-all"
          data-testid="scan-document-btn"
        >
          <Camera size={20} />
          Scan Document
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Take a photo of a parts list or invoice to extract data
        </p>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or upload a file</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-sky-400 bg-sky-50'
            : selectedFile
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drop file here or click to browse"
        data-testid="drop-zone"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          aria-hidden="true"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <FileSpreadsheet size={40} className="mx-auto text-emerald-500" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-navy-900 break-all">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatBytes(selectedFile.size)} &middot; {selectedFile.type || 'Unknown type'}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors min-h-[44px] inline-flex items-center"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload size={40} className="mx-auto text-slate-300" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-slate-600">
                <span className="text-sky-600 font-medium">Click to browse</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports {ACCEPTED_TYPES.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop scan option - inline alongside upload */}
      <div className="hidden md:flex items-center gap-3 mt-4">
        <button
          onClick={() => setShowCamera(true)}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-navy-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          data-testid="scan-document-desktop-btn"
        >
          <Camera size={16} />
          Scan Document
        </button>
        <span className="text-xs text-slate-400">Use your camera to capture a parts list</span>
      </div>

      {/* Upload button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="btn-primary min-h-[44px] px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="upload-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Upload &amp; Parse
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Import Results
// ---------------------------------------------------------------------------

interface ImportResultsStepProps {
  onReset: () => void;
}

function ImportResultsStep({ onReset }: ImportResultsStepProps) {
  const { currentSession } = useUploadStore();

  const processed = currentSession?.processedRows ?? 0;
  const errors = currentSession?.errorRows ?? 0;
  const total = currentSession?.totalRows ?? 0;
  const created = processed - errors;

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-emerald-500" />
      </div>

      <h2 className="text-xl font-display text-navy-900 mb-2">Import Complete</h2>
      <p className="text-sm text-slate-500 mb-8">
        Your inventory file has been processed and imported.
      </p>

      {/* Results summary */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-semibold text-navy-900">{total}</p>
            <p className="text-xs text-slate-400 mt-1">Total Rows</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{created}</p>
            <p className="text-xs text-emerald-500 mt-1">Created</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-red-600">{errors}</p>
            <p className="text-xs text-red-500 mt-1">Errors</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/inventory"
          className="btn-primary min-h-[44px] px-6 py-2.5 text-sm flex items-center gap-2"
        >
          <ExternalLink size={16} />
          View Inventory
        </Link>
        <button
          onClick={onReset}
          className="min-h-[44px] px-6 py-2.5 text-sm text-slate-600 hover:text-navy-900 flex items-center gap-2 border border-slate-200 rounded-lg transition-colors"
          data-testid="upload-another-btn"
        >
          <RotateCcw size={16} />
          Upload Another
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BulkUploadPage() {
  const { currentStep, setStep, reset } = useUploadStore();

  const goNext = () => setStep(currentStep + 1);
  const goBack = () => setStep(currentStep - 1);

  const handleReset = () => {
    reset();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-navy-900 mb-1">Bulk Upload</h1>
          <p className="text-slate-500 text-sm">
            Import inventory from spreadsheets and documents
          </p>
        </div>
        {currentStep > 0 && currentStep < 3 && (
          <button
            onClick={goBack}
            className="min-h-[44px] text-sm text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Previous Step
          </button>
        )}
      </div>

      <StepIndicator currentStep={currentStep} />

      {currentStep === 0 && <FileUploadStep onNext={goNext} />}
      {currentStep === 1 && <ColumnMappingStep onNext={goNext} onBack={goBack} />}
      {currentStep === 2 && <DataReviewStep onNext={goNext} onBack={goBack} />}
      {currentStep === 3 && <ImportResultsStep onReset={handleReset} />}
    </div>
  );
}
