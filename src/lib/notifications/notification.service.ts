/**
 * Service Unifié de Notifications
 * Orchestre l'envoi de notifications via Email, SMS et WhatsApp
 * Basé sur le Prompt 6.1 - Services de Notification
 */

import { unifiedEmailService } from './unified-email.service';
import { smsService } from './sms.service';
import { whatsappService } from './whatsapp.service';
import {
  TypeNotification,
  NotificationData,
  getEmailSubject,
  getSmsMessage,
  getWhatsAppTemplate,
  getWhatsAppVariables,
} from './templates';
import { prisma } from '@/lib/prisma';
import { CanalNotification, StatutNotification } from '@prisma/client';

export interface SendNotificationOptions {
  demandeId: string;
  type: TypeNotification;
  canaux: CanalNotification[];
  data: NotificationData;
  messagePersonnalise?: string;
}

export interface NotificationResult {
  canal: CanalNotification;
  success: boolean;
  error?: string;
}

/**
 * Service principal de gestion des notifications
 */
export class NotificationService {
  /**
   * Envoie une notification sur plusieurs canaux
   */
  async send(options: SendNotificationOptions): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Récupérer les informations de la demande pour les coordonnées
    const demande = await prisma.demande.findUnique({
      where: { id: options.demandeId },
      include: { appele: true },
    });

    if (!demande || !demande.appele) {
      console.error('Demande ou appelé non trouvé');
      return [];
    }

    const { appele } = demande;

    // Préparer les données complètes
    const notificationData: NotificationData = {
      ...options.data,
      nom: appele.nom,
      prenom: appele.prenom,
    };

    // Envoyer sur chaque canal sélectionné
    for (const canal of options.canaux) {
      let result: NotificationResult;

      try {
        switch (canal) {
          case CanalNotification.EMAIL:
            result = await this.sendEmail(appele.email, options.type, notificationData);
            break;

          case CanalNotification.SMS:
            result = await this.sendSms(appele.telephone, options.type, notificationData);
            break;

          case CanalNotification.WHATSAPP:
            result = await this.sendWhatsApp(appele.whatsapp, options.type, notificationData);
            break;

          default:
            result = { canal, success: false, error: 'Canal non supporté' };
        }

        // Enregistrer dans la base de données
        await this.logNotification({
          demandeId: options.demandeId,
          canal,
          destinataire: this.getDestinataire(canal, appele),
          contenu: this.getContenu(canal, options.type, notificationData),
          statut: result.success ? StatutNotification.ENVOYEE : StatutNotification.ECHEC,
          messageErreur: result.error,
        });

        results.push(result);
      } catch (error) {
        console.error(`Erreur envoi ${canal}:`, error);
        results.push({
          canal,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });

        // Logger l'échec
        await this.logNotification({
          demandeId: options.demandeId,
          canal,
          destinataire: this.getDestinataire(canal, appele),
          contenu: this.getContenu(canal, options.type, notificationData),
          statut: StatutNotification.ECHEC,
          messageErreur: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  /**
   * Envoie un email
   */
  private async sendEmail(
    email: string | null,
    type: TypeNotification,
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!email) {
      return {
        canal: CanalNotification.EMAIL,
        success: false,
        error: 'Email non renseigné',
      };
    }

    let success = false;

    try {
      switch (type) {
        case TypeNotification.CONFIRMATION_DEPOT:
          success = await unifiedEmailService.sendConfirmationDepot(email, {
            numeroEnregistrement: data.numeroEnregistrement,
            nom: data.nom,
            prenom: data.prenom,
            dateEnregistrement: data.dateEnregistrement || '',
          });
          break;

        case TypeNotification.DEMANDE_REJETEE:
          success = await unifiedEmailService.sendDemandeRejetee(email, {
            numeroEnregistrement: data.numeroEnregistrement,
            nom: data.nom,
            prenom: data.prenom,
            motifRejet: data.motifRejet || '',
          });
          break;

        case TypeNotification.ATTESTATION_PRETE:
          success = await unifiedEmailService.sendAttestationPrete(email, {
            numeroEnregistrement: data.numeroEnregistrement,
            numeroAttestation: data.numeroAttestation || '',
            nom: data.nom,
            prenom: data.prenom,
          });
          break;

        default:
          success = false;
      }

      return {
        canal: CanalNotification.EMAIL,
        success,
        error: success ? undefined : 'Échec envoi email',
      };
    } catch (error) {
      return {
        canal: CanalNotification.EMAIL,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur email',
      };
    }
  }

  /**
   * Envoie un SMS
   */
  private async sendSms(
    telephone: string | null,
    type: TypeNotification,
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!telephone) {
      return {
        canal: CanalNotification.SMS,
        success: false,
        error: 'Téléphone non renseigné',
      };
    }

    let success = false;

    try {
      switch (type) {
        case TypeNotification.CONFIRMATION_DEPOT:
          success = await smsService.sendConfirmationDepot(telephone, {
            numeroEnregistrement: data.numeroEnregistrement,
            nom: data.nom,
          });
          break;

        case TypeNotification.DEMANDE_REJETEE:
          success = await smsService.sendDemandeRejetee(telephone, {
            numeroEnregistrement: data.numeroEnregistrement,
          });
          break;

        case TypeNotification.ATTESTATION_PRETE:
          success = await smsService.sendAttestationPrete(telephone, {
            numeroAttestation: data.numeroAttestation || '',
            nom: data.nom,
          });
          break;

        default:
          success = false;
      }

      return {
        canal: CanalNotification.SMS,
        success,
        error: success ? undefined : 'Échec envoi SMS',
      };
    } catch (error) {
      return {
        canal: CanalNotification.SMS,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur SMS',
      };
    }
  }

  /**
   * Envoie un WhatsApp
   */
  private async sendWhatsApp(
    whatsapp: string | null,
    type: TypeNotification,
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!whatsapp) {
      return {
        canal: CanalNotification.WHATSAPP,
        success: false,
        error: 'WhatsApp non renseigné',
      };
    }

    let success = false;

    try {
      switch (type) {
        case TypeNotification.CONFIRMATION_DEPOT:
          success = await whatsappService.sendConfirmationDepot(whatsapp, {
            numeroEnregistrement: data.numeroEnregistrement,
            nom: data.nom,
            prenom: data.prenom,
            dateEnregistrement: data.dateEnregistrement || '',
          });
          break;

        case TypeNotification.DEMANDE_REJETEE:
          success = await whatsappService.sendDemandeRejetee(whatsapp, {
            numeroEnregistrement: data.numeroEnregistrement,
            nom: data.nom,
            prenom: data.prenom,
            motifRejet: data.motifRejet || '',
          });
          break;

        case TypeNotification.ATTESTATION_PRETE:
          success = await whatsappService.sendAttestationPrete(whatsapp, {
            numeroEnregistrement: data.numeroEnregistrement,
            numeroAttestation: data.numeroAttestation || '',
            nom: data.nom,
            prenom: data.prenom,
          });
          break;

        default:
          success = false;
      }

      return {
        canal: CanalNotification.WHATSAPP,
        success,
        error: success ? undefined : 'Échec envoi WhatsApp',
      };
    } catch (error) {
      return {
        canal: CanalNotification.WHATSAPP,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur WhatsApp',
      };
    }
  }

  /**
   * Enregistre une notification dans la base de données
   */
  private async logNotification(data: {
    demandeId: string;
    canal: CanalNotification;
    destinataire: string;
    contenu: string;
    statut: StatutNotification;
    messageErreur?: string;
  }): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          demandeId: data.demandeId,
          canal: data.canal,
          destinataire: data.destinataire,
          contenu: data.contenu,
          statut: data.statut,
          messageErreur: data.messageErreur,
          dateEnvoi: data.statut === StatutNotification.ENVOYEE ? new Date() : null,
          tentatives: 1,
        },
      });
    } catch (error) {
      console.error('Erreur log notification:', error);
    }
  }

  /**
   * Récupère le destinataire selon le canal
   */
  private getDestinataire(canal: CanalNotification, appele: any): string {
    switch (canal) {
      case CanalNotification.EMAIL:
        return appele.email || '';
      case CanalNotification.SMS:
        return appele.telephone || '';
      case CanalNotification.WHATSAPP:
        return appele.whatsapp || '';
      default:
        return '';
    }
  }

  /**
   * Récupère le contenu du message selon le canal et le type
   */
  private getContenu(
    canal: CanalNotification,
    type: TypeNotification,
    data: NotificationData
  ): string {
    switch (canal) {
      case CanalNotification.EMAIL:
        return getEmailSubject(type, data);
      case CanalNotification.SMS:
      case CanalNotification.WHATSAPP:
        return getSmsMessage(type, data);
      default:
        return '';
    }
  }

  /**
   * Récupère l'historique des notifications pour une demande
   */
  async getHistorique(demandeId: string) {
    return prisma.notification.findMany({
      where: { demandeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Teste tous les canaux de notification
   */
  async testAllChannels(): Promise<{
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  }> {
    const [email, sms, whatsapp] = await Promise.all([
      unifiedEmailService.testConnection(),
      smsService.testConnection(),
      whatsappService.testConnection(),
    ]);

    return { email, sms, whatsapp };
  }
}

// Instance singleton
export const notificationService = new NotificationService();
