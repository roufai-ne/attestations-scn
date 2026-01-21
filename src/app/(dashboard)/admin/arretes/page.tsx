/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ArretesDataTable } from '@/components/admin/ArretesDataTable';
import { ArreteUploadDialogButton } from '@/components/admin/ArreteUploadDialogButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ArretesPage() {
  
  const [stats, setStats] = useState<any>(null);
  const [arretes, setArretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stats from API
      const statsResponse = await fetch('/api/admin/arretes/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load arretes list from API  
      const arretesResponse = await fetch('/api/admin/arretes');
      if (arretesResponse.ok) {
        const arretesData = await arretesResponse.json();
        setArretes(arretesData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const defaultStats = stats || {
    total: 0,
    byStatus: {
      EN_ATTENTE: 0,
      EN_COURS: 0,
      INDEXE: 0,
      ERREUR: 0,
    },
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Arrêtés</h1>
          <p className="text-gray-600 mt-1">
            Upload et gestion des arrêtés de service civique
          </p>
        </div>
        <div className="flex gap-2">
          <ArreteUploadDialogButton />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Arrêtés uploadés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avec appelés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultStats.byStatus.INDEXE || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Appelés extraits</p>
            {defaultStats.total > 0 && (
              <Progress
                value={(defaultStats.byStatus.INDEXE / defaultStats.total) * 100}
                className="mt-2 h-1"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(defaultStats.byStatus.EN_ATTENTE || 0) + (defaultStats.byStatus.EN_COURS || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Arrêtés sans appelés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {defaultStats.byStatus.ERREUR || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Nécessitent vérification</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des arrêtés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Arrêtés</CardTitle>
          <CardDescription>
            Gérez les arrêtés et leurs appelés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArretesDataTable initialData={arretes} />
        </CardContent>
      </Card>
    </div>
  );
}

