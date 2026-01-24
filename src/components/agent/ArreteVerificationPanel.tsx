'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    AlertTriangle,
    Bell,
    RefreshCw,
} from 'lucide-react';

interface AppeleArrete {
    id: string;
    numero: number;
    nom: string;
    prenoms: string | null;
    dateNaissance: Date | string | null;
    lieuNaissance: string | null;
    diplome: string | null;
    lieuService: string | null;
    arrete: {
        id: string;
        numero: string;
        dateArrete: Date | string | null;
        promotion: string;
        annee: string;
    };
}

interface ArreteVerificationPanelProps {
    demandeId: string;
    appele: {
        nom: string;
        prenom: string;
        promotion: string;
        dateNaissance?: string | Date | null;
        lieuNaissance?: string | null;
    };
    statut: string;
    // État contrôlé par le parent
    isVerified?: boolean;
    savedArreteInfo?: AppeleArrete | null;
    onVerificationChange: (verified: boolean, arreteInfo?: AppeleArrete) => void;
}

type VerificationStatus = 'non_verifie' | 'en_cours' | 'trouve' | 'non_trouve';

export function ArreteVerificationPanel({
    demandeId,
    appele,
    statut,
    isVerified = false,
    savedArreteInfo = null,
    onVerificationChange,
}: ArreteVerificationPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<AppeleArrete[]>([]);
    const [sendingNotification, setSendingNotification] = useState(false);
    const [hasSearchedWithNoMatch, setHasSearchedWithNoMatch] = useState(false);

    // Utiliser l'état du parent si disponible
    const selectedResult = savedArreteInfo;

    // Calculer le statut de vérification
    const verificationStatus: VerificationStatus = isVerified
        ? 'trouve'
        : loading
            ? 'en_cours'
            : hasSearchedWithNoMatch
                ? 'non_trouve'
                : 'non_verifie';

    // Ref pour éviter la recherche automatique multiple
    const hasAutoSearched = useRef(false);
    const previousDemandeId = useRef(demandeId);

    // Recherche automatique au chargement avec les infos de l'appelé
    // Utilise une ref pour s'assurer que ça ne se fait qu'une fois par demande
    useEffect(() => {
        // Reset si on change de demande
        if (previousDemandeId.current !== demandeId) {
            hasAutoSearched.current = false;
            previousDemandeId.current = demandeId;
        }

        // Ne pas refaire la recherche si déjà fait ou si résultat déjà sélectionné par le parent
        if (hasAutoSearched.current || isVerified || savedArreteInfo) {
            return;
        }

        if (appele?.nom && appele?.prenom) {
            hasAutoSearched.current = true;
            const query = `${appele.nom} ${appele.prenom}`;
            setSearchQuery(query);
            handleSearch(query);
        }
    }, [appele?.nom, appele?.prenom, demandeId, isVerified, savedArreteInfo]);

    const handleSearch = async (query?: string) => {
        const searchTerm = query || searchQuery;
        if (!searchTerm || searchTerm.length < 2) {
            toast.error('Veuillez entrer au moins 2 caractères');
            return;
        }

        setLoading(true);
        setHasSearchedWithNoMatch(false);
        try {
            const response = await fetch(`/api/arretes/search?q=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.results || []);
                if (data.results && data.results.length > 0) {
                    // Chercher une correspondance exacte
                    const exactMatch = data.results.find((r: AppeleArrete) => {
                        const nomMatch = r.nom?.toUpperCase() === appele.nom?.toUpperCase();
                        const prenomMatch = r.prenoms?.toUpperCase().includes(appele.prenom?.toUpperCase());
                        return nomMatch && prenomMatch;
                    });

                    if (exactMatch) {
                        onVerificationChange(true, exactMatch);
                        toast.success('Appelé trouvé dans les arrêtés !');
                    } else {
                        // Des résultats mais pas de match exact
                        setHasSearchedWithNoMatch(false);
                    }
                } else {
                    // Aucun résultat
                    setHasSearchedWithNoMatch(true);
                }
            } else {
                toast.error('Erreur lors de la recherche');
            }
        } catch (error) {
            console.error('Erreur de recherche:', error);
            toast.error('Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectResult = (result: AppeleArrete) => {
        setHasSearchedWithNoMatch(false);
        onVerificationChange(true, result);
        toast.success(`Arrêté ${result.arrete.numero} sélectionné`);
    };

    const handleResetVerification = () => {
        hasAutoSearched.current = false;
        setHasSearchedWithNoMatch(false);
        onVerificationChange(false, undefined);
        setResults([]);
    };

    const handleSendNotification = async () => {
        setSendingNotification(true);
        try {
            const response = await fetch(`/api/demandes/${demandeId}/notify-copie-arrete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                toast.success('Notification envoyée à l\'appelé pour fournir une copie de l\'arrêté');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erreur lors de l\'envoi de la notification');
            }
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            toast.error('Erreur lors de l\'envoi de la notification');
        } finally {
            setSendingNotification(false);
        }
    };

    const handleMarkAbsenceArrete = async () => {
        try {
            const response = await fetch(`/api/demandes/${demandeId}/pieces-non-conformes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    piecesNonConformes: [
                        {
                            type: 'COPIE_ARRETE',
                            observation: 'Absence dans les arrêtés - Appelé non trouvé dans la base des arrêtés',
                        },
                    ],
                    observations: 'L\'appelé n\'a pas été trouvé dans les arrêtés du service civique.',
                }),
            });

            if (response.ok) {
                toast.success('Pièce marquée comme non conforme : Absence dans les arrêtés');
                onVerificationChange(false);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erreur lors du marquage');
            }
        } catch (error) {
            console.error('Erreur marquage pièce:', error);
            toast.error('Erreur lors du marquage');
        }
    };

    const canEdit = ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(statut);

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Vérification dans les arrêtés
                </CardTitle>
                <CardDescription>
                    Recherchez l'appelé dans la base des arrêtés pour valider sa présence
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statut de vérification */}
                <div className={`p-4 rounded-lg border-2 ${verificationStatus === 'trouve'
                    ? 'border-green-500 bg-green-50'
                    : verificationStatus === 'non_trouve'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-2">
                        {verificationStatus === 'trouve' ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">
                                    Appelé vérifié dans les arrêtés
                                </span>
                            </>
                        ) : verificationStatus === 'non_trouve' ? (
                            <>
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                <span className="font-medium text-orange-800">
                                    Appelé non trouvé dans les arrêtés
                                </span>
                            </>
                        ) : verificationStatus === 'en_cours' ? (
                            <>
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                <span className="font-medium text-blue-800">
                                    Recherche en cours...
                                </span>
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5 text-gray-500" />
                                <span className="font-medium text-gray-700">
                                    Vérification non effectuée
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Résultat sélectionné */}
                {selectedResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-green-800">
                                    {selectedResult.nom} {selectedResult.prenoms}
                                </p>
                                <div className="text-sm text-green-700 mt-1 space-y-1">
                                    <p>📋 Arrêté n° <strong>{selectedResult.arrete.numero}</strong></p>
                                    <p>📅 Date: {formatDate(selectedResult.arrete.dateArrete)}</p>
                                    <p>🎓 Promotion: {selectedResult.arrete.promotion}</p>
                                    <p>📍 N° dans l'arrêté: {selectedResult.numero}</p>
                                </div>
                            </div>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetVerification}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Formulaire de recherche */}
                {canEdit && !selectedResult && (
                    <>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="search-arrete" className="sr-only">
                                    Rechercher
                                </Label>
                                <Input
                                    id="search-arrete"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Nom, prénom, promotion..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button onClick={() => handleSearch()} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Résultats de recherche */}
                        {results.length > 0 && !selectedResult && (
                            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                                {results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => handleSelectResult(result)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {result.nom} {result.prenoms}
                                                </p>
                                                <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                                                    <span>Arrêté {result.arrete.numero}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {result.arrete.promotion}
                                                    </Badge>
                                                    <span>N° {result.numero}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                Sélectionner
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions si non trouvé */}
                        {verificationStatus === 'non_trouve' && (
                            <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800">
                                    <strong>Aucun résultat trouvé.</strong> Vous pouvez :
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSendNotification}
                                        disabled={sendingNotification}
                                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                    >
                                        {sendingNotification ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Bell className="h-4 w-4 mr-2" />
                                        )}
                                        Demander copie de l'arrêté
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleMarkAbsenceArrete}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Marquer absence dans arrêtés
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
