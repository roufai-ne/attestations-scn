'use client';

/**
 * Page du journal d'audit
 * Visualisation et export des logs d'audit système
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { Download, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filtres
  const [filters, setFilters] = useState({
    userId: 'ALL',
    action: 'ALL',
    dateDebut: '',
    dateFin: '',
    demandeId: '',
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?actif=true');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Ajouter les filtres non vides (exclure les valeurs 'ALL')
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ export: 'csv' });

      // Ajouter les filtres non vides (exclure les valeurs 'ALL')
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/audit?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

      // Télécharger le fichier
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Logs exportés avec succès');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export des logs');
    } finally {
      setExporting(false);
    }
  };

  const actionOptions = [
    { value: 'ALL', label: 'Toutes les actions' },
    { value: 'USER_LOGIN', label: 'Connexion utilisateur' },
    { value: 'USER_LOGOUT', label: 'Déconnexion utilisateur' },
    { value: 'USER_CREATED', label: 'Création utilisateur' },
    { value: 'USER_UPDATED', label: 'Modification utilisateur' },
    { value: 'USER_DELETED', label: 'Suppression utilisateur' },
    { value: 'DEMANDE_CREATED', label: 'Création demande' },
    { value: 'DEMANDE_UPDATED', label: 'Modification demande' },
    { value: 'DEMANDE_VALIDATED', label: 'Validation demande' },
    { value: 'DEMANDE_REJECTED', label: 'Rejet demande' },
    { value: 'ATTESTATION_GENERATED', label: 'Génération attestation' },
    { value: 'ATTESTATION_SIGNED', label: 'Signature attestation' },
    { value: 'ARRETE_UPLOADED', label: 'Upload arrêté' },
    { value: 'NOTIFICATION_SENT', label: 'Notification envoyée' },
    { value: 'CONFIG_UPDATED', label: 'Modification configuration' },
  ];

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Journal d'audit</h2>
        <p className="text-muted-foreground">
          Traçabilité complète de toutes les actions effectuées dans le système
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de recherche
          </CardTitle>
          <CardDescription>Affinez votre recherche dans les logs d'audit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Utilisateur */}
            <div>
              <Label>Utilisateur</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => setFilters({ ...filters, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les utilisateurs</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action */}
            <div>
              <Label>Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* N° Demande */}
            <div>
              <Label>N° Demande</Label>
              <Input
                placeholder="Ex: SCN-2024-001"
                value={filters.demandeId}
                onChange={(e) => setFilters({ ...filters, demandeId: e.target.value })}
              />
            </div>

            {/* Date début */}
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
              />
            </div>

            {/* Date fin */}
            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              Rechercher
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Export en cours...' : 'Exporter en CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs d'audit</CardTitle>
          <CardDescription>
            {pagination.total} log{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des logs...</p>
            </div>
          ) : (
            <AuditLogTable logs={logs} pagination={pagination} onPageChange={handlePageChange} />
          )}
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>À propos du journal d'audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Le journal d'audit enregistre toutes les actions importantes effectuées dans le système, y compris :
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Connexions et déconnexions des utilisateurs</li>
            <li>Création, modification et suppression d'utilisateurs</li>
            <li>Toutes les opérations sur les demandes d'attestation</li>
            <li>Génération et signature d'attestations</li>
            <li>Envoi de notifications</li>
            <li>Modifications de configuration</li>
          </ul>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Conservation :</strong> Les logs d'audit sont conservés indéfiniment pour assurer la
              traçabilité complète des opérations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
