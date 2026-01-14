'use client';

/**
 * Page des rapports administrateur
 * Génération et export de rapports Excel
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportFilters } from '@/components/admin/reports/ReportFilters';
import { ReportPreview } from '@/components/admin/reports/ReportPreview';
import { toast } from 'sonner';
import { FileText, FileSpreadsheet, Users } from 'lucide-react';

export default function RapportsPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (reportType: 'demandes' | 'attestations' | 'agents', filters: any) => {
    setLoading(true);

    try {
      // Construire l'URL avec les paramètres de filtre
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const url = `/api/admin/reports/${reportType}?${params.toString()}`;

      // Télécharger le fichier
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      // Récupérer le blob et le nom de fichier
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Rapport exporté avec succès');
    } catch (error) {
      console.error('Erreur export rapport:', error);
      toast.error('Erreur lors de l\'export du rapport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rapports et Exports</h2>
        <p className="text-muted-foreground">
          Générez des rapports Excel pour analyser l'activité du Service Civique
        </p>
      </div>

      <Tabs defaultValue="demandes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demandes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="attestations" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Attestations
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        {/* Rapport des demandes */}
        <TabsContent value="demandes">
          <div className="grid gap-6 md:grid-cols-2">
            <ReportFilters
              reportType="demandes"
              onExport={(filters) => handleExport('demandes', filters)}
              loading={loading}
            />
            <ReportPreview reportType="demandes" />
          </div>
        </TabsContent>

        {/* Rapport des attestations */}
        <TabsContent value="attestations">
          <div className="grid gap-6 md:grid-cols-2">
            <ReportFilters
              reportType="attestations"
              onExport={(filters) => handleExport('attestations', filters)}
              loading={loading}
            />
            <ReportPreview reportType="attestations" />
          </div>
        </TabsContent>

        {/* Rapport des agents */}
        <TabsContent value="agents">
          <div className="grid gap-6 md:grid-cols-2">
            <ReportFilters
              reportType="agents"
              onExport={(filters) => handleExport('agents', filters)}
              loading={loading}
            />
            <ReportPreview reportType="agents" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Informations complémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'utilisation</CardTitle>
          <CardDescription>Conseils pour générer des rapports pertinents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Rapport des demandes</h4>
            <p className="text-sm text-muted-foreground">
              Utilisez les filtres pour analyser les demandes par période, statut, promotion ou agent. Idéal pour
              identifier les pics d'activité et les demandes en attente.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Rapport des attestations</h4>
            <p className="text-sm text-muted-foreground">
              Exportez la liste des attestations délivrées pour le suivi administratif. Permet de vérifier les
              signatures et dates de délivrance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Rapport d'activité des agents</h4>
            <p className="text-sm text-muted-foreground">
              Analysez la performance de chaque agent : nombre de demandes traitées, taux de validation, temps moyen.
              Utile pour l'évaluation et la formation.
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>Astuce :</strong> Pour des rapports mensuels, sélectionnez le 1er et le dernier jour du mois
              dans les filtres de période.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
