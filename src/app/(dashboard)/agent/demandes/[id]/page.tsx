'use client';

/**
 * Page de détail d'une demande
 * Affichage, modification, validation/rejet
 */

import { use, useEffect, useState } from 'react';
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
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ValidationDialog } from '@/components/agent/ValidationDialog';
import { RejectionDialog } from '@/components/agent/RejectionDialog';
import { EditDemandeDialog } from '@/components/agent/EditDemandeDialog';
import { ArreteVerificationPanel } from '@/components/agent/ArreteVerificationPanel';

export default function DemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [demande, setDemande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validationOpen, setValidationOpen] = useState(false);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [verifyingPiece, setVerifyingPiece] = useState<string | null>(null);
  const [arreteVerified, setArreteVerified] = useState<boolean>(false);
  const [arreteInfo, setArreteInfo] = useState<any>(null);

  useEffect(() => {
    fetchDemande();
  }, [id]);

  const fetchDemande = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${id}`);
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

  const handleChangeStatut = async (nouveauStatut: string) => {
    try {
      const response = await fetch(`/api/demandes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      });

      if (response.ok) {
        toast.success(`Statut modifié avec succès`);
        fetchDemande();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error('Erreur lors de la modification du statut');
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

  const getPieceLabel = (typePiece: string) => {
    const labels: Record<string, string> = {
      DEMANDE_MANUSCRITE: 'Demande manuscrite',
      CERTIFICAT_ASSIDUITE: 'Certificat d\'assiduité',
      CERTIFICAT_CESSATION: 'Certificat de cessation',
      CERTIFICAT_PRISE_SERVICE: 'Certificat de prise de service',
      COPIE_ARRETE: 'Copie de l\'arrêté',
    };
    return labels[typePiece] || typePiece;
  };

  const canEdit = () => {
    return demande && ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut);
  };

  const allPiecesVerified = () => {
    if (!demande?.pieces || demande.pieces.length === 0) return false;
    // Vérifier seulement les pièces présentes
    const piecesPresentes = demande.pieces.filter((piece: any) => piece.present);
    if (piecesPresentes.length === 0) return false;
    return piecesPresentes.every((piece: any) => piece.statutVerification !== null);
  };

  const allPiecesConformes = () => {
    if (!demande?.pieces || demande.pieces.length === 0) return false;
    // Vérifier seulement les pièces présentes
    const piecesPresentes = demande.pieces.filter((piece: any) => piece.present);
    if (piecesPresentes.length === 0) return false;
    return piecesPresentes.every((piece: any) => piece.conforme === true);
  };

  const canValidate = () => {
    return demande &&
      ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut) &&
      allPiecesVerified() &&
      allPiecesConformes() &&
      arreteVerified;
  };

  const handleArreteVerification = (verified: boolean, info?: any) => {
    setArreteVerified(verified);
    setArreteInfo(info || null);
  };

  const canReject = () => {
    return demande && ['ENREGISTREE', 'EN_TRAITEMENT', 'PIECES_NON_CONFORMES'].includes(demande.statut);
  };

  const canMarkPiecesNonConformes = () => {
    return demande &&
      ['EN_TRAITEMENT', 'ENREGISTREE'].includes(demande.statut) &&
      demande.pieces?.length > 0 &&
      allPiecesVerified() &&
      !allPiecesConformes();
  };

  const canGenerateAttestation = () => {
    return demande && demande.statut === 'VALIDEE' && !demande.attestation;
  };

  const handleMarquerPiecesNonConformes = async () => {
    if (!demande?.pieces) return;

    // Récupérer les pièces non conformes déjà vérifiées
    const piecesNonConformes = demande.pieces
      .filter((piece: any) => piece.present && piece.conforme === false)
      .map((piece: any) => ({
        type: piece.type,
        observation: piece.observation || ''
      }));

    if (piecesNonConformes.length === 0) {
      toast.error('Aucune pièce non conforme trouvée');
      return;
    }

    try {
      const response = await fetch(`/api/demandes/${id}/pieces-non-conformes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piecesNonConformes,
          observations: 'Pièces non conformes détectées lors de la vérification'
        }),
      });

      if (response.ok) {
        toast.success('Pièces signalées comme non conformes');
        fetchDemande();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors du signalement');
      }
    } catch (error) {
      console.error('Erreur signalement pièces:', error);
      toast.error('Erreur lors du signalement');
    }
  };

  const handleVerifyPiece = async (pieceId: string, conforme: boolean) => {
    setVerifyingPiece(pieceId);
    try {
      const response = await fetch(`/api/demandes/${id}/pieces/${pieceId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conforme }),
      });

      if (response.ok) {
        toast.success(`Pièce marquée comme ${conforme ? 'conforme' : 'non conforme'}`);
        await fetchDemande();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la vérification');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification de la pièce');
    } finally {
      setVerifyingPiece(null);
    }
  };

  const handleGenerateAttestation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/demandes/${id}/generer-attestation`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Attestation générée avec succès');
        fetchDemande();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération de l\'attestation');
    } finally {
      setLoading(false);
    }
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
      <div className="flex gap-2 flex-wrap">
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
        {canMarkPiecesNonConformes() && (
          <Button
            variant="outline"
            onClick={handleMarquerPiecesNonConformes}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Pièces non conformes
          </Button>
        )}
        {canGenerateAttestation() && (
          <Button onClick={handleGenerateAttestation} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Générer l'attestation
          </Button>
        )}
        {demande.attestation && (
          <Button
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/attestations/${demande.attestation.id}/download`;
              link.download = `attestation-${demande.attestation.numero}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger l'attestation
          </Button>
        )}

        {/* Menu de changement de statut - toujours visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Changer le statut
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => handleChangeStatut('SOUMISE')}
              disabled={demande.statut === 'SOUMISE'}
            >
              Soumise
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChangeStatut('EN_COURS')}
              disabled={demande.statut === 'EN_COURS'}
            >
              En cours de traitement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleChangeStatut('VALIDEE')}
              disabled={demande.statut === 'VALIDEE'}
              className="text-green-600"
            >
              Validée
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChangeStatut('REJETEE')}
              disabled={demande.statut === 'REJETEE'}
              className="text-red-600"
            >
              Rejetée
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

        {/* Vérification dans les arrêtés */}
        {demande.appele && (
          <ArreteVerificationPanel
            demandeId={id}
            appele={{
              nom: demande.appele.nom,
              prenom: demande.appele.prenom,
              promotion: demande.appele.promotion,
              dateNaissance: demande.appele.dateNaissance,
              lieuNaissance: demande.appele.lieuNaissance,
            }}
            statut={demande.statut}
            isVerified={arreteVerified}
            savedArreteInfo={arreteInfo}
            onVerificationChange={handleArreteVerification}
          />
        )}

        {/* Vérification des pièces */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Vérification des pièces du dossier
            </CardTitle>
            <CardDescription>
              Cochez chaque pièce comme conforme ou non conforme pour débloquer les actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demande.pieces && demande.pieces.length > 0 ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 mb-4">
                  {demande.pieces.map((piece: any) => (
                    <div
                      key={piece.id}
                      className={`p-4 rounded-lg border-2 transition-all ${!piece.present
                        ? 'border-gray-200 bg-gray-100 opacity-60'
                        : piece.conforme === true
                          ? 'border-green-500 bg-green-50'
                          : piece.conforme === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{getPieceLabel(piece.type)}</p>
                            {!piece.present && (
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Manquante</span>
                            )}
                          </div>
                          {piece.observation && (
                            <p className="text-sm text-muted-foreground mb-3">{piece.observation}</p>
                          )}

                          {/* Boutons de vérification */}
                          {['EN_TRAITEMENT', 'ENREGISTREE', 'PIECES_NON_CONFORMES'].includes(demande.statut) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={piece.conforme === true ? 'default' : 'outline'}
                                className={piece.conforme === true ? 'bg-green-600 hover:bg-green-700' : ''}
                                onClick={() => handleVerifyPiece(piece.id, true)}
                                disabled={!piece.present || verifyingPiece === piece.id}
                              >
                                {verifyingPiece === piece.id && piece.conforme === true ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Conforme
                              </Button>
                              <Button
                                size="sm"
                                variant={piece.conforme === false ? 'destructive' : 'outline'}
                                onClick={() => handleVerifyPiece(piece.id, false)}
                                disabled={!piece.present || verifyingPiece === piece.id}
                              >
                                {verifyingPiece === piece.id && piece.conforme === false ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                Non conforme
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Icône de statut */}
                        <div>
                          {piece.conforme === true ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : piece.conforme === false ? (
                            <XCircle className="h-6 w-6 text-red-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Résumé de la vérification */}
                <div className={`p-4 rounded-lg border ${allPiecesVerified()
                  ? allPiecesConformes()
                    ? 'border-green-200 bg-green-50'
                    : 'border-orange-200 bg-orange-50'
                  : 'border-blue-200 bg-blue-50'
                  }`}>
                  <div className="flex items-center gap-2">
                    {allPiecesVerified() ? (
                      allPiecesConformes() ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-sm font-medium text-green-800">
                            Toutes les pièces sont conformes - Vous pouvez valider la demande
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <p className="text-sm font-medium text-orange-800">
                            Certaines pièces ne sont pas conformes - Vous pouvez signaler à l'appelé
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">
                          Vérifiez toutes les pièces pour débloquer les actions
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Aucune pièce à vérifier</p>
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
        demandeId={id}
        onSuccess={fetchDemande}
      />

      <RejectionDialog
        open={rejectionOpen}
        onOpenChange={setRejectionOpen}
        demandeId={id}
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
