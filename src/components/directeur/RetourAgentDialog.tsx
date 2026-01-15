'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface RetourAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    demandeId: string;
    onSuccess: () => void;
}

export function RetourAgentDialog({
    open,
    onOpenChange,
    demandeId,
    onSuccess,
}: RetourAgentDialogProps) {
    const [remarque, setRemarque] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!remarque.trim()) {
            toast.error('Veuillez saisir une remarque');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/demandes/${demandeId}/retour-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarque }),
            });

            if (response.ok) {
                toast.success('Dossier retourné à l\'agent traitant');
                onOpenChange(false);
                setRemarque('');
                onSuccess();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Erreur lors du retour');
            }
        } catch (error) {
            console.error('Erreur retour agent:', error);
            toast.error('Erreur lors du retour');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeft className="h-5 w-5" />
                        Retourner le dossier à l'agent
                    </DialogTitle>
                    <DialogDescription>
                        Le dossier sera retourné en traitement avec votre remarque
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="remarque">Remarque *</Label>
                        <Textarea
                            id="remarque"
                            placeholder="Expliquez pourquoi vous retournez ce dossier..."
                            value={remarque}
                            onChange={(e) => setRemarque(e.target.value)}
                            rows={5}
                            className="mt-2"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Envoi...' : 'Retourner le dossier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
