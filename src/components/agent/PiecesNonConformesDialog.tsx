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
import { AlertTriangle } from 'lucide-react';

interface Piece {
  id: string;
  type: string;
  typePiece?: string;
  present: boolean;
  conforme: boolean;
  observation?: string;
}

interface PiecesNonConformesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandeId: string;
  pieces: Piece[];
  onSuccess: () => void;
}

const piecesLabels: Record<string, string> = {
  DEMANDE_MANUSCRITE: 'Demande manuscrite',
  CERTIFICAT_ASSIDUITE: "Certificat d'assiduité",
  CERTIFICAT_CESSATION: 'Certificat de cessation de service',
  CERTIFICAT_PRISE_SERVICE: 'Certificat de prise de service',
  COPIE_ARRETE: "Copie de l'arrêté",
};

export function PiecesNonConformesDialog({
  open,
  onOpenChange,
  demandeId,
  pieces,
  onSuccess,
}: PiecesNonConformesDialogProps) {
  const [selectedPieces, setSelectedPieces] = useState<{ type: string; observation: string }[]>([]);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePieceToggle = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedPieces([...selectedPieces, { type, observation: '' }]);
    } else {
      setSelectedPieces(selectedPieces.filter((p) => p.type !== type));
    }
  };

  const handlePieceObservation = (type: string, observation: string) => {
    setSelectedPieces(
      selectedPieces.map((p) => (p.type === type ? { ...p, observation } : p))
    );
  };

  const handleSubmit = async () => {
    if (selectedPieces.length === 0) {
      toast.error('Veuillez sélectionner au moins une pièce non conforme');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${demandeId}/pieces-non-conformes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piecesNonConformes: selectedPieces,
          observations,
        }),
      });

      if (response.ok) {
        toast.success('Pièces signalées comme non conformes');
        onOpenChange(false);
        setSelectedPieces([]);
        setObservations('');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors du signalement');
      }
    } catch (error) {
      console.error('Erreur signalement pièces:', error);
      toast.error('Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Signaler des pièces non conformes
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les pièces qui ne sont pas conformes. L'appelé sera notifié.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
          {pieces.map((piece) => {
            const type = piece.type || piece.typePiece || '';
            const isSelected = selectedPieces.some((p) => p.type === type);
            return (
              <div
                key={piece.id}
                className={`p-4 rounded-lg border ${
                  isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`piece-${piece.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePieceToggle(type, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`piece-${piece.id}`} className="font-medium cursor-pointer">
                      {piecesLabels[type] || type}
                    </Label>
                    {isSelected && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Précisez le problème..."
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          value={selectedPieces.find((p) => p.type === type)?.observation || ''}
                          onChange={(e) => handlePieceObservation(type, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="space-y-2">
            <Label htmlFor="observations">Observations générales (optionnel)</Label>
            <Textarea
              id="observations"
              placeholder="Ajoutez des observations générales..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-800">
              <strong>Après signalement :</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Le statut passera à "Pièces non conformes"</li>
                <li>L'appelé recevra une notification</li>
                <li>Il pourra régulariser son dossier</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedPieces.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Signalement en cours...' : 'Signaler les pièces'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
