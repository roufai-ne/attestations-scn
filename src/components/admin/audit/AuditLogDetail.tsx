'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Globe, FileText, Settings } from 'lucide-react';

interface AuditLogDetailProps {
  log: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetail({ log, open, onOpenChange }: AuditLogDetailProps) {
  if (!log) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      USER_LOGIN: 'Connexion utilisateur',
      USER_LOGOUT: 'Déconnexion utilisateur',
      USER_CREATED: 'Création utilisateur',
      USER_UPDATED: 'Modification utilisateur',
      USER_DELETED: 'Suppression utilisateur',
      DEMANDE_CREATED: 'Création demande',
      DEMANDE_UPDATED: 'Modification demande',
      DEMANDE_VALIDATED: 'Validation demande',
      DEMANDE_REJECTED: 'Rejet demande',
      ATTESTATION_GENERATED: 'Génération attestation',
      ATTESTATION_SIGNED: 'Signature attestation',
      ARRETE_UPLOADED: 'Upload arrêté',
      NOTIFICATION_SENT: 'Notification envoyée',
      CONFIG_UPDATED: 'Modification configuration',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('DELETED') || action.includes('REJECTED')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du log d'audit</DialogTitle>
          <DialogDescription>Informations complètes sur l'action enregistrée</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <p className="text-lg font-semibold">{getActionLabel(log.action)}</p>
                  </div>
                </div>
                <Badge className={getActionColor(log.action)}>{log.action}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Date et heure */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                  <p className="text-base font-medium">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Utilisateur */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilisateur</p>
                  <p className="text-base font-medium">
                    {log.user.prenom} {log.user.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">{log.user.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {log.user.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demande associée */}
          {log.demande && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Demande associée</p>
                    <p className="text-base font-medium">{log.demande.numeroEnregistrement}</p>
                    {log.demande.appele && (
                      <p className="text-sm text-muted-foreground">
                        {log.demande.appele.prenom} {log.demande.appele.nom}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations réseau */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Informations réseau</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Adresse IP :</span>{' '}
                      {log.ipAddress || 'Non disponible'}
                    </p>
                    {log.userAgent && (
                      <p className="text-sm break-all">
                        <span className="font-medium">User Agent :</span> {log.userAgent}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails supplémentaires */}
          {log.details && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Détails supplémentaires</p>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(JSON.parse(log.details), null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
