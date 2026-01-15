'use client';

/**
 * Dashboard Administrateur
 * Vue d'ensemble avec statistiques globales et graphiques
 */

import { useEffect, useState } from 'react';
import { StatsCards } from '@/components/admin/dashboard/StatsCards';
import { DashboardCharts } from '@/components/admin/dashboard/DashboardCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  overview: {
    totalDemandes: number;
    enCours: number;
    validees: number;
    rejetees: number;
    signees: number;
    delivrees: number;
    tauxValidation: number;
  };
  statutCounts: Record<string, number>;
  monthlyData: Array<{ month: string; count: number }>;
  topAgents: Array<{ nom: string; count: number }>;
  topPromotions: Array<{ promotion: string; count: number }>;
  tempsTraitement: {
    moyenJours: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrateur</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'activité du Service Civique
          </p>
        </div>
      </div>

      {/* Cartes statistiques */}
      <StatsCards stats={stats.overview} />

      {/* Indicateurs de performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen de traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tempsTraitement.moyenJours} jours</div>
            <p className="text-xs text-muted-foreground">
              Objectif : 2-3 jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attestations signées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.signees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.delivrees} délivrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.tauxValidation}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.validees} validées / {stats.overview.rejetees} rejetées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <DashboardCharts
        monthlyData={stats.monthlyData}
        topAgents={stats.topAgents}
        topPromotions={stats.topPromotions}
        statutCounts={stats.statutCounts}
      />

      {/* Alertes système */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes système</CardTitle>
          <CardDescription>Notifications et points d'attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.overview.enCours > 10 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm">
                <strong>{stats.overview.enCours}</strong> demandes en cours de traitement
              </span>
            </div>
          )}

          {stats.tempsTraitement.moyenJours > 3 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm">
                Temps moyen de traitement supérieur à l'objectif (3 jours)
              </span>
            </div>
          )}

          {stats.overview.enCours === 0 && stats.overview.totalDemandes > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                ✓ Aucune demande en attente de traitement
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
