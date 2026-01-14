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
import { CheckCircle } from 'lucide-react';

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandeId: string;
  onSuccess: () => void;
}

export function ValidationDialog({ open, onOpenChange, demandeId, onSuccess }: ValidationDialogProps) {
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${demandeId}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observations }),
      });

      if (response.ok) {
        toast.success('Demande validée avec succès');
        onOpenChange(false);
        setObservations('');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Valider la demande
          </DialogTitle>
          <DialogDescription>
            Confirmez la validation de cette demande. L'appelé sera notifié et l'attestation pourra être générée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="observations">Observations (optionnel)</Label>
            <Textarea
              id="observations"
              placeholder="Ajoutez des observations si nécessaire..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Après validation :</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Le statut passera à "Validée"</li>
                <li>L'appelé recevra une notification</li>
                <li>Vous pourrez générer l'attestation</li>
              </ul>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleValidate} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? 'Validation en cours...' : 'Confirmer la validation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
