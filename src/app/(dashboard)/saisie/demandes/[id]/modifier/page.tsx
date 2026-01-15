'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DemandeFormSaisie from '@/components/saisie/DemandeFormSaisie';

export default function ModifierDemandePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDemande();
    }, [resolvedParams.id]);

    const loadDemande = async () => {
        try {
            const response = await fetch(`/api/saisie/demandes/${resolvedParams.id}`);
            if (response.ok) {
                const demande = await response.json();

                // Vérifier si la demande peut être modifiée
                if (!['ENREGISTREE', 'PIECES_NON_CONFORMES'].includes(demande.statut)) {
                    setError('Cette demande ne peut plus être modifiée');
                    return;
                }

                // Transformer les données pour le formulaire
                setInitialData({
                    numeroEnregistrement: demande.numeroEnregistrement,
                    dateEnregistrement: new Date(demande.dateEnregistrement),
                    nom: demande.appele?.nom || '',
                    prenom: demande.appele?.prenom || '',
                    dateNaissance: demande.appele ? new Date(demande.appele.dateNaissance) : undefined,
                    lieuNaissance: demande.appele?.lieuNaissance || '',
                    email: demande.appele?.email || '',
                    telephone: demande.appele?.telephone || '',
                    whatsapp: demande.appele?.whatsapp || '',
                    whatsappIdentique: demande.appele?.telephone === demande.appele?.whatsapp,
                    diplome: demande.appele?.diplome || '',
                    promotion: demande.appele?.promotion || '',
                    numeroArrete: demande.appele?.numeroArrete || '',
                    structure: demande.appele?.structure || '',
                    dateDebutService: demande.appele ? new Date(demande.appele.dateDebutService) : undefined,
                    dateFinService: demande.appele ? new Date(demande.appele.dateFinService) : undefined,
                    pieces: demande.pieces.map((p: any) => ({
                        type: p.type,
                        present: p.present,
                    })),
                    observations: demande.observations || '',
                });
            } else {
                setError('Demande non trouvée');
            }
        } catch (err) {
            console.error('Erreur chargement demande:', err);
            setError('Erreur lors du chargement de la demande');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Modifier la demande
                    </h1>
                    <p className="text-gray-600">
                        Modifiez les informations de la demande {initialData?.numeroEnregistrement}
                    </p>
                </div>
            </div>

            <DemandeFormSaisie
                mode="edit"
                initialData={initialData}
                demandeId={resolvedParams.id}
            />
        </div>
    );
}
