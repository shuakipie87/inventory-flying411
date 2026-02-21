import { DollarSign, TrendingUp } from 'lucide-react';

interface PriceSuggestion {
    min: string;
    max: string;
    average: string;
    dataPoints: number;
}

interface PriceHintProps {
    suggestion: PriceSuggestion | null;
    condition?: string;
}

export default function PriceHint({ suggestion, condition = 'used' }: PriceHintProps) {
    if (!suggestion) {
        return null;
    }

    return (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Suggested Price Range ({condition})</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-semibold text-gray-900">
                        ${suggestion.min} - ${suggestion.max}
                    </span>
                </div>
                <div className="text-sm text-gray-500">
                    Avg: ${suggestion.average}
                </div>
                <div className="text-xs text-gray-400">
                    Based on {suggestion.dataPoints} data points
                </div>
            </div>
        </div>
    );
}
