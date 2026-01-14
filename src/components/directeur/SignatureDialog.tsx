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
import { Loader2, Lock, AlertCircle } from 'lucide-react';
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
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSign = async () => {
        if (!pin || pin.length < 4) {
            setError('Veuillez saisir votre PIN');
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
                    ? { pin }
                    : { attestationIds, pin };

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Signature d'attestation(s)</DialogTitle>
                    <DialogDescription>
                        Vous êtes sur le point de signer {attestationIds.length} attestation(s).
                        Veuillez saisir votre PIN pour confirmer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="pin">PIN de signature</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Saisissez votre PIN"
                                className="pl-10"
                                maxLength={6}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSign();
                                    }
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            PIN de 4 à 6 chiffres configuré dans votre profil
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPin('');
                            setError(null);
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button onClick={handleSign} disabled={loading || !pin}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signature en cours...
                            </>
                        ) : (
                            'Signer'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
