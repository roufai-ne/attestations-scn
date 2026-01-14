'use client';

/**
 * Composant d'historique des notifications pour une demande
 */

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CanalNotification, StatutNotification } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  canal: CanalNotification;
  destinataire: string;
  contenu: string;
  statut: StatutNotification;
  dateEnvoi: Date | null;
  createdAt: Date;
  messageErreur?: string | null;
}

interface NotificationHistoryProps {
  demandeId: string;
}

export function NotificationHistory({ demandeId }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [demandeId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/historique/${demandeId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCanalIcon = (canal: CanalNotification) => {
    switch (canal) {
      case CanalNotification.EMAIL:
        return <Mail className="h-4 w-4" />;
      case CanalNotification.SMS:
        return <Phone className="h-4 w-4" />;
      case CanalNotification.WHATSAPP:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCanalLabel = (canal: CanalNotification) => {
    switch (canal) {
      case CanalNotification.EMAIL:
        return 'Email';
      case CanalNotification.SMS:
        return 'SMS';
      case CanalNotification.WHATSAPP:
        return 'WhatsApp';
    }
  };

  const getStatutBadge = (statut: StatutNotification) => {
    switch (statut) {
      case StatutNotification.ENVOYEE:
        return (
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Envoyée
          </Badge>
        );
      case StatutNotification.ECHEC:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Échec
          </Badge>
        );
      case StatutNotification.EN_ATTENTE:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune notification envoyée pour cette demande
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Historique des notifications</h3>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notif) => (
              <TableRow key={notif.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getCanalIcon(notif.canal)}
                    <span className="font-medium">{getCanalLabel(notif.canal)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{notif.destinataire}</TableCell>
                <TableCell className="text-sm max-w-xs truncate" title={notif.contenu}>
                  {notif.contenu}
                </TableCell>
                <TableCell>{getStatutBadge(notif.statut)}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {notif.dateEnvoi
                    ? format(new Date(notif.dateEnvoi), 'dd/MM/yyyy HH:mm', { locale: fr })
                    : format(new Date(notif.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
