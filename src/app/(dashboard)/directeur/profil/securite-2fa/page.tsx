'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Shield,
    Smartphone,
    Mail,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Copy,
    ArrowLeft,
    QrCode,
    Key,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorStatus {
    enabled: boolean;
    currentMethod: 'email' | 'totp';
    methods: {
        email: {
            available: boolean;
            active: boolean;
        };
        totp: {
            available: boolean;
            configured: boolean;
            active: boolean;
        };
    };
}

interface SetupTOTPResponse {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}

export default function Securite2FAPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'email' | 'totp'>('email');
    const [setupMode, setSetupMode] = useState(false);
    const [totpSetup, setTotpSetup] = useState<SetupTOTPResponse | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);

    useEffect(() => {
        fetch2FAStatus();
    }, []);

    const fetch2FAStatus = async () => {
        try {
            const response = await fetch('/api/directeur/2fa/status');
            const data = await response.json();
            setStatus(data);
            setSelectedMethod(data.currentMethod || 'email');
        } catch (error) {
            console.error('Erreur chargement statut 2FA:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger le statut 2FA',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMethodChange = async (method: 'email' | 'totp') => {
        // Si on sélectionne TOTP mais qu'il n'est pas configuré, lancer la configuration
        if (method === 'totp' && !status?.methods.totp.configured) {
            await startTOTPSetup();
            return;
        }

        // Sinon, changer la méthode directement
        setSubmitting(true);
        try {
            const response = await fetch('/api/directeur/2fa/set-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du changement');
            }

            toast({
                title: 'Méthode modifiée',
                description: method === 'email'
                    ? 'Les codes seront envoyés par email'
                    : 'Utilisez votre application Authenticator',
            });

            setSelectedMethod(method);
            fetch2FAStatus();
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const startTOTPSetup = async () => {
        setSubmitting(true);
        try {
            const response = await fetch('/api/directeur/2fa/setup-totp', {
                method: 'POST',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la configuration');
            }

            setTotpSetup(data);
            setSetupMode(true);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const enableTOTP = async () => {
        if (!totpSetup || !verificationCode) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/directeur/2fa/enable-totp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: totpSetup.secret,
                    code: verificationCode,
                    backupCodes: totpSetup.backupCodes,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Code invalide');
            }

            toast({
                title: 'TOTP activé',
                description: 'L\'authentification par application est maintenant active',
            });

            setShowBackupCodes(true);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Code invalide',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetTOTP = async () => {
        if (!confirm('Êtes-vous sûr de vouloir reconfigurer TOTP ? Vous devrez rescanner le QR code.')) {
            return;
        }

        setSubmitting(true);
        try {
            // Désactiver l'ancien TOTP puis démarrer une nouvelle configuration
            await fetch('/api/directeur/2fa/disable-totp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true }),
            });

            // Démarrer une nouvelle configuration
            await startTOTPSetup();
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copié',
            description: 'Copié dans le presse-papiers',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    // Écran des codes de backup après activation TOTP
    if (showBackupCodes && totpSetup) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            TOTP activé avec succès
                        </CardTitle>
                        <CardDescription>
                            Conservez ces codes de secours en lieu sûr
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                <strong>Important :</strong> Ces codes ne seront plus affichés.
                                Notez-les dans un endroit sûr. Chaque code ne peut être utilisé qu&apos;une seule fois
                                si vous perdez l&apos;accès à votre application.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-2">
                            {totpSetup.backupCodes.map((code, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded font-mono text-sm"
                                >
                                    <span>{code}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(code)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => copyToClipboard(totpSetup.backupCodes.join('\n'))}
                            variant="outline"
                            className="w-full"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copier tous les codes
                        </Button>

                        <Button
                            onClick={() => {
                                setShowBackupCodes(false);
                                setSetupMode(false);
                                setTotpSetup(null);
                                setVerificationCode('');
                                fetch2FAStatus();
                            }}
                            className="w-full"
                        >
                            Terminé
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Écran de configuration TOTP (scan QR code)
    if (setupMode && totpSetup) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSetupMode(false);
                        setTotpSetup(null);
                        setVerificationCode('');
                    }}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Annuler
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Configuration Google Authenticator
                        </CardTitle>
                        <CardDescription>
                            Scannez le QR code avec votre application d&apos;authentification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <img
                                src={totpSetup.qrCode}
                                alt="QR Code TOTP"
                                className="mx-auto border rounded-lg p-2 bg-white"
                                style={{ width: 200, height: 200 }}
                            />
                        </div>

                        <Alert>
                            <AlertDescription>
                                <p className="mb-2 text-sm">
                                    Si vous ne pouvez pas scanner le QR code, entrez ce code manuellement :
                                </p>
                                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded font-mono text-xs">
                                    <span className="flex-1 break-all">{totpSetup.secret}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(totpSetup.secret)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="code">Code de vérification</Label>
                            <Input
                                id="code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl tracking-widest"
                            />
                            <p className="text-xs text-gray-500">
                                Entrez le code à 6 chiffres affiché dans votre application
                            </p>
                        </div>

                        <Button
                            onClick={enableTOTP}
                            disabled={submitting || verificationCode.length !== 6}
                            className="w-full"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Vérification...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activer TOTP
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Écran principal - Sélection de la méthode
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.push('/directeur/profil')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au profil
            </Button>

            <div>
                <h1 className="text-3xl font-bold">Authentification à Deux Facteurs</h1>
                <p className="text-gray-600">Choisissez comment recevoir vos codes de vérification</p>
            </div>

            {/* Sélection de la méthode */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Méthode de vérification
                    </CardTitle>
                    <CardDescription>
                        Sélectionnez votre méthode préférée pour recevoir les codes 2FA
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup
                        value={selectedMethod}
                        onValueChange={(value) => handleMethodChange(value as 'email' | 'totp')}
                        disabled={submitting}
                    >
                        {/* Option Email OTP */}
                        <div
                            className={`flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMethod === 'email'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => !submitting && handleMethodChange('email')}
                        >
                            <RadioGroupItem value="email" id="email" className="mt-1" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    <Label htmlFor="email" className="font-medium cursor-pointer">
                                        Email OTP
                                    </Label>
                                    {status?.methods.email.active && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            Actif
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Un code à 6 chiffres sera envoyé à votre adresse email à chaque signature.
                                    Le code expire après 5 minutes.
                                </p>
                            </div>
                        </div>

                        {/* Option TOTP */}
                        <div
                            className={`flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMethod === 'totp'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => !submitting && handleMethodChange('totp')}
                        >
                            <RadioGroupItem value="totp" id="totp" className="mt-1" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-purple-600" />
                                    <Label htmlFor="totp" className="font-medium cursor-pointer">
                                        Application Authenticator (TOTP)
                                    </Label>
                                    {status?.methods.totp.active && (
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                            Actif
                                        </span>
                                    )}
                                    {status?.methods.totp.configured && !status?.methods.totp.active && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                            Configuré
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Utilisez Google Authenticator, Authy ou une autre application TOTP.
                                    Les codes se renouvellent automatiquement toutes les 30 secondes.
                                </p>
                                {!status?.methods.totp.configured && (
                                    <p className="text-xs text-purple-600 mt-2 font-medium">
                                        Cliquez pour configurer l&apos;application
                                    </p>
                                )}
                            </div>
                        </div>
                    </RadioGroup>

                    {/* Bouton pour reconfigurer TOTP si déjà configuré */}
                    {status?.methods.totp.configured && (
                        <div className="pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetTOTP}
                                disabled={submitting}
                                className="text-gray-600"
                            >
                                <QrCode className="mr-2 h-4 w-4" />
                                Reconfigurer l&apos;application Authenticator
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                                Utile si vous avez changé de téléphone ou perdu l&apos;accès à l&apos;application
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info sécurité */}
            <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                    <strong>Rappel :</strong> La 2FA est obligatoire pour signer les attestations.
                    Elle ajoute une couche de sécurité en plus de votre PIN.
                </AlertDescription>
            </Alert>

            {/* Indicateur de chargement */}
            {submitting && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Modification en cours...</span>
                </div>
            )}
        </div>
    );
}
