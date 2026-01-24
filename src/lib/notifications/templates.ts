/**
 * Templates de messages pour les notifications
 * Basé sur le Prompt 6.1 - Services de Notification
 */

export enum TypeNotification {
  CONFIRMATION_DEPOT = 'CONFIRMATION_DEPOT',
  DEMANDE_REJETEE = 'DEMANDE_REJETEE',
  ATTESTATION_PRETE = 'ATTESTATION_PRETE',
  DEMANDE_EN_TRAITEMENT = 'DEMANDE_EN_TRAITEMENT',
  PIECES_NON_CONFORMES = 'PIECES_NON_CONFORMES',
  DEMANDE_COPIE_ARRETE = 'DEMANDE_COPIE_ARRETE',
  MESSAGE_PERSONNALISE = 'MESSAGE_PERSONNALISE',
}

export interface NotificationData {
  numeroEnregistrement: string;
  numeroAttestation?: string;
  nom: string;
  prenom: string;
  dateEnregistrement?: string;
  motifRejet?: string;
  messagePersonnalise?: string;
}

/**
 * Récupère le sujet de l'email selon le type
 */
export function getEmailSubject(type: TypeNotification, data: NotificationData): string {
  switch (type) {
    case TypeNotification.CONFIRMATION_DEPOT:
      return `Confirmation de dépôt - Demande d'attestation ${data.numeroEnregistrement}`;

    case TypeNotification.DEMANDE_REJETEE:
      return `Demande d'attestation ${data.numeroEnregistrement} - Information`;

    case TypeNotification.ATTESTATION_PRETE:
      return `✓ Votre attestation est prête - ${data.numeroAttestation}`;

    case TypeNotification.DEMANDE_EN_TRAITEMENT:
      return `Demande ${data.numeroEnregistrement} en cours de traitement`;

    case TypeNotification.PIECES_NON_CONFORMES:
      return `Demande ${data.numeroEnregistrement} - Pièces à régulariser`;

    case TypeNotification.DEMANDE_COPIE_ARRETE:
      return `Demande ${data.numeroEnregistrement} - Copie d'arrêté requise`;

    case TypeNotification.MESSAGE_PERSONNALISE:
      return `Service Civique National - Information`;

    default:
      return 'Service Civique National - Notification';
  }
}

/**
 * Récupère le message SMS selon le type (max 160 caractères)
 */
export function getSmsMessage(type: TypeNotification, data: NotificationData): string {
  switch (type) {
    case TypeNotification.CONFIRMATION_DEPOT:
      return `Service Civique: Votre demande ${data.numeroEnregistrement} a été enregistrée. Vous serez notifié(e) dès que votre attestation sera prête.`;

    case TypeNotification.DEMANDE_REJETEE:
      return `Service Civique: Votre demande ${data.numeroEnregistrement} nécessite une régularisation. Veuillez contacter nos services.`;

    case TypeNotification.ATTESTATION_PRETE:
      return `Service Civique: Votre attestation ${data.numeroAttestation} est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.`;

    case TypeNotification.DEMANDE_EN_TRAITEMENT:
      return `Service Civique: Votre demande ${data.numeroEnregistrement} est en cours de traitement.`;

    case TypeNotification.PIECES_NON_CONFORMES:
      return `Service Civique: Pièces non conformes pour demande ${data.numeroEnregistrement}. Contactez-nous.`;

    case TypeNotification.DEMANDE_COPIE_ARRETE:
      return `Service Civique: Demande ${data.numeroEnregistrement} - Veuillez fournir une copie de votre arrêté. Présentez-vous à nos bureaux.`;

    case TypeNotification.MESSAGE_PERSONNALISE:
      return data.messagePersonnalise || 'Service Civique: Nouveau message disponible.';

    default:
      return 'Service Civique National - Notification';
  }
}

/**
 * Récupère le nom du template WhatsApp selon le type
 */
export function getWhatsAppTemplate(type: TypeNotification): string {
  switch (type) {
    case TypeNotification.CONFIRMATION_DEPOT:
      return 'confirmation_depot';

    case TypeNotification.DEMANDE_REJETEE:
      return 'demande_rejetee';

    case TypeNotification.ATTESTATION_PRETE:
      return 'attestation_prete';

    case TypeNotification.DEMANDE_EN_TRAITEMENT:
      return 'demande_en_traitement';

    case TypeNotification.PIECES_NON_CONFORMES:
      return 'pieces_non_conformes';

    case TypeNotification.DEMANDE_COPIE_ARRETE:
      return 'demande_copie_arrete';

    default:
      return 'notification_generale';
  }
}

/**
 * Récupère les variables pour le template WhatsApp
 */
export function getWhatsAppVariables(
  type: TypeNotification,
  data: NotificationData
): Record<string, string> {
  const baseVariables = {
    '1': data.prenom,
    '2': data.nom,
  };

  switch (type) {
    case TypeNotification.CONFIRMATION_DEPOT:
      return {
        ...baseVariables,
        '3': data.numeroEnregistrement,
        '4': data.dateEnregistrement || '',
      };

    case TypeNotification.DEMANDE_REJETEE:
      return {
        ...baseVariables,
        '3': data.numeroEnregistrement,
        '4': data.motifRejet || '',
      };

    case TypeNotification.ATTESTATION_PRETE:
      return {
        ...baseVariables,
        '3': data.numeroAttestation || '',
        '4': data.numeroEnregistrement,
      };

    case TypeNotification.DEMANDE_EN_TRAITEMENT:
      return {
        ...baseVariables,
        '3': data.numeroEnregistrement,
      };

    case TypeNotification.PIECES_NON_CONFORMES:
      return {
        ...baseVariables,
        '3': data.numeroEnregistrement,
      };

    case TypeNotification.DEMANDE_COPIE_ARRETE:
      return {
        ...baseVariables,
        '3': data.numeroEnregistrement,
      };

    default:
      return baseVariables;
  }
}

/**
 * Instructions pour créer les templates WhatsApp dans Meta Business Manager
 *
 * TEMPLATE: confirmation_depot
 * Nom: Confirmation de dépôt
 * Catégorie: TRANSACTIONAL
 * Langue: French (fr)
 * Corps:
 * "Bonjour {{1}} {{2}},
 *
 * Nous avons bien reçu votre dossier de demande d'attestation sous le numéro {{3}} le {{4}}.
 *
 * Votre dossier est en cours de traitement. Vous recevrez une notification dès que votre attestation sera prête.
 *
 * Service Civique National
 * République du Niger"
 *
 * -------------------------
 *
 * TEMPLATE: demande_rejetee
 * Nom: Demande rejetée
 * Catégorie: TRANSACTIONAL
 * Langue: French (fr)
 * Corps:
 * "Bonjour {{1}} {{2}},
 *
 * Votre demande {{3}} ne peut être traitée.
 *
 * Motif: {{4}}
 *
 * Veuillez contacter nos services pour régulariser votre situation.
 *
 * Service Civique National
 * République du Niger"
 *
 * -------------------------
 *
 * TEMPLATE: attestation_prete
 * Nom: Attestation prête
 * Catégorie: TRANSACTIONAL
 * Langue: French (fr)
 * Corps:
 * "Bonjour {{1}} {{2}},
 *
 * ✓ Votre attestation {{3}} est prête !
 *
 * Demande N°: {{4}}
 *
 * Vous pouvez la retirer à nos bureaux (Lun-Ven, 8h-16h) avec une pièce d'identité.
 *
 * Service Civique National
 * République du Niger"
 */
