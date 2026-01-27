/**
 * Service Brevo - Envoi d'emails et SMS via Brevo (anciennement Sendinblue)
 * Documentation: https://developers.brevo.com/
 */

import { 
  TransactionalEmailsApi, 
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail, 
  TransactionalSMSApi,
  TransactionalSMSApiApiKeys,
  SendTransacSms, 
  AccountApi,
  AccountApiApiKeys
} from '@getbrevo/brevo';
import { logger } from '@/lib/logger';

export interface BrevoEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: {
    email: string;
    name: string;
  };
}

export interface BrevoSmsOptions {
  to: string; // Format E.164: +227XXXXXXXX
  message: string;
  sender?: string; // Max 11 caractères alphanumériques
}

export class BrevoService {
  private emailClient: TransactionalEmailsApi;
  private smsClient: TransactionalSMSApi;
  private accountClient: AccountApi;
  private apiKey: string;
  private smsEnabled: boolean;
  private defaultSender: {
    email: string;
    name: string;
  };

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.smsEnabled = process.env.BREVO_SMS_ENABLED === 'true';
    
    this.defaultSender = {
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@servicecivique.ne',
      name: process.env.BREVO_SENDER_NAME || 'Service Civique National',
    };

    // Initialisation des clients avec API Key (syntaxe v3+)
    this.emailClient = new TransactionalEmailsApi();
    this.emailClient.setApiKey(TransactionalEmailsApiApiKeys.apiKey, this.apiKey);
    
    this.smsClient = new TransactionalSMSApi();
    this.smsClient.setApiKey(TransactionalSMSApiApiKeys.apiKey, this.apiKey);
    
    this.accountClient = new AccountApi();
    this.accountClient.setApiKey(AccountApiApiKeys.apiKey, this.apiKey);
  }

  /**
   * Vérifie si le service est configuré
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  /**
   * Vérifie si les SMS sont activés
   */
  isSmsEnabled(): boolean {
    return this.smsEnabled && this.isConfigured();
  }

  /**
   * Envoie un email via Brevo
   */
  async sendEmail(options: BrevoEmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        logger.error('Brevo non configuré - API Key manquante');
        return false;
      }

      const sendSmtpEmail: SendSmtpEmail = {
        sender: options.from || this.defaultSender,
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        ...(options.text && { textContent: options.text }),
      };

      const result = await this.emailClient.sendTransacEmail(sendSmtpEmail);
      
      logger.network('Brevo Email', `Email envoyé avec succès: ${result.body.messageId}`);
      return true;
    } catch (error) {
      logger.error('Erreur envoi email Brevo: ' + error);
      return false;
    }
  }

  /**
   * Envoie un SMS via Brevo
   */
  async sendSms(options: BrevoSmsOptions): Promise<boolean> {
    try {
      console.log('\n=== BREVO SMS DEBUG ===');
      console.log('SMS Enabled:', this.isSmsEnabled());
      console.log('API Key présente:', !!this.apiKey);
      console.log('Destinataire:', options.to);
      console.log('Message:', options.message);
      console.log('Sender:', options.sender || 'SCN');

      if (!this.isSmsEnabled()) {
        logger.info('SMS Brevo désactivé ou non configuré');
        return false;
      }

      // Validation du format du numéro (E.164)
      if (!options.to.startsWith('+')) {
        logger.error('Numéro de téléphone invalide - doit commencer par +');
        return false;
      }

      const sendTransacSms: SendTransacSms = {
        recipient: options.to,
        content: options.message,
        type: 'transactional' as any,
        sender: options.sender?.substring(0, 11) || 'SCN',
      };

      console.log('Payload SMS:', JSON.stringify(sendTransacSms, null, 2));

      const result = await this.smsClient.sendTransacSms(sendTransacSms);
      
      console.log('Résultat Brevo SMS:', result);
      logger.network('Brevo SMS', `SMS envoyé avec succès: ${result.body.reference}`);
      return true;
    } catch (error: any) {
      console.error('\n=== ERREUR BREVO SMS ===');
      console.error('Message:', error.message);
      console.error('Response:', error.response?.body);
      console.error('Status:', error.response?.statusCode);
      console.error('Stack:', error.stack);
      logger.error('Erreur envoi SMS Brevo: ' + error);
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
    sendSms?: boolean,
    phone?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Service Civique National</h1>
            <p>République du Niger</p>
          </div>

          <div class="content">
            <h2>Confirmation de dépôt de votre demande d'attestation</h2>

            <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>

            <p>Nous avons bien reçu votre dossier de demande d'attestation de Service Civique.</p>

            <div class="info">
              <strong>Numéro d'enregistrement :</strong> ${data.numeroEnregistrement}<br>
              <strong>Date d'enregistrement :</strong> ${data.dateEnregistrement}
            </div>

            <p>Votre dossier est en cours de traitement. Vous recevrez une notification dès que votre attestation sera prête.</p>

            <p><strong>Important :</strong> Conservez précieusement votre numéro d'enregistrement.</p>
          </div>

          <div class="footer">
            <p>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation Technologique<br>
            Direction de l'Enseignement Supérieur Publique<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSent = await this.sendEmail({
      to,
      subject: `Confirmation de dépôt - Demande d'attestation ${data.numeroEnregistrement}`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre demande d'attestation a été enregistrée sous le numéro ${data.numeroEnregistrement} le ${data.dateEnregistrement}.\n\nVous recevrez une notification dès que votre attestation sera prête.\n\nService Civique National - République du Niger`,
    });

    // Envoi SMS optionnel
    if (sendSms && phone) {
      await this.sendSms({
        to: phone,
        message: `Service Civique: Votre demande ${data.numeroEnregistrement} a été enregistrée le ${data.dateEnregistrement}. Vous serez notifié dès que votre attestation sera prête.`,
        sender: 'SCN-Niger',
      });
    }

    return emailSent;
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
    sendSms?: boolean,
    phone?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Service Civique National</h1>
            <p>République du Niger</p>
          </div>

          <div class="content">
            <h2>Information sur votre demande d'attestation</h2>

            <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>

            <p>Après examen de votre dossier N° <strong>${data.numeroEnregistrement}</strong>, nous vous informons que votre demande ne peut être traitée pour le motif suivant :</p>

            <div class="alert">
              <strong>Motif :</strong><br>
              ${data.motifRejet}
            </div>

            <p>Nous vous invitons à vous rapprocher de nos services pour plus d'informations ou pour régulariser votre situation.</p>
          </div>

          <div class="footer">
            <p>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation Technologique<br>
            Direction de l'Enseignement Supérieur Publique<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSent = await this.sendEmail({
      to,
      subject: `Demande d'attestation ${data.numeroEnregistrement} - Information`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre demande N° ${data.numeroEnregistrement} ne peut être traitée.\n\nMotif : ${data.motifRejet}\n\nVeuillez contacter nos services.\n\nService Civique National - République du Niger`,
    });

    // Envoi SMS optionnel
    if (sendSms && phone) {
      await this.sendSms({
        to: phone,
        message: `Service Civique: Votre demande ${data.numeroEnregistrement} ne peut être traitée. Motif: ${data.motifRejet.substring(0, 100)}. Contactez nos services.`,
        sender: 'SCN-Niger',
      });
    }

    return emailSent;
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
    sendSms?: boolean,
    phone?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .success { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 10px 0; }
          .numero { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Attestation Prête</h1>
            <p>Service Civique National - République du Niger</p>
          </div>

          <div class="content">
            <h2>Votre attestation est disponible</h2>

            <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>

            <p>Nous avons le plaisir de vous informer que votre attestation de Service Civique National est désormais prête.</p>

            <div class="success">
              <strong>Demande N° :</strong> ${data.numeroEnregistrement}<br>
              <strong>Attestation N° :</strong> ${data.numeroAttestation}
            </div>

            <div class="numero">${data.numeroAttestation}</div>

            <p><strong>Prochaines étapes :</strong></p>
            <ul>
              <li>Vous pouvez venir retirer votre attestation à nos bureaux</li>
              <li>Munissez-vous d'une pièce d'identité</li>
              <li>N'oubliez pas de noter votre numéro d'attestation</li>
            </ul>

            <p>Horaires d'ouverture : Du lundi au vendredi, de 8h à 16h</p>
          </div>

          <div class="footer">
            <p>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation Technologique<br>
            Direction de l'Enseignement Supérieur Publique<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSent = await this.sendEmail({
      to,
      subject: `✓ Votre attestation est prête - ${data.numeroAttestation}`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre attestation de Service Civique est prête !\n\nDemande N° : ${data.numeroEnregistrement}\nAttestation N° : ${data.numeroAttestation}\n\nVous pouvez venir la retirer à nos bureaux (lundi-vendredi, 8h-16h) avec une pièce d'identité.\n\nService Civique National - République du Niger`,
    });

    // Envoi SMS optionnel
    if (sendSms && phone) {
      await this.sendSms({
        to: phone,
        message: `Service Civique: Votre attestation ${data.numeroAttestation} est prête ! Venez la retirer à nos bureaux (lun-ven 8h-16h) avec votre pièce d'identité.`,
        sender: 'SCN-Niger',
      });
    }

    return emailSent;
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
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation du mot de passe</h1>
            <p>Service Civique National - République du Niger</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>

            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

            <p style="text-align: center;">
              <a href="${data.resetLink}" class="button">Réinitialiser mon mot de passe</a>
            </p>

            <div class="warning">
              <strong>⚠️ Ce lien expire dans ${data.expiresIn}.</strong><br>
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </div>

            <p style="font-size: 12px; color: #6b7280;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <code>${data.resetLink}</code>
            </p>
          </div>

          <div class="footer">
            <p>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation Technologique<br>
            Direction de l'Enseignement Supérieur Publique<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Réinitialisation de votre mot de passe`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour définir un nouveau mot de passe :\n${data.resetLink}\n\nCe lien expire dans ${data.expiresIn}.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.\n\nService Civique National - République du Niger`,
    });
  }

  /**
   * Récupère les informations du compte Brevo
   */
  async getAccountInfo(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.isConfigured()) {
        return null;
      }

      const result = await this.accountClient.getAccount();
      
      return result.body as unknown as Record<string, unknown>;
    } catch (error) {
      logger.error('Erreur récupération info compte Brevo: ' + error);
      return null;
    }
  }
}

// Instance singleton
export const brevoService = new BrevoService();
