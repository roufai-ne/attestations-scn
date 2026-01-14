'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuditLogDetail } from './AuditLogDetail';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface AuditLogTableProps {
  logs: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function AuditLogTable({ logs, pagination, onPageChange }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      USER_LOGIN: 'Connexion',
      USER_LOGOUT: 'Déconnexion',
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
      CONFIG_UPDATED: 'Configuration',
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

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun log d'audit trouvé pour les critères sélectionnés.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Demande</TableHead>
              <TableHead>Adresse IP</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewDetails(log)}
              >
                <TableCell className="font-medium">{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {log.user.prenom} {log.user.nom}
                    </p>
                    <p className="text-sm text-muted-foreground">{log.user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>{getActionLabel(log.action)}</Badge>
                </TableCell>
                <TableCell>
                  {log.demande ? (
                    <div>
                      <p className="font-medium text-sm">{log.demande.numeroEnregistrement}</p>
                      {log.demande.appele && (
                        <p className="text-xs text-muted-foreground">
                          {log.demande.appele.prenom} {log.demande.appele.nom}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {log.ipAddress || 'N/A'}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(log);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {pagination.total} log{pagination.total > 1 ? 's' : ''} au total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal de détails */}
      <AuditLogDetail log={selectedLog} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
