'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, FileText, Calendar, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttestationInfo {
    numero: string;
    nom: string;
    prenom: string;
    dateNaissance: Date;
    diplome: string;
    promotion: string;
    dateGeneration: Date;
    statut: string;
}

export default function VerifierPage() {
    const router = useRouter();
    const [numero, setNumero] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        valid: boolean;
        attestation?: AttestationInfo;
        reason?: string;
    } | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!numero.trim()) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Pour la vérification simple par numéro, on redirige vers la page de résultat
            // qui fera l'appel API avec les paramètres de signature
            router.push(`/verifier/${numero}`);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-100 py-12 px-4">
            <div className="container mx-auto max-w-2xl">
                {/* En-tête */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Vérification d'Attestation
                    </h1>
                    <p className="text-lg text-gray-600">
                        Service Civique National du Niger
                    </p>
                </div>

                {/* Formulaire de vérification */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Vérifier l'authenticité d'une attestation</CardTitle>
                        <CardDescription>
                            Saisissez le numéro d'attestation ou scannez le QR Code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <Label htmlFor="numero">Numéro d'attestation</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="numero"
                                        value={numero}
                                        onChange={(e) => setNumero(e.target.value)}
                                        placeholder="Ex: ATT-2026-00001"
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={loading || !numero.trim()}>
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                        <span className="ml-2">Vérifier</span>
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Le numéro se trouve en haut à droite de l'attestation
                                </p>
                            </div>

                            {/* Instructions */}
                            <Alert>
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-medium">Comment vérifier une attestation ?</p>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            <li>Saisissez le numéro d'attestation ci-dessus</li>
                                            <li>Ou scannez le QR Code avec votre smartphone</li>
                                            <li>Les informations de l'attestation s'afficheront si elle est valide</li>
                                        </ul>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </form>
                    </CardContent>
                </Card>

                {/* Informations supplémentaires */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>
                        Cette page permet de vérifier l'authenticité des attestations délivrées par
                        le Service Civique National.
                    </p>
                    <p className="mt-2">
                        En cas de doute, contactez le Service Civique National.
                    </p>
                </div>
            </div>
        </div>
    );
}

