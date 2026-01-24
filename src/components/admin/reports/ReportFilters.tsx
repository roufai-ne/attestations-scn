'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ReportFiltersProps {
  reportType: 'demandes' | 'attestations' | 'agents';
  onExport: (filters: Record<string, string>) => void;
  loading: boolean;
}

interface Agent {
  id: string;
  nom: string;
  prenom: string;
}

export function ReportFilters({ reportType, onExport, loading }: ReportFiltersProps) {
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    statut: 'TOUS',
    promotion: 'ALL',
    agentId: 'ALL',
    typeSignature: 'TOUS',
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [promotions, setPromotions] = useState<string[]>([]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?role=AGENT&actif=true');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    try {
      const response = await fetch('/api/demandes/promotions');
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
    }
  }, []);

  useEffect(() => {
    if (reportType === 'demandes') {
      const loadData = async () => {
        await Promise.all([fetchAgents(), fetchPromotions()]);
      };
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const handleExport = () => {
    // Nettoyer les filtres vides
    const cleanFilters: Record<string, string> = {};
    (Object.keys(filters) as Array<keyof typeof filters>).forEach((key) => {
      const value = filters[key];
      if (value && value !== 'TOUS' && value !== 'ALL') {
        cleanFilters[key] = value;
      }
    });
    onExport(cleanFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtres du rapport</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Période */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date début</Label>
            <Input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
            />
          </div>
          <div>
            <Label>Date fin</Label>
            <Input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
            />
          </div>
        </div>

        {/* Filtres spécifiques aux demandes */}
        {reportType === 'demandes' && (
          <>
            <div>
              <Label>Statut</Label>
              <Select value={filters.statut} onValueChange={(value) => setFilters({ ...filters, statut: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOUS">Tous les statuts</SelectItem>
                  <SelectItem value="ENREGISTREE">Enregistrée</SelectItem>
                  <SelectItem value="EN_TRAITEMENT">En traitement</SelectItem>
                  <SelectItem value="PIECES_NON_CONFORMES">Pièces non conformes</SelectItem>
                  <SelectItem value="VALIDEE">Validée</SelectItem>
                  <SelectItem value="EN_ATTENTE_SIGNATURE">En attente signature</SelectItem>
                  <SelectItem value="SIGNEE">Signée</SelectItem>
                  <SelectItem value="REJETEE">Rejetée</SelectItem>
                  <SelectItem value="DELIVREE">Délivrée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Promotion</Label>
              <Select value={filters.promotion} onValueChange={(value) => setFilters({ ...filters, promotion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les promotions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les promotions</SelectItem>
                  {promotions.map((promo) => (
                    <SelectItem key={promo} value={promo}>
                      {promo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agent</Label>
              <Select value={filters.agentId} onValueChange={(value) => setFilters({ ...filters, agentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.prenom} {agent.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Filtres spécifiques aux attestations */}
        {reportType === 'attestations' && (
          <div>
            <Label>Type de signature</Label>
            <Select
              value={filters.typeSignature}
              onValueChange={(value) => setFilters({ ...filters, typeSignature: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUS">Tous les types</SelectItem>
                <SelectItem value="ELECTRONIQUE">Électronique</SelectItem>
                <SelectItem value="MANUSCRITE">Manuscrite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bouton d'export */}
        <Button onClick={handleExport} disabled={loading} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Génération en cours...' : 'Générer et télécharger le rapport Excel'}
        </Button>
      </CardContent>
    </Card>
  );
}
