'use client';

/**
 * Page de détail d'une demande
 * Affichage, modification, validation/rejet
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Download,
} from 'lucide-react';
import { ValidationDialog } from '@/components/agent/ValidationDialog';
import { RejectionDialog } from '@/components/agent/RejectionDialog';
import { EditDemandeDialog } from '@/components/agent/EditDemandeDialog';

export default function DemandeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [demande, setDemande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validationOpen, setValidationOpen] = useState(false);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchDemande();
  }, [params.id]);

  const fetchDemande = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDemande(data);
      } else {
        toast.error('Demande non trouvée');
        router.push('/agent/demandes');
      }
    } catch (error) {
      console.error('Erreur chargement demande:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      ENREGISTREE: { label: 'Enregistrée', className: 'bg-blue-100 text-blue-800' },
      EN_TRAITEMENT: { label: 'En traitement', className: 'bg-yellow-100 text-yellow-800' },
      PIECES_NON_CONFORMES: { label: 'Pièces non conformes', className: 'bg-orange-100 text-orange-800' },
      VALIDEE: { label: 'Validée', className: 'bg-green-100 text-green-800' },
      EN_ATTENTE_SIGNATURE: { label: 'En attente signature', className: 'bg-purple-100 text-purple-800' },
      REJETEE: { label: 'Rejetée', className: 'bg-red-100 text-red-800' },
      DELIVREE: { label: 'Délivrée', className: 'bg-emerald-100 text-emerald-800' },
    };
    const config = configs[statut] || { label: statut, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const canEdit = () => {
    return demande && ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut);
  };

  const canValidate = () => {
    return demande && ['EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut);
  };

  const canReject = () => {
    return demande && ['EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la demande...</p>
        </div>
      </div>
    );
  }

  if (!demande) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Demande {demande.numeroEnregistrement}</h2>
            <p className="text-muted-foreground">
              Enregistrée le {new Date(demande.dateEnregistrement).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatutBadge(demande.statut)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canEdit() && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        )}
        {canValidate() && (
          <Button onClick={() => setValidationOpen(true)} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Valider
          </Button>
        )}
        {canReject() && (
          <Button variant="destructive" onClick={() => setRejectionOpen(true)}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        )}
        {demande.attestation && (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Télécharger l'attestation
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations de l'appelé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations de l'appelé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
              <p className="text-base font-semibold">
                {demande.appele?.nom} {demande.appele?.prenom}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                <p className="text-base">
                  {demande.appele?.dateNaissance
                    ? new Date(demande.appele.dateNaissance).toLocaleDateString('fr-FR')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lieu de naissance</p>
                <p className="text-base">{demande.appele?.lieuNaissance || 'N/A'}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <p className="text-base">{demande.appele?.telephone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{demande.appele?.email || 'N/A'}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Promotion</p>
              <p className="text-base font-semibold">{demande.appele?.promotion}</p>
            </div>
          </CardContent>
        </Card>

        {/* Informations de la demande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de la demande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">N° d'enregistrement</p>
              <p className="text-base font-semibold">{demande.numeroEnregistrement}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              {getStatutBadge(demande.statut)}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date d'enregistrement</p>
                <p className="text-base">
                  {new Date(demande.dateEnregistrement).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {demande.dateTraitement && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date de traitement</p>
                  <p className="text-base">
                    {new Date(demande.dateTraitement).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agent en charge</p>
              <p className="text-base">
                {demande.agent ? `${demande.agent.prenom} ${demande.agent.nom}` : 'Non assigné'}
              </p>
            </div>
            {demande.observations && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observations</p>
                  <p className="text-base">{demande.observations}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vérification des pièces */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Vérification des pièces du dossier
            </CardTitle>
            <CardDescription>État de conformité des pièces justificatives</CardDescription>
          </CardHeader>
          <CardContent>
            {demande.pieces && demande.pieces.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {demande.pieces.map((piece: any) => (
                  <div
                    key={piece.id}
                    className={`p-4 rounded-lg border ${
                      piece.conforme
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{piece.typePiece}</p>
                        {piece.observation && (
                          <p className="text-sm text-muted-foreground mt-1">{piece.observation}</p>
                        )}
                      </div>
                      {piece.conforme ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune pièce vérifiée</p>
            )}
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique de la demande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="w-px h-full bg-gray-200"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Demande enregistrée</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(demande.dateEnregistrement).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(demande.dateEnregistrement).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>

              {demande.dateTraitement && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="w-px h-full bg-gray-200"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Demande traitée</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(demande.dateTraitement).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(demande.dateTraitement).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {demande.attestation && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-purple-100 p-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Attestation générée</p>
                    <p className="text-sm text-muted-foreground">
                      N° {demande.attestation.numero}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ValidationDialog
        open={validationOpen}
        onOpenChange={setValidationOpen}
        demandeId={params.id}
        onSuccess={fetchDemande}
      />

      <RejectionDialog
        open={rejectionOpen}
        onOpenChange={setRejectionOpen}
        demandeId={params.id}
        onSuccess={fetchDemande}
      />

      <EditDemandeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        demande={demande}
        onSuccess={fetchDemande}
      />
    </div>
  );
}
