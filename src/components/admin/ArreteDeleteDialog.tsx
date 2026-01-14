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
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ArreteDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrete: {
    id: string;
    numero: string;
  } | null;
  onSuccess: () => void;
}

export function ArreteDeleteDialog({ open, onOpenChange, arrete, onSuccess }: ArreteDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!arrete) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/arretes/${arrete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Arrêté ${arrete.numero} supprimé avec succès`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'arrêté
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. L'arrêté et son fichier PDF seront définitivement supprimés.
          </DialogDescription>
        </DialogHeader>

        {arrete && (
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Arrêté à supprimer:</p>
              <p className="text-lg font-bold text-red-600 mt-1">{arrete.numero}</p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Êtes-vous sûr de vouloir continuer ?
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
