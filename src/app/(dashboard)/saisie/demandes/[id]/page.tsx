'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Edit,
    Loader2,
    User,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Demande {
    id: string;
    numeroEnregistrement: string;
    dateEnregistrement: string;
    statut: string;
    observations: string | null;
    appele: {
        nom: string;
        prenom: string;
        dateNaissance: string;
        lieuNaissance: string;
        email: string | null;
        telephone: string | null;
        whatsapp: string | null;
        diplome: string;
        promotion: string;
        numeroArrete: string | null;
        structure: string | null;
        dateDebutService: string;
        dateFinService: string;
    } | null;
    pieces: {
        type: string;
        present: boolean;
        conforme: boolean | null;
    }[];
    agent: {
        nom: string;
        prenom: string;
    } | null;
}

const statutColors: Record<string, string> = {
    ENREGISTREE: 'bg-gray-100 text-gray-800',
    EN_TRAITEMENT: 'bg-blue-100 text-blue-800',
    PIECES_NON_CONFORMES: 'bg-orange-100 text-orange-800',
    VALIDEE: 'bg-green-100 text-green-800',
    EN_ATTENTE_SIGNATURE: 'bg-purple-100 text-purple-800',
    SIGNEE: 'bg-indigo-100 text-indigo-800',
    REJETEE: 'bg-red-100 text-red-800',
    DELIVREE: 'bg-teal-100 text-teal-800',
};

const statutLabels: Record<string, string> = {
    ENREGISTREE: 'Enregistrée',
    EN_TRAITEMENT: 'En traitement',
    PIECES_NON_CONFORMES: 'Pièces non conformes',
    VALIDEE: 'Validée',
    EN_ATTENTE_SIGNATURE: 'En attente signature',
    SIGNEE: 'Signée',
    REJETEE: 'Rejetée',
    DELIVREE: 'Délivrée',
};

const piecesLabels: Record<string, string> = {
    DEMANDE_MANUSCRITE: 'Demande manuscrite',
    CERTIFICAT_ASSIDUITE: "Certificat d'assiduité",
    CERTIFICAT_CESSATION: 'Certificat de cessation',
    CERTIFICAT_PRISE_SERVICE: 'Certificat de prise de service',
    COPIE_ARRETE: "Copie de l'arrêté",
};

export default function DemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [demande, setDemande] = useState<Demande | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDemande();
    }, [resolvedParams.id]);

    const loadDemande = async () => {
        try {
            const response = await fetch(`/api/saisie/demandes/${resolvedParams.id}`);
            if (response.ok) {
                const data = await response.json();
                setDemande(data);
            }
        } catch (error) {
            console.error('Erreur chargement demande:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEdit = demande && ['ENREGISTREE', 'PIECES_NON_CONFORMES'].includes(demande.statut);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!demande) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Demande non trouvée</p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Demande {demande.numeroEnregistrement}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={statutColors[demande.statut]} variant="secondary">
                                {statutLabels[demande.statut]}
                            </Badge>
                        </div>
                    </div>
                </div>
                {canEdit && (
                    <Link href={`/saisie/demandes/${demande.id}/modifier`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de l'appelé */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Informations de l'appelé
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {demande.appele && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Nom</p>
                                        <p className="font-medium">{demande.appele.nom}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Prénom</p>
                                        <p className="font-medium">{demande.appele.prenom}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date de naissance</p>
                                        <p className="font-medium">
                                            {format(new Date(demande.appele.dateNaissance), 'dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Lieu de naissance</p>
                                        <p className="font-medium">{demande.appele.lieuNaissance}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium">{demande.appele.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Téléphone</p>
                                            <p className="font-medium">{demande.appele.telephone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Service civique */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            Service civique
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {demande.appele && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Diplôme</p>
                                        <p className="font-medium">{demande.appele.diplome}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Promotion</p>
                                        <p className="font-medium">{demande.appele.promotion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Numéro d'arrêté</p>
                                        <p className="font-medium">{demande.appele.numeroArrete || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Structure</p>
                                        <p className="font-medium">{demande.appele.structure || '-'}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Début de service</p>
                                            <p className="font-medium">
                                                {format(new Date(demande.appele.dateDebutService), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Fin de service</p>
                                            <p className="font-medium">
                                                {format(new Date(demande.appele.dateFinService), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Pièces du dossier */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            Pièces du dossier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {demande.pieces.map((piece) => (
                                <div
                                    key={piece.type}
                                    className={`p-4 rounded-lg border ${
                                        piece.present ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">
                                            {piecesLabels[piece.type] || piece.type}
                                        </span>
                                        {piece.present ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-xs ${piece.present ? 'text-green-600' : 'text-gray-500'}`}>
                                            {piece.present ? 'Présente' : 'Absente'}
                                        </span>
                                        {piece.conforme !== null && (
                                            <Badge variant={piece.conforme ? 'default' : 'destructive'} className="text-xs">
                                                {piece.conforme ? 'Conforme' : 'Non conforme'}
                                            </Badge>
                                        )}
                                        {piece.present && piece.conforme === null && (
                                            <Badge variant="outline" className="text-xs">
                                                <Clock className="h-3 w-3 mr-1" />
                                                À vérifier
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Observations */}
                {demande.observations && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Observations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{demande.observations}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
