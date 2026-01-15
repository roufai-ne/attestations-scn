'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatsCards } from '@/components/directeur/StatsCards';
import { SignatureDialog } from '@/components/directeur/SignatureDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSignature, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DirecteurDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [attestationsEnAttente, setAttestationsEnAttente] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [selectedAttestations, setSelectedAttestations] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, attestationsRes] = await Promise.all([
                fetch('/api/directeur/stats'),
                fetch('/api/directeur/attestations?statut=GENEREE&limit=10'),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                console.log('Stats data:', statsData);
                setStats(statsData);
            }

            if (attestationsRes.ok) {
                const attestationsData = await attestationsRes.json();
                console.log('Attestations data:', attestationsData);
                // L'API retourne { attestations: [], pagination: {} }
                const attestations = attestationsData.attestations || [];
                setAttestationsEnAttente(Array.isArray(attestations) ? attestations : []);
            } else {
                console.error('Erreur API attestations:', attestationsRes.status, await attestationsRes.text());
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignAll = () => {
        const ids = attestationsEnAttente.map((a) => a.id);
        setSelectedAttestations(ids);
        setSignatureDialogOpen(true);
    };

    const handleSignOne = (id: string) => {
        setSelectedAttestations([id]);
        setSignatureDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Tableau de bord Directeur</h1>
                <p className="text-gray-600">Vue d'ensemble et gestion des attestations</p>
            </div>

            {stats && <StatsCards stats={stats.attestations} />}

            {stats?.alertes?.dossiersAnciens > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {stats.alertes.dossiersAnciens} attestation(s) en attente depuis plus de 7 jours
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Attestations en attente de signature</CardTitle>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => router.push('/directeur/attestations')}
                            >
                                Voir toutes les attestations
                            </Button>
                            {attestationsEnAttente.length > 0 && (
                                <Button onClick={handleSignAll}>
                                    <FileSignature className="mr-2 h-4 w-4" />
                                    Signer tout ({attestationsEnAttente.length})
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {attestationsEnAttente.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            Aucune attestation en attente
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {attestationsEnAttente.map((attestation) => (
                                <div
                                    key={attestation.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium">{attestation.numero}</p>
                                        <p className="text-sm text-gray-600">
                                            {attestation.demande?.appele?.nom} {attestation.demande?.appele?.prenom}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Générée le {format(new Date(attestation.dateGeneration), 'dd MMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSignOne(attestation.id)}
                                    >
                                        Signer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <SignatureDialog
                open={signatureDialogOpen}
                onOpenChange={setSignatureDialogOpen}
                attestationIds={selectedAttestations}
                onSuccess={loadData}
            />
        </div>
    );
}
