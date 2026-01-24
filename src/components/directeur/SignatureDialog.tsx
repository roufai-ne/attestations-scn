'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, Mail, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attestationIds: string[];
    onSuccess: () => void;
}

export function SignatureDialog({
    open,
    onOpenChange,
    attestationIds,
    onSuccess,
}: SignatureDialogProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<'pin' | 'otp'>('pin');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Étape 1 : Demander un code OTP
    const handleRequestOTP = async () => {
        if (!pin || pin.length < 4) {
            setError('Veuillez saisir votre PIN');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/directeur/2fa/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SIGN_ATTESTATION',
                    pin,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la demande du code');
            }

            toast({
                title: 'Code envoyé',
                description: 'Un code de vérification a été envoyé à votre email',
            });

            setStep('otp');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            setError(errorMessage);
            toast({
                title: 'Erreur',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Étape 2 : Signer avec PIN + OTP
    const handleSign = async () => {
        if (!otp || otp.length !== 6) {
            setError('Veuillez saisir le code à 6 chiffres');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint =
                attestationIds.length === 1
                    ? `/api/directeur/attestations/${attestationIds[0]}/signer`
                    : '/api/directeur/attestations/signer-lot';

            const body =
                attestationIds.length === 1
                    ? { pin, otpCode: otp }
                    : { attestationIds, pin, otpCode: otp };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la signature');
            }

            toast({
                title: 'Signature réussie',
                description: result.message,
            });

            setPin('');
            setOtp('');
            setStep('pin');
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            setError(errorMessage);
            toast({
                title: 'Erreur',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPin('');
        setOtp('');
        setStep('pin');
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Signature sécurisée (2FA)
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'pin' ? (
                            <>
                                Vous êtes sur le point de signer {attestationIds.length} attestation(s).
                                Saisissez votre PIN pour recevoir un code de vérification.
                            </>
                        ) : (
                            <>
                                Un code de vérification a été envoyé à votre email.
                                Saisissez-le pour confirmer la signature.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 'pin' ? (
                        // Étape 1 : Saisie du PIN
                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN de signature</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="pin"
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Saisissez votre PIN"
                                    className="pl-10"
                                    maxLength={6}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRequestOTP();
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                PIN de 4 à 6 chiffres configuré dans votre profil
                            </p>
                        </div>
                    ) : (
                        // Étape 2 : Saisie du code OTP
                        <div className="space-y-2">
                            <Label htmlFor="otp">Code de vérification</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Code à 6 chiffres"
                                    className="pl-10 text-center text-lg tracking-widest"
                                    maxLength={6}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSign();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Code envoyé par email (valide 5 min)
                                </p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                        setStep('pin');
                                        setOtp('');
                                        setError(null);
                                    }}
                                    className="text-xs"
                                >
                                    Renvoyer le code
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    {step === 'pin' ? (
                        <Button onClick={handleRequestOTP} disabled={loading || !pin}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Recevoir le code
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleSign} disabled={loading || otp.length !== 6}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signature en cours...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Signer
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
