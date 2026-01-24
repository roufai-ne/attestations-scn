/**
 * Helpers pour les notifications
 * Validation et filtrage des canaux selon les coordonnées disponibles
 */

import { CanalNotification } from '@prisma/client';

/**
 * Valide si un email est valide
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide si un numéro de téléphone est valide (format international)
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  // Format E.164 : +[code pays][numéro]
  // Exemple: +227XXXXXXXX, +33XXXXXXXXX
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Valide si un numéro WhatsApp est valide (même format que téléphone)
 */
export function isValidWhatsApp(whatsapp: string | null | undefined): boolean {
  return isValidPhone(whatsapp);
}

/**
 * Filtre les canaux de notification selon les coordonnées disponibles
 * Retourne uniquement les canaux pour lesquels l'appelé a des coordonnées valides
 */
export function filterValidChannels(
  requestedChannels: CanalNotification[],
  appele: {
    email?: string | null;
    telephone?: string | null;
    whatsapp?: string | null;
  }
): CanalNotification[] {
  const validChannels: CanalNotification[] = [];

  for (const canal of requestedChannels) {
    switch (canal) {
      case CanalNotification.EMAIL:
        if (isValidEmail(appele.email)) {
          validChannels.push(canal);
        }
        break;

      case CanalNotification.SMS:
        if (isValidPhone(appele.telephone)) {
          validChannels.push(canal);
        }
        break;

      case CanalNotification.WHATSAPP:
        if (isValidWhatsApp(appele.whatsapp)) {
          validChannels.push(canal);
        }
        break;
    }
  }

  return validChannels;
}

/**
 * Récupère automatiquement les canaux disponibles pour un appelé
 * Retourne tous les canaux pour lesquels l'appelé a des coordonnées valides
 */
export function getAvailableChannels(appele: {
  email?: string | null;
  telephone?: string | null;
  whatsapp?: string | null;
}): CanalNotification[] {
  const channels: CanalNotification[] = [];

  if (isValidEmail(appele.email)) {
    channels.push(CanalNotification.EMAIL);
  }

  if (isValidPhone(appele.telephone)) {
    channels.push(CanalNotification.SMS);
  }

  if (isValidWhatsApp(appele.whatsapp)) {
    channels.push(CanalNotification.WHATSAPP);
  }

  return channels;
}

/**
 * Vérifie si au moins un canal de notification est disponible
 */
export function hasAnyValidChannel(appele: {
  email?: string | null;
  telephone?: string | null;
  whatsapp?: string | null;
}): boolean {
  return (
    isValidEmail(appele.email) ||
    isValidPhone(appele.telephone) ||
    isValidWhatsApp(appele.whatsapp)
  );
}

/**
 * Options pour l'envoi de notifications avec validation
 */
export interface SafeNotificationOptions {
  /** Envoyer la notification (par défaut: false) */
  enabled?: boolean;
  /** Canaux demandés (sera filtré selon disponibilité) */
  channels?: CanalNotification[];
  /** Forcer l'envoi même si désactivé par défaut */
  force?: boolean;
}

/**
 * Détermine si une notification doit être envoyée et sur quels canaux
 */
export function shouldSendNotification(
  options: SafeNotificationOptions | undefined,
  appele: {
    email?: string | null;
    telephone?: string | null;
    whatsapp?: string | null;
  }
): { send: boolean; channels: CanalNotification[] } {
  // Par défaut, notifications désactivées
  if (!options?.enabled && !options?.force) {
    return { send: false, channels: [] };
  }

  // Vérifier si au moins un canal est disponible
  if (!hasAnyValidChannel(appele)) {
    return { send: false, channels: [] };
  }

  // Si des canaux sont spécifiés, les filtrer
  if (options.channels && options.channels.length > 0) {
    const validChannels = filterValidChannels(options.channels, appele);
    return {
      send: validChannels.length > 0,
      channels: validChannels,
    };
  }

  // Sinon, utiliser tous les canaux disponibles
  const availableChannels = getAvailableChannels(appele);
  return {
    send: availableChannels.length > 0,
    channels: availableChannels,
  };
}
