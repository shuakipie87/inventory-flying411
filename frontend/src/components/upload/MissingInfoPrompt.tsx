import { useState } from 'react';
import { AlertTriangle, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface PartSuggestion {
  id: string;
  partNumber: string;
  title: string;
  category: string;
}

interface MissingInfoPromptProps {
  missingFields: string[];
  matchConfidence: number | null;
  onSelectPart: (partId: string) => void;
}

export default function MissingInfoPrompt({
  missingFields,
  matchConfidence,
  onSelectPart,
}: MissingInfoPromptProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PartSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/parts/search', {
        params: { q: searchQuery, limit: 5 },
      });
      setSuggestions(data.data ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const isLowConfidence = matchConfidence != null && matchConfidence < 0.5;

  return (
    <div className="space-y-3">
      {/* Missing fields alert */}
      {missingFields.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} />
            Missing or Uncertain Fields
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((field) => (
              <span
                key={field}
                className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Low confidence notice */}
      {isLowConfidence && (
        <p className="text-xs text-slate-500">
          Match confidence is low ({Math.round((matchConfidence ?? 0) * 100)}%).
          Try searching for the correct part below.
        </p>
      )}

      {/* Part search */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Search Parts Database
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search by part number or name..."
              className="input w-full py-2 pl-8 text-sm"
              data-testid="part-search-input"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          {suggestions.map((part) => (
            <button
              key={part.id}
              onClick={() => onSelectPart(part.id)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-sky-50 border-b border-slate-50 last:border-0 transition-colors"
              data-testid={`part-suggestion-${part.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{part.partNumber}</p>
                <p className="text-xs text-slate-400 truncate">{part.title}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-2">{part.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
