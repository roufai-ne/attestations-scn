'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSuccess: () => void;
}

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    role: user?.role || 'AGENT',
    password: '',
    actif: user?.actif ?? true,
  });
  const [loading, setLoading] = useState(false);

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
            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENT">Agent</SelectItem>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'En cours...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
