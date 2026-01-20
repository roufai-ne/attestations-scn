'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, FileText, Award, User, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
    type: 'demande' | 'attestation' | 'appele';
    id: string;
    title: string;
    subtitle: string;
    url: string;
    statut: string | null;
}

export function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    // Fermer le dropdown quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Recherche avec debounce
    useEffect(() => {
        const search = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results || []);
                }
            } catch (error) {
                console.error('Erreur recherche:', error);
            } finally {
                setLoading(false);
            }
        };
        search();
    }, [debouncedQuery]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'demande':
                return <FileText className="h-4 w-4 text-blue-500" />;
            case 'attestation':
                return <Award className="h-4 w-4 text-green-500" />;
            case 'appele':
                return <User className="h-4 w-4 text-purple-500" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'demande':
                return 'Demande';
            case 'attestation':
                return 'Attestation';
            case 'appele':
                return 'Appelé';
            default:
                return type;
        }
    };

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');
        router.push(result.url);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Rechercher une demande, un appelé..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[var(--accent-orange)] focus:ring-[var(--accent-orange)]/20 transition-colors"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
            </div>

            {/* Dropdown des résultats */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {results.length === 0 && !loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <p>Aucun résultat pour "{query}"</p>
                        </div>
                    ) : (
                        <ul className="py-2">
                            {results.map((result) => (
                                <li key={`${result.type}-${result.id}`}>
                                    <button
                                        onClick={() => handleSelect(result)}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="flex-shrink-0">
                                            {getIcon(result.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {result.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {result.subtitle}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {getTypeLabel(result.type)}
                                        </Badge>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
