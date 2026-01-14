/**
 * Service Email - Envoi d'emails via Nodemailer
 * Basé sur le Prompt 6.1 - Services de Notification
 */

import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true pour port 465, false pour autres
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Envoie un email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Vérifier la configuration
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.error('Configuration SMTP manquante');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: `"Service Civique National" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Email envoyé:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Teste la connexion SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Connexion SMTP OK');
      return true;
    } catch (error) {
      console.error('Erreur connexion SMTP:', error);
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
            <p>Ministère de la Jeunesse et des Sports<br>
            Direction du Service Civique National<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Confirmation de dépôt - Demande d'attestation ${data.numeroEnregistrement}`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre demande d'attestation a été enregistrée sous le numéro ${data.numeroEnregistrement} le ${data.dateEnregistrement}.\n\nVous recevrez une notification dès que votre attestation sera prête.\n\nService Civique National - République du Niger`,
    });
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
            <p>Ministère de la Jeunesse et des Sports<br>
            Direction du Service Civique National<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Demande d'attestation ${data.numeroEnregistrement} - Information`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre demande N° ${data.numeroEnregistrement} ne peut être traitée.\n\nMotif : ${data.motifRejet}\n\nVeuillez contacter nos services.\n\nService Civique National - République du Niger`,
    });
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
            <p>Ministère de la Jeunesse et des Sports<br>
            Direction du Service Civique National<br>
            République du Niger</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `✓ Votre attestation est prête - ${data.numeroAttestation}`,
      html,
      text: `Bonjour ${data.prenom} ${data.nom},\n\nVotre attestation de Service Civique est prête !\n\nDemande N° : ${data.numeroEnregistrement}\nAttestation N° : ${data.numeroAttestation}\n\nVous pouvez venir la retirer à nos bureaux (lundi-vendredi, 8h-16h) avec une pièce d'identité.\n\nService Civique National - République du Niger`,
    });
  }
}

// Instance singleton
export const emailService = new EmailService();
