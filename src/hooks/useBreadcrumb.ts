/**
 * Hook useBreadcrumb - Gestion avancée des fils d'Ariane
 * Permet de définir dynamiquement les breadcrumbs avec contexte
 */

'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface UseBreadcrumbOptions {
  /**
   * Override le label généré automatiquement pour le segment actuel
   */
  customLabel?: string;

  /**
   * Items additionnels à ajouter (pour contexte dynamique)
   */
  additionalItems?: BreadcrumbItem[];

  /**
   * Désactiver génération automatique (utiliser seulement additionalItems)
   */
  disableAuto?: boolean;

  /**
   * Mapping personnalisé des segments
   */
  customMapping?: Record<string, string>;
}

/**
 * Mapping par défaut des segments URL vers labels lisibles
 */
const DEFAULT_LABEL_MAP: Record<string, string> = {
  // Rôles
  'agent': 'Agent',
  'directeur': 'Directeur',
  'admin': 'Administration',
  'saisie': 'Saisie',

  // Modules principaux
  'demandes': 'Demandes',
  'attestations': 'Attestations',
  'arretes': 'Arrêtés',
  'utilisateurs': 'Utilisateurs',
  'rapports': 'Rapports',
  'audit': 'Journal d\'audit',
  'configuration': 'Configuration',
  'notifications': 'Notifications',

  // Pages spécifiques
  'dashboard': 'Tableau de bord',
  'nouvelle-demande': 'Nouvelle demande',
  'nouvelle': 'Nouveau',
  'modifier': 'Modifier',
  'signature': 'Signature',
  'profil': 'Mon profil',
  'parametres': 'Paramètres',
  'stats': 'Statistiques',

  // Actions
  'ajouter': 'Ajouter',
  'editer': 'Éditer',
  'supprimer': 'Supprimer',
  'details': 'Détails',
  'historique': 'Historique',

  // Autres
  'verifier': 'Vérifier',
  '2fa': 'Double authentification',
  'templates': 'Templates',
};

/**
 * Hook useBreadcrumb - Génère les breadcrumbs automatiquement avec possibilité de customisation
 * 
 * @example
 * // Usage basique (auto-génération)
 * const breadcrumbs = useBreadcrumb();
 * 
 * @example
 * // Avec label personnalisé
 * const breadcrumbs = useBreadcrumb({ 
 *   customLabel: 'Demande #1234' 
 * });
 * 
 * @example
 * // Avec items additionnels
 * const breadcrumbs = useBreadcrumb({
 *   additionalItems: [
 *     { label: 'Demande', href: '/agent/demandes' },
 *     { label: 'ATT-2026-00123', href: '/agent/demandes/clxxx' }
 *   ]
 * });
 * 
 * @example
 * // Mapping personnalisé
 * const breadcrumbs = useBreadcrumb({
 *   customMapping: {
 *     'mes-demandes': 'Mes Demandes',
 *     'en-attente': 'En Attente'
 *   }
 * });
 */
export function useBreadcrumb(options: UseBreadcrumbOptions = {}) {
  const pathname = usePathname();
  const {
    customLabel,
    additionalItems = [],
    disableAuto = false,
    customMapping = {},
  } = options;

  const breadcrumbs = useMemo(() => {
    // Si désactivé, retourner seulement les items additionnels
    if (disableAuto) {
      return additionalItems;
    }

    // Combiner mappings
    const labelMap = { ...DEFAULT_LABEL_MAP, ...customMapping };

    // Parser le pathname
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Détecter les IDs dynamiques (cuid, uuid, nombres)
      const isId =
        /^[a-zA-Z0-9]{20,}$/.test(segment) || // cuid
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || // uuid
        /^\d+$/.test(segment); // nombre pur

      // Si c'est un ID
      if (isId) {
        // Si c'est le dernier segment et qu'on a un customLabel, l'utiliser
        if (index === segments.length - 1 && customLabel) {
          items.push({
            label: customLabel,
            href: currentPath,
          });
        } else {
          // Sinon, afficher "Détails" ou masquer
          items.push({
            label: 'Détails',
            href: currentPath,
          });
        }
        return;
      }

      // Label du segment
      let label = labelMap[segment] || segment;

      // Capitaliser si pas trouvé dans mapping
      if (!labelMap[segment]) {
        label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Override avec customLabel si c'est le dernier segment
      if (index === segments.length - 1 && customLabel) {
        label = customLabel;
      }

      // Ajouter l'item
      items.push({
        label,
        href: currentPath,
      });
    });

    // Ajouter les items additionnels
    return [...items, ...additionalItems];
  }, [pathname, customLabel, additionalItems, disableAuto, customMapping]);

  return breadcrumbs;
}

/**
 * Hook useBreadcrumbWithData - Génère breadcrumbs avec données dynamiques
 * Utile pour afficher des infos comme "Demande #1234" ou "Jean Dupont"
 * 
 * @example
 * const breadcrumbs = useBreadcrumbWithData({
 *   dataLabel: demande?.numeroEnregistrement,
 *   fallbackLabel: 'Chargement...'
 * });
 */
export function useBreadcrumbWithData(options: {
  dataLabel?: string | null;
  fallbackLabel?: string;
  customMapping?: Record<string, string>;
}) {
  const { dataLabel, fallbackLabel = 'Détails', customMapping } = options;

  return useBreadcrumb({
    customLabel: dataLabel || fallbackLabel,
    customMapping,
  });
}

/**
 * Hook useBreadcrumbContext - Pour contexte complexe avec items personnalisés
 * 
 * @example
 * const breadcrumbs = useBreadcrumbContext([
 *   { label: 'Administration', href: '/admin' },
 *   { label: 'Utilisateurs', href: '/admin/utilisateurs' },
 *   { label: 'Jean Dupont' } // Pas de href = dernier item
 * ]);
 */
export function useBreadcrumbContext(items: BreadcrumbItem[]) {
  return useBreadcrumb({
    additionalItems: items,
    disableAuto: true,
  });
}
