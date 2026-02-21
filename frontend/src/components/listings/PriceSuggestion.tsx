import { useState } from 'react';
import { Sparkles, TrendingUp, DollarSign, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PriceSuggestionProps {
  title: string;
  category: string;
  condition: string;
  description?: string;
  onApplyPrice: (price: number) => void;
}

interface Suggestion {
  min: number;
  max: number;
  average: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

const confidenceConfig = {
  high: { label: 'High Confidence', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  medium: { label: 'Medium Confidence', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  low: { label: 'Low Confidence', bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' },
};

export default function PriceSuggestion({ title, category, condition, description, onApplyPrice }: PriceSuggestionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [applied, setApplied] = useState(false);

  const canSuggest = title.trim().length > 0 && category && condition;

  const handleSuggest = async () => {
    if (!canSuggest) return;

    setIsLoading(true);
    setSuggestion(null);
    setApplied(false);

    try {
      const response = await api.post('/ai/suggest-price', {
        title,
        category,
        condition,
        description,
      });
      setSuggestion(response.data.data.suggestion);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get price suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (price: number) => {
    onApplyPrice(price);
    setApplied(true);
    toast.success(`Price set to $${price.toLocaleString()}`);
  };

  const formatPrice = (price: number) => {
    if (price === 0.01) return 'Call For Price';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="mt-3">
      {/* Suggest Button */}
      {!suggestion && (
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!canSuggest || isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} />
              Analyzing market prices...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              AI Price Suggestion
            </>
          )}
        </button>
      )}

      {/* Suggestion Card */}
      {suggestion && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <TrendingUp size={14} className="text-violet-600" />
              </div>
              <span className="text-sm font-bold text-violet-900">AI Price Estimate</span>
            </div>
            <span className={`badge ${confidenceConfig[suggestion.confidence].bg} ${confidenceConfig[suggestion.confidence].text} ring-1 ring-inset ${confidenceConfig[suggestion.confidence].ring}`}>
              {confidenceConfig[suggestion.confidence].label}
            </span>
          </div>

          {/* Price Range */}
          {suggestion.average === 0.01 ? (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-gray-800">Call For Price</p>
              <p className="text-xs text-gray-500 mt-1">This item is typically sold via negotiation</p>
            </div>
          ) : (
            <div className="flex items-end gap-4 mb-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Price Range</p>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={16} className="text-violet-600" />
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(suggestion.min)} — {formatPrice(suggestion.max)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Suggested</p>
                <span className="text-xl font-extrabold text-violet-700">{formatPrice(suggestion.average)}</span>
              </div>
            </div>
          )}

          {/* Reasoning */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3 bg-white/60 rounded-lg p-2.5">
            {suggestion.reasoning}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {suggestion.average !== 0.01 && (
              <>
                <button
                  type="button"
                  onClick={() => handleApply(suggestion.average)}
                  disabled={applied}
                  className="btn btn-sm bg-violet-600 text-white hover:bg-violet-700 gap-1.5 disabled:opacity-50"
                >
                  {applied ? <Check size={12} /> : <DollarSign size={12} />}
                  {applied ? 'Applied' : `Apply ${formatPrice(suggestion.average)}`}
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(suggestion.min)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Use Min ({formatPrice(suggestion.min)})
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(suggestion.max)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Use Max ({formatPrice(suggestion.max)})
                </button>
              </>
            )}
            {suggestion.average === 0.01 && (
              <button
                type="button"
                onClick={() => handleApply(0.01)}
                disabled={applied}
                className="btn btn-sm bg-violet-600 text-white hover:bg-violet-700 gap-1.5 disabled:opacity-50"
              >
                {applied ? <Check size={12} /> : <DollarSign size={12} />}
                {applied ? 'Applied' : 'Set Call For Price'}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => { setSuggestion(null); setApplied(false); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hint text when button is disabled */}
      {!canSuggest && !suggestion && (
        <p className="text-xs text-gray-400 mt-1.5">Fill in title, category, and condition to enable AI pricing</p>
      )}
    </div>
  );
}
