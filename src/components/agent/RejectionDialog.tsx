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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { XCircle, Bell } from 'lucide-react';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandeId: string;
  onSuccess: () => void;
}

export function RejectionDialog({ open, onOpenChange, demandeId, onSuccess }: RejectionDialogProps) {
  const [motif, setMotif] = useState('');
  const [envoyerNotification, setEnvoyerNotification] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!motif.trim()) {
      toast.error('Le motif de rejet est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${demandeId}/rejeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif, envoyerNotification }),
      });

      if (response.ok) {
        toast.success('Demande rejetée');
        onOpenChange(false);
        setMotif('');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rejeter la demande
          </DialogTitle>
          <DialogDescription>
            Indiquez le motif du rejet. L'appelé sera notifié avec les raisons du refus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="motif">
              Motif du rejet <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motif"
              placeholder="Expliquez les raisons du rejet (pièces manquantes, informations incorrectes, etc.)..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={5}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Soyez précis pour permettre à l'appelé de corriger sa demande
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Checkbox
              id="envoyerNotification"
              checked={envoyerNotification}
              onCheckedChange={(checked) => setEnvoyerNotification(checked as boolean)}
            />
            <Label htmlFor="envoyerNotification" className="flex items-center gap-2 cursor-pointer">
              <Bell className="h-4 w-4" />
              Envoyer une notification à l'appelé
            </Label>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Après rejet :</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Le statut passera à "Rejetée"</li>
                <li>L'appelé recevra une notification avec le motif</li>
                <li>La demande ne pourra plus être traitée</li>
              </ul>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading}>
            {loading ? 'Rejet en cours...' : 'Confirmer le rejet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
