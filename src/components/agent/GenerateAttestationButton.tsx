'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateAttestationButtonProps {
    demandeId: string;
    statut: string;
}

export function GenerateAttestationButton({ demandeId, statut }: GenerateAttestationButtonProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/demandes/${demandeId}/generer-attestation`, {
                method: 'POST',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la génération');
            }

            toast({
                title: 'Attestation générée',
                description: `Numéro: ${result.attestation.numero}`,
            });

            router.refresh();
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur lors de la génération',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (statut !== 'VALIDEE') {
        return null;
    }

    return (
        <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileText className="mr-2 h-4 w-4" />
            )}
            Générer l'attestation
        </Button>
    );
}
