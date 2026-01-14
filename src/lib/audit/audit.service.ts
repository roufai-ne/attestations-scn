/**
 * Service d'audit - Traçabilité de toutes les actions
 * Basé sur le Prompt 7.3 - Journal d'audit
 */

import { prisma } from '@/lib/prisma';

export enum AuditAction {
  // Utilisateurs
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',

  // Demandes
  DEMANDE_CREATED = 'DEMANDE_CREATED',
  DEMANDE_UPDATED = 'DEMANDE_UPDATED',
  DEMANDE_DELETED = 'DEMANDE_DELETED',
  DEMANDE_VALIDATED = 'DEMANDE_VALIDATED',
  DEMANDE_REJECTED = 'DEMANDE_REJECTED',

  // Attestations
  ATTESTATION_GENERATED = 'ATTESTATION_GENERATED',
  ATTESTATION_SIGNED = 'ATTESTATION_SIGNED',
  ATTESTATION_DELIVERED = 'ATTESTATION_DELIVERED',

  // Notifications
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',

  // Arrêtés
  ARRETE_UPLOADED = 'ARRETE_UPLOADED',
  ARRETE_INDEXED = 'ARRETE_INDEXED',
  ARRETE_DELETED = 'ARRETE_DELETED',

  // Configuration
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  TEMPLATE_UPDATED = 'TEMPLATE_UPDATED',

  // Autres
  FILE_UPLOADED = 'FILE_UPLOADED',
  EXPORT_GENERATED = 'EXPORT_GENERATED',
}

export interface AuditLogData {
  action: AuditAction | string;
  userId?: string;
  demandeId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service principal d'audit
 */
export class AuditService {
  /**
   * Enregistre une action dans le journal d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          demandeId: data.demandeId,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      // Log en console en développement
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', {
          action: data.action,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
      // Ne pas bloquer l'application si l'audit échoue
    }
  }

  /**
   * Log une création d'utilisateur
   */
  async logUserCreated(
    adminId: string,
    newUserId: string,
    userData: { email: string; role: string },
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.USER_CREATED,
      userId: adminId,
      details: {
        newUserId,
        email: userData.email,
        role: userData.role,
      },
      ipAddress,
    });
  }

  /**
   * Log une modification d'utilisateur
   */
  async logUserUpdated(
    adminId: string,
    targetUserId: string,
    changes: any,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.USER_UPDATED,
      userId: adminId,
      details: {
        targetUserId,
        changes,
      },
      ipAddress,
    });
  }

  /**
   * Log une suppression d'utilisateur
   */
  async logUserDeleted(
    adminId: string,
    deletedUserId: string,
    deletedUserEmail: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.USER_DELETED,
      userId: adminId,
      details: {
        deletedUserId,
        deletedUserEmail,
      },
      ipAddress,
    });
  }

  /**
   * Log une connexion utilisateur
   */
  async logUserLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: AuditAction.USER_LOGIN,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une création de demande
   */
  async logDemandeCreated(
    agentId: string,
    demandeId: string,
    numeroEnregistrement: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.DEMANDE_CREATED,
      userId: agentId,
      demandeId,
      details: { numeroEnregistrement },
      ipAddress,
    });
  }

  /**
   * Log une validation de demande
   */
  async logDemandeValidated(
    agentId: string,
    demandeId: string,
    numeroEnregistrement: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.DEMANDE_VALIDATED,
      userId: agentId,
      demandeId,
      details: { numeroEnregistrement },
      ipAddress,
    });
  }

  /**
   * Log un rejet de demande
   */
  async logDemandeRejected(
    agentId: string,
    demandeId: string,
    motifRejet: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.DEMANDE_REJECTED,
      userId: agentId,
      demandeId,
      details: { motifRejet },
      ipAddress,
    });
  }

  /**
   * Log une génération d'attestation
   */
  async logAttestationGenerated(
    agentId: string,
    demandeId: string,
    numeroAttestation: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.ATTESTATION_GENERATED,
      userId: agentId,
      demandeId,
      details: { numeroAttestation },
      ipAddress,
    });
  }

  /**
   * Log une signature d'attestation
   */
  async logAttestationSigned(
    directeurId: string,
    demandeId: string,
    numeroAttestation: string,
    typeSignature: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.ATTESTATION_SIGNED,
      userId: directeurId,
      demandeId,
      details: {
        numeroAttestation,
        typeSignature,
      },
      ipAddress,
    });
  }

  /**
   * Log une notification envoyée
   */
  async logNotificationSent(
    userId: string,
    demandeId: string,
    canaux: string[],
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.NOTIFICATION_SENT,
      userId,
      demandeId,
      details: { canaux },
      ipAddress,
    });
  }

  /**
   * Log un upload d'arrêté
   */
  async logArreteUploaded(
    adminId: string,
    arreteId: string,
    numeroArrete: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.ARRETE_UPLOADED,
      userId: adminId,
      details: {
        arreteId,
        numeroArrete,
      },
      ipAddress,
    });
  }

  /**
   * Log une mise à jour de configuration
   */
  async logConfigUpdated(
    adminId: string,
    configKey: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.CONFIG_UPDATED,
      userId: adminId,
      details: { configKey },
      ipAddress,
    });
  }

  /**
   * Récupère les logs d'audit avec filtres
   */
  async getLogs(filters?: {
    userId?: string;
    demandeId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.demandeId) where.demandeId = filters.demandeId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
            },
          },
          demande: {
            select: {
              id: true,
              numeroEnregistrement: true,
              statut: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      total,
    };
  }

  /**
   * Récupère les statistiques d'activité
   */
  async getActivityStats(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        action: true,
        userId: true,
        createdAt: true,
      },
    });

    // Compter par action
    const actionCounts = logs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    // Compter par utilisateur
    const userCounts = logs.reduce((acc: any, log) => {
      if (log.userId) {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      period,
      totalActions: logs.length,
      actionCounts,
      userCounts,
      mostActiveUsers: Object.entries(userCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count })),
      mostFrequentActions: Object.entries(actionCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
    };
  }

  /**
   * Récupère les actions d'un utilisateur spécifique
   */
  async getUserActivity(userId: string, limit: number = 20) {
    return prisma.auditLog.findMany({
      where: { userId },
      include: {
        demande: {
          select: {
            numeroEnregistrement: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Exporte les logs d'audit
   */
  async exportLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { logs } = await this.getLogs({
      ...filters,
      limit: 10000, // Limite pour l'export
    });

    return logs;
  }
}

// Instance singleton
export const auditService = new AuditService();
