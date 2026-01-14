import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ArretesDataTable } from '@/components/admin/ArretesDataTable';
import { ArreteUploadDialogButton } from '@/components/admin/ArreteUploadDialogButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { arreteService } from '@/lib/services/arrete.service';

export const metadata = {
  title: 'Gestion des Arrêtés | Admin',
  description: 'Gestion et indexation des arrêtés de service civique',
};

async function getStats() {
  try {
    return await arreteService.getIndexationStats();
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
    return {
      total: 0,
      byStatus: {
        EN_ATTENTE: 0,
        EN_COURS: 0,
        INDEXE: 0,
        ERREUR: 0,
      },
    };
  }
}

async function getArretes() {
  try {
    const result = await arreteService.listArretes({ page: 1, limit: 100 });
    return result.data;
  } catch (error) {
    console.error('Erreur lors du chargement des arrêtés:', error);
    return [];
  }
}

export default async function ArretesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const [stats, arretes] = await Promise.all([getStats(), getArretes()]);

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
        <ArreteUploadDialogButton />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
              {stats.byStatus.INDEXE || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Prêts pour recherche</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(stats.byStatus.EN_ATTENTE || 0) + (stats.byStatus.EN_COURS || 0)}
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
              {stats.byStatus.ERREUR || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Nécessitent attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des arrêtés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Arrêtés</CardTitle>
          <CardDescription>
            Gérez les arrêtés uploadés et leur statut d'indexation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Chargement...</div>}>
            <ArretesDataTable initialData={arretes} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
