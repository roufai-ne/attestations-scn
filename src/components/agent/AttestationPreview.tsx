'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ExternalLink, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttestationPreviewProps {
    attestation: {
        id: string;
        numero: string;
        dateGeneration: Date;
        statut: string;
    };
    demande: {
        id: string;
        appele: {
            nom: string;
            prenom: string;
        };
    };
}

export function AttestationPreview({ attestation, demande }: AttestationPreviewProps) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await fetch(`/api/attestations/${attestation.id}/download`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${attestation.numero}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
        } finally {
            setDownloading(false);
        }
    };

    const verificationUrl = `${window.location.origin}/verifier/${attestation.numero}`;

    return (
        <Card className="border-green-200 bg-green-50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-green-800">Attestation générée</CardTitle>
                    </div>
                    <Badge className="bg-green-600">
                        {attestation.statut === 'SIGNEE' ? 'Signée' : 'En attente de signature'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Informations */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Numéro</p>
                        <p className="font-semibold text-lg">{attestation.numero}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Date de génération</p>
                        <p className="font-medium">
                            {format(new Date(attestation.dateGeneration), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm text-gray-600">Titulaire</p>
                        <p className="font-medium">
                            {demande.appele.nom} {demande.appele.prenom}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleDownload} disabled={downloading} className="flex-1">
                        {downloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Télécharger le PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.open(verificationUrl, '_blank')}
                        className="flex-1"
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Page de vérification
                    </Button>
                </div>

                {/* Lien de vérification */}
                <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                        <p className="text-sm font-medium mb-1">Lien de vérification publique :</p>
                        <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                        >
                            {verificationUrl}
                        </a>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
