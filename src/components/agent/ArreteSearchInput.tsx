'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileText, ExternalLink } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
    id: string;
    numero: string;
    dateArrete: Date | string;
    promotion: string;
    annee: string;
    fichierPath: string;
    excerpt: string;
}

interface ArreteSearchInputProps {
    value?: string;
    dateValue?: string;
    onChange?: (numero: string, dateArrete: string) => void;
    onSelect?: (result: SearchResult) => void;
}

export function ArreteSearchInput({ value, onChange, onSelect }: ArreteSearchInputProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fermer les résultats si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Rechercher quand la query change
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            searchArretes(debouncedQuery);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [debouncedQuery]);

    const searchArretes = async (searchQuery: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/arretes/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.results || []);
                setShowResults(true);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        setQuery('');
        setShowResults(false);
        const dateStr = result.dateArrete instanceof Date
            ? result.dateArrete.toISOString().split('T')[0]
            : new Date(result.dateArrete).toISOString().split('T')[0];
        onChange?.(result.numero, dateStr);
        onSelect?.(result);
    };

    const handleViewPDF = (result: SearchResult, e: React.MouseEvent) => {
        e.stopPropagation();
        // Ouvrir le PDF dans un nouvel onglet
        window.open(result.fichierPath, '_blank');
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>
            <Label htmlFor="arrete-search">
                Rechercher dans les arrêtés
                <span className="text-sm text-gray-500 ml-2">(Nom, prénom, promotion...)</span>
            </Label>

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="arrete-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ex: MOUSSA Ibrahim, Promotion 2024..."
                        className="pl-10 pr-10"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                </div>

                {/* Résultats de recherche */}
                {showResults && results.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[400px] overflow-y-auto">
                        <div className="p-3 border-b bg-gray-50 sticky top-0">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {results.length} résultat(s) trouvé(s)
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                                    onClick={() => handleSelect(result)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Ligne 1: Icône + Numéro + Badge promotion */}
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[var(--accent-orange)]/10 rounded-lg flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-[var(--accent-orange)]" />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-[var(--navy)]">
                                                        {result.numero}
                                                    </span>
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                        {result.promotion}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(result.dateArrete).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ligne 2: Excerpt avec highlight */}
                                            <div
                                                className="text-sm text-gray-600 pl-11 leading-relaxed bg-gray-50 p-2 rounded-lg border-l-2 border-[var(--accent-orange)]"
                                                dangerouslySetInnerHTML={{ __html: result.excerpt }}
                                            />
                                        </div>

                                        {/* Bouton voir PDF */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleViewPDF(result, e)}
                                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            PDF
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Aucun résultat */}
                {showResults && results.length === 0 && !loading && query.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                        Aucun résultat trouvé pour "{query}"
                    </div>
                )}
            </div>

            {/* Numéro sélectionné */}
            {value && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                        Arrêté sélectionné : {value}
                    </span>
                </div>
            )}
        </div>
    );
}
