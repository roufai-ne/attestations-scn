/**
 * Service WhatsApp - Envoi de messages via WhatsApp Business Cloud API
 * Basé sur le Prompt 6.1 - Services de Notification
 */

import { logger } from '@/lib/logger';

export interface WhatsAppOptions {
  to: string;
  templateName: string;
  variables: Record<string, string>;
}

/**
 * Service WhatsApp utilisant l'API Cloud de Meta
 */
export class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private apiUrl: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Envoie un message WhatsApp en utilisant un template pré-approuvé
   */
  async sendTemplate(options: WhatsAppOptions): Promise<boolean> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        logger.error('Configuration WhatsApp manquante');
        return false;
      }

      // Formater le numéro au format international
      const formattedTo = options.to.startsWith('+')
        ? options.to.substring(1)
        : `227${options.to.replace(/^0+/, '')}`;

      // Construire les paramètres du template
      const components = this.buildTemplateComponents(options.variables);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: {
            name: options.templateName,
            language: {
              code: 'fr', // Français
            },
            components,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Erreur WhatsApp API: ' + JSON.stringify(error));
        return false;
      }

      const result = await response.json();
      logger.network('WhatsApp', `WhatsApp envoyé: ${result.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      logger.error('Erreur envoi WhatsApp: ' + error);
      return false;
    }
  }

  /**
   * Envoie un message texte simple (pour tests uniquement, nécessite conversation active)
   */
  async sendText(to: string, message: string): Promise<boolean> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        logger.error('Configuration WhatsApp manquante');
        return false;
      }

      const formattedTo = to.startsWith('+')
        ? to.substring(1)
        : `227${to.replace(/^0+/, '')}`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Erreur WhatsApp API: ' + JSON.stringify(error));
        return false;
      }

      const result = await response.json();
      logger.network('WhatsApp', `WhatsApp texte envoyé: ${result.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      logger.error('Erreur envoi WhatsApp: ' + error);
      return false;
    }
  }

  /**
   * Construit les composants du template avec variables
   */
  private buildTemplateComponents(variables: Record<string, string>): any[] {
    const parameters = Object.values(variables).map((value) => ({
      type: 'text',
      text: value,
    }));

    return [
      {
        type: 'body',
        parameters,
      },
    ];
  }

  /**
   * Teste la connexion à l'API WhatsApp
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        return false;
      }

      // Vérifier le Phone Number ID
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Invalid WhatsApp configuration');
      }

      logger.info('Connexion WhatsApp OK');
      return true;
    } catch (error) {
      logger.error('Erreur connexion WhatsApp: ' + error);
      return false;
    }
  }

  /**
   * WhatsApp de confirmation de dépôt
   * Template name: "confirmation_depot" (doit être créé et approuvé dans Meta Business Manager)
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
    return this.sendTemplate({
      to,
      templateName: 'confirmation_depot',
      variables: {
        '1': data.prenom,
        '2': data.nom,
        '3': data.numeroEnregistrement,
        '4': data.dateEnregistrement,
      },
    });
  }

  /**
   * WhatsApp de demande rejetée
   * Template name: "demande_rejetee"
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
    return this.sendTemplate({
      to,
      templateName: 'demande_rejetee',
      variables: {
        '1': data.prenom,
        '2': data.nom,
        '3': data.numeroEnregistrement,
        '4': data.motifRejet,
      },
    });
  }

  /**
   * WhatsApp d'attestation prête
   * Template name: "attestation_prete"
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
    return this.sendTemplate({
      to,
      templateName: 'attestation_prete',
      variables: {
        '1': data.prenom,
        '2': data.nom,
        '3': data.numeroAttestation,
        '4': data.numeroEnregistrement,
      },
    });
  }
}

// Instance singleton
export const whatsappService = new WhatsAppService();
