'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SignatureDialog } from '@/components/directeur/SignatureDialog';
import { RetourAgentDialog } from '@/components/directeur/RetourAgentDialog';
import { ArrowLeft, FileSignature, Download, User, Calendar, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DirecteurAttestationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [attestation, setAttestation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [retourDialogOpen, setRetourDialogOpen] = useState(false);

    useEffect(() => {
        loadAttestation();
    }, [id]);

    const loadAttestation = async () => {
        try {
            const response = await fetch(`/api/directeur/attestations/${id}`);
            if (response.ok) {
                const data = await response.json();
                setAttestation(data);
            } else {
                router.push('/directeur/attestations');
            }
        } catch (error) {
            console.error('Erreur chargement attestation:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatutBadge = (statut: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            GENEREE: { label: 'À signer', className: 'bg-blue-100 text-blue-800' },
            SIGNEE: { label: 'Signée', className: 'bg-green-100 text-green-800' },
            DELIVREE: { label: 'Délivrée', className: 'bg-gray-100 text-gray-800' },
        };
        const variant = variants[statut] || { label: statut, className: 'bg-gray-100' };
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!attestation) {
        return null;
    }

    return (
        <div className="space-y-6 p-8">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Attestation N° {attestation.numero}</h1>
                        <p className="text-gray-600">
                            Demande {attestation.demande?.numeroEnregistrement}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatutBadge(attestation.statut)}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {attestation.statut === 'GENEREE' && (
                    <>
                        <Button onClick={() => setSignatureDialogOpen(true)}>
                            <FileSignature className="h-4 w-4 mr-2" />
                            Signer l'attestation
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setRetourDialogOpen(true)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retourner à l'agent
                        </Button>
                    </>
                )}
                {attestation.fichierPath && (
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le PDF
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informations de l'appelé */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informations de l'appelé
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                            <p className="text-base font-semibold">
                                {attestation.demande?.appele?.nom} {attestation.demande?.appele?.prenom}
                            </p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                                <p className="text-base">
                                    {attestation.demande?.appele?.dateNaissance
                                        ? format(new Date(attestation.demande.appele.dateNaissance), 'dd/MM/yyyy', { locale: fr })
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Lieu de naissance</p>
                                <p className="text-base">{attestation.demande?.appele?.lieuNaissance || 'N/A'}</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Promotion</p>
                            <p className="text-base font-semibold">{attestation.demande?.appele?.promotion}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations de l'attestation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Détails de l'attestation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Numéro</p>
                            <p className="text-base font-semibold">{attestation.numero}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Date de génération</p>
                            <p className="text-base">
                                {format(new Date(attestation.dateGeneration), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </p>
                        </div>
                        {attestation.dateSignature && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Date de signature</p>
                                    <p className="text-base">
                                        {format(new Date(attestation.dateSignature), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                    </p>
                                </div>
                            </>
                        )}
                        {attestation.signataire && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Signataire</p>
                                    <p className="text-base">
                                        {attestation.signataire.nom} {attestation.signataire.prenom}
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <SignatureDialog
                open={signatureDialogOpen}
                onOpenChange={setSignatureDialogOpen}
                attestationIds={[id]}
                onSuccess={() => {
                    loadAttestation();
                }}
            />

            <RetourAgentDialog
                open={retourDialogOpen}
                onOpenChange={setRetourDialogOpen}
                demandeId={attestation.demande?.id}
                onSuccess={() => {
                    router.push('/directeur/attestations');
                }}
            />
        </div>
    );
}
