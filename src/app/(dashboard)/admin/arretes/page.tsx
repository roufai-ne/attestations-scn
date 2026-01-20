'use client';

import { useEffect, useState } from 'react';
import { ArretesDataTable } from '@/components/admin/ArretesDataTable';
import { ArreteUploadDialogButton } from '@/components/admin/ArreteUploadDialogButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function ArretesPage() {
  const [stats, setStats] = useState<any>(null);
  const [arretes, setArretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexProgress, setReindexProgress] = useState<{
    total: number;
    processed: number;
    success: number;
    errors: number;
  } | null>(null);

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

  const handleReindexAll = async (onlyErrors: boolean = false) => {
    try {
      setReindexing(true);
      setReindexProgress(null);

      const response = await fetch('/api/admin/arretes/reindex-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyErrors }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la ré-indexation');
      }

      const result = await response.json();

      setReindexProgress({
        total: result.processed,
        processed: result.processed,
        success: result.success,
        errors: result.errors,
      });

      if (result.errors > 0) {
        toast.warning(`Ré-indexation terminée: ${result.success} réussis, ${result.errors} erreurs`);
      } else {
        toast.success(`Ré-indexation terminée: ${result.success} arrêtés traités`);
      }

      // Recharger les données
      await loadData();

    } catch (error) {
      console.error('Erreur ré-indexation:', error);
      toast.error('Erreur lors de la ré-indexation');
    } finally {
      setReindexing(false);
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

  const hasErrors = (defaultStats.byStatus.ERREUR || 0) > 0;
  const hasPending = (defaultStats.byStatus.EN_ATTENTE || 0) > 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Arrêtés</h1>
          <p className="text-gray-600 mt-1">
            Upload et indexation OCR des arrêtés de service civique
          </p>
        </div>
        <div className="flex gap-2">
          <ArreteUploadDialogButton />
        </div>
      </div>

      {/* Barre de progression si ré-indexation en cours */}
      {reindexing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Ré-indexation en cours...</p>
                <p className="text-xs text-blue-600">Veuillez patienter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat de la ré-indexation */}
      {reindexProgress && !reindexing && (
        <Card className={reindexProgress.errors > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className={`h-5 w-5 ${reindexProgress.errors > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-sm font-medium">
                    Ré-indexation terminée
                  </p>
                  <p className="text-xs text-gray-600">
                    {reindexProgress.success} réussis, {reindexProgress.errors} erreurs sur {reindexProgress.total} total
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReindexProgress(null)}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-sm font-medium">Indexés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {defaultStats.byStatus.INDEXE || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Prêts pour recherche</p>
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
            <p className="text-xs text-gray-500 mt-1">En traitement OCR</p>
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
            <p className="text-xs text-gray-500 mt-1">Nécessitent attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions de ré-indexation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Ré-indexation OCR
          </CardTitle>
          <CardDescription>
            Relancer l'extraction de texte OCR sur les arrêtés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => handleReindexAll(false)}
              disabled={reindexing || defaultStats.total === 0}
            >
              {reindexing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Ré-indexer tous ({defaultStats.total})
            </Button>

            {hasErrors && (
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => handleReindexAll(true)}
                disabled={reindexing}
              >
                {reindexing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Ré-indexer les erreurs ({defaultStats.byStatus.ERREUR})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des arrêtés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Arrêtés</CardTitle>
          <CardDescription>
            Gérez les arrêtés uploadés et leur statut d'indexation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArretesDataTable initialData={arretes} />
        </CardContent>
      </Card>
    </div>
  );
}

