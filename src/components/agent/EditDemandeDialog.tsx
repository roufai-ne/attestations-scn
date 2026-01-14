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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';

interface EditDemandeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demande: any;
  onSuccess: () => void;
}

export function EditDemandeDialog({ open, onOpenChange, demande, onSuccess }: EditDemandeDialogProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    telephone: '',
    email: '',
    promotion: '',
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demande && demande.appele) {
      setFormData({
        nom: demande.appele.nom || '',
        prenom: demande.appele.prenom || '',
        dateNaissance: demande.appele.dateNaissance ? new Date(demande.appele.dateNaissance).toISOString().split('T')[0] : '',
        lieuNaissance: demande.appele.lieuNaissance || '',
        telephone: demande.appele.telephone || '',
        email: demande.appele.email || '',
        promotion: demande.appele.promotion || '',
        observations: demande.observations || '',
      });
    }
  }, [demande]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/demandes/${demande.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Demande modifiée avec succès');
        onOpenChange(false);
        onSuccess();
      } else {
        const data = await response.json();
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier la demande
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la demande. Les changements seront enregistrés immédiatement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="prenom">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
              <Input
                id="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={(e) => setFormData({ ...formData, lieuNaissance: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
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
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              placeholder="Observations ou remarques particulières..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
