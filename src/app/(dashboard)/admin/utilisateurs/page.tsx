'use client';

/**
 * Page de gestion des utilisateurs (Admin)
 * Permet de créer, modifier, désactiver et réinitialiser les mots de passe
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Search, MoreVertical, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';
import { UserFormModal } from '@/components/admin/users/UserFormModal';
import { Role } from '@prisma/client';
import { useConfirm } from '@/components/shared/ConfirmProvider';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  actif: boolean;
  createdAt: string;
  _count: {
    demandesTraitees: number;
    attestationsSignees: number;
  };
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirm = useConfirm();

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Désactiver l\'utilisateur',
      description: 'Êtes-vous sûr de vouloir désactiver cet utilisateur ? Il ne pourra plus se connecter.',
      confirmText: 'Désactiver',
      cancelText: 'Annuler',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Utilisateur désactivé');
        fetchUsers();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur serveur');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Entrez le nouveau mot de passe (min 8 caractères):');
    if (!newPassword || newPassword.length < 8) {
      toast.error('Mot de passe trop court');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        toast.success('Mot de passe réinitialisé');
      } else {
        toast.error('Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      toast.error('Erreur serveur');
    }
  };

  const getRoleBadge = (role: Role) => {
    const colors: Record<Role, string> = {
      ADMIN: 'bg-purple-500',
      DIRECTEUR: 'bg-blue-500',
      AGENT: 'bg-green-500',
      SAISIE: 'bg-orange-500',
    };
    const labels: Record<Role, string> = {
      ADMIN: 'Admin',
      DIRECTEUR: 'Directeur',
      AGENT: 'Agent traitant',
      SAISIE: 'Agent saisie',
    };
    return <Badge className={colors[role]}>{labels[role]}</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-gray-500 mt-2">
            Créer et gérer les comptes agents, directeurs et administrateurs
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Rechercher par nom, prénom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="ADMIN">Administrateurs</SelectItem>
            <SelectItem value="DIRECTEUR">Directeurs</SelectItem>
            <SelectItem value="AGENT">Agents traitants</SelectItem>
            <SelectItem value="SAISIE">Agents de saisie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Demandes traitées</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.prenom} {user.nom}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.actif ? (
                      <Badge variant="default" className="bg-green-500">Actif</Badge>
                    ) : (
                      <Badge variant="destructive">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user._count.demandesTraitees}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de création/édition */}
      <UserFormModal
        open={showModal}
        onOpenChange={setShowModal}
        user={selectedUser}
        onSuccess={() => {
          setShowModal(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
