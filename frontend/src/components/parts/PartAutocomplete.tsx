import { useState, useEffect, useRef } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Part {
    id: string;
    partNumber: string;
    manufacturer: string;
    description: string;
    category: string;
    model?: string;
}

interface PriceSuggestion {
    min: string;
    max: string;
    average: string;
    dataPoints: number;
}

interface PartAutocompleteProps {
    onSelect: (part: Part) => void;
    onPriceHint?: (suggestion: PriceSuggestion | null) => void;
    condition?: string;
    defaultValue?: string;
}

export default function PartAutocomplete({
    onSelect,
    onPriceHint,
    condition = 'used',
    defaultValue = '',
}: PartAutocompleteProps) {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<Part[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const response = await api.get(`/parts/search?q=${encodeURIComponent(query)}&limit=10`);
                setResults(response.data.data.parts);
                setIsOpen(true);
            } catch (error) {
                console.error('Part search failed:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Fetch pricing when part is selected
    const handleSelect = async (part: Part) => {
        setSelectedPart(part);
        setQuery(part.partNumber);
        setIsOpen(false);
        onSelect(part);

        // Fetch pricing suggestion
        if (onPriceHint) {
            try {
                const response = await api.get(`/parts/${part.partNumber}/pricing?condition=${condition}`);
                onPriceHint(response.data.data.suggestion);
            } catch {
                onPriceHint(null);
            }
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedPart(null);
                    }}
                    placeholder="Search part number, manufacturer..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-400" />
                    ) : (
                        <Search className="w-4 h-4 text-gray-400" />
                    )}
                </div>
                {selectedPart && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Check className="w-4 h-4 text-green-500" />
                    </div>
                )}
            </div>

            {/* Dropdown results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {results.map((part) => (
                        <button
                            key={part.id}
                            type="button"
                            onClick={() => handleSelect(part)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">{part.partNumber}</p>
                                    <p className="text-sm text-gray-500 truncate">{part.description}</p>
                                </div>
                                <span className="text-xs text-gray-400 ml-2">{part.manufacturer}</span>
                            </div>
                            <div className="mt-1 flex gap-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {part.category}
                                </span>
                                {part.model && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                        {part.model}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No parts found matching "{query}"
                </div>
            )}
        </div>
    );
}
