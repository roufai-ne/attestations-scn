'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Key, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DirecteurProfilPage() {
    const [loading, setLoading] = useState(true);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        checkConfiguration();
    }, []);

    const checkConfiguration = async () => {
        try {
            const response = await fetch('/api/directeur/signature/config');
            const data = await response.json();
            setHasSignature(data.configured);
        } catch (error) {
            console.error('Erreur vérification config:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Mon Profil</h1>
                <p className="text-gray-600">Gérez votre signature électronique et vos paramètres de sécurité</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration Signature */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenTool className="h-5 w-5" />
                            Signature Électronique
                        </CardTitle>
                        <CardDescription>
                            {hasSignature
                                ? 'Votre signature est configurée'
                                : 'Configuration de votre signature numérique'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            {hasSignature ? (
                                <>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 font-medium">Signature active</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <span className="text-amber-700 font-medium">Signature non configurée</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {hasSignature
                                ? 'Modifiez votre image de signature, votre titre ou votre PIN de sécurité.'
                                : 'Configurez votre signature pour pouvoir signer les attestations.'}
                        </p>
                        <Link href="/directeur/profil/signature">
                            <Button className="w-full">
                                {hasSignature ? 'Modifier ma signature' : 'Configurer ma signature'}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Changer PIN */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            PIN de Sécurité
                        </CardTitle>
                        <CardDescription>
                            Code de 4 à 6 chiffres pour la signature
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            {hasSignature ? (
                                <>
                                    <Shield className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-700 font-medium">PIN actif</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <span className="text-amber-700 font-medium">PIN non défini</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {hasSignature
                                ? 'Modifiez votre PIN pour renforcer la sécurité de vos signatures.'
                                : 'Vous devez d\'abord configurer votre signature.'}
                        </p>
                        <Link href="/directeur/profil/changer-pin">
                            <Button
                                className="w-full"
                                variant={hasSignature ? 'default' : 'outline'}
                                disabled={!hasSignature}
                            >
                                Changer mon PIN
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Authentification 2FA */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Authentification à Deux Facteurs (2FA)
                        </CardTitle>
                        <CardDescription>
                            Protection supplémentaire avec double vérification (PIN + Code temporaire)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                        Sécurité renforcée
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Le système 2FA actuel utilise votre <strong>PIN</strong> comme premier facteur 
                                        et un <strong>code temporaire de 6 chiffres</strong> envoyé par email comme second facteur.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">Premier facteur : PIN</p>
                                        <p className="text-xs text-gray-600">
                                            Code de 4-6 chiffres que vous connaissez
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Actif</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">Second facteur : Code Email</p>
                                        <p className="text-xs text-gray-600">
                                            Code temporaire envoyé à votre email
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Actif</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                                <strong>Note :</strong> Le 2FA est automatiquement activé pour toutes les signatures. 
                                Assurez-vous d&apos;avoir accès à votre email pour recevoir les codes de vérification.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
