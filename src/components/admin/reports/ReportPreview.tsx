'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Users, FileText, BarChart3 } from 'lucide-react';

interface ReportPreviewProps {
  reportType: 'demandes' | 'attestations' | 'agents';
}

export function ReportPreview({ reportType }: ReportPreviewProps) {
  const reportInfo = {
    demandes: {
      icon: FileText,
      title: 'Rapport des demandes',
      description: 'Export de toutes les demandes d\'attestation avec leurs statuts et informations complètes',
      columns: [
        'N° Enregistrement',
        'Nom et prénom de l\'appelé',
        'Promotion',
        'Statut de la demande',
        'Date d\'enregistrement',
        'Agent en charge',
        'Observations',
      ],
      example: 'Permet d\'analyser le volume de demandes par période, par promotion ou par agent.',
    },
    attestations: {
      icon: FileSpreadsheet,
      title: 'Rapport des attestations',
      description: 'Export de toutes les attestations générées et signées',
      columns: [
        'N° Attestation',
        'Nom et prénom de l\'appelé',
        'Date de génération',
        'Date de signature',
        'Type de signature',
        'Signataire',
        'Statut',
      ],
      example: 'Permet de suivre les attestations délivrées et le type de signature utilisé.',
    },
    agents: {
      icon: Users,
      title: 'Rapport d\'activité des agents',
      description: 'Statistiques de performance et d\'activité de chaque agent',
      columns: [
        'Nom de l\'agent',
        'Nombre de demandes traitées',
        'Nombre validées',
        'Nombre rejetées',
        'Taux de validation (%)',
        'Temps moyen de traitement (jours)',
      ],
      example: 'Permet d\'évaluer la performance des agents et identifier les besoins de formation.',
    },
  };

  const info = reportInfo[reportType];
  const Icon = info.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle>{info.title}</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Colonnes incluses dans l'export
          </h4>
          <ul className="space-y-1">
            {info.columns.map((column, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                {column}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Cas d'usage :</strong> {info.example}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Format d'export :</strong> Microsoft Excel (.xlsx) compatible avec Excel, LibreOffice et Google Sheets
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

