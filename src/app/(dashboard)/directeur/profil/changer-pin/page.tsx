'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChangerPinPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [hasConfig, setHasConfig] = useState(false);
    const [checkingConfig, setCheckingConfig] = useState(true);

    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    useEffect(() => {
        checkConfiguration();
    }, []);

    const checkConfiguration = async () => {
        try {
            const response = await fetch('/api/directeur/signature/config');
            const data = await response.json();
            setHasConfig(data.configured);
        } catch (error) {
            console.error('Erreur vérification config:', error);
        } finally {
            setCheckingConfig(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{4,6}$/.test(currentPin)) {
            toast({
                title: 'Erreur',
                description: 'PIN actuel invalide (4-6 chiffres)',
                variant: 'destructive',
            });
            return;
        }

        if (!/^\d{4,6}$/.test(newPin)) {
            toast({
                title: 'Erreur',
                description: 'Le nouveau PIN doit contenir 4 à 6 chiffres',
                variant: 'destructive',
            });
            return;
        }

        if (newPin !== confirmPin) {
            toast({
                title: 'Erreur',
                description: 'Les nouveaux PIN ne correspondent pas',
                variant: 'destructive',
            });
            return;
        }

        if (currentPin === newPin) {
            toast({
                title: 'Erreur',
                description: 'Le nouveau PIN doit être différent de l\'ancien',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/directeur/signature/change-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPin, newPin }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du changement de PIN');
            }

            toast({
                title: 'Succès',
                description: 'Votre PIN a été modifié avec succès',
            });

            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (checkingConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!hasConfig) {
        return (
            <div className="max-w-md mx-auto">
                <Card>
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            Signature non configurée
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Vous devez d'abord configurer votre signature électronique avant de pouvoir changer votre PIN.
                        </p>
                        <Link href="/directeur/profil/signature">
                            <Button>Configurer ma signature</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Changer mon PIN</h1>
                <p className="text-gray-600">Modifiez le PIN de votre signature électronique</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Key className="h-5 w-5" />
                        Nouveau PIN
                    </CardTitle>
                    <CardDescription>
                        Entrez votre PIN actuel et définissez un nouveau PIN
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="currentPin">PIN actuel</Label>
                            <Input
                                id="currentPin"
                                type="password"
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                placeholder="••••"
                            />
                        </div>

                        <hr className="my-4" />

                        <div>
                            <Label htmlFor="newPin">Nouveau PIN</Label>
                            <Input
                                id="newPin"
                                type="password"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                placeholder="••••"
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPin">Confirmer le nouveau PIN</Label>
                            <Input
                                id="confirmPin"
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                placeholder="••••"
                            />
                        </div>

                        <Alert>
                            <AlertDescription>
                                Pour des raisons de sécurité, choisissez un PIN que vous n'utilisez pas ailleurs.
                            </AlertDescription>
                        </Alert>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Modification en cours...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Changer le PIN
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

