'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';

interface ArreteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrete: {
    id: string;
    numero: string;
    dateArrete: string;
    promotion: string;
    annee: string;
  } | null;
  onSuccess: () => void;
}

export function ArreteEditDialog({ open, onOpenChange, arrete, onSuccess }: ArreteEditDialogProps) {
  const [formData, setFormData] = useState({
    numero: '',
    dateArrete: '',
    promotion: '',
    annee: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (arrete) {
      setFormData({
        numero: arrete.numero || '',
        dateArrete: arrete.dateArrete ? new Date(arrete.dateArrete).toISOString().split('T')[0] : '',
        promotion: arrete.promotion || '',
        annee: arrete.annee || '',
      });
    }
  }, [arrete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrete) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/arretes/${arrete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero,
          dateArrete: new Date(formData.dateArrete).toISOString(),
          promotion: formData.promotion,
          annee: formData.annee,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Arrêté modifié avec succès');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier l'arrêté
          </DialogTitle>
          <DialogDescription>
            Modifiez les métadonnées de l'arrêté. Le fichier PDF ne sera pas modifié.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="numero">
              Numéro d'arrêté <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="Ex: 2024/001/MESRIT/SCN"
              required
            />
          </div>

          <div>
            <Label htmlFor="dateArrete">
              Date de l'arrêté <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateArrete"
              type="date"
              value={formData.dateArrete}
              onChange={(e) => setFormData({ ...formData, dateArrete: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="promotion">
              Promotion <span className="text-red-500">*</span>
            </Label>
            <Input
              id="promotion"
              value={formData.promotion}
              onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
              placeholder="Ex: 2023-2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="annee">
              Année <span className="text-red-500">*</span>
            </Label>
            <Input
              id="annee"
              value={formData.annee}
              onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
              placeholder="Ex: 2024"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
