/**
 * Service Email Unifié - Utilise Brevo ou SMTP selon la configuration
 */

import { emailService } from './email.service';
import { brevoService } from './brevo.service';
import { logger } from '@/lib/logger';

export interface UnifiedEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class UnifiedEmailService {
  private provider: 'brevo' | 'smtp';

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as 'brevo' | 'smtp') || 'smtp';
    logger.info(`Service email initialisé avec provider: ${this.provider}`);
  }

  /**
   * Envoie un email via le provider configuré
   */
  async sendEmail(options: UnifiedEmailOptions): Promise<boolean> {
    try {
      if (this.provider === 'brevo') {
        return await brevoService.sendEmail(options);
      } else {
        return await emailService.sendEmail(options);
      }
    } catch (error) {
      logger.error(`Erreur envoi email (${this.provider}): ${error}`);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation de dépôt
   */
  async sendConfirmationDepot(
    to: string,
    data: {
      numeroEnregistrement: string;
      nom: string;
      prenom: string;
      dateEnregistrement: string;
    },
    options?: {
      sendSms?: boolean;
      phone?: string;
    }
  ): Promise<boolean> {
    if (this.provider === 'brevo') {
      return await brevoService.sendConfirmationDepot(
        to,
        data,
        options?.sendSms,
        options?.phone
      );
    } else {
      return await emailService.sendConfirmationDepot(to, data);
    }
  }

  /**
   * Envoie un email de rejet de demande
   */
  async sendDemandeRejetee(
    to: string,
    data: {
      numeroEnregistrement: string;
      nom: string;
      prenom: string;
      motifRejet: string;
    },
    options?: {
      sendSms?: boolean;
      phone?: string;
    }
  ): Promise<boolean> {
    if (this.provider === 'brevo') {
      return await brevoService.sendDemandeRejetee(
        to,
        data,
        options?.sendSms,
        options?.phone
      );
    } else {
      return await emailService.sendDemandeRejetee(to, data);
    }
  }

  /**
   * Envoie un email d'attestation prête
   */
  async sendAttestationPrete(
    to: string,
    data: {
      numeroEnregistrement: string;
      numeroAttestation: string;
      nom: string;
      prenom: string;
    },
    options?: {
      sendSms?: boolean;
      phone?: string;
    }
  ): Promise<boolean> {
    if (this.provider === 'brevo') {
      return await brevoService.sendAttestationPrete(
        to,
        data,
        options?.sendSms,
        options?.phone
      );
    } else {
      return await emailService.sendAttestationPrete(to, data);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordReset(
    to: string,
    data: {
      nom: string;
      prenom: string;
      resetLink: string;
      expiresIn: string;
    }
  ): Promise<boolean> {
    if (this.provider === 'brevo') {
      return await brevoService.sendPasswordReset(to, data);
    } else {
      return await emailService.sendPasswordReset(to, data);
    }
  }

  /**
   * Envoie un SMS (uniquement avec Brevo si activé)
   */
  async sendSms(options: {
    to: string;
    message: string;
    sender?: string;
  }): Promise<boolean> {
    if (this.provider === 'brevo' && brevoService.isSmsEnabled()) {
      return await brevoService.sendSms(options);
    } else {
      logger.info('SMS non disponible - Brevo SMS non activé');
      return false;
    }
  }

  /**
   * Vérifie si le service email est configuré
   */
  isConfigured(): boolean {
    if (this.provider === 'brevo') {
      return brevoService.isConfigured();
    } else {
      return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    }
  }

  /**
   * Vérifie si les SMS sont disponibles
   */
  isSmsAvailable(): boolean {
    return this.provider === 'brevo' && brevoService.isSmsEnabled();
  }

  /**
   * Récupère le provider actuel
   */
  getProvider(): 'brevo' | 'smtp' {
    return this.provider;
  }

  /**
   * Teste la connexion email
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.provider === 'brevo') {
        const accountInfo = await brevoService.getAccountInfo();
        return !!accountInfo;
      } else {
        return await emailService.testConnection();
      }
    } catch (error) {
      logger.error(`Erreur test connexion (${this.provider}): ${error}`);
      return false;
    }
  }
}

// Instance singleton
export const unifiedEmailService = new UnifiedEmailService();
