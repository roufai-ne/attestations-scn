/**
 * Service SMS - Envoi de SMS via Twilio ou autre fournisseur
 * Basé sur le Prompt 6.1 - Services de Notification
 */

import twilio from 'twilio';

export interface SmsOptions {
  to: string;
  message: string;
}

// Interface pour adapter différents fournisseurs SMS
export interface ISmsProvider {
  send(to: string, message: string): Promise<boolean>;
  testConnection(): Promise<boolean>;
}

/**
 * Provider Twilio pour l'envoi de SMS
 */
class TwilioProvider implements ISmsProvider {
  private client: any;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.error('Configuration Twilio manquante');
        return false;
      }

      // Formater le numéro au format international si nécessaire
      const formattedTo = to.startsWith('+') ? to : `+227${to}`; // +227 pour le Niger

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo,
      });

      console.log('SMS envoyé:', result.sid);
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      // Vérifier le compte Twilio
      await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('Connexion Twilio OK');
      return true;
    } catch (error) {
      console.error('Erreur connexion Twilio:', error);
      return false;
    }
  }
}

/**
 * Provider générique pour API SMS locale (à adapter selon le fournisseur au Niger)
 */
class GenericSmsProvider implements ISmsProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.SMS_API_URL || '';
    this.apiKey = process.env.SMS_API_KEY || '';
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      if (!this.apiUrl || !this.apiKey) {
        console.error('Configuration SMS API manquante');
        return false;
      }

      // Exemple générique - À adapter selon l'API du fournisseur
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: to,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`API SMS error: ${response.statusText}`);
      }

      console.log('SMS envoyé via API générique');
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiUrl || !this.apiKey) {
        return false;
      }
      // Test de connexion basique
      console.log('API SMS configurée');
      return true;
    } catch (error) {
      console.error('Erreur test API SMS:', error);
      return false;
    }
  }
}

/**
 * Service SMS principal
 */
export class SmsService {
  private provider: ISmsProvider;

  constructor() {
    // Choisir le provider selon la configuration
    const useTwilio = process.env.SMS_PROVIDER === 'twilio';
    this.provider = useTwilio ? new TwilioProvider() : new GenericSmsProvider();
  }

  /**
   * Envoie un SMS
   */
  async sendSms(options: SmsOptions): Promise<boolean> {
    return this.provider.send(options.to, options.message);
  }

  /**
   * Teste la connexion
   */
  async testConnection(): Promise<boolean> {
    return this.provider.testConnection();
  }

  /**
   * Formate un numéro de téléphone pour le Niger
   */
  private formatPhoneNumber(phone: string): string {
    // Nettoyer le numéro
    let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

    // Ajouter le préfixe international si nécessaire
    if (!cleaned.startsWith('+')) {
      cleaned = '+227' + cleaned.replace(/^0+/, '');
    }

    return cleaned;
  }

  /**
   * SMS de confirmation de dépôt (max 160 caractères)
   */
  async sendConfirmationDepot(
    to: string,
    data: {
      numeroEnregistrement: string;
      nom: string;
    }
  ): Promise<boolean> {
    const message = `Service Civique: Votre demande ${data.numeroEnregistrement} a été enregistrée. Vous serez notifié(e) dès que votre attestation sera prête.`;

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message,
    });
  }

  /**
   * SMS de rejet de demande
   */
  async sendDemandeRejetee(
    to: string,
    data: {
      numeroEnregistrement: string;
    }
  ): Promise<boolean> {
    const message = `Service Civique: Votre demande ${data.numeroEnregistrement} nécessite une régularisation. Veuillez contacter nos services.`;

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message,
    });
  }

  /**
   * SMS d'attestation prête
   */
  async sendAttestationPrete(
    to: string,
    data: {
      numeroAttestation: string;
      nom: string;
    }
  ): Promise<boolean> {
    const message = `Service Civique: Votre attestation ${data.numeroAttestation} est prête. Vous pouvez la retirer à nos bureaux (Lun-Ven, 8h-16h) avec une pièce d'identité.`;

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message,
    });
  }
}

// Instance singleton
export const smsService = new SmsService();
