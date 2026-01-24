'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  actif: boolean;
}

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

const initialFormData = {
  email: '',
  nom: '',
  prenom: '',
  role: 'AGENT' as Role,
  password: '',
  actif: true,
};

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // Mettre à jour le formulaire quand l'utilisateur change ou que le modal s'ouvre
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          password: '',
          actif: user.actif,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';

      const body = user ?
        { nom: formData.nom, prenom: formData.prenom, email: formData.email, role: formData.role, actif: formData.actif } :
        formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(user ? 'Utilisateur modifié' : 'Utilisateur créé');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Modifier' : 'Créer'} un utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} required />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} required />
            </div>
          </div>
          <div>
            <Label>Rôle</Label>
            <Select value={formData.role} onValueChange={(value: Role) => setFormData({...formData, role: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SAISIE">Agent de saisie</SelectItem>
                <SelectItem value="AGENT">Agent traitant</SelectItem>
                <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!user && (
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8} />
            </div>
          )}
          {user && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Compte actif</Label>
                <p className="text-sm text-gray-500">
                  Désactiver le compte empêche l'utilisateur de se connecter
                </p>
              </div>
              <Switch
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData({...formData, actif: checked})}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'En cours...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
